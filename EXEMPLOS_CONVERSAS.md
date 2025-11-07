# 💬 Exemplos de Conversas - OniSaúde Bot

## 📋 Índice
1. [Agendamento de Consulta Simples](#1-agendamento-de-consulta-simples)
2. [Agendamento de Teleconsulta](#2-agendamento-de-teleconsulta)
3. [Solicitação de Exames](#3-solicitação-de-exames)
4. [Cadastro de Novo Paciente](#4-cadastro-de-novo-paciente)
5. [Recuperação de Senha](#5-recuperação-de-senha)

---

## 1. Agendamento de Consulta Simples

### Conversa Exemplo:

**👤 Usuário:** Olá

**🤖 Bot:** 
```
Olá! 👋

Bem-vindo(a) à *OniSaúde*! 

Sou seu assistente virtual e estou aqui para ajudá-lo(a) a:

✅ Agendar consultas
✅ Agendar teleconsultas
✅ Solicitar exames

Como posso ajudá-lo(a) hoje?
```

**👤 Usuário:** Quero marcar uma consulta

**🤖 Bot:**
```
Ótimo! Vou te ajudar a agendar sua consulta. 📅

Em qual cidade você está? (Se não informar, vou considerar Goiânia)
```

**👤 Usuário:** Goiânia

**🤖 Bot:**
```
Perfeito! Qual especialidade, profissional ou local você procura?

Você pode me dizer:
- Nome da especialidade (ex: "Cardiologia")
- Nome do profissional (ex: "Dr. Carlos")
- Nome do local (ex: "Clínica São Lucas")
```

**👤 Usuário:** Cardiologista

**🤖 Bot:**
```
Encontrei as seguintes opções relacionadas a "Cardiologista":

*Especialidades:*
1. CARDIOLOGIA

*Profissionais:*
2. Dr. CARLOS ALBERTO SILVA - Cardiologia
3. Dra. MARIA CARDOSO - Cardiologia

*Locais:*
4. CENTRO COR CARDIOLOGIA LTDA

Qual opção você prefere? (Digite o número)
```

**👤 Usuário:** 1

**🤖 Bot:**
```
Ótimo! Buscando profissionais de CARDIOLOGIA em Goiânia...

Encontrei 9 profissionais disponíveis:

1. Dr. CLÁUDIO RODRIGUES RODARTE
   📍 CENTRO COR CARDIOLOGIA LTDA
   📅 Próxima vaga: 07/10/2025
   💰 Valor: R$ 119,90

2. Dr. JAMIL ELIAS DIB FILHO
   📍 INCOR São Lucas
   📅 Próxima vaga: 08/10/2025
   💰 Valor: R$ 119,90

3. [...]

Qual profissional você prefere? (Digite o número)
```

**👤 Usuário:** 1

**🤖 Bot:**
```
Perfeito! Buscando horários disponíveis para Dr. CLÁUDIO RODRIGUES RODARTE...

*Horários disponíveis:*

📅 *07/10/2025 (Segunda-feira)*
1. 08:00
2. 09:00
3. 10:00

📅 *08/10/2025 (Terça-feira)*
4. 08:00
5. 14:00
6. 15:00

Qual horário você prefere? (Digite o número)
```

**👤 Usuário:** 2

**🤖 Bot:**
```
Ótimo! Você escolheu:
📅 07/10/2025 às 09:00
👨‍⚕️ Dr. CLÁUDIO RODRIGUES RODARTE

Para continuar, preciso que você faça login.

Por favor, me envie seu CPF ou email e senha no formato:
CPF/EMAIL senha

Exemplo: 123.456.789-00 minhasenha123
```

**👤 Usuário:** 123.456.789-00 senha123

**🤖 Bot:**
```
✅ Login realizado com sucesso!

Olá João Silva! Agora podemos continuar com seu agendamento. 📅

Deseja agendar para você mesmo ou para um dependente?
```

**👤 Usuário:** Para mim

**🤖 Bot:**
```
Perfeito! Confirma o agendamento com os seguintes dados?

📅 *Data:* 07/10/2025
🕐 *Horário:* 09:00
👨‍⚕️ *Profissional:* Dr. CLÁUDIO RODRIGUES RODARTE
🏥 *Local:* CENTRO COR CARDIOLOGIA LTDA
🎯 *Especialidade:* CARDIOLOGIA
💰 *Valor:* R$ 119,90

Digite "SIM" para confirmar ou "NÃO" para cancelar.
```

**👤 Usuário:** SIM

**🤖 Bot:**
```
🎉 *Agendamento confirmado com sucesso!*

📅 *Data:* 07/10/2025
🕐 *Horário:* 09:00
👨‍⚕️ *Profissional:* Dr. CLÁUDIO RODRIGUES RODARTE
🏥 *Local:* CENTRO COR CARDIOLOGIA LTDA
💰 *Valor:* R$ 119,90

⚠️ *Importante:* As instruções de pagamento serão enviadas em breve.

Obrigado por escolher a OniSaúde! 💙
```

---

## 2. Agendamento de Teleconsulta

**👤 Usuário:** Quero fazer uma teleconsulta

**🤖 Bot:**
```
Ótimo! Vou te ajudar a agendar sua teleconsulta. 💻📹

Em qual cidade você está? (Se não informar, vou considerar Goiânia)
```

**👤 Usuário:** pode ser goiania

**🤖 Bot:**
```
Perfeito! Qual especialidade você procura para a teleconsulta?
```

_[O resto do fluxo é similar ao agendamento de consulta]_

---

## 3. Solicitação de Exames

**👤 Usuário:** Preciso fazer exames

**🤖 Bot:**
```
Vou te ajudar a solicitar seus exames! 🔬

Qual exame você precisa fazer? Você pode me dizer o nome ou código TUSS.

Exemplos: "hemograma", "raio-x", "ultrassom"
```

**👤 Usuário:** Hemograma

**🤖 Bot:**
```
Encontrei os seguintes exames relacionados a "Hemograma":

1. HEMOGRAMA COMPLETO COM CONTAGEM DE PLAQUETAS OU FRAÇÕES
   Código: 403043611
   💰 R$ 13,75

2. HEMOGLOBINA GLICADA
   Código: 408010088
   💰 R$ 25,00

Qual você deseja adicionar? (Digite o número)
```

**👤 Usuário:** 1

**🤖 Bot:**
```
✅ Exame adicionado ao carrinho!

*Carrinho atual:*
1. HEMOGRAMA COMPLETO - R$ 13,75

💰 *Total:* R$ 13,75

Deseja adicionar mais exames? (SIM/NÃO)
```

**👤 Usuário:** Sim, quero glicemia também

**🤖 Bot:**
```
Buscando exames de "glicemia"...

Encontrei:
1. GLICOSE
   Código: 402010018
   💰 R$ 8,50

2. HEMOGLOBINA GLICADA
   Código: 408010088
   💰 R$ 25,00

Qual você deseja adicionar? (Digite o número)
```

**👤 Usuário:** 1

**🤖 Bot:**
```
✅ Exame adicionado ao carrinho!

*Carrinho atual:*
1. HEMOGRAMA COMPLETO - R$ 13,75
2. GLICOSE - R$ 8,50

💰 *Total:* R$ 22,25

Deseja adicionar mais exames? (SIM/NÃO)
```

**👤 Usuário:** Não, pode finalizar

**🤖 Bot:**
```
Para finalizar, preciso que você faça login.

Por favor, me envie seu CPF ou email e senha no formato:
CPF/EMAIL senha
```

**👤 Usuário:** 123.456.789-00 senha123

**🤖 Bot:**
```
✅ Login realizado com sucesso!

Confirma o pedido dos seguintes exames?

*Exames:*
1. HEMOGRAMA COMPLETO - R$ 13,75
2. GLICOSE - R$ 8,50

💰 *Total:* R$ 22,25

Digite "SIM" para confirmar.
```

**👤 Usuário:** SIM

**🤖 Bot:**
```
🎉 *Pedido de exames criado com sucesso!*

📋 *Exames solicitados:*
• HEMOGRAMA COMPLETO - R$ 13,75
• GLICOSE - R$ 8,50

💰 *Valor total:* R$ 22,25

⚠️ *Importante:* As instruções de pagamento serão enviadas em breve.

Obrigado por escolher a OniSaúde! 💙
```

---

## 4. Cadastro de Novo Paciente

**👤 Usuário:** Quero marcar uma consulta

_[Bot segue fluxo normal até solicitar login]_

**🤖 Bot:**
```
Para continuar, preciso que você faça login.

Por favor, me envie seu CPF ou email e senha.
```

**👤 Usuário:** 123.456.789-00 senha123

**🤖 Bot:**
```
❌ CPF/email ou senha incorretos.

Você ainda não tem cadastro na OniSaúde?

Digite "CADASTRAR" para criar sua conta ou tente fazer login novamente.
```

**👤 Usuário:** CADASTRAR

**🤖 Bot:**
```
Ótimo! Vou te ajudar a criar seu cadastro. 📝

Qual é o seu nome completo?
```

**👤 Usuário:** João da Silva Santos

**🤖 Bot:**
```
Obrigado, João! Agora preciso do seu CPF.

Digite apenas números ou com pontuação (123.456.789-00).
```

**👤 Usuário:** 123.456.789-00

**🤖 Bot:**
```
Perfeito! Qual é a sua data de nascimento?

Formato: DD/MM/AAAA (Ex: 15/03/1990)
```

**👤 Usuário:** 15/03/1990

**🤖 Bot:**
```
Ótimo! Qual é o seu email?
```

**👤 Usuário:** joao.silva@email.com

**🤖 Bot:**
```
Perfeito! Qual é o seu telefone/celular?

Digite com DDD: (62) 99999-9999
```

**👤 Usuário:** (62) 98765-4321

**🤖 Bot:**
```
Ótimo! Agora preciso do seu endereço. Qual é o seu CEP?
```

**👤 Usuário:** 74000-000

**🤖 Bot:**
```
Endereço encontrado:
Rua das Flores, Centro - Goiânia/GO

Qual é o número da sua casa/apartamento?
```

**👤 Usuário:** 123

**🤖 Bot:**
```
Tem complemento? (Se não, digite "não")
```

**👤 Usuário:** Apto 45

**🤖 Bot:**
```
Por último, crie uma senha para sua conta (mínimo 6 caracteres):
```

**👤 Usuário:** minhasenha123

**🤖 Bot:**
```
✅ *Cadastro realizado com sucesso!*

✅ Login realizado com sucesso!

Olá João da Silva Santos! Agora você já pode utilizar todos os nossos serviços! 🎉

Vamos continuar com seu agendamento? 📅
```

---

## 5. Recuperação de Senha

**👤 Usuário:** Esqueci minha senha

**🤖 Bot:**
```
Sem problemas! Vou te ajudar a recuperar sua senha. 🔑

Por favor, me informe seu CPF ou email cadastrado.
```

**👤 Usuário:** 123.456.789-00

**🤖 Bot:**
```
Encontrei seu cadastro! 

Onde você deseja receber o link de recuperação?

1. Celular: (62) ****-9999
2. Email: joao****@email.com

Digite o número da opção desejada.
```

**👤 Usuário:** 1

**🤖 Bot:**
```
✅ Link de recuperação enviado para seu celular!

Você receberá uma mensagem em breve com as instruções.

Precisa de mais alguma coisa? 😊
```

---

## 💡 Dicas para Conversas Naturais

O bot entende linguagem natural, então o usuário pode:

- ✅ "quero marcar consulta"
- ✅ "preciso de um cardiologista"
- ✅ "pode ser quinta às 14h"
- ✅ "adiciona hemograma no carrinho"
- ✅ "confirma"
- ✅ "sim"
- ✅ "não"

O GPT-4o interpreta e executa as funções necessárias automaticamente! 🤖✨

