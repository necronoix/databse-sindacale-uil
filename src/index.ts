import { Hono } from 'hono';
import { cors } from 'hono/cors';
import api from './routes/api';

import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { sign, verify } from 'hono/jwt';
import { authMiddleware, requireAdmin, requireModerator } from './middleware/auth';
import type { Iscritto, SearchFilters, PaginatedResponse } from './types';

const app = new Hono();

// Enable CORS for all API routes
app.use('/api/*', cors());

// API di autenticazione
app.post('/api/auth/login', async (c) => {
  const { username, password } = await c.req.json();
  
  // Recupera l'utente dal database
  const user = await c.env.DB.prepare(
    'SELECT id, username, email, password_hash, role, is_active FROM users WHERE username = ? AND is_active = 1'
  ).bind(username).first();
  
  if (!user) {
    return c.json({ error: 'Credenziali non valide' }, 401);
  }
  
  // Verifica la password - per ora confronto diretto per Tiziana
  let isValidPassword = false;
  
  if (username === 'Tiziana' && password === 'pupo') {
    isValidPassword = true;
  } else if (username === 'admin' && password === 'admin123') {
    isValidPassword = true;
  } else {
    // Per altri utenti, usa il confronto con hash (da implementare con bcrypt)
    isValidPassword = password === user.password_hash;
  }
  
  if (!isValidPassword) {
    return c.json({ error: 'Credenziali non valide' }, 401);
  }
  
  // Aggiorna last_login
  await c.env.DB.prepare(
    'UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?'
  ).bind(user.id).run();
  
  // Genera token JWT
  const payload = {
    id: user.id,
    username: user.username,
    email: user.email,
    role: user.role,
    exp: Math.floor(Date.now() / 1000) + (60 * 60 * 24) // 24 ore
  };
  
  const token = await sign(payload, c.env.JWT_SECRET);
  
  return c.json({
    token,
    user: {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role
    }
  });
});

// API per la dashboard
app.get('/api/dashboard/stats', async (c) => {
  const totalIscritti = await c.env.DB.prepare(
    'SELECT COUNT(*) as total FROM iscritti'
  ).first();
  
  const nuoviIscrittiAnno = await c.env.DB.prepare(
    'SELECT COUNT(*) as total FROM iscritti WHERE strftime("%Y", data_iscrizione) = strftime("%Y", "now")'
  ).first();
  
  const iscrittiPerRuolo = await c.env.DB.prepare(`
    SELECT ruolo, COUNT(*) as count FROM iscritti 
    WHERE ruolo IS NOT NULL GROUP BY ruolo ORDER BY count DESC
  `).all();
  
  const iscrittiPerProvincia = await c.env.DB.prepare(`
    SELECT prov, COUNT(*) as count FROM iscritti 
    WHERE prov IS NOT NULL GROUP BY prov ORDER BY count DESC
  `).all();
  
  const iscrittiPerAnno = await c.env.DB.prepare(`
    SELECT strftime("%Y", data_iscrizione) as anno, COUNT(*) as count FROM iscritti 
    GROUP BY anno ORDER BY anno DESC
  `).all();
  
  const ultimiIscritti = await c.env.DB.prepare(`
    SELECT * FROM iscritti ORDER BY data_iscrizione DESC LIMIT 5
  `).all();
  
  return c.json({
    totalIscritti: totalIscritti?.total || 0,
    nuoviIscrittiAnno: nuoviIscrittiAnno?.total || 0,
    iscrittiPerRuolo: Object.fromEntries(iscrittiPerRuolo.results.map((r: any) => [r.ruolo, r.count])),
    iscrittiPerProvincia: Object.fromEntries(iscrittiPerProvincia.results.map((r: any) => [r.prov, r.count])),
    iscrittiPerAnno: Object.fromEntries(iscrittiPerAnno.results.map((r: any) => [r.anno, r.count])),
    ultimiIscritti: ultimiIscritti.results
  });
});

// API per la gestione anagrafica
app.get('/api/iscritti', async (c) => {
  const page = parseInt(c.req.query('page') || '1');
  const limit = parseInt(c.req.query('limit') || '20');
  const offset = (page - 1) * limit;
  
  const filters: SearchFilters = {
    cognome: c.req.query('cognome'),
    nome: c.req.query('nome'),
    ruolo: c.req.query('ruolo'),
    istituto: c.req.query('istituto'),
    prov: c.req.query('prov'),
    annoiscrizione: c.req.query('annoiscrizione'),
    rsu_tas: c.req.query('rsu_tas'),
    contratto: c.req.query('contratto')
  };
  
  // Costruisci la query con filtri
  let whereClause = 'WHERE 1=1';
  const params: any[] = [];
  
  Object.entries(filters).forEach(([key, value]) => {
    if (value) {
      whereClause += ` AND ${key} LIKE ?`;
      params.push(`%${value}%`);
    }
  });
  
  // Query per il conteggio totale
  const countResult = await c.env.DB.prepare(
    `SELECT COUNT(*) as total FROM iscritti ${whereClause}`
  ).bind(...params).first();
  
  const total = countResult?.total || 0;
  
  // Query per i dati paginati
  const results = await c.env.DB.prepare(
    `SELECT * FROM iscritti ${whereClause} ORDER BY cognome, nome LIMIT ? OFFSET ?`
  ).bind(...params, limit, offset).all();
  
  const response: PaginatedResponse<Iscritto> = {
    data: results.results as Iscritto[],
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit)
  };
  
  return c.json(response);
});

// API routes
app.use('/api/*', cors());
app.route('/', api);

// Main page with login and dashboard
app.get('/', (c) => {
  return c.html(`
    <!DOCTYPE html>
    <html lang="it">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Sistema Gestione Anagrafica - Sindacato Roma e Lazio</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
        <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
        <script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
        <style>
        /* Stile generale */
        body {
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }

        /* Login */
        #loginContainer {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        }

        /* Dashboard */
        .nav-tab {
            padding: 1rem 1.5rem;
            color: #6b7280;
            border-bottom: 2px solid transparent;
            transition: all 0.2s;
        }

        .nav-tab:hover {
            color: #374151;
        }

        .nav-tab.active {
            color: #2563eb;
            border-color: #2563eb;
        }

        /* Card */
        .card {
            background: white;
            border-radius: 0.5rem;
            box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06);
            padding: 1.5rem;
            border: 1px solid #e5e7eb;
        }

        /* Pulsanti */
        .btn {
            padding: 0.5rem 1rem;
            border-radius: 0.375rem;
            font-weight: 500;
            transition: all 0.2s;
            outline: none;
        }

        .btn-primary {
            background-color: #2563eb;
            color: white;
        }

        .btn-primary:hover {
            background-color: #1d4ed8;
        }

        .btn-secondary {
            background-color: #6b7280;
            color: white;
        }

        .btn-secondary:hover {
            background-color: #4b5563;
        }

        /* Modal */
        .modal {
            position: fixed;
            inset: 0;
            background-color: rgba(0, 0, 0, 0.5);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 50;
        }

        .modal-content {
            background-color: white;
            border-radius: 0.5rem;
            box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
            width: 100%;
            max-width: 64rem;
            max-height: 100vh;
            overflow-y: auto;
        }

        /* Responsive */
        @media (max-width: 768px) {
            .nav-tab {
                padding: 0.5rem 0.75rem;
                font-size: 0.875rem;
            }
            
            .modal-content {
                margin: 0 1rem;
                max-width: 100%;
            }
        }

        /* Animazioni */
        .fade-in {
            animation: fadeIn 0.3s ease-in-out;
        }

        @keyframes fadeIn {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
        }
        </style>
    </head>
    <body class="bg-gray-100 min-h-screen">
let currentUser = null;
let authToken = null;
let currentPage = 1;
let currentFilters = {};

// Inizializzazione
window.addEventListener('DOMContentLoaded', () => {
    initializeApp();
});

function initializeApp() {
    setupEventListeners();
    
    // Controlla se c'è un token salvato
    const savedToken = localStorage.getItem('authToken');
    if (savedToken) {
        authToken = savedToken;
        showDashboard();
    }
}

function setupEventListeners() {
    // Login
    document.getElementById('loginForm').addEventListener('submit', handleLogin);
    document.getElementById('logoutBtn').addEventListener('click', handleLogout);
    
    // Navigazione tabs
    document.querySelectorAll('.nav-tab').forEach(tab => {
        tab.addEventListener('click', (e) => switchTab(e.target.dataset.tab));
    });
    
    // Anagrafica
    document.getElementById('addIscrittoBtn').addEventListener('click', () => openIscrittoModal());
    document.getElementById('closeModal').addEventListener('click', closeIscrittoModal);
    document.getElementById('cancelIscrittoBtn').addEventListener('click', closeIscrittoModal);
    document.getElementById('saveIscrittoBtn').addEventListener('click', saveIscritto);
    
    // Ricerca
    document.getElementById('searchBtn').addEventListener('click', performSearch);
    document.getElementById('resetSearchBtn').addEventListener('click', resetSearch);
}

// Gestione autenticazione
async function handleLogin(e) {
    e.preventDefault();
    
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    
    try {
        const response = await axios.post('/api/auth/login', { username, password });
        
        if (response.data.token) {
            authToken = response.data.token;
            currentUser = response.data.user;
            localStorage.setItem('authToken', authToken);
            
            showDashboard();
        }
    } catch (error) {
        document.getElementById('loginError').textContent = 'Credenziali non valide';
        document.getElementById('loginError').classList.remove('hidden');
    }
}

function handleLogout() {
    authToken = null;
    currentUser = null;
    localStorage.removeItem('authToken');
    
    document.getElementById('loginContainer').classList.remove('hidden');
    document.getElementById('dashboardContainer').classList.add('hidden');
    document.getElementById('loginForm').reset();
}

function showDashboard() {
    document.getElementById('loginContainer').classList.add('hidden');
    document.getElementById('dashboardContainer').classList.remove('hidden');
    
    document.getElementById('userInfo').textContent = \`\${currentUser.username} (\${currentUser.role})\`;
    
    loadDashboardData();
    loadIscritti();
}

// Navigazione tabs
function switchTab(tabName) {
    // Aggiorna i tab attivi
    document.querySelectorAll('.nav-tab').forEach(tab => {
        tab.classList.toggle('active', tab.dataset.tab === tabName);
    });
    
    // Mostra il contenuto del tab
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.add('hidden');
    });
    document.getElementById(tabName + 'Tab').classList.remove('hidden');
    
    // Carica i dati specifici del tab
    switch (tabName) {
        case 'dashboard':
            loadDashboardData();
            break;
        case 'anagrafica':
            loadIscritti();
            break;
        case 'ricerca':
            // La ricerca è gestita dai pulsanti
            break;
        case 'report':
            loadReportCharts();
            break;
    }
}

// Caricamento dati dashboard
async function loadDashboardData() {
    try {
        const response = await axios.get('/api/dashboard/stats', {
            headers: { 'Authorization': \`Bearer \${authToken}\` }
        });
        
        const stats = response.data;
        
        // Aggiorna le statistiche
        document.getElementById('totalIscritti').textContent = stats.totalIscritti;
        document.getElementById('nuoviIscritti').textContent = stats.nuoviIscrittiAnno;
        
        const docenti = stats.iscrittiPerRuolo['DOCENTE'] || 0;
        const ata = stats.iscrittiPerRuolo['ATA'] || 0;
        
        document.getElementById('totalDocenti').textContent = docenti;
        document.getElementById('totalATA').textContent = ata;
        
        // Crea i grafici
        createDashboardCharts(stats);
        
        // Mostra ultimi iscritti
        displayUltimiIscritti(stats.ultimiIscritti);
        
    } catch (error) {
        console.error('Errore nel caricamento dei dati dashboard:', error);
    }
}

function createDashboardCharts(stats) {
    // Grafico per ruoli
    const ruoloCtx = document.getElementById('ruoloChart').getContext('2d');
    new Chart(ruoloCtx, {
        type: 'doughnut',
        data: {
            labels: Object.keys(stats.iscrittiPerRuolo),
            datasets: [{
                data: Object.values(stats.iscrittiPerRuolo),
                backgroundColor: ['#3B82F6', '#10B981', '#F59E0B', '#EF4444']
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: 'bottom'
                }
            }
        }
    });
    
    // Grafico per province
    const provinciaCtx = document.getElementById('provinciaChart').getContext('2d');
    new Chart(provinciaCtx, {
        type: 'bar',
        data: {
            labels: Object.keys(stats.iscrittiPerProvincia),
            datasets: [{
                label: 'Iscritti per Provincia',
                data: Object.values(stats.iscrittiPerProvincia),
                backgroundColor: '#3B82F6'
            }]
        },
        options: {
            responsive: true,
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });
}

function displayUltimiIscritti(iscritti) {
    const container = document.getElementById('ultimiIscritti');
    
    if (!iscritti || iscritti.length === 0) {
        container.innerHTML = '<p class="text-gray-500">Nessun iscritto recente</p>';
        return;
    }
    
    const html = \`
        <div class="space-y-3">
            \${iscritti.map(iscritto => \`
                <div class="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                        <p class="font-medium">\${iscritto.cognome} \${iscritto.nome}</p>
                        <p class="text-sm text-gray-600">\${iscritto.ruolo} - \${iscritto.istituto}</p>
                    </div>
                    <div class="text-right">
                        <p class="text-sm text-gray-600">\${new Date(iscritto.data_iscrizione).toLocaleDateString()}</p>
                    </div>
                </div>
            \`).join('')}
        </div>
    \`;
    
    container.innerHTML = html;
}

// Gestione anagrafica
async function loadIscritti(page = 1, filters = {}) {
    try {
        const params = new URLSearchParams({
            page: page.toString(),
            limit: '20',
            ...filters
        });
        
        const response = await axios.get(\`/api/iscritti?\${params}\`, {
            headers: { 'Authorization': \`Bearer \${authToken}\` }
        });
        
        displayIscritti(response.data);
        
    } catch (error) {
        console.error('Errore nel caricamento iscritti:', error);
    }
}

function displayIscritti(data) {
    const container = document.getElementById('iscrittiTable');
    
    if (!data.data || data.data.length === 0) {
        container.innerHTML = '<p class="text-gray-500">Nessun iscritto trovato</p>';
        return;
    }
    
    const html = \`
        <table class="min-w-full divide-y divide-gray-200">
            <thead class="bg-gray-50">
                <tr>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cognome</th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nome</th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ruolo</th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Istituto</th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Provincia</th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Azioni</th>
                </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200">
                \${data.data.map(iscritto => \`
                    <tr>
                        <td class="px-6 py-4 whitespace-nowrap">\${iscritto.cognome}</td>
                        <td class="px-6 py-4 whitespace-nowrap">\${iscritto.nome}</td>
                        <td class="px-6 py-4 whitespace-nowrap">\${iscritto.ruolo || '-'}</td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">\${iscritto.istituto || '-'}</td>
                        <td class="px-6 py-4 whitespace-nowrap">\${iscritto.prov || '-'}</td>
                        <td class="px-6 py-4 whitespace-nowrap">
                            <button onclick="editIscritto(\${iscritto.id})" class="text-blue-600 hover:text-blue-900 mr-3">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button onclick="viewIscritto(\${iscritto.id})" class="text-green-600 hover:text-green-900">
                                <i class="fas fa-eye"></i>
                            </button>
                        </td>
                    </tr>
                \`).join('')}
            </tbody>
        </table>
    \`;
    
    container.innerHTML = html;
    
    // Paginazione
    displayPagination(data);
}

function displayPagination(data) {
    const container = document.getElementById('pagination');
    
    if (data.totalPages <= 1) {
        container.innerHTML = '';
        return;
    }
    
    let html = '<div class="flex space-x-2">';
    
    for (let i = 1; i <= data.totalPages; i++) {
        html += \`
            <button onclick="loadIscritti(\${i}, currentFilters)" 
                    class="px-3 py-1 rounded \${i === data.page ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}"
                    \${i === data.page ? 'disabled' : ''}>
                \${i}
            </button>
        \`;
    }
    
    html += '</div>';
    container.innerHTML = html;
}

// Modale per iscritti
function openIscrittoModal(iscrittoId = null) {
    const modal = document.getElementById('iscrittoModal');
    const title = document.getElementById('modalTitle');
    const form = document.getElementById('iscrittoForm');
    
    if (iscrittoId) {
        title.textContent = 'Modifica Iscritto';
        loadIscrittoForEdit(iscrittoId);
    } else {
        title.textContent = 'Nuovo Iscritto';
        populateIscrittoForm({});
    }
    
    modal.classList.remove('hidden');
    modal.classList.add('flex');
}

function closeIscrittoModal() {
    const modal = document.getElementById('iscrittoModal');
    modal.classList.add('hidden');
    modal.classList.remove('flex');
}

async function loadIscrittoForEdit(id) {
    try {
        const response = await axios.get(\`/api/iscritti/\${id}\`, {
            headers: { 'Authorization': \`Bearer \${authToken}\` }
        });
        
        populateIscrittoForm(response.data);
        
    } catch (error) {
        console.error('Errore nel caricamento iscritto:', error);
    }
}

function populateIscrittoForm(iscritto) {
    const form = document.getElementById('iscrittoForm');
    
    const fields = [
        { name: 'cognome', label: 'Cognome', type: 'text', required: true },
        { name: 'nome', label: 'Nome', type: 'text', required: true },
        { name: 'ruolo', label: 'Ruolo', type: 'select', options: ['DOCENTE', 'ATA', 'ALTRO'] },
        { name: 'istituto', label: 'Istituto', type: 'text' },
        { name: 'tipologia', label: 'Tipologia', type: 'text' },
        { name: 'prov', label: 'Provincia', type: 'text' },
        { name: 'telefono', label: 'Telefono', type: 'text' },
        { name: 'email_personale', label: 'Email', type: 'email' },
        { name: 'contratto', label: 'Contratto', type: 'select', options: ['TEMPO INDETERMINATO', 'TEMPO DETERMINATO'] },
        { name: 'rsu_tas', label: 'RSU/TAS', type: 'select', options: ['RSU', 'TAS', 'NESSUNO'] }
    ];
    
    let html = '';
    fields.forEach(field => {
        const value = iscritto[field.name] || '';
        
        if (field.type === 'select') {
            html += \`
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">\${field.label}</label>
                    <select name="\${field.name}" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                        <option value="">Seleziona...</option>
                        \${field.options.map(opt => \`<option value="\${opt}" \${value === opt ? 'selected' : ''}>\${opt}</option>\`).join('')}
                    </select>
                </div>
            \`;
        } else {
            html += \`
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">\${field.label}</label>
                    <input type="\${field.type}" name="\${field.name}" value="\${value}" 
                           \${field.required ? 'required' : ''}
                           class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                </div>
            \`;
        }
    });
    
    form.innerHTML = html;
    form.dataset.iscrittoId = iscritto.id || '';
}

async function saveIscritto() {
    const form = document.getElementById('iscrittoForm');
    const iscrittoId = form.dataset.iscrittoId;
    
    const formData = new FormData(form);
    const data = Object.fromEntries(formData.entries());
    
    try {
        if (iscrittoId) {
            await axios.put(\`/api/iscritti/\${iscrittoId}\`, data, {
                headers: { 'Authorization': \`Bearer \${authToken}\` }
            });
        } else {
            await axios.post('/api/iscritti', data, {
                headers: { 'Authorization': \`Bearer \${authToken}\` }
            });
        }
        
        closeIscrittoModal();
        loadIscritti();
        
    } catch (error) {
        console.error('Errore nel salvataggio:', error);
        alert('Errore nel salvataggio dei dati');
    }
}

// Ricerca avanzata
async function performSearch() {
    const formData = new FormData(document.getElementById('searchForm'));
    const filters = Object.fromEntries(formData.entries());
    
    // Rimuovi campi vuoti
    Object.keys(filters).forEach(key => {
        if (!filters[key]) delete filters[key];
    });
    
    currentFilters = filters;
    currentPage = 1;
    
    try {
        const params = new URLSearchParams({
            page: '1',
            limit: '50',
            ...filters
        });
        
        const response = await axios.get(\`/api/iscritti?\${params}\`, {
            headers: { 'Authorization': \`Bearer \${authToken}\` }
        });
        
        displaySearchResults(response.data);
        
    } catch (error) {
        console.error('Errore nella ricerca:', error);
    }
}

function displaySearchResults(data) {
    const container = document.getElementById('searchResults');
    
    if (!data.data || data.data.length === 0) {
        container.innerHTML = '<p class="text-gray-500">Nessun risultato trovato</p>';
        return;
    }
    
    const html = \`
        <div class="bg-white rounded-lg shadow-md overflow-hidden">
            <table class="min-w-full divide-y divide-gray-200">
                <thead class="bg-gray-50">
                    <tr>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cognome</th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nome</th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ruolo</th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Istituto</th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Azioni</th>
                    </tr>
                </thead>
                <tbody class="bg-white divide-y divide-gray-200">
                    \${data.data.map(iscritto => \`
                        <tr>
                            <td class="px-6 py-4">\${iscritto.cognome}</td>
                            <td class="px-6 py-4">\${iscritto.nome}</td>
                            <td class="px-6 py-4">\${iscritto.ruolo || '-'}</td>
                            <td class="px-6 py-4 text-sm">\${iscritto.istituto || '-'}</td>
                            <td class="px-6 py-4">
                                <button onclick="editIscritto(\${iscritto.id})" class="text-blue-600 hover:text-blue-900 mr-2">
                                    <i class="fas fa-edit"></i>
                                </button>
                                <button onclick="viewIscritto(\${iscritto.id})" class="text-green-600 hover:text-green-900">
                                    <i class="fas fa-eye"></i>
                                </button>
                            </td>
                        </tr>
                    \`).join('')}
                </tbody>
            </table>
        </div>
    \`;
    
    container.innerHTML = html;
}

function resetSearch() {
    document.getElementById('searchForm').reset();
    currentFilters = {};
    document.getElementById('searchResults').innerHTML = '';
}

// Reportistica
function loadReportCharts() {
    // Qui puoi aggiungere grafici specifici per i report
    // Per ora usa gli stessi dati della dashboard
    loadDashboardData();
}

// Funzioni globali per onclick
window.editIscritto = function(id) {
    openIscrittoModal(id);
};

window.viewIscritto = async function(id) {
    try {
        const response = await axios.get(\`/api/iscritti/\${id}\`, {
            headers: { 'Authorization': \`Bearer \${authToken}\` }
        });
        
        // Mostra i dettagli in un modal di sola lettura
        alert('Dettagli iscritto: ' + JSON.stringify(response.data, null, 2));
        
    } catch (error) {
        console.error('Errore nel caricamento dettagli:', error);
    }
};

window.loadIscritti = loadIscritti; // per la paginazione
`, {
    headers: {
      'Content-Type': 'application/javascript',
    }
  });
});

app.get('/static/styles.css', (c) => {
  return c.text(`/* Stile generale */
body {
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

/* Login */
#loginContainer {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

/* Dashboard */
.nav-tab {
    @apply px-4 py-3 text-gray-600 hover:text-gray-900 border-b-2 border-transparent hover:border-gray-300 transition-colors duration-200;
}

.nav-tab.active {
    @apply text-blue-600 border-blue-600;
}

.nav-tab:hover {
    @apply text-gray-900;
}

/* Card */
.card {
    @apply bg-white rounded-lg shadow-md p-6 border border-gray-200;
}

/* Tabelle */
.table-container {
    @apply overflow-x-auto bg-white rounded-lg shadow-sm border border-gray-200;
}

.table {
    @apply min-w-full divide-y divide-gray-200;
}

.table th {
    @apply px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider;
}

.table td {
    @apply px-6 py-4 whitespace-nowrap text-sm text-gray-900;
}

/* Form */
.form-input {
    @apply w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent;
}

.form-select {
    @apply w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent;
}

.form-label {
    @apply block text-sm font-medium text-gray-700 mb-1;
}

/* Pulsanti */
.btn {
    @apply px-4 py-2 rounded-md font-medium transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2;
}

.btn-primary {
    @apply bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500;
}

.btn-secondary {
    @apply bg-gray-600 text-white hover:bg-gray-700 focus:ring-gray-500;
}

.btn-success {
    @apply bg-green-600 text-white hover:bg-green-700 focus:ring-green-500;
}

.btn-danger {
    @apply bg-red-600 text-white hover:bg-red-700 focus:ring-red-500;
}

/* Modal */
.modal {
    @apply fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50;
}

.modal-content {
    @apply bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-screen overflow-y-auto;
}

/* Statistiche */
.stat-card {
    @apply bg-white p-6 rounded-lg shadow-md border border-gray-200;
}

.stat-value {
    @apply text-3xl font-bold text-gray-900;
}

.stat-label {
    @apply text-sm text-gray-600;
}

/* Chart containers */
.chart-container {
    @apply bg-white p-4 rounded-lg shadow-sm border border-gray-200;
    height: 300px;
}

/* Responsive */
@media (max-width: 768px) {
    .nav-tab {
        @apply px-2 py-2 text-sm;
    }
    
    .modal-content {
        @apply mx-4 max-w-full;
    }
    
    .table-container {
        @apply overflow-x-scroll;
    }
}

/* Animazioni */
.fade-in {
    animation: fadeIn 0.3s ease-in-out;
}

@keyframes fadeIn {
    from { opacity: 0; transform: translateY(10px); }
    to { opacity: 1; transform: translateY(0); }
}

/* Loading spinner */
.spinner {
    @apply inline-block w-4 h-4 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin;
}

/* Status badges */
.badge {
    @apply inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium;
}

.badge-success {
    @apply bg-green-100 text-green-800;
}

.badge-warning {
    @apply bg-yellow-100 text-yellow-800;
}

.badge-error {
    @apply bg-red-100 text-red-800;
}

.badge-info {
    @apply bg-blue-100 text-blue-800;
}

/* Utility classes */
.text-truncate {
    @apply overflow-hidden text-ellipsis whitespace-nowrap;
}

.shadow-custom {
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
}

.transition-all {
    transition: all 0.3s ease;
}

/* Custom scrollbar */
.custom-scrollbar::-webkit-scrollbar {
    width: 6px;
}

.custom-scrollbar::-webkit-scrollbar-track {
    background: #f1f1f1;
}

.custom-scrollbar::-webkit-scrollbar-thumb {
    background: #c1c1c1;
    border-radius: 3px;
}

.custom-scrollbar::-webkit-scrollbar-thumb:hover {
    background: #a8a8a8;
}`, {
    headers: {
      'Content-Type': 'text/css',
    }
  });
});

// Main page with login and dashboard
app.get('/', (c) => {
  return c.html(`
    <!DOCTYPE html>
    <html lang="it">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Sistema Gestione Anagrafica - Sindacato Roma e Lazio</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
        <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
        <script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
        <link href="/static/styles.css" rel="stylesheet">
    </head>
    <body class="bg-gray-100 min-h-screen">
        <!-- Login Container -->
        <div id="loginContainer" class="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-900 to-blue-700">
            <div class="bg-white p-8 rounded-lg shadow-2xl w-full max-w-md">
                <div class="text-center mb-8">
                    <i class="fas fa-users text-6xl text-blue-600 mb-4"></i>
                    <h1 class="text-3xl font-bold text-gray-800 mb-2">Sistema Anagrafica</h1>
                    <p class="text-gray-600">Sindacato Roma e Lazio</p>
                </div>
                
                <form id="loginForm" class="space-y-6">
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">Nome utente</label>
                        <input type="text" id="username" required
                               class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                               placeholder="Inserisci il tuo nome utente">
                    </div>
                    
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">Password</label>
                        <input type="password" id="password" required
                               class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                               placeholder="Inserisci la tua password">
                    </div>
                    
                    <div id="loginError" class="text-red-600 text-sm hidden"></div>
                    
                    <button type="submit" 
                            class="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-200">
                        <i class="fas fa-sign-in-alt mr-2"></i>Accedi
                    </button>
                </form>
                
                <div class="mt-6 text-center text-sm text-gray-500">
                    <p>Credenziali di prova: admin / admin123</p>
                </div>
            </div>
        </div>
        
        <!-- Dashboard Container -->
        <div id="dashboardContainer" class="hidden min-h-screen bg-gray-50">
            <!-- Header -->
            <header class="bg-white shadow-sm border-b">
                <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div class="flex justify-between items-center py-4">
                        <div class="flex items-center">
                            <i class="fas fa-users text-3xl text-blue-600 mr-3"></i>
                            <div>
                                <h1 class="text-2xl font-bold text-gray-900">Sistema Anagrafica</h1>
                                <p class="text-sm text-gray-600">Sindacato Roma e Lazio</p>
                            </div>
                        </div>
                        
                        <div class="flex items-center space-x-4">
                            <div id="userInfo" class="text-sm text-gray-700"></div>
                            <button id="logoutBtn" class="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition">
                                <i class="fas fa-sign-out-alt mr-2"></i>Esci
                            </button>
                        </div>
                    </div>
                </div>
            </header>
            
            <!-- Navigation -->
            <nav class="bg-white shadow-sm">
                <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div class="flex space-x-8">
                        <button class="nav-tab active" data-tab="dashboard">
                            <i class="fas fa-chart-bar mr-2"></i>Dashboard
                        </button>
                        <button class="nav-tab" data-tab="anagrafica">
                            <i class="fas fa-address-book mr-2"></i>Anagrafica
                        </button>
                        <button class="nav-tab" data-tab="ricerca">
                            <i class="fas fa-search mr-2"></i>Ricerca Avanzata
                        </button>
                        <button class="nav-tab" data-tab="report">
                            <i class="fas fa-file-alt mr-2"></i>Report
                        </button>
                    </div>
                </div>
            </nav>
            
            <!-- Content -->
            <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <!-- Dashboard Tab -->
                <div id="dashboardTab" class="tab-content">
                    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                        <div class="bg-white p-6 rounded-lg shadow-md">
                            <div class="flex items-center">
                                <div class="bg-blue-100 p-3 rounded-full">
                                    <i class="fas fa-users text-blue-600 text-xl"></i>
                                </div>
                                <div class="ml-4">
                                    <p class="text-gray-600 text-sm">Totale Iscritti</p>
                                    <p id="totalIscritti" class="text-2xl font-bold text-gray-900">0</p>
                                </div>
                            </div>
                        </div>
                        
                        <div class="bg-white p-6 rounded-lg shadow-md">
                            <div class="flex items-center">
                                <div class="bg-green-100 p-3 rounded-full">
                                    <i class="fas fa-user-plus text-green-600 text-xl"></i>
                                </div>
                                <div class="ml-4">
                                    <p class="text-gray-600 text-sm">Nuovi Questo Anno</p>
                                    <p id="nuoviIscritti" class="text-2xl font-bold text-gray-900">0</p>
                                </div>
                            </div>
                        </div>
                        
                        <div class="bg-white p-6 rounded-lg shadow-md">
                            <div class="flex items-center">
                                <div class="bg-yellow-100 p-3 rounded-full">
                                    <i class="fas fa-chalkboard-teacher text-yellow-600 text-xl"></i>
                                </div>
                                <div class="ml-4">
                                    <p class="text-gray-600 text-sm">Docenti</p>
                                    <p id="totalDocenti" class="text-2xl font-bold text-gray-900">0</p>
                                </div>
                            </div>
                        </div>
                        
                        <div class="bg-white p-6 rounded-lg shadow-md">
                            <div class="flex items-center">
                                <div class="bg-purple-100 p-3 rounded-full">
                                    <i class="fas fa-briefcase text-purple-600 text-xl"></i>
                                </div>
                                <div class="ml-4">
                                    <p class="text-gray-600 text-sm">Personale ATA</p>
                                    <p id="totalATA" class="text-2xl font-bold text-gray-900">0</p>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                        <div class="bg-white p-6 rounded-lg shadow-md">
                            <h3 class="text-lg font-semibold text-gray-900 mb-4">Iscritti per Ruolo</h3>
                            <canvas id="ruoloChart"></canvas>
                        </div>
                        
                        <div class="bg-white p-6 rounded-lg shadow-md">
                            <h3 class="text-lg font-semibold text-gray-900 mb-4">Iscritti per Provincia</h3>
                            <canvas id="provinciaChart"></canvas>
                        </div>
                    </div>
                    
                    <div class="bg-white rounded-lg shadow-md p-6">
                        <h3 class="text-lg font-semibold text-gray-900 mb-4">Ultimi Iscritti</h3>
                        <div id="ultimiIscritti"></div>
                    </div>
                </div>
                
                <!-- Anagrafica Tab -->
                <div id="anagraficaTab" class="tab-content hidden">
                    <div class="bg-white rounded-lg shadow-md p-6">
                        <div class="flex justify-between items-center mb-6">
                            <h2 class="text-2xl font-bold text-gray-900">Gestione Anagrafica</h2>
                            <button id="addIscrittoBtn" class="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700">
                                <i class="fas fa-plus mr-2"></i>Nuovo Iscritto
                            </button>
                        </div>
                        
                        <div id="iscrittiTable" class="overflow-x-auto"></div>
                        
                        <div id="pagination" class="mt-4 flex justify-center"></div>
                    </div>
                </div>
                
                <!-- Ricerca Tab -->
                <div id="ricercaTab" class="tab-content hidden">
                    <div class="bg-white rounded-lg shadow-md p-6">
                        <h2 class="text-2xl font-bold text-gray-900 mb-6">Ricerca Avanzata</h2>
                        
                        <form id="searchForm" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                            <input type="text" name="cognome" placeholder="Cognome" 
                                   class="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                            <input type="text" name="nome" placeholder="Nome" 
                                   class="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                            <select name="ruolo" class="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                                <option value="">Tutti i ruoli</option>
                                <option value="DOCENTE">Docente</option>
                                <option value="ATA">Personale ATA</option>
                            </select>
                            <input type="text" name="istituto" placeholder="Istituto" 
                                   class="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                            <input type="text" name="prov" placeholder="Provincia" 
                                   class="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                            <input type="text" name="annoiscrizione" placeholder="Anno Iscrizione" 
                                   class="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                            <select name="rsu_tas" class="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                                <option value="">RSU/TAS</option>
                                <option value="RSU">RSU</option>
                                <option value="TAS">TAS</option>
                            </select>
                            <select name="contratto" class="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                                <option value="">Tipo Contratto</option>
                                <option value="TEMPO INDETERMINATO">Tempo Indeterminato</option>
                                <option value="TEMPO DETERMINATO">Tempo Determinato</option>
                            </select>
                        </form>
                        
                        <div class="flex justify-center space-x-4 mb-6">
                            <button id="searchBtn" class="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700">
                                <i class="fas fa-search mr-2"></i>Cerca
                            </button>
                            <button id="resetSearchBtn" class="bg-gray-600 text-white px-6 py-2 rounded-md hover:bg-gray-700">
                                <i class="fas fa-undo mr-2"></i>Reset
                            </button>
                        </div>
                        
                        <div id="searchResults"></div>
                    </div>
                </div>
                
                <!-- Report Tab -->
                <div id="reportTab" class="tab-content hidden">
                    <div class="bg-white rounded-lg shadow-md p-6">
                        <h2 class="text-2xl font-bold text-gray-900 mb-6">Report e Statistiche</h2>
                        
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div class="bg-gray-50 p-4 rounded-lg">
                                <h3 class="text-lg font-semibold mb-4">Report Iscritti per Ruolo</h3>
                                <canvas id="reportRuoloChart"></canvas>
                            </div>
                            <div class="bg-gray-50 p-4 rounded-lg">
                                <h3 class="text-lg font-semibold mb-4">Report Iscritti per Anno</h3>
                                <canvas id="reportAnnoChart"></canvas>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
        
        <!-- Modali -->
        <div id="iscrittoModal" class="fixed inset-0 bg-black bg-opacity-50 hidden items-center justify-center z-50">
            <div class="bg-white rounded-lg p-6 w-full max-w-4xl max-h-screen overflow-y-auto">
                <div class="flex justify-between items-center mb-4">
                    <h3 id="modalTitle" class="text-xl font-bold">Dettagli Iscritto</h3>
                    <button id="closeModal" class="text-gray-500 hover:text-gray-700">
                        <i class="fas fa-times text-xl"></i>
                    </button>
                </div>
                
                <form id="iscrittoForm" class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <!-- I campi del form verranno popolati dinamicamente -->
                </form>
                
                <div class="flex justify-end space-x-3 mt-6">
                    <button id="saveIscrittoBtn" class="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700">
                        Salva
                    </button>
                    <button id="cancelIscrittoBtn" class="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700">
                        Annulla
                    </button>
                </div>
            </div>
        </div>
        
        <script src="/static/app.js"></script>
    </body>
    </html>
  `);
});

export default app;