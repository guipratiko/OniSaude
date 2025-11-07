#!/bin/bash

# Script para testar o webhook localmente
# Uso: ./test-webhook.sh

echo "🧪 Testando webhook OniSaúde Bot..."
echo ""

# Health Check
echo "1️⃣ Testando Health Check..."
curl -s http://localhost:3000/health | jq .
echo ""
echo ""

# Simula mensagem da Evolution API
echo "2️⃣ Enviando mensagem de teste..."
curl -X POST http://localhost:3000/webhook \
  -H "Content-Type: application/json" \
  -d '[
    {
      "headers": {
        "host": "localhost:3000",
        "user-agent": "Test",
        "content-type": "application/json"
      },
      "params": {},
      "query": {},
      "body": {
        "event": "messages.upsert",
        "data": {
          "key": {
            "remoteJid": "5562999999999@s.whatsapp.net",
            "fromMe": false,
            "id": "TEST123456789",
            "participant": ""
          },
          "pushName": "Teste Usuario",
          "status": "DELIVERY_ACK",
          "message": {
            "conversation": "Olá, quero agendar uma consulta"
          },
          "messageType": "conversation",
          "messageTimestamp": 1699999999,
          "instanceId": "test-instance-123",
          "source": "test"
        },
        "timestamp": "2025-11-07T12:00:00.000Z",
        "instanceName": "TestInstance",
        "integrationId": "test-integration-id",
        "workflowType": "ai-workflow"
      },
      "webhookUrl": "http://localhost:3000/webhook",
      "executionMode": "test"
    }
  ]' | jq .

echo ""
echo "✅ Teste concluído!"
echo ""
echo "📋 Verifique os logs em: logs/combined.log"
echo "💬 Se tudo estiver OK, a mensagem foi processada e enviada para o WhatsApp"

