const openaiService = require('./openaiService');
const oniApiService = require('./oniApiService');
const sessionService = require('./sessionService');
const whatsappService = require('./whatsappService');
const logger = require('../config/logger');
const { ESTADOS, TIPO_SERVICO, ONI_MUNIC_GOIANIA, ONI_SUPER_ID, ONI_PROC_CONSULTA } = require('../config/constants');
const { limparCPF, validarCPF, validarEmail } = require('../utils/validators');

/**
 * Processa mensagem do usuário e coordena todo o fluxo
 */
const processUserMessage = async (telefoneCliente, mensagem, instancia, nome) => {
  try {
    // Obtém ou cria sessão
    const session = await sessionService.getSession(telefoneCliente, instancia);
    
    // Se é primeira mensagem, envia boas-vindas
    if (session.estado === ESTADOS.INICIO && session.historico.length === 0) {
      await whatsappService.enviarBoasVindas(telefoneCliente, instancia, nome);
      await sessionService.updateSessionState(telefoneCliente, instancia, ESTADOS.IDENTIFICANDO_SERVICO);
      return;
    }
    
    // Adiciona mensagem do usuário ao histórico
    await sessionService.addMessageToHistory(telefoneCliente, instancia, 'user', mensagem);
    
    // Obtém histórico de mensagens
    const historico = await sessionService.getMessageHistory(telefoneCliente, instancia);
    
    // Processa com GPT-4o
    const gptResponse = await openaiService.processMessage(historico);
    
    // Se houver chamada de função, executa
    if (gptResponse.functionCall) {
      await handleFunctionCall(
        telefoneCliente,
        instancia,
        gptResponse.functionCall,
        session,
        historico
      );
    } else if (gptResponse.content) {
      // Envia resposta do GPT
      await whatsappService.enviarMensagem(telefoneCliente, gptResponse.content, instancia);
      await sessionService.addMessageToHistory(telefoneCliente, instancia, 'assistant', gptResponse.content);
    }
    
  } catch (error) {
    logger.error('Erro ao processar mensagem do usuário', error);
    await whatsappService.enviarMensagemErro(telefoneCliente, instancia);
  }
};

/**
 * Manipula chamadas de função do GPT
 */
const handleFunctionCall = async (telefoneCliente, instancia, functionCall, session, historico) => {
  const { name, arguments: args } = functionCall;
  
  logger.info(`🎯 Executando: ${name}`);
  
  let functionResult;
  let responseMessage;
  
  try {
    switch (name) {
      case 'buscar_municipios':
        functionResult = await oniApiService.buscarMunicipios({
          munic_nome: args.nome,
          proc_codigo: args.proc_codigo
        });
        
        // Atualiza sessão com município encontrado (incluindo UF) e proc_codigo
        if (functionResult && functionResult.length > 0) {
          await sessionService.updateSessionData(telefoneCliente, instancia, {
            munic_id: functionResult[0].munic_id,
            munic_nome: functionResult[0].munic_nome,
            munic_uf: functionResult[0].munic_uf,
            proc_codigo: args.proc_codigo // Salva tipo de serviço (consulta/teleconsulta)
          });
          logger.info(`📍 Cidade: ${functionResult[0].munic_nome}, ${functionResult[0].munic_uf}`);
        }
        
        const gptResult1 = await continuarComGPT(historico, functionCall, functionResult);
        responseMessage = gptResult1.content;
        
        // Se GPT quer chamar outra função, executa recursivamente
        if (gptResult1.functionCall) {
          await handleFunctionCall(telefoneCliente, instancia, gptResult1.functionCall, session, historico);
          return;
        }
        break;
        
      case 'buscar_profissionais_especialidades':
        // Sempre usa munic_id da sessão (numérico), nunca o que o GPT enviar
        const municIdBusca = session.dados.munic_id || ONI_MUNIC_GOIANIA;
        
        functionResult = await oniApiService.buscarProfEspLocal({
          nome: args.nome,
          munic_id: municIdBusca,
          proc_codigo: args.proc_codigo
        });
        
        if (functionResult?.length > 0) {
          logger.info(`✅ Encontrado: ${functionResult.length} opção(ões)`);
        }
        const gptResult2 = await continuarComGPT(historico, functionCall, functionResult);
        responseMessage = gptResult2.content;
        
        // Se GPT quer chamar outra função, executa recursivamente
        if (gptResult2.functionCall) {
          await handleFunctionCall(telefoneCliente, instancia, gptResult2.functionCall, session, historico);
          return;
        }
        
        break;
        
      case 'listar_profissionais':
        // Monta localização no formato "Cidade, UF"
        const municNome = session.dados.munic_nome || 'Goiânia';
        const municUF = session.dados.munic_uf || 'GO';
        const localizacao = `${municNome}, ${municUF}`;
        
        
        functionResult = await oniApiService.listarProfissionais({
          esp_id: args.esp_id,
          cli_id: args.cli_id,
          prof_id: args.prof_id,
          nome: args.nome,
          munic_id: args.munic_id || session.dados.munic_id || ONI_MUNIC_GOIANIA,
          localizacao: localizacao,
          proc_codigo: args.proc_codigo
        });
        
        // Salva lista de profissionais na sessão para referência futura
        if (functionResult?.profs && Object.keys(functionResult.profs).length > 0) {
          const totalProfs = Object.keys(functionResult.profs).length;
          logger.info(`👨‍⚕️ ${totalProfs} profissional(is) encontrado(s)`);
          
          await sessionService.updateSessionData(telefoneCliente, instancia, {
            profissionais_disponiveis: functionResult.profs,
            unidades_disponiveis: functionResult.unidades,
            esp_id: args.esp_id
          });
        }
        
        const gptResult3 = await continuarComGPT(historico, functionCall, functionResult);
        responseMessage = gptResult3.content;
        
        // Se GPT quer chamar outra função, executa recursivamente
        if (gptResult3.functionCall) {
          logger.info(` GPT quer chamar outra função: ${gptResult3.functionCall.name}`);
          await handleFunctionCall(telefoneCliente, instancia, gptResult3.functionCall, session, historico);
          return;
        }
        
        break;
        
      case 'selecionar_profissional':
        
        // Busca profissionais salvos na sessão
        const profsDisponiveis = session.dados.profissionais_disponiveis;
        
        if (!profsDisponiveis) {
          responseMessage = 'Desculpe, não encontrei a lista de profissionais. Por favor, busque novamente.';
          break;
        }
        
        // Converte objeto de profissionais em array
        const profsArray = Object.values(profsDisponiveis);
        const indexEscolhido = args.numero_escolhido - 1; // Converte de 1-based para 0-based
        
        if (indexEscolhido < 0 || indexEscolhido >= profsArray.length) {
          responseMessage = `Número inválido. Por favor, escolha entre 1 e ${profsArray.length}.`;
          break;
        }
        
        const profEscolhido = profsArray[indexEscolhido];
        const unidadeId = Object.keys(profEscolhido.unidades)[0]; // Pega primeira unidade
        
        // Salva dados do profissional selecionado
        await sessionService.updateSessionData(telefoneCliente, instancia, {
          prof_id_selecionado: profEscolhido.prof_id,
          prof_nome_selecionado: profEscolhido.prof_nome,
          esp_id_selecionado: profEscolhido.esp_id,
          cli_id_selecionado: unidadeId,
          proc_vlr: profEscolhido.proc_vlr
        });
        
        logger.info(`✅ Selecionado: ${profEscolhido.prof_nome}`);
        
        responseMessage = `✅ Profissional selecionado: ${profEscolhido.prof_nome}\n\nAgora vou buscar os horários disponíveis...`;
        
        // Automaticamente busca vagas para o profissional escolhido
        const dataInicial = new Date();
        dataInicial.setDate(dataInicial.getDate() + 1); // Amanhã
        const dataFinal = new Date();
        dataFinal.setDate(dataFinal.getDate() + 14); // Próximos 14 dias
        
        const vagasResult = await oniApiService.listarVagas({
          prof_id: profEscolhido.prof_id,
          esp_id: profEscolhido.esp_id,
          cli_id: unidadeId,
          proc_codigo: session.dados.proc_codigo || ONI_PROC_CONSULTA,
          tblproced_id: 1,
          super_id: ONI_SUPER_ID,
          data_inicial: dataInicial.toISOString().split('T')[0],
          data_final: dataFinal.toISOString().split('T')[0]
        });
        
        const totalDatas = Object.keys(vagasResult || {}).length;
        if (totalDatas > 0) {
          logger.info(`📅 ${totalDatas} data(s) com vagas`);
        }
        
        // Salva vagas na sessão
        await sessionService.updateSessionData(telefoneCliente, instancia, {
          vagas_disponiveis: vagasResult
        });
        
        const gptVagas = await continuarComGPT(historico, functionCall, vagasResult);
        responseMessage = gptVagas.content;
        
        if (gptVagas.functionCall) {
          logger.info(` GPT quer chamar outra função: ${gptVagas.functionCall.name}`);
          await handleFunctionCall(telefoneCliente, instancia, gptVagas.functionCall, session, historico);
          return;
        }
        break;
        
      case 'listar_vagas':
        functionResult = await oniApiService.listarVagas(args);
        
        // Salva dados do profissional selecionado
        await sessionService.updateSessionData(telefoneCliente, instancia, {
          prof_id: args.prof_id,
          esp_id: args.esp_id,
          cli_id: args.cli_id,
          proc_codigo: args.proc_codigo,
          tblproced_id: args.tblproced_id || 1
        });
        
        const gptResult4 = await continuarComGPT(historico, functionCall, functionResult);
        responseMessage = gptResult4.content;
        
        if (gptResult4.functionCall) {
          logger.info(` GPT quer chamar outra função: ${gptResult4.functionCall.name}`);
          await handleFunctionCall(telefoneCliente, instancia, gptResult4.functionCall, session, historico);
          return;
        }
        break;
        
      case 'selecionar_horario':
        functionResult = await handleSelecionarHorario(telefoneCliente, instancia, args, session);
        responseMessage = functionResult.message;
        break;
        
      case 'login_paciente':
        functionResult = await handleLogin(telefoneCliente, instancia, args.login, args.senha);
        responseMessage = functionResult.message;
        break;
        
      case 'buscar_dependentes':
        const token = session.dados.token;
        // SEMPRE usa benef_id da sessão (nunca o que o GPT envia)
        const benef_id_dep = session.dados.benef_id;
        
        if (!benef_id_dep) {
          responseMessage = '❌ Você precisa fazer login antes de buscar dependentes. Por favor, faça login primeiro.';
          break;
        }
        
        functionResult = await oniApiService.listarDependentes(benef_id_dep, token);
        const gptResult5 = await continuarComGPT(historico, functionCall, functionResult);
        responseMessage = gptResult5.content;
        
        if (gptResult5.functionCall) {
          logger.info(` GPT quer chamar outra função: ${gptResult5.functionCall.name}`);
          await handleFunctionCall(telefoneCliente, instancia, gptResult5.functionCall, session, historico);
          return;
        }
        break;
        
      case 'validar_agendamento':
        functionResult = await handleValidarAgendamento(telefoneCliente, instancia, args, session);
        responseMessage = functionResult.message;
        break;
        
      case 'confirmar_agendamento':
        functionResult = await handleConfirmarAgendamento(telefoneCliente, instancia, args, session);
        responseMessage = functionResult.message;
        break;
        
      case 'buscar_procedimentos_exames':
        functionResult = await oniApiService.listarProcedimentos({
          nome: args.nome,
          munic_id: args.munic_id || session.dados.munic_id || ONI_MUNIC_GOIANIA
        });
        
        // Guarda tipo de serviço
        await sessionService.updateSessionData(telefoneCliente, instancia, {
          tipo_servico: TIPO_SERVICO.EXAMES
        });
        
        const gptResult6 = await continuarComGPT(historico, functionCall, functionResult);
        responseMessage = gptResult6.content;
        
        if (gptResult6.functionCall) {
          logger.info(` GPT quer chamar outra função: ${gptResult6.functionCall.name}`);
          await handleFunctionCall(telefoneCliente, instancia, gptResult6.functionCall, session, historico);
          return;
        }
        break;
        
      case 'criar_pedido_exames':
        // SEMPRE usa benef_id da sessão (nunca o que o GPT envia)
        functionResult = await handleCriarPedidoExames(telefoneCliente, instancia, session);
        responseMessage = functionResult.message;
        break;
        
      case 'cadastrar_paciente':
        functionResult = await handleCadastro(telefoneCliente, instancia, args);
        responseMessage = functionResult.message;
        break;
        
      case 'solicitar_recuperacao_senha':
        functionResult = await oniApiService.solicitarAlteracaoSenha(args.cpf_email);
        const gptResult7 = await continuarComGPT(historico, functionCall, functionResult);
        responseMessage = gptResult7.content;
        
        if (gptResult7.functionCall) {
          logger.info(` GPT quer chamar outra função: ${gptResult7.functionCall.name}`);
          await handleFunctionCall(telefoneCliente, instancia, gptResult7.functionCall, session, historico);
          return;
        }
        break;
        
      default:
        responseMessage = 'Desculpe, não entendi o que você precisa. Pode reformular?';
    }
    
    // Envia resposta
    if (responseMessage) {
      await whatsappService.enviarMensagem(telefoneCliente, responseMessage, instancia);
      await sessionService.addMessageToHistory(telefoneCliente, instancia, 'assistant', responseMessage);
    }
    
  } catch (error) {
    logger.error(`❌ Erro ao executar função ${name}`, error);
    await whatsappService.enviarMensagemErro(telefoneCliente, instancia);
  }
};

/**
 * Continua conversa com GPT após receber resultado de função
 * Retorna objeto com content e functionCall (se houver)
 */
const continuarComGPT = async (historico, functionCall, functionResult) => {
  try {
    const messages = [
      ...historico,
      {
        role: 'assistant',
        content: null,
        function_call: {
          name: functionCall.name,
          arguments: JSON.stringify(functionCall.arguments)
        }
      },
      {
        role: 'function',
        name: functionCall.name,
        content: JSON.stringify(functionResult)
      }
    ];
    
    // Mantém as funções disponíveis para o GPT poder continuar chamando se necessário
    const response = await openaiService.processMessage(messages);
    
    // Retorna tanto o conteúdo quanto a possível nova chamada de função
    return {
      content: response.content,
      functionCall: response.functionCall
    };
  } catch (error) {
    logger.error('❌ [DEBUG] Erro ao continuar com GPT', error);
    throw error;
  }
};

/**
 * Seleciona um horário específico das vagas disponíveis
 */
const handleSelecionarHorario = async (telefoneCliente, instancia, args, session) => {
  try {
    const vagas = session.dados.vagas_disponiveis;
    
    if (!vagas) {
      return {
        success: false,
        message: 'Não encontrei vagas disponíveis. Por favor, busque novamente.'
      };
    }
    
    const { data_escolhida, numero_horario } = args;
    
    // Busca os horários da data escolhida
    const horariosData = vagas[data_escolhida];
    
    if (!horariosData || horariosData.length === 0) {
      return {
        success: false,
        message: 'Data não encontrada. Por favor, escolha uma data válida da lista.'
      };
    }
    
    // Pega o horário escolhido (converte de 1-based para 0-based)
    const indexHorario = numero_horario - 1;
    const horarioEscolhido = horariosData[indexHorario];
    
    if (!horarioEscolhido) {
      return {
        success: false,
        message: `Horário não encontrado. Por favor, escolha entre 1 e ${horariosData.length}.`
      };
    }
    
    // Salva o horário escolhido na sessão
    await sessionService.updateSessionData(telefoneCliente, instancia, {
      horario_escolhido: horarioEscolhido.data_hora,
      data_escolhida: data_escolhida
    });
    
    logger.info(`⏰ Horário selecionado: ${horarioEscolhido.data_hora}`);
    
    // Verifica se o usuário já está logado
    const token = session.dados.token;
    const benef_id = session.dados.benef_id;
    
    if (!token || !benef_id) {
      // Não está logado, solicita login
      return {
        success: true,
        needsLogin: true,
        message: `✅ Horário selecionado: ${horarioEscolhido.data_hora}

Agora preciso que você faça login para confirmar o agendamento. Por favor, informe seu CPF ou email e sua senha. 🔐`
      };
    }
    
    // Já está logado, valida automaticamente
    logger.info('✅ Usuário já logado. Validando agendamento automaticamente...');
    
    const sessionAtualizada = await sessionService.getSession(telefoneCliente, instancia);
    const resultadoValidacao = await handleValidarAgendamento(
      telefoneCliente,
      instancia,
      { data_hora: horarioEscolhido.data_hora },
      sessionAtualizada
    );
    
    return resultadoValidacao;
    
  } catch (error) {
    logger.error('Erro ao selecionar horário', error);
    return {
      success: false,
      message: 'Erro ao selecionar horário. Tente novamente.'
    };
  }
};

/**
 * Processa login do paciente
 */
const handleLogin = async (telefoneCliente, instancia, login, senha) => {
  try {
    // Faz login na API
    const loginResponse = await oniApiService.loginPaciente(login, senha);
    
    if (!loginResponse.status || !loginResponse.token) {
      return {
        success: false,
        message: 'CPF/email ou senha incorretos. Por favor, tente novamente.'
      };
    }
    
    // Busca informações do paciente
    const tokenInfo = await oniApiService.getTokenInfo(loginResponse.token);
    
    if (!tokenInfo.status || !tokenInfo.data) {
      return {
        success: false,
        message: 'Erro ao buscar informações do paciente. Tente novamente.'
      };
    }
    
    const benefData = tokenInfo.data;
    
    // Salva token e dados na sessão
    await sessionService.saveAuthToken(
      telefoneCliente,
      instancia,
      loginResponse.token,
      benefData.benef_id,
      benefData.benef_nome
    );
    
    logger.info(`🔐 Login: ${benefData.benef_nome} (ID: ${benefData.benef_id})`);
    
    // Busca termos obrigatórios
    const termos = await oniApiService.buscarTermosBeneficiario(benefData.benef_id, loginResponse.token);
    const termosObrigatorios = termos.filter(t => t.term_aceite === '1' && t.act_aceitou !== '1');
    
    if (termosObrigatorios.length > 0) {
      return {
        success: true,
        message: `⚠️ Olá ${benefData.benef_nome}! 

Você precisa aceitar os termos de uso antes de continuar. Por favor, acesse o portal da OniSaúde para aceitar os termos obrigatórios.`
      };
    }
    
    // Busca sessão atualizada para verificar se há agendamento pendente
    const sessionAtualizada = await sessionService.getSession(telefoneCliente, instancia);
    
    // Verifica se há horário escolhido esperando validação
    const horarioEscolhido = sessionAtualizada.dados.horario_escolhido;
    
    if (horarioEscolhido) {
      logger.info('📅 Horário escolhido detectado. Validando agendamento automaticamente...');
      
      // Valida automaticamente o agendamento
      const resultadoValidacao = await handleValidarAgendamento(
        telefoneCliente, 
        instancia, 
        { data_hora: horarioEscolhido },
        sessionAtualizada
      );
      
      // Retorna o resultado da validação diretamente
      return resultadoValidacao;
    }
    
    return {
      success: true,
      message: `✅ Login realizado com sucesso!

Olá ${benefData.benef_nome}! Agora podemos continuar com seu agendamento. 📅`
    };
    
  } catch (error) {
    logger.error('Erro no login', error);
    return {
      success: false,
      message: 'Erro ao fazer login. Verifique seus dados e tente novamente.'
    };
  }
};

/**
 * Valida agendamento
 */
const handleValidarAgendamento = async (telefoneCliente, instancia, params, session) => {
  try {
    const token = session.dados.token;
    // SEMPRE usa benef_id da sessão autenticada (nunca o que o GPT envia)
    const benef_id = session.dados.benef_id;
    
    if (!benef_id) {
      return {
        success: false,
        message: '❌ Você precisa fazer login antes de agendar. Por favor, faça login primeiro.'
      };
    }
    
    // Usa IDs salvos na sessão se não fornecidos
    const validacaoParams = {
      cli_id: params.cli_id || session.dados.cli_id_selecionado,
      prof_id: params.prof_id || session.dados.prof_id_selecionado,
      esp_id: params.esp_id || session.dados.esp_id_selecionado,
      proc_codigo: params.proc_codigo || session.dados.proc_codigo || '10101012',
      tblproced_id: params.tblproced_id || 1,
      data_hora: params.data_hora,
      tpa_id: params.tpa_id || 1,
      benef_id
    };
    
    logger.info(`🔍 Validando agendamento para benef_id: ${benef_id}`);
    
    const validacao = await oniApiService.validarAgendamento(validacaoParams, token);
    
    if (validacao.valid) {
      // Salva dados validados
      await sessionService.updateSessionData(telefoneCliente, instancia, {
        agendamento_validado: params
      });
      
      return {
        success: true,
        message: '✅ Agendamento validado! Confirme para finalizar.'
      };
    } else {
      return {
        success: false,
        message: `❌ ${validacao.message || 'Não foi possível validar o agendamento.'}\n\nPor favor, escolha outro horário.`
      };
    }
  } catch (error) {
    logger.error('Erro ao validar agendamento', error);
    return {
      success: false,
      message: 'Erro ao validar agendamento. Tente novamente.'
    };
  }
};

/**
 * Confirma agendamento
 */
const handleConfirmarAgendamento = async (telefoneCliente, instancia, params, session) => {
  try {
    const token = session.dados.token;
    // SEMPRE usa benef_id da sessão autenticada (nunca o que o GPT envia)
    const benef_id = session.dados.benef_id;
    
    if (!benef_id) {
      return {
        success: false,
        message: '❌ Você precisa fazer login antes de agendar. Por favor, faça login primeiro.'
      };
    }
    
    // Usa IDs salvos na sessão se não fornecidos
    const agendarParams = {
      cli_id: params.cli_id || session.dados.cli_id_selecionado,
      prof_id: params.prof_id || session.dados.prof_id_selecionado,
      esp_id: params.esp_id || session.dados.esp_id_selecionado,
      proc_codigo: params.proc_codigo || session.dados.proc_codigo || '10101012',
      tblproced_id: params.tblproced_id || 1,
      data_hora: params.data_hora,
      tpa_id: params.tpa_id || 1,
      benef_id
    };
    
    logger.info(`✅ Confirmando agendamento para benef_id: ${benef_id}`);
    
    const resultado = await oniApiService.agendar(agendarParams, token);
    
    if (resultado.ag_id) {
      // Salva ID do agendamento
      await sessionService.updateSessionData(telefoneCliente, instancia, {
        ag_id: resultado.ag_id,
        atd_id: resultado.atd_id,
        osp_id: resultado.osp_id
      });
      
      // Busca dados de pagamento
      const dadosPagamento = await oniApiService.buscarDadosPagamento(resultado.osp_id, token);
      
      const valor = dadosPagamento?.data?.agendamento?.valor || 'N/A';
      const data = dadosPagamento?.data?.agendamento?.data || 'N/A';
      const horario = dadosPagamento?.data?.agendamento?.inicio || 'N/A';
      const profissional = dadosPagamento?.data?.profissional?.nome || 'N/A';
      const unidade = dadosPagamento?.data?.unidade?.nome || 'N/A';
      
      return {
        success: true,
        message: `🎉 *Agendamento confirmado com sucesso!*

📅 *Data:* ${data}
🕐 *Horário:* ${horario}
👨‍⚕️ *Profissional:* ${profissional}
🏥 *Local:* ${unidade}
💰 *Valor:* R$ ${valor}

⚠️ *Importante:* As instruções de pagamento serão enviadas em breve.

Obrigado por escolher a OniSaúde! 💙`
      };
    } else {
      return {
        success: false,
        message: 'Erro ao confirmar agendamento. Tente novamente.'
      };
    }
  } catch (error) {
    logger.error('Erro ao confirmar agendamento', error);
    return {
      success: false,
      message: 'Erro ao confirmar agendamento. Tente novamente.'
    };
  }
};

/**
 * Cria pedido de exames
 */
const handleCriarPedidoExames = async (telefoneCliente, instancia, session) => {
  try {
    const token = session.dados.token;
    // SEMPRE usa benef_id da sessão autenticada
    const benef_id = session.dados.benef_id;
    const carrinho = session.dados.carrinhoExames || [];
    
    if (!benef_id) {
      return {
        success: false,
        message: '❌ Você precisa fazer login antes de criar o pedido. Por favor, faça login primeiro.'
      };
    }
    
    if (carrinho.length === 0) {
      return {
        success: false,
        message: 'Seu carrinho está vazio. Adicione exames antes de finalizar.'
      };
    }
    
    logger.info(`🔍 Criando pedido de exames para benef_id: ${benef_id}`);
    
    const resultado = await oniApiService.criarPedidoExames(benef_id, carrinho, token);
    
    if (resultado.osp_id) {
      // Busca dados de pagamento
      const dadosPagamento = await oniApiService.buscarDadosPagamento(resultado.osp_id, token);
      
      const valor = dadosPagamento?.data?.valor || 'N/A';
      const exames = dadosPagamento?.data?.exams || [];
      
      let listaExames = exames.map(e => `• ${e.descricao} - R$ ${e.valor}`).join('\n');
      
      return {
        success: true,
        message: `🎉 *Pedido de exames criado com sucesso!*

📋 *Exames solicitados:*
${listaExames}

💰 *Valor total:* R$ ${valor}

⚠️ *Importante:* As instruções de pagamento serão enviadas em breve.

Obrigado por escolher a OniSaúde! 💙`
      };
    } else {
      return {
        success: false,
        message: 'Erro ao criar pedido de exames. Tente novamente.'
      };
    }
  } catch (error) {
    logger.error('Erro ao criar pedido de exames', error);
    return {
      success: false,
      message: 'Erro ao criar pedido. Tente novamente.'
    };
  }
};

/**
 * Cadastra novo paciente
 */
const handleCadastro = async (telefoneCliente, instancia, dados) => {
  try {
    // Valida CPF
    const cpfLimpo = limparCPF(dados.cpf);
    if (!validarCPF(cpfLimpo)) {
      return {
        success: false,
        message: 'CPF inválido. Por favor, verifique e tente novamente.'
      };
    }
    
    // Valida email
    if (!validarEmail(dados.email)) {
      return {
        success: false,
        message: 'Email inválido. Por favor, verifique e tente novamente.'
      };
    }
    
    // Busca dados do CEP se fornecido
    let endereco = {};
    if (dados.cep) {
      try {
        const dadosCep = await oniApiService.buscarDadosCep(dados.cep);
        endereco = {
          benef_uf: dadosCep.uf,
          munic_id: dadosCep.munic_id,
          bar_nome: dadosCep.bairro,
          benef_endlogradouro: dadosCep.logradouro
        };
      } catch (error) {
        logger.warn('Erro ao buscar CEP, continuando sem endereço', error);
      }
    }
    
    // Monta dados do cadastro
    const dadosCadastro = {
      benef_nome: dados.nome,
      benef_cpf: cpfLimpo,
      benef_dtnasc: dados.data_nascimento,
      benef_email: dados.email,
      benef_senha: dados.senha,
      benef_dddcelular: dados.telefone?.substring(0, 2) || '',
      benef_celular: dados.telefone?.substring(2) || '',
      benef_endcep: dados.cep || '',
      benef_endnum: dados.numero || '',
      benef_endcomplemento: dados.complemento || '',
      super_id: require('../config/constants').ONI_SUPER_ID,
      ...endereco
    };
    
    const resultado = await oniApiService.cadastrarBeneficiario(dadosCadastro);
    
    if (resultado.tipo === 'sucesso') {
      // Faz login automático
      const loginResult = await handleLogin(telefoneCliente, instancia, cpfLimpo, dados.senha);
      
      return {
        success: true,
        message: `✅ *Cadastro realizado com sucesso!*

${loginResult.message}

Agora você já pode utilizar todos os nossos serviços! 🎉`
      };
    } else {
      return {
        success: false,
        message: resultado.msg || 'Erro ao cadastrar. Tente novamente.'
      };
    }
  } catch (error) {
    logger.error('Erro ao cadastrar paciente', error);
    return {
      success: false,
      message: 'Erro ao cadastrar. Verifique seus dados e tente novamente.'
    };
  }
};

module.exports = {
  processUserMessage
};

