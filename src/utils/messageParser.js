/**
 * Extrai dados relevantes do payload da Evolution API
 */
const parseEvolutionPayload = (payload) => {
  try {
    const body = payload.body || payload;
    const data = body.data;

    if (!data) {
      throw new Error('Payload inválido: data não encontrado');
    }

    const telefoneCliente = data.key?.remoteJid || null;
    const fromMe = data.key?.fromMe || false;
    const idMensagem = data.key?.id || null;
    const name = data.pushName || 'Cliente';
    
    // Tenta diferentes formatos de instância
    const instancia = body.instanceName || body.instance || payload.instance || null;
    
    // Extrai mensagem de diferentes tipos
    let mensagem = null;
    if (data.message) {
      mensagem = data.message.conversation || 
                 data.message.extendedTextMessage?.text ||
                 data.message.imageMessage?.caption ||
                 data.message.videoMessage?.caption ||
                 null;
    }

    // Verifica se é mensagem de áudio
    const audioMessage = data.message?.audioMessage || null;

    return {
      telefoneCliente,
      mensagem,
      idMensagem,
      fromMe,
      bootName: 'OniSaude Bot',
      name,
      instancia,
      audioMessage
    };
  } catch (error) {
    console.error('Erro ao parsear payload:', error);
    throw error;
  }
};

/**
 * Valida se o payload possui os campos obrigatórios
 */
const validatePayload = (parsedData) => {
  const { telefoneCliente, instancia, fromMe } = parsedData;

  if (!telefoneCliente) {
    return { valid: false, error: 'telefoneCliente não encontrado' };
  }

  if (!instancia) {
    return { valid: false, error: 'instancia não encontrada' };
  }

  if (fromMe) {
    return { valid: false, error: 'Mensagem enviada pelo bot (fromMe=true)' };
  }

  if (!parsedData.mensagem && !parsedData.audioMessage) {
    return { valid: false, error: 'Mensagem vazia' };
  }

  return { valid: true };
};

module.exports = {
  parseEvolutionPayload,
  validatePayload
};

