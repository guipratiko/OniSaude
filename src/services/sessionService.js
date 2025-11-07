const { getRedisClient } = require('../config/redis');
const { REDIS_SESSION_TTL, ESTADOS } = require('../config/constants');
const logger = require('../config/logger');

/**
 * Cria chave única para sessão baseada em telefone + instância
 */
const createSessionKey = (telefoneCliente, instancia) => {
  return `session:${telefoneCliente}:${instancia}`;
};

/**
 * Cria nova sessão ou recupera existente
 */
const getSession = async (telefoneCliente, instancia) => {
  try {
    const redis = getRedisClient();
    const key = createSessionKey(telefoneCliente, instancia);
    
    const sessionData = await redis.get(key);
    
    if (sessionData) {
      // Sessão recuperada (não loga para evitar spam)
      return JSON.parse(sessionData);
    }
    
    // Cria nova sessão
    const newSession = {
      telefoneCliente,
      instancia,
      estado: ESTADOS.INICIO,
      dados: {},
      historico: [],
      criadoEm: new Date().toISOString(),
      atualizadoEm: new Date().toISOString()
    };
    
    await saveSession(telefoneCliente, instancia, newSession);
    logger.info(`✨ Nova sessão criada: ${key}`);
    
    return newSession;
  } catch (error) {
    logger.error('Erro ao obter sessão', error);
    throw error;
  }
};

/**
 * Salva sessão no Redis
 */
const saveSession = async (telefoneCliente, instancia, sessionData) => {
  try {
    const redis = getRedisClient();
    const key = createSessionKey(telefoneCliente, instancia);
    
    sessionData.atualizadoEm = new Date().toISOString();
    
    await redis.setEx(
      key,
      REDIS_SESSION_TTL,
      JSON.stringify(sessionData)
    );
    
    // Não loga para evitar spam
  } catch (error) {
    logger.error('Erro ao salvar sessão', error);
    throw error;
  }
};

/**
 * Atualiza estado da sessão
 */
const updateSessionState = async (telefoneCliente, instancia, novoEstado) => {
  try {
    const session = await getSession(telefoneCliente, instancia);
    session.estado = novoEstado;
    await saveSession(telefoneCliente, instancia, session);
    logger.info(`🔄 Estado: ${novoEstado}`);
  } catch (error) {
    logger.error('Erro ao atualizar estado', error);
    throw error;
  }
};

/**
 * Atualiza dados da sessão
 */
const updateSessionData = async (telefoneCliente, instancia, dadosNovos) => {
  try {
    const session = await getSession(telefoneCliente, instancia);
    session.dados = {
      ...session.dados,
      ...dadosNovos
    };
    await saveSession(telefoneCliente, instancia, session);
    // Não loga para evitar spam
  } catch (error) {
    logger.error('Erro ao atualizar dados', error);
    throw error;
  }
};

/**
 * Adiciona mensagem ao histórico
 */
const addMessageToHistory = async (telefoneCliente, instancia, role, content) => {
  try {
    const session = await getSession(telefoneCliente, instancia);
    
    if (!session.historico) {
      session.historico = [];
    }
    
    session.historico.push({
      role,
      content,
      timestamp: new Date().toISOString()
    });
    
    // Mantém apenas últimas 20 mensagens
    if (session.historico.length > 20) {
      session.historico = session.historico.slice(-20);
    }
    
    await saveSession(telefoneCliente, instancia, session);
  } catch (error) {
    logger.error('Erro ao adicionar mensagem ao histórico', error);
    throw error;
  }
};

/**
 * Obtém histórico de mensagens formatado para OpenAI
 */
const getMessageHistory = async (telefoneCliente, instancia) => {
  try {
    const session = await getSession(telefoneCliente, instancia);
    
    if (!session.historico || session.historico.length === 0) {
      return [];
    }
    
    return session.historico.map(msg => ({
      role: msg.role,
      content: msg.content
    }));
  } catch (error) {
    logger.error('Erro ao obter histórico', error);
    throw error;
  }
};

/**
 * Limpa sessão (logout ou finalização)
 */
const clearSession = async (telefoneCliente, instancia) => {
  try {
    const redis = getRedisClient();
    const key = createSessionKey(telefoneCliente, instancia);
    await redis.del(key);
    logger.info(`Sessão removida: ${key}`);
  } catch (error) {
    logger.error('Erro ao limpar sessão', error);
    throw error;
  }
};

/**
 * Renova TTL da sessão
 */
const renewSession = async (telefoneCliente, instancia) => {
  try {
    const redis = getRedisClient();
    const key = createSessionKey(telefoneCliente, instancia);
    await redis.expire(key, REDIS_SESSION_TTL);
    logger.info(`TTL renovado: ${key}`);
  } catch (error) {
    logger.error('Erro ao renovar sessão', error);
    throw error;
  }
};

/**
 * Salva token de autenticação na sessão
 */
const saveAuthToken = async (telefoneCliente, instancia, token, benefId, benefNome) => {
  try {
    const session = await getSession(telefoneCliente, instancia);
    session.dados.token = token;
    session.dados.benef_id = benefId;
    session.dados.benef_nome = benefNome;
    session.dados.autenticado = true;
    await saveSession(telefoneCliente, instancia, session);
    logger.info(`🔐 Login: ${benefNome} (ID: ${benefId})`);
  } catch (error) {
    logger.error('Erro ao salvar token', error);
    throw error;
  }
};

/**
 * Verifica se usuário está autenticado
 */
const isAuthenticated = async (telefoneCliente, instancia) => {
  try {
    const session = await getSession(telefoneCliente, instancia);
    return session.dados.autenticado === true && session.dados.token;
  } catch (error) {
    logger.error('Erro ao verificar autenticação', error);
    return false;
  }
};

/**
 * Adiciona item ao carrinho de exames
 */
const addToExamCart = async (telefoneCliente, instancia, procedimento) => {
  try {
    const session = await getSession(telefoneCliente, instancia);
    
    if (!session.dados.carrinhoExames) {
      session.dados.carrinhoExames = [];
    }
    
    // Verifica se já existe
    const exists = session.dados.carrinhoExames.find(
      p => p.proc_codigo === procedimento.proc_codigo
    );
    
    if (!exists) {
      session.dados.carrinhoExames.push(procedimento);
    }
    
    await saveSession(telefoneCliente, instancia, session);
    logger.info(`Exame adicionado ao carrinho: ${procedimento.proc_codigo}`);
  } catch (error) {
    logger.error('Erro ao adicionar ao carrinho', error);
    throw error;
  }
};

/**
 * Remove item do carrinho de exames
 */
const removeFromExamCart = async (telefoneCliente, instancia, proc_codigo) => {
  try {
    const session = await getSession(telefoneCliente, instancia);
    
    if (!session.dados.carrinhoExames) {
      return;
    }
    
    session.dados.carrinhoExames = session.dados.carrinhoExames.filter(
      p => p.proc_codigo !== proc_codigo
    );
    
    await saveSession(telefoneCliente, instancia, session);
    logger.info(`Exame removido do carrinho: ${proc_codigo}`);
  } catch (error) {
    logger.error('Erro ao remover do carrinho', error);
    throw error;
  }
};

/**
 * Limpa carrinho de exames
 */
const clearExamCart = async (telefoneCliente, instancia) => {
  try {
    const session = await getSession(telefoneCliente, instancia);
    session.dados.carrinhoExames = [];
    await saveSession(telefoneCliente, instancia, session);
    logger.info('Carrinho limpo');
  } catch (error) {
    logger.error('Erro ao limpar carrinho', error);
    throw error;
  }
};

module.exports = {
  getSession,
  saveSession,
  updateSessionState,
  updateSessionData,
  addMessageToHistory,
  getMessageHistory,
  clearSession,
  renewSession,
  saveAuthToken,
  isAuthenticated,
  addToExamCart,
  removeFromExamCart,
  clearExamCart
};

