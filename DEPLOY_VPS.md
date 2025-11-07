# 🚀 Deploy na VPS - OniSaúde Bot

## 📋 Resumo das Portas e URLs

**Porta do servidor:** 4768 (ou conforme .env)

**URLs importantes:**
- Dashboard: `http://SEU_IP:4768/`
- Webhook Evolution: `http://SEU_IP:4768/messages-upsert`
- Health Check: `http://SEU_IP:4768/health`

## 🔧 Deploy na VPS

### 1. Subir arquivos para VPS
```bash
# No seu computador
scp -r /Users/guipratiko/Documents/OniSaude usuario@SEU_IP:/app
```

### 2. Instalar dependências
```bash
# Na VPS
cd /app
npm install
```

### 3. Configurar PM2
```bash
# Instalar PM2 globalmente
npm install -g pm2

# Iniciar aplicação
pm2 start src/server.js --name onisaude-bot

# Configurar para iniciar no boot
pm2 startup
pm2 save

# Ver logs
pm2 logs onisaude-bot

# Ver status
pm2 status
```

### 4. Configurar Firewall (se necessário)
```bash
# Abrir porta 4768
sudo ufw allow 4768/tcp
```

### 5. Configurar Nginx (opcional - para domínio)
```nginx
server {
    listen 80;
    server_name seu-dominio.com.br;
    
    location / {
        proxy_pass http://localhost:4768;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## 🔗 Configurar Webhook na Evolution API

**URL do webhook:**
```
http://SEU_IP:4768/messages-upsert
```

Ou se tiver domínio:
```
https://seu-dominio.com.br/messages-upsert
```

## 📊 Acessar Dashboard

Abra no navegador:
```
http://SEU_IP:4768/
```

O dashboard mostra:
- ✅ Sessões ativas em tempo real
- ✅ Histórico de cada conversa
- ✅ Logs do sistema
- ✅ Estatísticas
- ✅ Controles de administração

## 🔍 Monitoramento

### Ver logs em tempo real
```bash
pm2 logs onisaude-bot
```

### Ver status
```bash
pm2 status
```

### Reiniciar
```bash
pm2 restart onisaude-bot
```

### Parar
```bash
pm2 stop onisaude-bot
```

## ⚠️ Troubleshooting

### Servidor não inicia
```bash
# Ver erro específico
pm2 logs onisaude-bot --err

# Verificar se Redis está acessível
redis-cli -u redis://default:FBE6ADB99524C13656F9D19A31242@easy.clerky.com.br:6379 ping
```

### Porta já em uso
```bash
# Encontrar processo
lsof -i :4768

# Matar processo
kill -9 PID_AQUI
```

### Dashboard não carrega
```bash
# Verificar se arquivos estão na pasta public/
ls -la /app/public/

# Verificar permissões
chmod -R 755 /app/public/
```

### Mensagens não chegam
1. Verifique se webhook está configurado corretamente na Evolution
2. Teste manualmente:
```bash
curl -X POST http://SEU_IP:4768/messages-upsert \
  -H "Content-Type: application/json" \
  -d '{
    "data": {
      "key": {
        "remoteJid": "5562999999999@s.whatsapp.net",
        "fromMe": false,
        "id": "TEST123"
      },
      "pushName": "Teste",
      "message": {
        "conversation": "Olá"
      }
    },
    "instance": "OniSaude"
  }'
```

## 📝 Variáveis de Ambiente

Certifique-se que o `.env` está configurado na VPS:
```bash
cat /app/.env
```

## 🔐 Segurança

1. **Nunca exponha o .env:**
```bash
chmod 600 /app/.env
```

2. **Use HTTPS em produção** (com Nginx + Let's Encrypt)

3. **Proteja o dashboard** (adicione autenticação se necessário)

## 📈 Escalabilidade

Para múltiplas instâncias:
```bash
pm2 start src/server.js -i 4 --name onisaude-bot
```

Isso cria 4 processos balanceados.

