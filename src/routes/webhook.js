const express = require('express');
const router = express.Router();
const webhookController = require('../controllers/webhookController');

// Rotas do webhook (aceita ambos os formatos)
router.post('/webhook', webhookController.handleWebhook);
router.post('/webhook/messages-upsert', webhookController.handleWebhook);

// Health check
router.get('/health', webhookController.healthCheck);
router.get('/', webhookController.healthCheck);

module.exports = router;

