// Estado global
let ws = null;
let selectedSession = null;
let autoScroll = true;
let sessions = {};
let logs = [];

// Inicia polling HTTP (sem WebSocket por enquanto)
function startPolling() {
    // Atualiza sessões a cada 3 segundos
    setInterval(() => {
        fetch('/api/sessions')
            .then(res => res.json())
            .then(data => {
                updateSessions(data.sessions);
                updateConnectionStatus(true);
            })
            .catch(err => {
                console.error('Erro ao buscar sessões:', err);
                updateConnectionStatus(false);
            });
    }, 3000);
    
    // Atualiza stats a cada 5 segundos
    setInterval(() => {
        fetch('/api/stats')
            .then(res => res.json())
            .then(data => updateStats(data))
            .catch(err => console.error('Erro ao buscar stats:', err));
    }, 5000);
    
    // Atualiza logs a cada 3 segundos
    setInterval(() => {
        fetchLogs();
    }, 3000);
    
    // Primeira carga
    requestInitialData();
}

// Atualiza status de conexão
function updateConnectionStatus(connected) {
    const statusEl = document.getElementById('connection-status');
    if (connected) {
        statusEl.textContent = '● Conectado';
        statusEl.className = 'status-badge connected';
    } else {
        statusEl.textContent = '● Desconectado';
        statusEl.className = 'status-badge disconnected';
    }
    updateLastUpdate();
}

// Atualiza timestamp
function updateLastUpdate() {
    const now = new Date();
    document.getElementById('last-update').textContent = 
        `Última atualização: ${now.toLocaleTimeString('pt-BR')}`;
}

// Solicita dados iniciais
function requestInitialData() {
    fetch('/api/sessions')
        .then(res => res.json())
        .then(data => {
            updateSessions(data.sessions);
            updateConnectionStatus(true);
        })
        .catch(err => {
            console.error('Erro ao buscar sessões:', err);
            updateConnectionStatus(false);
        });
    
    fetch('/api/stats')
        .then(res => res.json())
        .then(data => updateStats(data))
        .catch(err => console.error('Erro ao buscar stats:', err));
}

// Atualiza lista de sessões
function updateSessions(sessionsData) {
    sessions = sessionsData;
    renderSessions();
    updateStats({ total_sessions: Object.keys(sessions).length });
}

// Atualiza sessão individual
function updateSession(session) {
    const key = `${session.telefoneCliente}:${session.instancia}`;
    sessions[key] = session;
    renderSessions();
    
    // Se a sessão selecionada foi atualizada, atualiza detalhes
    if (selectedSession === key) {
        renderSessionDetails(session);
    }
}

// Renderiza lista de sessões
function renderSessions() {
    const container = document.getElementById('sessions-list');
    const sessionKeys = Object.keys(sessions);
    
    if (sessionKeys.length === 0) {
        container.innerHTML = '<p class="empty-state">Nenhuma sessão ativa</p>';
        return;
    }
    
    container.innerHTML = sessionKeys.map(key => {
        const session = sessions[key];
        const phone = session.telefoneCliente?.replace('@s.whatsapp.net', '') || 'Desconhecido';
        const lastUpdate = new Date(session.atualizadoEm).toLocaleString('pt-BR');
        const messagesCount = session.historico?.length || 0;
        
        return `
            <div class="session-item ${selectedSession === key ? 'active' : ''}" 
                 onclick="selectSession('${key}')">
                <div class="session-header">
                    <span class="session-name">📱 ${phone}</span>
                    <span class="session-time">${lastUpdate}</span>
                </div>
                <div class="session-info">
                    <div>Instância: ${session.instancia}</div>
                    <div>Mensagens: ${messagesCount}</div>
                    <span class="session-estado">${session.estado}</span>
                </div>
            </div>
        `;
    }).join('');
}

// Seleciona uma sessão
function selectSession(key) {
    selectedSession = key;
    renderSessions();
    renderSessionDetails(sessions[key]);
}

// Limpa seleção
function clearSelectedSession() {
    selectedSession = null;
    renderSessions();
    document.getElementById('session-details').innerHTML = 
        '<p class="empty-state">Selecione uma sessão para ver o histórico</p>';
}

// Renderiza detalhes da sessão
function renderSessionDetails(session) {
    const container = document.getElementById('session-details');
    
    if (!session) {
        container.innerHTML = '<p class="empty-state">Sessão não encontrada</p>';
        return;
    }
    
    const historico = session.historico || [];
    const dados = session.dados || {};
    
    let html = '';
    
    // Dados da sessão
    html += `
        <div class="session-data">
            <div class="session-data-title">📊 Dados da Sessão</div>
            <div class="session-data-content">
                ${Object.keys(dados).map(key => `
                    <div class="key-value">
                        <span class="key">${key}:</span>
                        <span class="value">${formatValue(dados[key])}</span>
                    </div>
                `).join('')}
            </div>
        </div>
    `;
    
    // Histórico de mensagens
    html += '<div class="session-data-title">💬 Histórico de Mensagens</div>';
    
    if (historico.length === 0) {
        html += '<p class="empty-state">Sem mensagens ainda</p>';
    } else {
        html += historico.map(msg => {
            const time = new Date(msg.timestamp).toLocaleTimeString('pt-BR');
            const roleLabel = msg.role === 'user' ? '👤 Usuário' : 
                             msg.role === 'assistant' ? '🤖 Assistente' : 
                             '⚙️ Sistema';
            
            return `
                <div class="message-item ${msg.role}">
                    <div class="message-role">${roleLabel}</div>
                    <div class="message-content">${escapeHtml(msg.content)}</div>
                    <div class="message-time">${time}</div>
                </div>
            `;
        }).join('');
    }
    
    container.innerHTML = html;
}

// Formata valores para exibição
function formatValue(value) {
    if (typeof value === 'object') {
        return JSON.stringify(value, null, 2);
    }
    if (typeof value === 'boolean') {
        return value ? '✅ Sim' : '❌ Não';
    }
    return String(value);
}

// Adiciona log
function addLog(logData) {
    logs.unshift(logData); // Adiciona no início
    if (logs.length > 500) {
        logs = logs.slice(0, 500); // Mantém apenas últimos 500
    }
    renderLogs();
}

// Renderiza logs
function renderLogs() {
    const container = document.getElementById('logs-container');
    
    if (logs.length === 0) {
        container.innerHTML = '<div style="color: #999;">Aguardando logs...</div>';
        return;
    }
    
    const html = logs.map(log => {
        const time = new Date(log.timestamp).toLocaleTimeString('pt-BR');
        const level = log.level || 'info';
        const message = log.message || '';
        
        return `
            <div class="log-entry ${level}">
                [${time}] [${level.toUpperCase()}] ${escapeHtml(message)}
            </div>
        `;
    }).join('');
    
    container.innerHTML = html;
    
    if (autoScroll) {
        container.scrollTop = 0;
    }
}

// Limpa logs
function clearLogs() {
    logs = [];
    renderLogs();
}

// Toggle auto-scroll
function toggleAutoScroll() {
    autoScroll = !autoScroll;
    document.getElementById('autoscroll-btn').textContent = 
        `📜 Auto-scroll: ${autoScroll ? 'ON' : 'OFF'}`;
}

// Atualiza estatísticas
function updateStats(stats) {
    if (stats.total_sessions !== undefined) {
        document.getElementById('total-sessions').textContent = stats.total_sessions;
    }
    if (stats.total_messages !== undefined) {
        document.getElementById('total-messages').textContent = stats.total_messages;
    }
    if (stats.total_appointments !== undefined) {
        document.getElementById('total-appointments').textContent = stats.total_appointments;
    }
    if (stats.success_rate !== undefined) {
        document.getElementById('success-rate').textContent = `${stats.success_rate}%`;
    }
}

// Funções de controle
function refreshSessions() {
    requestInitialData();
}

function clearAllSessions() {
    if (confirm('Tem certeza que deseja limpar todas as sessões?')) {
        fetch('/api/sessions/clear', { method: 'POST' })
            .then(res => res.json())
            .then(data => {
                alert(data.message || 'Sessões limpas!');
                sessions = {};
                renderSessions();
                clearSelectedSession();
            })
            .catch(err => alert('Erro ao limpar sessões: ' + err.message));
    }
}

function exportLogs() {
    const dataStr = JSON.stringify(logs, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `logs-${Date.now()}.json`;
    a.click();
}

function testConnection() {
    fetch('/health')
        .then(res => res.json())
        .then(data => {
            alert(`✅ Servidor OK!\n\nStatus: ${data.status}\nTimestamp: ${data.timestamp}`);
        })
        .catch(err => {
            alert('❌ Erro ao conectar: ' + err.message);
        });
}

// Escape HTML
function escapeHtml(text) {
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return String(text).replace(/[&<>"']/g, m => map[m]);
}

// Busca logs do servidor
function fetchLogs() {
    fetch('/api/logs')
        .then(res => res.json())
        .then(data => {
            if (data.logs) {
                logs = data.logs;
                renderLogs();
            }
        })
        .catch(err => console.error('Erro ao buscar logs:', err));
}

// Inicialização
document.addEventListener('DOMContentLoaded', () => {
    console.log('Dashboard OniSaúde iniciado');
    
    // Inicia polling HTTP
    startPolling();
    fetchLogs();
    
    console.log('✅ Dashboard pronto');
});

