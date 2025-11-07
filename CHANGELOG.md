# 📝 Changelog - OniSaúde WhatsApp Bot

## [1.0.0] - 2025-11-07

### ✨ Implementado

#### Core
- ✅ Sistema completo de atendimento via WhatsApp
- ✅ Integração com Evolution API
- ✅ Integração com API OniSaúde
- ✅ GPT-4o com function calling
- ✅ Gerenciamento de sessões com Redis
- ✅ Sistema de logs com Winston

#### Funcionalidades
- ✅ Agendamento de consultas presenciais
- ✅ Agendamento de teleconsultas
- ✅ Solicitação de exames
- ✅ Cadastro de novos pacientes
- ✅ Login de pacientes
- ✅ Busca de profissionais/especialidades/locais
- ✅ Seleção de dependentes
- ✅ Recuperação de senha

#### Dashboard Web
- ✅ Interface de monitoramento em tempo real
- ✅ Visualização de sessões ativas
- ✅ Histórico de conversas
- ✅ Logs do sistema
- ✅ Estatísticas
- ✅ Controles administrativos

### 🐛 Correções

#### Webhook
- ✅ Parser de payload Evolution API (suporte a campo `instance`)
- ✅ Rota `/messages-upsert` adicionada
- ✅ Rota `/webhook/messages-upsert` adicionada

#### GPT-4o
- ✅ Function call arguments convertido para string JSON
- ✅ Array de funções sempre disponível (não mais vazio)
- ✅ Suporte a chamadas recursivas de funções
- ✅ Nova função `selecionar_profissional` para escolha por número

#### API OniSaúde
- ✅ Salvamento de UF do município
- ✅ Construção dinâmica de localização ("Cidade, UF")
- ✅ Uso de munic_id numérico (não texto)
- ✅ Salvamento de lista de profissionais na sessão
- ✅ Uso de IDs reais em validação/agendamento

#### Logs
- ✅ Removidos logs repetitivos de sessão
- ✅ Removidos logs de API (exceto erros)
- ✅ Removidos logs verbosos de debug
- ✅ Mantidos apenas logs do fluxo e ações da LLM
- ✅ Logs mais limpos e informativos

### 🔧 Melhorias Técnicas
- ✅ Import de constantes (ONI_SUPER_ID, ONI_PROC_CONSULTA)
- ✅ Validação usa IDs salvos na sessão
- ✅ Agendamento usa IDs salvos na sessão
- ✅ Logging condicional (sem spam de requisições do dashboard)

### 📚 Documentação
- ✅ README.md principal
- ✅ COMO_USAR.md
- ✅ INSTALACAO.md  
- ✅ EXEMPLOS_CONVERSAS.md
- ✅ DEPLOY_VPS.md
- ✅ RESUMO_SISTEMA.md
- ✅ CHANGELOG.md

## [Próximas Versões]

### 🔜 v1.1.0 - Pagamentos
- ⏳ Pagamento com PIX
- ⏳ Pagamento com Cartão de Crédito
- ⏳ Pagamento com Boleto
- ⏳ Validação de pagamento
- ⏳ Emissão de comprovantes

### 🔜 v1.2.0 - Gestão de Agendamentos
- ⏳ Consultar agendamentos existentes
- ⏳ Cancelar agendamentos
- ⏳ Reagendar consultas
- ⏳ Transferir agendamentos

### 🔜 v1.3.0 - Prontuário
- ⏳ Buscar laudos
- ⏳ Buscar receitas
- ⏳ Buscar atestados
- ⏳ Histórico de consultas

### 🔜 v1.4.0 - Melhorias
- ⏳ Transcrição de áudios
- ⏳ Suporte a imagens
- ⏳ Notificações de lembrete
- ⏳ WebSocket no dashboard
- ⏳ Autenticação no dashboard
- ⏳ Relatórios e analytics

---

**Versão Atual:** 1.0.0  
**Status:** ✅ Produção  
**Última Atualização:** 2025-11-07

