const axios = require('axios');
const logger = require('../config/logger');
const { WHATSAPP_SEND_URL } = require('../config/constants');

/**
 * Envia mensagem para o WhatsApp via webhook
 */
const enviarMensagem = async (telefoneCliente, mensagem, instancia, retries = 3) => {
  try {
    const payload = {
      telefoneCliente,
      mensagem,
      instancia
    };

    logger.info(`Enviando mensagem WhatsApp para ${telefoneCliente}`, { payload });

    const response = await axios.post(WHATSAPP_SEND_URL, payload, {
      headers: {
        'Content-Type': 'application/json'
      },
      timeout: 10000
    });

    logger.info(`Mensagem enviada com sucesso para ${telefoneCliente}`, {
      status: response.status
    });

    return response.data;
  } catch (error) {
    logger.error(`Erro ao enviar mensagem (tentativa ${4 - retries}/3)`, {
      telefoneCliente,
      error: error.message
    });

    // Retry com backoff exponencial
    if (retries > 0) {
      const delay = (4 - retries) * 1000; // 1s, 2s, 3s
      logger.info(`Aguardando ${delay}ms antes de tentar novamente...`);
      
      await new Promise(resolve => setTimeout(resolve, delay));
      return enviarMensagem(telefoneCliente, mensagem, instancia, retries - 1);
    }

    throw error;
  }
};

/**
 * Envia múltiplas mensagens em sequência
 */
const enviarMensagensSequencial = async (telefoneCliente, mensagens, instancia, delay = 1000) => {
  try {
    for (let i = 0; i < mensagens.length; i++) {
      await enviarMensagem(telefoneCliente, mensagens[i], instancia);
      
      // Aguarda entre mensagens (exceto a última)
      if (i < mensagens.length - 1) {
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    
    logger.info(`${mensagens.length} mensagens enviadas sequencialmente para ${telefoneCliente}`);
  } catch (error) {
    logger.error('Erro ao enviar mensagens sequenciais', error);
    throw error;
  }
};

/**
 * Formata mensagem com quebras de linha e formatação WhatsApp
 */
const formatarMensagem = (texto) => {
  // Remove espaços extras no início e fim
  return texto.trim();
};

/**
 * Envia mensagem de erro padrão
 */
const enviarMensagemErro = async (telefoneCliente, instancia) => {
  const mensagem = `Desculpe, ocorreu um erro ao processar sua solicitação. 😔

Por favor, tente novamente em alguns instantes ou entre em contato com nosso suporte.`;

  return enviarMensagem(telefoneCliente, mensagem, instancia);
};

/**
 * Envia mensagem de boas-vindas
 */
const enviarBoasVindas = async (telefoneCliente, instancia, nome) => {
  const mensagem = `Olá${nome ? ` ${nome}` : ''}! 👋

Bem-vindo(a) à *OniSaúde*! 

Sou seu assistente virtual e estou aqui para ajudá-lo(a) a:

✅ Agendar consultas
✅ Agendar teleconsultas
✅ Solicitar exames

Como posso ajudá-lo(a) hoje?`;

  return enviarMensagem(telefoneCliente, mensagem, instancia);
};

module.exports = {
  enviarMensagem,
  enviarMensagensSequencial,
  formatarMensagem,
  enviarMensagemErro,
  enviarBoasVindas
};

