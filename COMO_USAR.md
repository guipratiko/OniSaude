# 🚀 Como Usar o OniSaúde WhatsApp Bot

## 📋 Pré-requisitos

1. Node.js (versão 16 ou superior)
2. Acesso ao Redis configurado
3. Chave da API OpenAI
4. Webhook da Evolution API configurado

## 🛠️ Instalação

```bash
# 1. Instalar dependências
npm install

# 2. Verificar arquivo .env (já está configurado)
# Certifique-se de que todas as variáveis estão corretas

# 3. Iniciar o servidor
npm start

# OU em modo desenvolvimento (com auto-reload)
npm run dev
```

## 🌐 Endpoints Disponíveis

- **POST /webhook** - Recebe mensagens da Evolution API
- **GET /health** - Health check do serviço
- **GET /** - Health check (alias)

## 📱 Fluxo de Uso pelo WhatsApp

### 1. Primeira Mensagem
Quando o usuário enviar qualquer mensagem, o bot responde com boas-vindas e opções.

### 2. Agendamento de Consulta
```
Usuário: "Quero marcar uma consulta"
Bot: "Qual especialidade você procura?"
Usuário: "Cardiologista"
Bot: [Lista especialidades/profissionais]
Usuário: "Cardiologia"
Bot: [Lista profissionais disponíveis]
Usuário: "Dr. Carlos Silva"
Bot: [Lista horários disponíveis]
Usuário: "Quarta às 14h"
Bot: "Preciso que faça login. Digite seu CPF e senha"
Usuário: "123.456.789-00 e senha123"
Bot: "Login realizado! Confirma o agendamento?"
Usuário: "Sim"
Bot: "Agendamento confirmado! [detalhes]"
```

### 3. Agendamento de Teleconsulta
Mesmo fluxo de consulta, mas o bot automaticamente usa o código de teleconsulta.

### 4. Solicitação de Exames
```
Usuário: "Preciso fazer exames"
Bot: "Quais exames você precisa?"
Usuário: "Hemograma"
Bot: [Lista exames disponíveis]
Usuário: "Hemograma completo"
Bot: "Exame adicionado! Deseja adicionar mais?"
Usuário: "Não, finalizar"
Bot: "Preciso que faça login..."
[...processo de login...]
Bot: "Pedido criado! [detalhes e valor]"
```

### 5. Cadastro de Novo Paciente
```
Bot: "Você não tem cadastro. Vamos criar?"
Usuário: "Sim"
Bot: "Qual seu nome completo?"
Usuário: "João da Silva"
Bot: "Qual seu CPF?"
Usuário: "123.456.789-00"
[...coleta dados...]
Bot: "Cadastro realizado! Você já está logado."
```

### 6. Recuperação de Senha
```
Usuário: "Esqueci minha senha"
Bot: "Digite seu CPF ou email"
Usuário: "123.456.789-00"
Bot: "Escolha onde quer receber o link: [opções]"
Usuário: "Celular"
Bot: "Link enviado para seu celular!"
```

## 🔧 Configurações Importantes

### Variáveis Fixas OniSaúde
Já configuradas no `.env`:
- `ONI_CONV_ANS=999998`
- `ONI_PLANO_ID=3062`
- `ONI_SUPER_ID=36`
- `ONI_PROC_CONSULTA=10101012`
- `ONI_PROC_TELECONSULTA=10101011`
- `ONI_MUNIC_GOIANIA=5208707`

### Redis
- Sessões expiram após 30 minutos de inatividade
- Chave: `session:{telefone}:{instancia}`
- Armazena: estado, dados, histórico, token

### OpenAI
- Modelo: GPT-4o
- Temperature: 0.7
- Max tokens: 800 (respostas) / 500 (chat simples)
- Function calling habilitado

## 📊 Logs

Os logs são salvos em:
- `logs/error.log` - Apenas erros
- `logs/combined.log` - Todos os logs

Em desenvolvimento, logs também aparecem no console.

## 🐛 Troubleshooting

### Erro: Redis não conecta
```bash
# Verifique se o Redis está acessível
redis-cli -u redis://default:FBE6ADB99524C13656F9D19A31242@easy.clerky.com.br:6379 ping
```

### Erro: OpenAI API
- Verifique se a chave está correta no `.env`
- Verifique se há saldo na conta OpenAI

### Erro: API OniSaúde não responde
- Verifique a URL base no `.env`
- Teste manualmente com curl:
```bash
curl "https://portalmedic.onitecnologia.com.br/giss/public/apigestor/endereco/listar-municipios?munic_nome=goiania&conv_ans=999998&super_id=36&proc_codigo=10101012"
```

### Mensagens não chegam no WhatsApp
- Verifique se o webhook de envio está correto
- Teste manualmente:
```bash
curl -X POST https://api.clerky.com.br/webhook/26eefda3-f9f4-44a4-948b-bb9ac2eb8757 \
  -H "Content-Type: application/json" \
  -d '{
    "telefoneCliente": "5562999999999@s.whatsapp.net",
    "mensagem": "Teste",
    "instancia": "P3QAQ7i"
  }'
```

## 🔒 Segurança

- Nunca commite o arquivo `.env`
- As senhas dos usuários são enviadas para a API OniSaúde (HTTPS)
- Tokens são armazenados no Redis com TTL
- Logs não contêm senhas ou tokens

## 📞 Suporte

Para dúvidas sobre a API OniSaúde, consulte:
- Documentação: https://portalmedic.onitecnologia.com.br/giss/public/apigestor/documentacao

## 🚀 Deploy em Produção

### Com PM2 (recomendado)
```bash
# Instalar PM2 globalmente
npm install -g pm2

# Iniciar aplicação
pm2 start src/server.js --name onisaude-bot

# Ver logs
pm2 logs onisaude-bot

# Reiniciar
pm2 restart onisaude-bot

# Parar
pm2 stop onisaude-bot

# Auto-start no boot
pm2 startup
pm2 save
```

### Variáveis de Ambiente em Produção
Garanta que o `.env` está configurado ou use variáveis de ambiente do sistema.

## 📈 Monitoramento

### Verificar se está rodando
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

### Logs em tempo real
```bash
# Com PM2
pm2 logs onisaude-bot --lines 100

# Sem PM2
tail -f logs/combined.log
```

## 🎯 Próximas Implementações

- [ ] Pagamentos com PIX
- [ ] Pagamentos com Cartão
- [ ] Pagamentos com Boleto
- [ ] Transcrição de áudios
- [ ] Envio de imagens (comprovantes)
- [ ] Consulta de agendamentos existentes
- [ ] Cancelamento de agendamentos
- [ ] Histórico de consultas
- [ ] Prontuário digital

## 💡 Dicas

1. **Teste localmente antes de produção**
2. **Use ngrok para testar webhooks localmente**:
   ```bash
   ngrok http 3000
   ```
3. **Monitore os logs constantemente nos primeiros dias**
4. **Faça backup das configurações**
5. **Documente mudanças nas variáveis fixas**

