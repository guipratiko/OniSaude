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
   - Liste profissionais e horários disponíveis
   - Após escolha do horário, solicite login (se não logado)
   - Confirme dados e finalize
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
    description: 'Busca lista de dependentes do beneficiário titular',
    parameters: {
      type: 'object',
      properties: {
        benef_id: {
          type: 'string',
          description: 'ID do beneficiário'
        }
      },
      required: ['benef_id']
    }
  },
  {
    name: 'validar_agendamento',
    description: 'Valida se é possível realizar o agendamento com os parâmetros fornecidos',
    parameters: {
      type: 'object',
      properties: {
        cli_id: { type: 'string' },
        prof_id: { type: 'string' },
        esp_id: { type: 'string' },
        benef_id: { type: 'string' },
        tblproced_id: { type: 'string' },
        proc_codigo: { type: 'string' },
        data_hora: { type: 'string', description: 'Formato: YYYY-MM-DD HH:mm' },
        tpa_id: { type: 'string' }
      },
      required: ['cli_id', 'prof_id', 'esp_id', 'benef_id', 'proc_codigo', 'data_hora']
    }
  },
  {
    name: 'confirmar_agendamento',
    description: 'Confirma o agendamento após validação bem-sucedida',
    parameters: {
      type: 'object',
      properties: {
        cli_id: { type: 'string' },
        prof_id: { type: 'string' },
        esp_id: { type: 'string' },
        benef_id: { type: 'string' },
        tblproced_id: { type: 'string' },
        proc_codigo: { type: 'string' },
        data_hora: { type: 'string' },
        tpa_id: { type: 'string' }
      },
      required: ['cli_id', 'prof_id', 'esp_id', 'benef_id', 'proc_codigo', 'data_hora']
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
    description: 'Cria pedido com os exames selecionados (do carrinho)',
    parameters: {
      type: 'object',
      properties: {
        benef_id: {
          type: 'string',
          description: 'ID do beneficiário'
        }
      },
      required: ['benef_id']
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
    logger.info('Chamando OpenAI GPT-4o', {
      messageCount: messages.length
    });

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

    logger.info('Resposta OpenAI recebida', {
      hasContent: !!assistantMessage.content,
      hasFunctionCall: !!assistantMessage.function_call
    });

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

