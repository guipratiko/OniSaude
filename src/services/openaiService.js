const openai = require('../config/openai');
const logger = require('../config/logger');

/**
 * System prompt que define o comportamento do assistente
 */
const SYSTEM_PROMPT = `Você é um assistente virtual da OniSaúde, uma plataforma de agendamento de consultas, teleconsultas e exames médicos.

Seu papel é ajudar os pacientes de forma cordial, profissional e eficiente a:
- Agendar consultas presenciais
- Agendar teleconsultas
- Solicitar exames médicos
- Cadastrar novos pacientes
- Fazer login de pacientes existentes
- Recuperar senhas

REGRAS IMPORTANTES:
1. Seja sempre cordial e use emojis moderadamente (👋, ✅, 📅, 🏥, etc)
2. Faça perguntas diretas e claras, uma de cada vez
3. Confirme informações importantes antes de prosseguir
4. Se o usuário não souber a cidade, use Goiânia como padrão
5. Explique os próximos passos de forma clara
6. Ao listar opções, numere-as para facilitar a escolha
7. Seja empático e paciente
8. Use as funções disponíveis para buscar informações na API
9. Nunca invente informações - sempre consulte a API
10. Quando precisar de autenticação, peça CPF/email e senha de forma clara
11. Para cadastro, colete os dados obrigatórios: nome, CPF, data nascimento, email, telefone, CEP, número, senha
12. Valide CPF e email antes de prosseguir
13. Para exames, permita que o usuário adicione múltiplos itens ao carrinho
14. Sempre confirme antes de finalizar agendamentos ou pedidos
15. Seja breve nas respostas (máximo 2-3 parágrafos por mensagem)

FLUXO DE AGENDAMENTO:
1. Identifique tipo de serviço (consulta, teleconsulta ou exame)
2. Identifique a cidade (padrão Goiânia)
3. Para consultas/teleconsultas:
   - Pergunte especialidade, profissional ou local
   - Busque opções e apresente ao paciente
   - Liste profissionais disponíveis
   - Após usuário escolher profissional, mostre horários disponíveis
   - IMPORTANTE: Quando mostrar horários, numere-os (1, 2, 3...) e instrua o usuário a escolher pelo número
   - Quando usuário escolher um número, SEMPRE use a função selecionar_horario
   - Se usuário não estiver logado, a função solicitará login automaticamente
   - Após login, o sistema valida o agendamento automaticamente
4. Para exames:
   - Pergunte qual exame deseja
   - Permita adicionar múltiplos exames
   - Solicite login (se não logado)
   - Confirme carrinho e finalize

IMPORTANTE: Pagamentos ainda não estão implementados. Informe que após confirmação, o paciente receberá instruções de pagamento posteriormente.`;

/**
 * Definição das funções disponíveis para o GPT
 */
const FUNCTIONS = [
  {
    name: 'buscar_municipios',
    description: 'Busca municípios pelo nome para identificar a localização do paciente',
    parameters: {
      type: 'object',
      properties: {
        nome: {
          type: 'string',
          description: 'Parte do nome do município a buscar'
        },
        proc_codigo: {
          type: 'string',
          description: 'Código do procedimento (10101012 para consulta, 10101011 para teleconsulta)'
        }
      },
      required: ['nome']
    }
  },
  {
    name: 'buscar_profissionais_especialidades',
    description: 'Busca profissionais, especialidades ou locais de atendimento pelo nome',
    parameters: {
      type: 'object',
      properties: {
        nome: {
          type: 'string',
          description: 'Parte do nome do profissional, especialidade ou local'
        },
        munic_id: {
          type: 'string',
          description: 'ID do município'
        },
        proc_codigo: {
          type: 'string',
          description: 'Código do procedimento (10101012 para consulta, 10101011 para teleconsulta)'
        }
      },
      required: ['nome', 'proc_codigo']
    }
  },
  {
    name: 'listar_profissionais',
    description: 'Lista profissionais disponíveis por especialidade, local ou profissional específico',
    parameters: {
      type: 'object',
      properties: {
        esp_id: {
          type: 'string',
          description: 'ID da especialidade'
        },
        cli_id: {
          type: 'string',
          description: 'ID da clínica/local'
        },
        prof_id: {
          type: 'string',
          description: 'ID do profissional'
        },
        nome: {
          type: 'string',
          description: 'Nome da especialidade, local ou profissional'
        },
        munic_id: {
          type: 'string',
          description: 'ID do município'
        },
        proc_codigo: {
          type: 'string',
          description: 'Código do procedimento'
        }
      },
      required: ['proc_codigo']
    }
  },
  {
    name: 'selecionar_profissional',
    description: 'Seleciona um profissional da lista retornada anteriormente pelo número (índice começando em 1). Use esta função quando o usuário escolher um profissional da lista.',
    parameters: {
      type: 'object',
      properties: {
        numero_escolhido: {
          type: 'number',
          description: 'Número do profissional escolhido (1, 2, 3, etc)'
        }
      },
      required: ['numero_escolhido']
    }
  },
  {
    name: 'listar_vagas',
    description: 'Lista horários disponíveis para um profissional específico. Os IDs devem vir da sessão após selecionar um profissional.',
    parameters: {
      type: 'object',
      properties: {
        prof_id: {
          type: 'string',
          description: 'ID do profissional (deve estar salvo na sessão)'
        },
        esp_id: {
          type: 'string',
          description: 'ID da especialidade (deve estar salvo na sessão)'
        },
        cli_id: {
          type: 'string',
          description: 'ID da clínica (deve estar salvo na sessão)'
        },
        proc_codigo: {
          type: 'string',
          description: 'Código do procedimento'
        },
        data_inicial: {
          type: 'string',
          description: 'Data inicial no formato YYYY-MM-DD'
        },
        data_final: {
          type: 'string',
          description: 'Data final no formato YYYY-MM-DD'
        }
      },
      required: ['data_inicial', 'data_final']
    }
  },
  {
    name: 'selecionar_horario',
    description: 'SEMPRE use esta função quando o usuário escolher um número de horário da lista de vagas (ex: 1, 2, primeira opção, primeira data, etc). Esta função seleciona o horário, verifica se o usuário está logado e valida o agendamento automaticamente. NUNCA peça confirmação manual - deixe a função fazer isso.',
    parameters: {
      type: 'object',
      properties: {
        data_escolhida: {
          type: 'string',
          description: 'Data escolhida no formato YYYY-MM-DD (ex: 2025-11-10). Extraia do contexto das vagas mostradas.'
        },
        numero_horario: {
          type: 'number',
          description: 'Número do horário escolhido na lista começando em 1 (primeira opção = 1, segunda = 2, etc)'
        }
      },
      required: ['data_escolhida', 'numero_horario']
    }
  },
  {
    name: 'login_paciente',
    description: 'Faz login do paciente com CPF/email e senha',
    parameters: {
      type: 'object',
      properties: {
        login: {
          type: 'string',
          description: 'CPF ou email do paciente'
        },
        senha: {
          type: 'string',
          description: 'Senha do paciente'
        }
      },
      required: ['login', 'senha']
    }
  },
  {
    name: 'buscar_dependentes',
    description: 'Busca lista de dependentes do beneficiário titular logado. O benef_id será obtido automaticamente da sessão.',
    parameters: {
      type: 'object',
      properties: {}
    }
  },
  {
    name: 'validar_agendamento',
    description: 'Valida se é possível realizar o agendamento com os parâmetros fornecidos. O benef_id será obtido automaticamente da sessão do usuário logado. Só utilize esta função se o paciente já estiver autenticado.',
    parameters: {
      type: 'object',
      properties: {
        cli_id: { type: 'string', description: 'ID da clínica (disponível na sessão)' },
        prof_id: { type: 'string', description: 'ID do profissional (disponível na sessão)' },
        esp_id: { type: 'string', description: 'ID da especialidade (disponível na sessão)' },
        tblproced_id: { type: 'string', description: 'ID da tabela de procedimentos (geralmente 1)' },
        proc_codigo: { type: 'string', description: 'Código do procedimento (disponível na sessão)' },
        data_hora: { type: 'string', description: 'Formato: YYYY-MM-DD HH:mm' },
        tpa_id: { type: 'string', description: 'ID do tipo de atendimento (geralmente 1)' }
      },
      required: ['data_hora']
    }
  },
  {
    name: 'confirmar_agendamento',
    description: 'Confirma o agendamento após validação bem-sucedida. O benef_id será obtido automaticamente da sessão do usuário logado. Só utilize esta função após o agendamento ter sido validado com sucesso.',
    parameters: {
      type: 'object',
      properties: {
        cli_id: { type: 'string', description: 'ID da clínica (disponível na sessão)' },
        prof_id: { type: 'string', description: 'ID do profissional (disponível na sessão)' },
        esp_id: { type: 'string', description: 'ID da especialidade (disponível na sessão)' },
        tblproced_id: { type: 'string', description: 'ID da tabela de procedimentos (geralmente 1)' },
        proc_codigo: { type: 'string', description: 'Código do procedimento (disponível na sessão)' },
        data_hora: { type: 'string', description: 'Formato: YYYY-MM-DD HH:mm' },
        tpa_id: { type: 'string', description: 'ID do tipo de atendimento (geralmente 1)' }
      },
      required: ['data_hora']
    }
  },
  {
    name: 'buscar_procedimentos_exames',
    description: 'Busca procedimentos/exames pelo nome ou código TUSS',
    parameters: {
      type: 'object',
      properties: {
        nome: {
          type: 'string',
          description: 'Nome do exame ou código TUSS'
        },
        munic_id: {
          type: 'string',
          description: 'ID do município'
        }
      },
      required: ['nome']
    }
  },
  {
    name: 'criar_pedido_exames',
    description: 'Cria pedido com os exames selecionados (do carrinho). O benef_id será obtido automaticamente da sessão do usuário logado. Só utilize esta função se o paciente já estiver autenticado.',
    parameters: {
      type: 'object',
      properties: {}
    }
  },
  {
    name: 'cadastrar_paciente',
    description: 'Cadastra novo paciente no sistema',
    parameters: {
      type: 'object',
      properties: {
        nome: { type: 'string' },
        cpf: { type: 'string' },
        data_nascimento: { type: 'string', description: 'Formato: YYYY-MM-DD' },
        email: { type: 'string' },
        telefone: { type: 'string' },
        cep: { type: 'string' },
        numero: { type: 'string' },
        complemento: { type: 'string' },
        senha: { type: 'string' }
      },
      required: ['nome', 'cpf', 'data_nascimento', 'email', 'senha']
    }
  },
  {
    name: 'solicitar_recuperacao_senha',
    description: 'Solicita recuperação de senha via CPF ou email',
    parameters: {
      type: 'object',
      properties: {
        cpf_email: {
          type: 'string',
          description: 'CPF ou email do paciente'
        }
      },
      required: ['cpf_email']
    }
  }
];

/**
 * Chama GPT-4o com function calling
 */
const processMessage = async (messages, availableFunctions = FUNCTIONS) => {
  try {
    // Chamada ao GPT
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        ...messages
      ],
      functions: availableFunctions,
      function_call: 'auto',
      temperature: 0.7,
      max_tokens: 800
    });

    const assistantMessage = response.choices[0].message;

    // Log apenas se chamar função
    if (assistantMessage.function_call) {
      logger.info(`🤖 GPT chamando: ${assistantMessage.function_call.name}`);
    }

    return {
      content: assistantMessage.content,
      functionCall: assistantMessage.function_call ? {
        name: assistantMessage.function_call.name,
        arguments: JSON.parse(assistantMessage.function_call.arguments)
      } : null,
      fullMessage: assistantMessage
    };
  } catch (error) {
    logger.error('Erro ao processar mensagem com OpenAI', error);
    throw error;
  }
};

/**
 * Processa mensagem simples sem function calling
 */
const simpleChat = async (userMessage, systemPrompt = null) => {
  try {
    const messages = [
      { role: 'user', content: userMessage }
    ];

    if (systemPrompt) {
      messages.unshift({ role: 'system', content: systemPrompt });
    }

    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages,
      temperature: 0.7,
      max_tokens: 500
    });

    return response.choices[0].message.content;
  } catch (error) {
    logger.error('Erro no chat simples', error);
    throw error;
  }
};

module.exports = {
  processMessage,
  simpleChat,
  SYSTEM_PROMPT,
  FUNCTIONS
};

