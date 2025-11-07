const { parseEvolutionPayload, validatePayload } = require('../utils/messageParser');
const flowService = require('../services/flowService');
const logger = require('../config/logger');

/**
 * Processa webhook recebido da Evolution API
 */
const handleWebhook = async (req, res) => {
  try {
    logger.info('Webhook recebido', { body: req.body });
    
    // Parse do payload (pode vir como array ou objeto)
    const payload = Array.isArray(req.body) ? req.body[0] : req.body;
    
    // Extrai dados relevantes
    const parsedData = parseEvolutionPayload(payload);
    
    // Valida payload
    const validation = validatePayload(parsedData);
    
    if (!validation.valid) {
      logger.warn('Payload inválido ou ignorado', { error: validation.error });
      return res.status(200).json({ 
        status: 'ignored',
        reason: validation.error 
      });
    }
    
    const { telefoneCliente, mensagem, instancia, name, audioMessage } = parsedData;
    
    // Se for áudio, informa que não suporta (por enquanto)
    if (audioMessage && !mensagem) {
      logger.info('Mensagem de áudio recebida (não suportado)');
      return res.status(200).json({ 
        status: 'success',
        message: 'Audio messages not supported yet' 
      });
    }
    
    // Processa mensagem de forma assíncrona
    // Não aguarda conclusão para responder rapidamente ao webhook
    setImmediate(async () => {
      try {
        await flowService.processUserMessage(
          telefoneCliente,
          mensagem,
          instancia,
          name
        );
      } catch (error) {
        logger.error('Erro ao processar mensagem em background', error);
      }
    });
    
    // Responde imediatamente para o webhook
    res.status(200).json({ 
      status: 'success',
      message: 'Message received and processing' 
    });
    
  } catch (error) {
    logger.error('Erro ao processar webhook', error);
    res.status(500).json({ 
      status: 'error',
      message: 'Internal server error' 
    });
  }
};

/**
 * Health check endpoint
 */
const healthCheck = async (req, res) => {
  res.status(200).json({ 
    status: 'ok',
    service: 'OniSaude WhatsApp Bot',
    timestamp: new Date().toISOString()
  });
};

module.exports = {
  handleWebhook,
  healthCheck
};

