// Variabili globali
let currentUser = null;
let authToken = null;
let currentPage = 1;
let currentFilters = {};

// Inizializzazione
window.addEventListener('DOMContentLoaded', () => {
    initializeApp();
});

function initializeApp() {
    // Controlla se c'è un token salvato
    const savedToken = localStorage.getItem('authToken');
    if (savedToken) {
        authToken = savedToken;
        // Verifica se il token è ancora valido
        validateTokenAndShowDashboard();
    } else {
        // Mostra il form di login
        showLoginForm();
    }
    
    setupEventListeners();
}

async function validateTokenAndShowDashboard() {
    try {
        // Testa il token con una chiamata API
        const response = await axios.get('/api/dashboard/stats', {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        
        if (response.status === 200) {
            showDashboard();
        } else {
            throw new Error('Token non valido');
        }
    } catch (error) {
        console.log('Token scaduto o non valido, mostra login');
        authToken = null;
        localStorage.removeItem('authToken');
        showLoginForm();
    }
}

function showLoginForm() {
    document.getElementById('loginContainer').classList.remove('hidden');
    document.getElementById('dashboardContainer').classList.add('hidden');
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
    
    document.getElementById('userInfo').textContent = `${currentUser.username} (${currentUser.role})`;
    
    loadDashboardData();
    loadIscritti();
}

// Navigazione tabs
function switchTab(tabName) {
    // Aggiorna i tab attivi
    document.querySelectorAll('.nav-tab').forEach(tab => {
        const isActive = tab.dataset.tab === tabName;
        if (isActive) {
            tab.classList.add('border-indigo-500', 'text-indigo-600');
            tab.classList.remove('border-transparent', 'text-gray-500');
        } else {
            tab.classList.remove('border-indigo-500', 'text-indigo-600');
            tab.classList.add('border-transparent', 'text-gray-500');
        }
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
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        
        const stats = response.data;
        
        // Aggiorna le statistiche
        document.getElementById('totalIscritti').textContent = stats.totalIscritti;
        document.getElementById('nuoviIscritti').textContent = stats.nuoviIscrittiAnno;
        
        const docenti = stats.iscrittiPerRuolo['Docente'] || 0;
        const ata = stats.iscrittiPerRuolo['Ata'] || 0;
        const dirigenti = stats.iscrittiPerRuolo['Dirigente'] || 0;
        
        document.getElementById('totalDocenti').textContent = docenti;
        document.getElementById('totalATA').textContent = ata;
        document.getElementById('totalDirigenti').textContent = dirigenti;
        
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
    
    const html = `
        <div class="space-y-3">
            ${iscritti.map(iscritto => `
                <div class="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                        <p class="font-medium">${iscritto.cognome} ${iscritto.nome}</p>
                        <p class="text-sm text-gray-600">${iscritto.ruolo || '-'} - ${iscritto.istituto || '-'}</p>
                    </div>
                    <div class="text-right">
                        <p class="text-sm text-gray-600">${new Date(iscritto.data_iscrizione).toLocaleDateString()}</p>
                    </div>
                </div>
            `).join('')}
        </div>
    `;
    
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
        
        const response = await axios.get(`/api/iscritti?${params}`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        
        displayIscritti(response.data);
        
    } catch (error) {
        console.error('Errore nel caricamento iscritti:', error);
    }
}

function displayIscritti(data) {
    const container = document.getElementById('iscrittiTable');
    
    if (!data.data || data.data.length === 0) {
        container.innerHTML = `
            <div class="text-center py-12">
                <div class="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <i class="fas fa-users text-gray-400 text-2xl"></i>
                </div>
                <h3 class="text-lg font-medium text-gray-900 mb-2">Nessun iscritto trovato</h3>
                <p class="text-gray-500">Non ci sono iscritti che corrispondono ai criteri di ricerca.</p>
            </div>
        `;
        return;
    }
    
    const html = `
        <div class="bg-white rounded-xl overflow-hidden">
            <table class="min-w-full">
                <thead>
                    <tr class="bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
                        <th class="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                            <div class="flex items-center space-x-1">
                                <i class="fas fa-user text-gray-400"></i>
                                <span>Iscritto</span>
                            </div>
                        </th>
                        <th class="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                            <div class="flex items-center space-x-1">
                                <i class="fas fa-briefcase text-gray-400"></i>
                                <span>Ruolo</span>
                            </div>
                        </th>
                        <th class="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                            <div class="flex items-center space-x-1">
                                <i class="fas fa-building text-gray-400"></i>
                                <span>Istituto</span>
                            </div>
                        </th>
                        <th class="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                            <div class="flex items-center space-x-1">
                                <i class="fas fa-envelope text-gray-400"></i>
                                <span>Contatti</span>
                            </div>
                        </th>
                        <th class="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                            <div class="flex items-center space-x-1">
                                <i class="fas fa-file-contract text-gray-400"></i>
                                <span>Contratto</span>
                            </div>
                        </th>
                        <th class="px-6 py-4 text-center text-xs font-bold text-gray-600 uppercase tracking-wider">
                            <i class="fas fa-cog text-gray-400"></i>
                            <span class="ml-1">Azioni</span>
                        </th>
                    </tr>
                </thead>
                <tbody class="bg-white divide-y divide-gray-100">
                    ${data.data.map((iscritto, index) => `
                        <tr class="hover:bg-gray-50 transition-colors duration-150 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-25'}">
                            <td class="px-6 py-4">
                                <div class="flex items-center">
                                    <div class="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-full flex items-center justify-center">
                                        <span class="text-indigo-700 font-semibold text-sm">
                                            ${(iscritto.cognome || '').charAt(0)}${(iscritto.nome || '').charAt(0)}
                                        </span>
                                    </div>
                                    <div class="ml-4">
                                        <div class="text-sm font-semibold text-gray-900">
                                            ${iscritto.cognome || '-'} ${iscritto.nome || '-'}
                                        </div>
                                        <div class="text-xs text-gray-500">
                                            ID: ${iscritto.id}
                                        </div>
                                    </div>
                                </div>
                            </td>
                            <td class="px-6 py-4">
                                <span class="inline-flex px-3 py-1 text-xs font-semibold rounded-full ${getRuoloBadgeClass(iscritto.ruolo)}">
                                    <i class="${getRuoloIcon(iscritto.ruolo)} mr-1"></i>
                                    ${iscritto.ruolo || '-'}
                                </span>
                            </td>
                            <td class="px-6 py-4">
                                <div class="text-sm text-gray-900 font-medium">
                                    ${truncateText(iscritto.istituto || '-', 30)}
                                </div>
                                <div class="text-xs text-gray-500">
                                    ${iscritto.localita || '-'}
                                </div>
                            </td>
                            <td class="px-6 py-4">
                                <div class="space-y-1">
                                    ${iscritto.email ? `
                                        <div class="flex items-center text-xs text-gray-600">
                                            <i class="fas fa-envelope text-gray-400 mr-1"></i>
                                            ${truncateText(iscritto.email, 25)}
                                        </div>
                                    ` : ''}
                                    ${iscritto.telefono ? `
                                        <div class="flex items-center text-xs text-gray-600">
                                            <i class="fas fa-phone text-gray-400 mr-1"></i>
                                            ${iscritto.telefono}
                                        </div>
                                    ` : ''}
                                </div>
                            </td>
                            <td class="px-6 py-4">
                                <span class="inline-flex px-3 py-1 text-xs font-semibold rounded-full ${getContractBadgeClass(iscritto.tipo_di_contratto)}">
                                    ${getContractIcon(iscritto.tipo_di_contratto)}
                                    ${iscritto.tipo_di_contratto || '-'}
                                </span>
                            </td>
                            <td class="px-6 py-4 text-center">
                                <div class="flex items-center justify-center space-x-2">
                                    <button onclick="viewIscritto(${iscritto.id})" 
                                            class="w-8 h-8 rounded-lg bg-green-100 hover:bg-green-200 text-green-600 hover:text-green-700 flex items-center justify-center transition-colors duration-200" 
                                            title="Visualizza dettagli">
                                        <i class="fas fa-eye text-sm"></i>
                                    </button>
                                    <button onclick="editIscritto(${iscritto.id})" 
                                            class="w-8 h-8 rounded-lg bg-blue-100 hover:bg-blue-200 text-blue-600 hover:text-blue-700 flex items-center justify-center transition-colors duration-200" 
                                            title="Modifica">
                                        <i class="fas fa-edit text-sm"></i>
                                    </button>
                                    <button onclick="deleteIscritto(${iscritto.id})" 
                                            class="w-8 h-8 rounded-lg bg-red-100 hover:bg-red-200 text-red-600 hover:text-red-700 flex items-center justify-center transition-colors duration-200" 
                                            title="Elimina">
                                        <i class="fas fa-trash text-sm"></i>
                                    </button>
                                </div>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
    `;
    
    container.innerHTML = html;
    
    // Paginazione
    displayPagination(data);
}

function getRuoloBadgeClass(ruolo) {
    switch (ruolo) {
        case 'Docente':
            return 'bg-blue-100 text-blue-700 border border-blue-200';
        case 'Ata':
            return 'bg-green-100 text-green-700 border border-green-200';
        case 'Dirigente':
            return 'bg-purple-100 text-purple-700 border border-purple-200';
        default:
            return 'bg-gray-100 text-gray-700 border border-gray-200';
    }
}

function getRuoloIcon(ruolo) {
    switch (ruolo) {
        case 'Docente':
            return 'fas fa-chalkboard-teacher';
        case 'Ata':
            return 'fas fa-tools';
        case 'Dirigente':
            return 'fas fa-user-tie';
        default:
            return 'fas fa-user';
    }
}

function getContractBadgeClass(contratto) {
    switch (contratto) {
        case 'Tempo Indeterminato':
            return 'bg-green-100 text-green-700 border border-green-200';
        case 'Tempo Determinato':
            return 'bg-orange-100 text-orange-700 border border-orange-200';
        default:
            return 'bg-gray-100 text-gray-700 border border-gray-200';
    }
}

function getContractIcon(contratto) {
    switch (contratto) {
        case 'Tempo Indeterminato':
            return '<i class="fas fa-check-circle mr-1"></i>';
        case 'Tempo Determinato':
            return '<i class="fas fa-clock mr-1"></i>';
        default:
            return '<i class="fas fa-file mr-1"></i>';
    }
}

function truncateText(text, maxLength) {
    if (!text || text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
}

function displayPagination(data) {
    const container = document.getElementById('pagination');
    
    if (data.totalPages <= 1) {
        container.innerHTML = '';
        return;
    }
    
    let html = `
        <div class="flex items-center justify-between">
            <div class="flex items-center text-sm text-gray-600">
                <span>Mostrando <span class="font-semibold">${((data.page - 1) * data.limit) + 1}</span> - <span class="font-semibold">${Math.min(data.page * data.limit, data.total)}</span> di <span class="font-semibold">${data.total}</span> risultati</span>
            </div>
            <div class="flex items-center space-x-1">
    `;
    
    // Previous button
    if (data.page > 1) {
        html += `
            <button onclick="loadIscritti(${data.page - 1}, currentFilters)" 
                    class="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-l-lg hover:bg-gray-50 hover:text-gray-700 transition-colors duration-200">
                <i class="fas fa-chevron-left mr-1"></i>Precedente
            </button>
        `;
    }
    
    // Page numbers
    const maxVisiblePages = 5;
    const startPage = Math.max(1, data.page - Math.floor(maxVisiblePages / 2));
    const endPage = Math.min(data.totalPages, startPage + maxVisiblePages - 1);
    
    if (startPage > 1) {
        html += `
            <button onclick="loadIscritti(1, currentFilters)" 
                    class="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 transition-colors duration-200">
                1
            </button>
        `;
        if (startPage > 2) {
            html += '<span class="px-3 py-2 text-sm text-gray-500">...</span>';
        }
    }
    
    for (let i = startPage; i <= endPage; i++) {
        html += `
            <button onclick="loadIscritti(${i}, currentFilters)" 
                    class="px-3 py-2 text-sm font-medium transition-colors duration-200 ${
                        i === data.page 
                        ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white border border-indigo-500 shadow-lg' 
                        : 'text-gray-700 bg-white border border-gray-300 hover:bg-gray-50'
                    }"
                    ${i === data.page ? 'disabled' : ''}>
                ${i}
            </button>
        `;
    }
    
    if (endPage < data.totalPages) {
        if (endPage < data.totalPages - 1) {
            html += '<span class="px-3 py-2 text-sm text-gray-500">...</span>';
        }
        html += `
            <button onclick="loadIscritti(${data.totalPages}, currentFilters)" 
                    class="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 transition-colors duration-200">
                ${data.totalPages}
            </button>
        `;
    }
    
    // Next button
    if (data.page < data.totalPages) {
        html += `
            <button onclick="loadIscritti(${data.page + 1}, currentFilters)" 
                    class="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-r-lg hover:bg-gray-50 hover:text-gray-700 transition-colors duration-200">
                Successiva<i class="fas fa-chevron-right ml-1"></i>
            </button>
        `;
    }
    
    html += `
            </div>
        </div>
    `;
    
    container.innerHTML = html;
}

// Modale per iscritti
function openIscrittoModal(iscrittoId = null) {
    const modal = document.getElementById('iscrittoModal');
    const title = document.getElementById('modalTitle');
    
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
        const response = await axios.get(`/api/iscritti/${id}`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        
        populateIscrittoForm(response.data);
        
    } catch (error) {
        console.error('Errore nel caricamento iscritto:', error);
    }
}

function populateIscrittoForm(iscritto) {
    const form = document.getElementById('iscrittoForm');
    
    // Sezioni organizzate per il form
    const sections = [
        {
            title: 'Dati Personali',
            icon: 'fas fa-user',
            color: 'indigo',
            fields: [
                { name: 'cognome', label: 'Cognome', type: 'text', required: true },
                { name: 'nome', label: 'Nome', type: 'text', required: true },
                { name: 'indirizzo', label: 'Indirizzo Residenza', type: 'text' },
                { name: 'email', label: 'Email Personale', type: 'email' },
                { name: 'telefono', label: 'Telefono', type: 'text' },
                { name: 'documento', label: 'Documento Identità', type: 'text' }
            ]
        },
        {
            title: 'Dati Iscrizione',
            icon: 'fas fa-calendar-plus',
            color: 'green',
            fields: [
                { name: 'iscrizione', label: 'Data Iscrizione', type: 'date' },
                { name: 'invio', label: 'Data Invio Documentazione', type: 'date' },
                { name: 'prot', label: 'Numero Protocollo', type: 'text' },
                { name: 'ruolo', label: 'Ruolo', type: 'select', options: ['Docente', 'Ata', 'Dirigente'], required: true },
                { name: 'prov_iscrizione', label: 'Provincia Iscrizione', type: 'text' },
                { name: 'anagrafica', label: 'Note Anagrafica', type: 'textarea' }
            ]
        },
        {
            title: 'Dati Lavorativi',
            icon: 'fas fa-briefcase',
            color: 'blue',
            fields: [
                { name: 'istituto', label: 'Istituto/Ente', type: 'text' },
                { name: 'tipologia', label: 'Tipologia Istituto', type: 'text' },
                { name: 'uff_servizio', label: 'Ufficio di Servizio', type: 'text' },
                { name: 'descrizione', label: 'Descrizione Mansione', type: 'text' },
                { name: 'cod_mecc', label: 'Codice Meccanografico', type: 'text' },
                { name: 'indirizzo_ufficio', label: 'Indirizzo Sede Lavoro', type: 'text' },
                { name: 'cap', label: 'CAP Sede', type: 'text' },
                { name: 'localita', label: 'Località Sede', type: 'text' },
                { name: 'qual_liv', label: 'Qualifica/Livello', type: 'text' }
            ]
        },
        {
            title: 'Dati Contrattuali',
            icon: 'fas fa-file-contract',
            color: 'purple',
            fields: [
                { name: 'tipo_di_contratto', label: 'Tipo di Contratto', type: 'select', options: ['Tempo Indeterminato', 'Tempo Determinato'] },
                { name: 'scadenza_contratto', label: 'Scadenza Contratto', type: 'date' },
                { name: 'tiporit', label: 'Tipo Ritenuta', type: 'text' },
                { name: 'importoritenuta', label: 'Importo Ritenuta (€)', type: 'number', step: '0.01' },
                { name: 'meserata', label: 'Mese Rata', type: 'text' },
                { name: 'annorata', label: 'Anno Rata', type: 'text' },
                { name: 'attuale', label: 'Stato Attuale', type: 'text' }
            ]
        },
        {
            title: 'Dati Sindacali',
            icon: 'fas fa-users-cog',
            color: 'orange',
            fields: [
                { name: 'rsu_tas', label: 'RSU/TAS', type: 'select', options: ['RSU', 'TAS', 'Nessuno'] },
                { name: 'riferimento', label: 'Riferimento/Contatto', type: 'text' },
                { name: 'dpt', label: 'Dipartimento', type: 'text' },
                { name: 'note', label: 'Note Aggiuntive', type: 'textarea' }
            ]
        }
    ];
    
    let html = '<div class="space-y-6">';
    
    sections.forEach((section, index) => {
        html += `
            <div class="bg-gray-50 rounded-xl p-6 border border-gray-200">
                <div class="flex items-center mb-4">
                    <div class="w-8 h-8 bg-gradient-to-r from-${section.color}-500 to-${section.color}-600 rounded-lg flex items-center justify-center mr-3">
                        <i class="${section.icon} text-white text-sm"></i>
                    </div>
                    <h4 class="text-lg font-semibold text-gray-900">${section.title}</h4>
                </div>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        `;
        
        section.fields.forEach(field => {
            const value = iscritto[field.name] || '';
            const isFullWidth = field.type === 'textarea' || field.name === 'indirizzo' || field.name === 'indirizzo_ufficio' || field.name === 'descrizione';
            const colSpan = isFullWidth ? 'md:col-span-2' : '';
            
            if (field.type === 'select') {
                html += `
                    <div class="${colSpan}">
                        <label class="block text-sm font-semibold text-gray-700 mb-2">${field.label} ${field.required ? '<span class="text-red-500">*</span>' : ''}</label>
                        <select name="${field.name}" ${field.required ? 'required' : ''} 
                                class="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-${section.color}-500 focus:border-transparent transition-all duration-200 bg-white">
                            <option value="">Seleziona ${field.label.toLowerCase()}...</option>
                            ${field.options.map(opt => `<option value="${opt}" ${value === opt ? 'selected' : ''}>${opt}</option>`).join('')}
                        </select>
                    </div>
                `;
            } else if (field.type === 'textarea') {
                html += `
                    <div class="${colSpan}">
                        <label class="block text-sm font-semibold text-gray-700 mb-2">${field.label}</label>
                        <textarea name="${field.name}" rows="3" 
                                 placeholder="Inserisci ${field.label.toLowerCase()}..."
                                 class="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-${section.color}-500 focus:border-transparent transition-all duration-200 resize-none">${value}</textarea>
                    </div>
                `;
            } else {
                const placeholder = field.type === 'date' ? '' : `Inserisci ${field.label.toLowerCase()}...`;
                html += `
                    <div class="${colSpan}">
                        <label class="block text-sm font-semibold text-gray-700 mb-2">${field.label} ${field.required ? '<span class="text-red-500">*</span>' : ''}</label>
                        <input type="${field.type}" name="${field.name}" value="${value}" 
                               ${field.required ? 'required' : ''}
                               ${field.step ? `step="${field.step}"` : ''}
                               placeholder="${placeholder}"
                               class="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-${section.color}-500 focus:border-transparent transition-all duration-200">
                    </div>
                `;
            }
        });
        
        html += `
                </div>
            </div>
        `;
    });
    
    html += '</div>';
    
    form.innerHTML = html;
    form.dataset.iscrittoId = iscritto.id || '';
}

async function saveIscritto() {
    const form = document.getElementById('iscrittoForm');
    const iscrittoId = form.dataset.iscrittoId;
    
    const formData = new FormData(form);
    const data = Object.fromEntries(formData.entries());
    
    // Rimuovi campi vuoti
    Object.keys(data).forEach(key => {
        if (data[key] === '') delete data[key];
    });
    
    try {
        if (iscrittoId) {
            await axios.put(`/api/iscritti/${iscrittoId}`, data, {
                headers: { 'Authorization': `Bearer ${authToken}` }
            });
        } else {
            await axios.post('/api/iscritti', data, {
                headers: { 'Authorization': `Bearer ${authToken}` }
            });
        }
        
        closeIscrittoModal();
        loadIscritti();
        
        // Mostra messaggio di successo
        showNotification('Iscritto salvato con successo!', 'success');
        
    } catch (error) {
        console.error('Errore nel salvataggio:', error);
        showNotification('Errore nel salvataggio dei dati', 'error');
    }
}

async function deleteIscritto(id) {
    if (!confirm('Sei sicuro di voler eliminare questo iscritto?')) {
        return;
    }
    
    try {
        await axios.delete(`/api/iscritti/${id}`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        
        loadIscritti();
        showNotification('Iscritto eliminato con successo!', 'success');
        
    } catch (error) {
        console.error('Errore nell\'eliminazione:', error);
        showNotification('Errore nell\'eliminazione dell\'iscritto', 'error');
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
        
        const response = await axios.get(`/api/iscritti?${params}`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
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
    
    const html = `
        <div class="bg-white rounded-lg shadow-md overflow-hidden">
            <div class="px-4 py-3 bg-gray-50 border-b">
                <h4 class="font-medium text-gray-900">Risultati ricerca (${data.total} trovati)</h4>
            </div>
            <table class="min-w-full divide-y divide-gray-200">
                <thead class="bg-gray-50">
                    <tr>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cognome</th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nome</th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ruolo</th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Istituto</th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Azioni</th>
                    </tr>
                </thead>
                <tbody class="bg-white divide-y divide-gray-200">
                    ${data.data.map(iscritto => `
                        <tr>
                            <td class="px-6 py-4">${iscritto.cognome || '-'}</td>
                            <td class="px-6 py-4">${iscritto.nome || '-'}</td>
                            <td class="px-6 py-4">
                                <span class="px-2 py-1 text-xs font-semibold rounded-full ${getRuoloBadgeClass(iscritto.ruolo)}">
                                    ${iscritto.ruolo || '-'}
                                </span>
                            </td>
                            <td class="px-6 py-4 text-sm">${iscritto.istituto || '-'}</td>
                            <td class="px-6 py-4 text-sm text-gray-600">${iscritto.email || '-'}</td>
                            <td class="px-6 py-4">
                                <button onclick="editIscritto(${iscritto.id})" class="text-blue-600 hover:text-blue-900 mr-2">
                                    <i class="fas fa-edit"></i>
                                </button>
                                <button onclick="viewIscritto(${iscritto.id})" class="text-green-600 hover:text-green-900">
                                    <i class="fas fa-eye"></i>
                                </button>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
    `;
    
    container.innerHTML = html;
}

function resetSearch() {
    document.getElementById('searchForm').reset();
    currentFilters = {};
    document.getElementById('searchResults').innerHTML = '';
}

// Reportistica
function loadReportCharts() {
    // Per ora usa gli stessi dati della dashboard
    loadDashboardData();
}

// Notifiche
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `fixed top-4 right-4 p-4 rounded-md shadow-lg z-50 ${getNotificationClass(type)}`;
    notification.innerHTML = `
        <div class="flex items-center">
            <i class="fas ${getNotificationIcon(type)} mr-2"></i>
            <span>${message}</span>
            <button onclick="this.parentElement.parentElement.remove()" class="ml-4 text-white hover:text-gray-200">
                <i class="fas fa-times"></i>
            </button>
        </div>
    `;
    
    document.body.appendChild(notification);
    
    // Rimuovi automaticamente dopo 5 secondi
    setTimeout(() => {
        if (notification.parentElement) {
            notification.remove();
        }
    }, 5000);
}

function getNotificationClass(type) {
    switch (type) {
        case 'success':
            return 'bg-green-600 text-white';
        case 'error':
            return 'bg-red-600 text-white';
        case 'warning':
            return 'bg-yellow-600 text-white';
        default:
            return 'bg-blue-600 text-white';
    }
}

function getNotificationIcon(type) {
    switch (type) {
        case 'success':
            return 'fa-check-circle';
        case 'error':
            return 'fa-exclamation-circle';
        case 'warning':
            return 'fa-exclamation-triangle';
        default:
            return 'fa-info-circle';
    }
}

// Funzioni globali per onclick
window.editIscritto = function(id) {
    openIscrittoModal(id);
};

window.viewIscritto = async function(id) {
    try {
        const response = await axios.get(`/api/iscritti/${id}`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        
        const iscritto = response.data;
        
        // Crea modal di visualizzazione moderna
        const modalHtml = `
            <div id="viewModal" class="fixed inset-0 z-50 overflow-hidden" role="dialog" aria-modal="true">
                <div class="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm transition-opacity"></div>
                <div class="fixed inset-0 z-50 overflow-y-auto">
                    <div class="flex min-h-full items-center justify-center p-4">
                        <div class="relative w-full max-w-4xl max-h-[90vh] bg-white rounded-2xl shadow-2xl">
                            <!-- Header -->
                            <div class="sticky top-0 bg-white rounded-t-2xl border-b border-gray-100 px-6 py-4">
                                <div class="flex items-center justify-between">
                                    <div class="flex items-center space-x-3">
                                        <div class="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center">
                                            <span class="text-white font-bold text-lg">
                                                ${(iscritto.cognome || '').charAt(0)}${(iscritto.nome || '').charAt(0)}
                                            </span>
                                        </div>
                                        <div>
                                            <h3 class="text-xl font-semibold text-gray-900">${iscritto.cognome} ${iscritto.nome}</h3>
                                            <p class="text-sm text-gray-600">${iscritto.ruolo || 'Ruolo non specificato'}</p>
                                        </div>
                                    </div>
                                    <button onclick="document.getElementById('viewModal').remove()" class="w-8 h-8 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors">
                                        <i class="fas fa-times"></i>
                                    </button>
                                </div>
                            </div>
                            
                            <!-- Content -->
                            <div class="overflow-y-auto max-h-[calc(90vh-140px)] p-6">
                                <div class="space-y-6">
                                    <!-- Dati Personali -->
                                    <div class="bg-indigo-50 rounded-xl p-5 border border-indigo-100">
                                        <div class="flex items-center mb-4">
                                            <div class="w-8 h-8 bg-indigo-500 rounded-lg flex items-center justify-center mr-3">
                                                <i class="fas fa-user text-white text-sm"></i>
                                            </div>
                                            <h4 class="text-lg font-semibold text-gray-900">Dati Personali</h4>
                                        </div>
                                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div class="space-y-1">
                                                <span class="text-sm font-medium text-gray-500">Email</span>
                                                <p class="text-gray-900">${iscritto.email || '-'}</p>
                                            </div>
                                            <div class="space-y-1">
                                                <span class="text-sm font-medium text-gray-500">Telefono</span>
                                                <p class="text-gray-900">${iscritto.telefono || '-'}</p>
                                            </div>
                                            <div class="space-y-1 md:col-span-2">
                                                <span class="text-sm font-medium text-gray-500">Indirizzo</span>
                                                <p class="text-gray-900">${iscritto.indirizzo || '-'}</p>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <!-- Dati Lavorativi -->
                                    <div class="bg-blue-50 rounded-xl p-5 border border-blue-100">
                                        <div class="flex items-center mb-4">
                                            <div class="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center mr-3">
                                                <i class="fas fa-briefcase text-white text-sm"></i>
                                            </div>
                                            <h4 class="text-lg font-semibold text-gray-900">Dati Lavorativi</h4>
                                        </div>
                                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div class="space-y-1">
                                                <span class="text-sm font-medium text-gray-500">Istituto</span>
                                                <p class="text-gray-900">${iscritto.istituto || '-'}</p>
                                            </div>
                                            <div class="space-y-1">
                                                <span class="text-sm font-medium text-gray-500">Tipologia</span>
                                                <p class="text-gray-900">${iscritto.tipologia || '-'}</p>
                                            </div>
                                            <div class="space-y-1">
                                                <span class="text-sm font-medium text-gray-500">Qualifica/Livello</span>
                                                <p class="text-gray-900">${iscritto.qual_liv || '-'}</p>
                                            </div>
                                            <div class="space-y-1">
                                                <span class="text-sm font-medium text-gray-500">Codice Meccanografico</span>
                                                <p class="text-gray-900">${iscritto.cod_mecc || '-'}</p>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <!-- Dati Contrattuali -->
                                    <div class="bg-purple-50 rounded-xl p-5 border border-purple-100">
                                        <div class="flex items-center mb-4">
                                            <div class="w-8 h-8 bg-purple-500 rounded-lg flex items-center justify-center mr-3">
                                                <i class="fas fa-file-contract text-white text-sm"></i>
                                            </div>
                                            <h4 class="text-lg font-semibold text-gray-900">Dati Contrattuali</h4>
                                        </div>
                                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div class="space-y-1">
                                                <span class="text-sm font-medium text-gray-500">Tipo Contratto</span>
                                                <div class="flex items-center">
                                                    <span class="inline-flex px-3 py-1 text-xs font-semibold rounded-full ${getContractBadgeClass(iscritto.tipo_di_contratto)}">
                                                        ${getContractIcon(iscritto.tipo_di_contratto)}
                                                        ${iscritto.tipo_di_contratto || '-'}
                                                    </span>
                                                </div>
                                            </div>
                                            <div class="space-y-1">
                                                <span class="text-sm font-medium text-gray-500">Scadenza</span>
                                                <p class="text-gray-900">${iscritto.scadenza_contratto || '-'}</p>
                                            </div>
                                            <div class="space-y-1">
                                                <span class="text-sm font-medium text-gray-500">Importo Ritenuta</span>
                                                <p class="text-gray-900">${iscritto.importoritenuta ? '€ ' + iscritto.importoritenuta : '-'}</p>
                                            </div>
                                            <div class="space-y-1">
                                                <span class="text-sm font-medium text-gray-500">RSU/TAS</span>
                                                <p class="text-gray-900">${iscritto.rsu_tas || '-'}</p>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    ${iscritto.note ? `
                                        <!-- Note -->
                                        <div class="bg-gray-50 rounded-xl p-5 border border-gray-200">
                                            <div class="flex items-center mb-3">
                                                <div class="w-8 h-8 bg-gray-500 rounded-lg flex items-center justify-center mr-3">
                                                    <i class="fas fa-sticky-note text-white text-sm"></i>
                                                </div>
                                                <h4 class="text-lg font-semibold text-gray-900">Note</h4>
                                            </div>
                                            <p class="text-gray-700 whitespace-pre-wrap">${iscritto.note}</p>
                                        </div>
                                    ` : ''}
                                </div>
                            </div>
                            
                            <!-- Footer -->
                            <div class="sticky bottom-0 bg-white rounded-b-2xl border-t border-gray-100 px-6 py-4">
                                <div class="flex justify-end space-x-3">
                                    <button onclick="document.getElementById('viewModal').remove()" class="px-6 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors duration-200">
                                        <i class="fas fa-times mr-2"></i>Chiudi
                                    </button>
                                    <button onclick="document.getElementById('viewModal').remove(); editIscritto(${id})" class="px-6 py-2.5 text-sm font-medium text-white bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl">
                                        <i class="fas fa-edit mr-2"></i>Modifica
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', modalHtml);
        
    } catch (error) {
        console.error('Errore nel caricamento dettagli:', error);
        showNotification('Errore nel caricamento dei dettagli', 'error');
    }
};

window.deleteIscritto = deleteIscritto;
window.loadIscritti = loadIscritti; // per la paginazione