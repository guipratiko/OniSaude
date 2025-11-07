# OniSaúde WhatsApp Bot

Sistema de atendimento automatizado via WhatsApp para agendamento de consultas, teleconsultas e exames da OniSaúde.

## Funcionalidades

- ✅ Agendamento de Consultas
- ✅ Agendamento de Teleconsultas
- ✅ Solicitação de Exames
- ✅ Cadastro de novos pacientes
- ✅ Login de pacientes existentes
- ✅ Busca de profissionais, especialidades e locais
- ✅ Gerenciamento de dependentes
- ✅ Recuperação de senha
- 🔄 Pagamentos (a ser implementado)

## Tecnologias

- Node.js + Express
- OpenAI GPT-4o
- Redis (gerenciamento de sessões)
- API OniSaúde

## Instalação

```bash
npm install
```

## Configuração

Edite o arquivo `.env` com suas credenciais.

## Execução

```bash
# Produção
npm start

# Desenvolvimento
npm run dev
```

## Webhook

O sistema recebe webhooks da Evolution API em:
```
POST http://localhost:3000/webhook
```

## Estrutura

```
/src
  /config       - Configurações (Redis, OpenAI, constantes)
  /services     - Lógica de negócio
  /controllers  - Controladores de rotas
  /routes       - Definição de rotas
  /utils        - Utilitários
  server.js     - Entrada da aplicação
```

## Fluxo de Atendimento

1. Usuário envia mensagem via WhatsApp
2. GPT-4o identifica intenção e coleta informações
3. Sistema consulta API OniSaúde
4. Apresenta opções ao usuário
5. Valida e confirma agendamento
6. Envia confirmação

## Variáveis Fixas OniSaúde

- conv_ans: 999998
- plano_id: 3062
- super_id: 36
- proc_codigo consulta: 10101012
- proc_codigo teleconsulta: 10101011
- Cidade padrão: Goiânia (5208707)

# OniSaude
