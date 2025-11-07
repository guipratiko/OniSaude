# 📦 Guia de Instalação - OniSaúde WhatsApp Bot

## ⚡ Instalação Rápida

```bash
# 1. Instalar dependências
npm install

# 2. Verificar configurações no .env
# (Já está configurado, mas você pode revisar)

# 3. Iniciar o servidor
npm start
```

Pronto! O servidor estará rodando em `http://localhost:3000`

## 🔍 Verificação da Instalação

### Teste 1: Health Check
```bash
curl http://localhost:3000/health
```

Resposta esperada:
```json
{
  "status": "ok",
  "service": "OniSaude WhatsApp Bot",
  "timestamp": "2025-11-07T..."
}
```

### Teste 2: Webhook (com script)
```bash
chmod +x test-webhook.sh
./test-webhook.sh
```

### Teste 3: Verificar Logs
```bash
tail -f logs/combined.log
```

## 📋 Checklist Pós-Instalação

- [ ] Servidor inicia sem erros
- [ ] Redis conecta com sucesso (veja logs)
- [ ] Health check responde OK
- [ ] Webhook aceita requisições POST
- [ ] Logs são criados em `logs/`

## ⚙️ Configuração do Webhook da Evolution

Configure o webhook da Evolution API para apontar para:
```
http://SEU_SERVIDOR:3000/webhook
```

Exemplo com ngrok (para testes locais):
```bash
# Terminal 1: Inicie o bot
npm start

# Terminal 2: Inicie o ngrok
ngrok http 3000

# Use a URL do ngrok como webhook na Evolution
# Exemplo: https://abc123.ngrok.io/webhook
```

## 🚀 Execução em Produção

### Opção 1: PM2 (Recomendado)
```bash
# Instalar PM2
npm install -g pm2

# Iniciar
pm2 start src/server.js --name onisaude-bot

# Configurar auto-start
pm2 startup
pm2 save

# Ver status
pm2 status

# Ver logs
pm2 logs onisaude-bot
```

### Opção 2: Systemd (Linux)
Crie `/etc/systemd/system/onisaude-bot.service`:

```ini
[Unit]
Description=OniSaude WhatsApp Bot
After=network.target

[Service]
Type=simple
User=seu_usuario
WorkingDirectory=/caminho/para/OniSaude
ExecStart=/usr/bin/node src/server.js
Restart=always
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
```

Ative o serviço:
```bash
sudo systemctl daemon-reload
sudo systemctl enable onisaude-bot
sudo systemctl start onisaude-bot
sudo systemctl status onisaude-bot
```

## 🔧 Solução de Problemas Comuns

### Erro: "Cannot find module"
```bash
rm -rf node_modules package-lock.json
npm install
```

### Erro: "Redis connection failed"
Verifique se o Redis está acessível:
```bash
redis-cli -u redis://default:FBE6ADB99524C13656F9D19A31242@easy.clerky.com.br:6379 ping
```

### Erro: "Port 3000 already in use"
Altere a porta no `.env`:
```
PORT=3001
```

### Erro: OpenAI API
Verifique se a chave está correta no `.env` e se há saldo na conta.

## 📊 Monitoramento

### Logs em tempo real
```bash
# Com PM2
pm2 logs onisaude-bot --lines 100

# Sem PM2
tail -f logs/combined.log
```

### Verificar uso de memória
```bash
# Com PM2
pm2 monit

# Sem PM2
ps aux | grep node
```

## 🔄 Atualização

```bash
# Parar o serviço
pm2 stop onisaude-bot
# ou
sudo systemctl stop onisaude-bot

# Fazer pull das alterações (se usar Git)
git pull

# Instalar novas dependências
npm install

# Reiniciar
pm2 restart onisaude-bot
# ou
sudo systemctl start onisaude-bot
```

## 📞 Suporte

- Documentação API OniSaúde: https://portalmedic.onitecnologia.com.br/giss/public/apigestor/documentacao
- Logs: `logs/combined.log` e `logs/error.log`

## ✅ Sistema Instalado!

Agora configure o webhook na Evolution API e teste enviando uma mensagem via WhatsApp! 🎉

