require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const helmet = require('helmet');
const cors = require('cors');
const path = require('path');
const { connectRedis } = require('./config/redis');
const logger = require('./config/logger');
const webhookRoutes = require('./routes/webhook');
const dashboardRoutes = require('./routes/dashboard');

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares
app.use(helmet({
  contentSecurityPolicy: false // Permite inline scripts para o dashboard
}));
app.use(cors());
app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '10mb' }));

// Serve arquivos estáticos do dashboard
app.use(express.static(path.join(__dirname, '../public')));

// Logging de requisições (exceto arquivos estáticos)
app.use((req, res, next) => {
  if (!req.path.match(/\.(css|js|ico|png|jpg)$/)) {
    logger.info(`${req.method} ${req.path}`, {
      ip: req.ip,
      userAgent: req.get('user-agent')
    });
  }
  next();
});

// Rotas
app.use('/', webhookRoutes);
app.use('/', dashboardRoutes);

// Tratamento de erro 404
app.use((req, res) => {
  res.status(404).json({
    status: 'error',
    message: 'Route not found'
  });
});

// Tratamento de erros global
app.use((err, req, res, next) => {
  logger.error('Erro não tratado', err);
  res.status(500).json({
    status: 'error',
    message: 'Internal server error'
  });
});

/**
 * Inicializa o servidor
 */
const startServer = async () => {
  try {
    // Conecta ao Redis
    logger.info('Conectando ao Redis...');
    await connectRedis();
    
    // Inicia servidor HTTP
    app.listen(PORT, () => {
      logger.info(`🚀 Servidor rodando na porta ${PORT}`);
      logger.info(`📡 Webhook disponível em: http://localhost:${PORT}/webhook`);
      logger.info(`💚 Health check em: http://localhost:${PORT}/health`);
      console.log('\n==============================================');
      console.log('🤖 OniSaúde WhatsApp Bot iniciado com sucesso!');
      console.log('==============================================\n');
    });
    
  } catch (error) {
    logger.error('Erro ao iniciar servidor', error);
    process.exit(1);
  }
};

// Tratamento de sinais de encerramento
process.on('SIGTERM', () => {
  logger.info('SIGTERM recebido, encerrando servidor...');
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('SIGINT recebido, encerrando servidor...');
  process.exit(0);
});

// Tratamento de erros não capturados
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection', { reason, promise });
});

process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception', error);
  process.exit(1);
});

// Inicia o servidor
startServer();

module.exports = app;

