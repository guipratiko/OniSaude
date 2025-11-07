const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');

// API Routes
router.get('/api/sessions', dashboardController.getSessions);
router.get('/api/sessions/:telefone/:instancia', dashboardController.getSessionDetails);
router.post('/api/sessions/clear', dashboardController.clearAllSessions);
router.delete('/api/sessions/:telefone/:instancia', dashboardController.clearSession);
router.get('/api/stats', dashboardController.getStats);

module.exports = router;

