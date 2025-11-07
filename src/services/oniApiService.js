const axios = require('axios');
const logger = require('../config/logger');
const {
  ONI_API_BASE_URL,
  ONI_CONV_ANS,
  ONI_PLANO_ID,
  ONI_SUPER_ID,
  ONI_PROC_CONSULTA,
  ONI_MUNIC_GOIANIA
} = require('../config/constants');

/**
 * Cliente HTTP configurado para API OniSaúde
 */
const apiClient = axios.create({
  baseURL: ONI_API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Interceptor para logging (apenas erros)
apiClient.interceptors.response.use(
  (response) => {
    // Não loga sucesso, apenas retorna
    return response;
  },
  (error) => {
    logger.error(`❌ API Error: ${error.config?.url}`, {
      message: error.message,
      response: error.response?.data
    });
    throw error;
  }
);

/**
 * ============================================
 * ENDPOINTS - BUSCA DE MUNICÍPIOS
 * ============================================
 */

const buscarMunicipios = async (params = {}) => {
  try {
    const response = await apiClient.get('/endereco/listar-municipios', {
      params: {
        proc_codigo: params.proc_codigo || ONI_PROC_CONSULTA,
        munic_id: params.munic_id || ONI_MUNIC_GOIANIA,
        conv_ans: ONI_CONV_ANS,
        super_id: ONI_SUPER_ID,
        munic_nome: params.munic_nome || 'goiania'
      }
    });
    return response.data;
  } catch (error) {
    logger.error('Erro ao buscar municípios', error);
    throw error;
  }
};

/**
 * ============================================
 * ENDPOINTS - BUSCA PROFISSIONAL/ESPECIALIDADE/LOCAL
 * ============================================
 */

const buscarProfEspLocal = async (params) => {
  try {
    const response = await apiClient.get('/agendaportal/listar-profissional-especialidade-servico', {
      params: {
        proc_codigo: params.proc_codigo,
        munic_id: params.munic_id || ONI_MUNIC_GOIANIA,
        conv_ans: ONI_CONV_ANS,
        super_id: ONI_SUPER_ID,
        nome: params.nome
      }
    });
    return response.data;
  } catch (error) {
    logger.error('Erro ao buscar profissionais/especialidades/locais', error);
    throw error;
  }
};

/**
 * ============================================
 * ENDPOINTS - LISTAR PROFISSIONAIS
 * ============================================
 */

const listarProfissionais = async (params) => {
  try {
    const queryParams = {
      munic_id: params.munic_id || ONI_MUNIC_GOIANIA,
      localizacao: params.localizacao || 'Goiânia, GO',
      conv_ans: ONI_CONV_ANS,
      conv_sigla: 'Onisaude',
      plano_id: ONI_PLANO_ID,
      tblproced_id: params.tblproced_id || 1,
      proc_codigo: params.proc_codigo,
      page: params.page || 1,
      per_page: params.per_page || 20
    };

    // Adiciona esp_id, cli_id ou prof_id conforme fornecido
    if (params.esp_id) {
      queryParams.esp_id = params.esp_id;
      queryParams.nome = params.nome;
    } else if (params.cli_id) {
      queryParams.cli_id = params.cli_id;
      queryParams.nome = params.nome;
    } else if (params.prof_id) {
      queryParams.prof_id = params.prof_id;
      queryParams.nome = params.nome;
    }

    const response = await apiClient.get('/agendaportal/listar-profissionais', {
      params: queryParams
    });
    return response.data;
  } catch (error) {
    logger.error('Erro ao listar profissionais', error);
    throw error;
  }
};

/**
 * ============================================
 * ENDPOINTS - LISTAR VAGAS
 * ============================================
 */

const listarVagas = async (params) => {
  try {
    const superIdArray = Array.isArray(params.super_id) ? params.super_id : [params.super_id || ONI_SUPER_ID];

    const response = await apiClient.get('/agendaportal/listar-vagas', {
      params: {
        prof_id: params.prof_id,
        conv_ans: ONI_CONV_ANS,
        esp_id: params.esp_id,
        cli_id: params.cli_id,
        proc_codigo: params.proc_codigo,
        tblproced_id: params.tblproced_id || 1,
        'super_id[]': superIdArray,
        data_inicial: params.data_inicial,
        data_final: params.data_final
      },
      paramsSerializer: params => {
        const searchParams = new URLSearchParams();
        Object.entries(params).forEach(([key, value]) => {
          if (Array.isArray(value)) {
            value.forEach(v => searchParams.append(key, v));
          } else {
            searchParams.append(key, value);
          }
        });
        return searchParams.toString();
      }
    });
    return response.data;
  } catch (error) {
    logger.error('Erro ao listar vagas', error);
    throw error;
  }
};

/**
 * ============================================
 * ENDPOINTS - AUTENTICAÇÃO
 * ============================================
 */

const loginPaciente = async (login, senha) => {
  try {
    const formData = new URLSearchParams();
    formData.append('login', login);
    formData.append('senha', senha);

    const response = await apiClient.post('/auth/login-paciente', formData, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });
    return response.data;
  } catch (error) {
    logger.error('Erro ao fazer login', error);
    throw error;
  }
};

const getTokenInfo = async (token) => {
  try {
    const response = await apiClient.post('/auth/token-info', {}, {
      headers: {
        'authorization': `Bearer ${token}`
      }
    });
    return response.data;
  } catch (error) {
    logger.error('Erro ao buscar info do token', error);
    throw error;
  }
};

const buscarTermosBeneficiario = async (benef_id, token) => {
  try {
    const response = await apiClient.get('/termo/buscar-termos-beneficiario', {
      params: { benef_id },
      headers: token ? { 'authorization': `Bearer ${token}` } : {}
    });
    return response.data;
  } catch (error) {
    logger.error('Erro ao buscar termos do beneficiário', error);
    throw error;
  }
};

/**
 * ============================================
 * ENDPOINTS - DEPENDENTES
 * ============================================
 */

const listarDependentes = async (benef_id, token) => {
  try {
    const response = await apiClient.get('/beneficiario/listar-dependente', {
      params: { benef_id },
      headers: {
        'authorization': `Bearer ${token}`
      }
    });
    return response.data;
  } catch (error) {
    logger.error('Erro ao listar dependentes', error);
    throw error;
  }
};

/**
 * ============================================
 * ENDPOINTS - PARCERIAS
 * ============================================
 */

const buscarParcerias = async (parceiro, tipo_parceria, tipo_atendimento, token) => {
  try {
    const response = await apiClient.get('/parceiros/buscar-parametrizacao-parceiro-onisaude', {
      params: {
        parceiro,
        tipo_parceria,
        tipo_atendimento
      },
      headers: token ? { 'authorization': `Bearer ${token}` } : {}
    });
    return response.data;
  } catch (error) {
    logger.error('Erro ao buscar parcerias', error);
    throw error;
  }
};

/**
 * ============================================
 * ENDPOINTS - AGENDAMENTO
 * ============================================
 */

const verificarRetorno = async (params, token) => {
  try {
    const formData = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      formData.append(key, value);
    });

    const response = await apiClient.post('/agendaportal/retorno', formData, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'authorization': `Bearer ${token}`
      }
    });
    return response.data;
  } catch (error) {
    logger.error('Erro ao verificar retorno', error);
    throw error;
  }
};

const validarAgendamento = async (params, token) => {
  try {
    const formData = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      formData.append(key, value);
    });

    const response = await apiClient.post('/agendaportal/validar', formData, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'authorization': `Bearer ${token}`
      }
    });
    return response.data;
  } catch (error) {
    logger.error('Erro ao validar agendamento', error);
    throw error;
  }
};

const agendar = async (params, token) => {
  try {
    const formData = new URLSearchParams();
    
    // Parâmetros obrigatórios
    const agendamentoParams = {
      ...params,
      conv_ans: ONI_CONV_ANS,
      plano_id: ONI_PLANO_ID,
      super_id: ONI_SUPER_ID,
      origem: params.origem || 7,
      tipo_agenda: params.tipo_agenda || 'O',
      tipo_agendamento: params.tipo_agendamento || 'P'
    };

    Object.entries(agendamentoParams).forEach(([key, value]) => {
      formData.append(key, value);
    });

    const response = await apiClient.post('/agendaportal/agendar', formData, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'authorization': `Bearer ${token}`
      }
    });
    return response.data;
  } catch (error) {
    logger.error('Erro ao agendar', error);
    throw error;
  }
};

/**
 * ============================================
 * ENDPOINTS - EXAMES
 * ============================================
 */

const listarProcedimentos = async (params) => {
  try {
    const response = await apiClient.get('/procedimento/listar-procedimentos', {
      params: {
        munic_id: params.munic_id || ONI_MUNIC_GOIANIA,
        conv_ans: ONI_CONV_ANS,
        nome: params.nome
      }
    });
    return response.data;
  } catch (error) {
    logger.error('Erro ao listar procedimentos', error);
    throw error;
  }
};

const listarUnidadesExames = async (codigos_procedimentos, munic_id, token) => {
  try {
    const response = await apiClient.get('/procedimento/listar-unidades', {
      params: {
        conv_ans: ONI_CONV_ANS,
        munic_id: munic_id || ONI_MUNIC_GOIANIA,
        codigos_procedimentos: codigos_procedimentos.join(',')
      },
      headers: {
        'authorization': `Bearer ${token}`
      }
    });
    return response.data;
  } catch (error) {
    logger.error('Erro ao listar unidades para exames', error);
    throw error;
  }
};

const criarPedidoExames = async (benef_id, procedimentos, token) => {
  try {
    const formData = new URLSearchParams();
    formData.append('benef_id', benef_id);

    procedimentos.forEach((proc, index) => {
      formData.append(`procedimentos[${index}][proc_codigo]`, proc.proc_codigo);
      formData.append(`procedimentos[${index}][proc_descricao]`, proc.proc_descricao);
      formData.append(`procedimentos[${index}][proc_vlr]`, proc.proc_vlr);
    });

    const response = await apiClient.post('/agendaportal/criar-pedido', formData, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'authorization': `Bearer ${token}`
      }
    });
    return response.data;
  } catch (error) {
    logger.error('Erro ao criar pedido de exames', error);
    throw error;
  }
};

/**
 * ============================================
 * ENDPOINTS - PAGAMENTO
 * ============================================
 */

const buscarDadosPagamento = async (osp_id, token) => {
  try {
    const formData = new URLSearchParams();
    formData.append('osp_id', osp_id);

    const response = await apiClient.post('/pagamentorede/dados-pagamento', formData, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'authorization': `Bearer ${token}`
      }
    });
    return response.data;
  } catch (error) {
    logger.error('Erro ao buscar dados de pagamento', error);
    throw error;
  }
};

const consultarTaxaAdm = async (tipo, token) => {
  try {
    const formData = new URLSearchParams();
    formData.append('tipo', tipo);

    const response = await apiClient.post('/pagamentogerencianet/consultar-taxa-adm', formData, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'authorization': `Bearer ${token}`
      }
    });
    return response.data;
  } catch (error) {
    logger.error('Erro ao consultar taxa administrativa', error);
    throw error;
  }
};

const buscarTokenBeneficiario = async (osp_id, token) => {
  try {
    const response = await apiClient.get('/procedimento/token-beneficiario', {
      params: { osp_id },
      headers: {
        'authorization': `Bearer ${token}`
      }
    });
    return response.data;
  } catch (error) {
    logger.error('Erro ao buscar token do beneficiário', error);
    throw error;
  }
};

/**
 * ============================================
 * ENDPOINTS - CADASTRO
 * ============================================
 */

const buscarDadosCep = async (cep) => {
  try {
    const response = await apiClient.get('/endereco/buscar-dados-cep', {
      params: { cep }
    });
    return response.data;
  } catch (error) {
    logger.error('Erro ao buscar dados do CEP', error);
    throw error;
  }
};

const listarUFs = async () => {
  try {
    const response = await apiClient.get('/endereco/listar-unidades-federativas');
    return response.data;
  } catch (error) {
    logger.error('Erro ao listar UFs', error);
    throw error;
  }
};

const listarMunicipiosPorUF = async (munic_uf) => {
  try {
    const response = await apiClient.get('/endereco/listar-municipios', {
      params: { munic_uf }
    });
    return response.data;
  } catch (error) {
    logger.error('Erro ao listar municípios por UF', error);
    throw error;
  }
};

const listarSetores = async (munic_id) => {
  try {
    const response = await apiClient.get('/endereco/listar-setores', {
      params: { munic_id }
    });
    return response.data;
  } catch (error) {
    logger.error('Erro ao listar setores', error);
    throw error;
  }
};

const cadastrarBeneficiario = async (dados) => {
  try {
    const formData = new URLSearchParams();
    Object.entries(dados).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        formData.append(key, value);
      }
    });

    const response = await apiClient.post('/beneficiario/alterar-beneficiario', formData, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });
    return response.data;
  } catch (error) {
    logger.error('Erro ao cadastrar beneficiário', error);
    throw error;
  }
};

/**
 * ============================================
 * ENDPOINTS - RECUPERAÇÃO DE SENHA
 * ============================================
 */

const solicitarAlteracaoSenha = async (cpf_email) => {
  try {
    const response = await apiClient.get('/beneficiario/solicitar-alteracao-senha', {
      params: { cpf_email }
    });
    return response.data;
  } catch (error) {
    logger.error('Erro ao solicitar alteração de senha', error);
    throw error;
  }
};

const solicitarAlteracaoSenhaContato = async (id_contato, emp_id = '') => {
  try {
    const response = await apiClient.get('/beneficiario/solicitar-alteracao-senha-contato', {
      params: { id_contato, emp_id }
    });
    return response.data;
  } catch (error) {
    logger.error('Erro ao solicitar alteração de senha por contato', error);
    throw error;
  }
};

module.exports = {
  // Municípios
  buscarMunicipios,
  
  // Busca de serviços
  buscarProfEspLocal,
  listarProfissionais,
  listarVagas,
  
  // Autenticação
  loginPaciente,
  getTokenInfo,
  buscarTermosBeneficiario,
  
  // Dependentes e parcerias
  listarDependentes,
  buscarParcerias,
  
  // Agendamento
  verificarRetorno,
  validarAgendamento,
  agendar,
  
  // Exames
  listarProcedimentos,
  listarUnidadesExames,
  criarPedidoExames,
  
  // Pagamento
  buscarDadosPagamento,
  consultarTaxaAdm,
  buscarTokenBeneficiario,
  
  // Cadastro
  buscarDadosCep,
  listarUFs,
  listarMunicipiosPorUF,
  listarSetores,
  cadastrarBeneficiario,
  
  // Recuperação de senha
  solicitarAlteracaoSenha,
  solicitarAlteracaoSenhaContato
};

