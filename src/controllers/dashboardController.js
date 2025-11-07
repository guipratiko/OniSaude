const { getRedisClient } = require('../config/redis');
const logger = require('../config/logger');

/**
 * Lista todas as sessões ativas
 */
const getSessions = async (req, res) => {
  try {
    const redis = getRedisClient();
    const keys = await redis.keys('session:*');
    
    const sessions = {};
    
    for (const key of keys) {
      const data = await redis.get(key);
      if (data) {
        const sessionData = JSON.parse(data);
        sessions[key.replace('session:', '')] = sessionData;
      }
    }
    
    res.json({ sessions });
  } catch (error) {
    logger.error('Erro ao buscar sessões', error);
    res.status(500).json({ error: 'Erro ao buscar sessões' });
  }
};

/**
 * Obtém detalhes de uma sessão específica
 */
const getSessionDetails = async (req, res) => {
  try {
    const { telefone, instancia } = req.params;
    const redis = getRedisClient();
    const key = `session:${telefone}:${instancia}`;
    
    const data = await redis.get(key);
    
    if (!data) {
      return res.status(404).json({ error: 'Sessão não encontrada' });
    }
    
    res.json(JSON.parse(data));
  } catch (error) {
    logger.error('Erro ao buscar detalhes da sessão', error);
    res.status(500).json({ error: 'Erro ao buscar sessão' });
  }
};

/**
 * Limpa todas as sessões
 */
const clearAllSessions = async (req, res) => {
  try {
    const redis = getRedisClient();
    const keys = await redis.keys('session:*');
    
    if (keys.length > 0) {
      await redis.del(keys);
    }
    
    logger.info(`${keys.length} sessões limpas`);
    res.json({ 
      message: `${keys.length} sessão(ões) limpa(s) com sucesso`,
      count: keys.length
    });
  } catch (error) {
    logger.error('Erro ao limpar sessões', error);
    res.status(500).json({ error: 'Erro ao limpar sessões' });
  }
};

/**
 * Limpa uma sessão específica
 */
const clearSession = async (req, res) => {
  try {
    const { telefone, instancia } = req.params;
    const redis = getRedisClient();
    const key = `session:${telefone}:${instancia}`;
    
    await redis.del(key);
    
    logger.info(`Sessão limpa: ${key}`);
    res.json({ message: 'Sessão limpa com sucesso' });
  } catch (error) {
    logger.error('Erro ao limpar sessão', error);
    res.status(500).json({ error: 'Erro ao limpar sessão' });
  }
};

/**
 * Retorna estatísticas gerais
 */
const getStats = async (req, res) => {
  try {
    const redis = getRedisClient();
    const keys = await redis.keys('session:*');
    
    let totalMessages = 0;
    let totalAppointments = 0;
    
    for (const key of keys) {
      const data = await redis.get(key);
      if (data) {
        const session = JSON.parse(data);
        totalMessages += session.historico?.length || 0;
        if (session.dados?.ag_id) {
          totalAppointments++;
        }
      }
    }
    
    const stats = {
      total_sessions: keys.length,
      total_messages: totalMessages,
      total_appointments: totalAppointments,
      success_rate: keys.length > 0 ? Math.round((totalAppointments / keys.length) * 100) : 0
    };
    
    res.json(stats);
  } catch (error) {
    logger.error('Erro ao buscar estatísticas', error);
    res.status(500).json({ error: 'Erro ao buscar estatísticas' });
  }
};

module.exports = {
  getSessions,
  getSessionDetails,
  clearAllSessions,
  clearSession,
  getStats
};

