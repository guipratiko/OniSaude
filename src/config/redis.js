const redis = require('redis');
require('dotenv').config();

let client = null;

const connectRedis = async () => {
  if (client && client.isOpen) {
    return client;
  }

  try {
    client = redis.createClient({
      url: process.env.REDIS_URL
    });

    client.on('error', (err) => {
      console.error('Redis Client Error:', err);
    });

    client.on('connect', () => {
      console.log('✅ Redis conectado com sucesso');
    });

    await client.connect();
    return client;
  } catch (error) {
    console.error('Erro ao conectar Redis:', error);
    throw error;
  }
};

const getRedisClient = () => {
  if (!client || !client.isOpen) {
    throw new Error('Redis não conectado. Execute connectRedis() primeiro.');
  }
  return client;
};

module.exports = {
  connectRedis,
  getRedisClient
};

