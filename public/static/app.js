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
        container.innerHTML = '<p class="text-gray-500">Nessun iscritto trovato</p>';
        return;
    }
    
    const html = `
        <table class="min-w-full divide-y divide-gray-200">
            <thead class="bg-gray-50">
                <tr>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cognome</th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nome</th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ruolo</th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Istituto</th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contratto</th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Azioni</th>
                </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200">
                ${data.data.map(iscritto => `
                    <tr>
                        <td class="px-6 py-4 whitespace-nowrap">${iscritto.cognome || '-'}</td>
                        <td class="px-6 py-4 whitespace-nowrap">${iscritto.nome || '-'}</td>
                        <td class="px-6 py-4 whitespace-nowrap">
                            <span class="px-2 py-1 text-xs font-semibold rounded-full ${getRuoloBadgeClass(iscritto.ruolo)}">
                                ${iscritto.ruolo || '-'}
                            </span>
                        </td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${iscritto.istituto || '-'}</td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-600">${iscritto.email || '-'}</td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm">
                            <span class="px-2 py-1 text-xs font-semibold rounded-full ${getContractBadgeClass(iscritto.tipo_di_contratto)}">
                                ${iscritto.tipo_di_contratto || '-'}
                            </span>
                        </td>
                        <td class="px-6 py-4 whitespace-nowrap">
                            <button onclick="editIscritto(${iscritto.id})" class="text-blue-600 hover:text-blue-900 mr-3" title="Modifica">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button onclick="viewIscritto(${iscritto.id})" class="text-green-600 hover:text-green-900 mr-3" title="Visualizza">
                                <i class="fas fa-eye"></i>
                            </button>
                            <button onclick="deleteIscritto(${iscritto.id})" class="text-red-600 hover:text-red-900" title="Elimina">
                                <i class="fas fa-trash"></i>
                            </button>
                        </td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
    
    container.innerHTML = html;
    
    // Paginazione
    displayPagination(data);
}

function getRuoloBadgeClass(ruolo) {
    switch (ruolo) {
        case 'Docente':
            return 'bg-blue-100 text-blue-800';
        case 'Ata':
            return 'bg-green-100 text-green-800';
        case 'Dirigente':
            return 'bg-purple-100 text-purple-800';
        default:
            return 'bg-gray-100 text-gray-800';
    }
}

function getContractBadgeClass(contratto) {
    switch (contratto) {
        case 'Tempo Indeterminato':
            return 'bg-green-100 text-green-800';
        case 'Tempo Determinato':
            return 'bg-yellow-100 text-yellow-800';
        default:
            return 'bg-gray-100 text-gray-800';
    }
}

function displayPagination(data) {
    const container = document.getElementById('pagination');
    
    if (data.totalPages <= 1) {
        container.innerHTML = '';
        return;
    }
    
    let html = '<div class="flex space-x-2">';
    
    for (let i = 1; i <= data.totalPages; i++) {
        html += `
            <button onclick="loadIscritti(${i}, currentFilters)" 
                    class="px-3 py-1 rounded ${i === data.page ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}"
                    ${i === data.page ? 'disabled' : ''}>
                ${i}
            </button>
        `;
    }
    
    html += '</div>';
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
    
    // Campi allineati con il nuovo schema del database
    const fields = [
        // Dati personali
        { name: 'cognome', label: 'Cognome', type: 'text', required: true, section: 'Dati Personali' },
        { name: 'nome', label: 'Nome', type: 'text', required: true },
        { name: 'indirizzo', label: 'Indirizzo', type: 'text' },
        { name: 'email', label: 'Email', type: 'email' },
        { name: 'telefono', label: 'Telefono', type: 'text' },
        
        // Dati iscrizione
        { name: 'iscrizione', label: 'Data Iscrizione', type: 'date', section: 'Dati Iscrizione' },
        { name: 'invio', label: 'Data Invio', type: 'date' },
        { name: 'prot', label: 'Protocollo', type: 'text' },
        { name: 'ruolo', label: 'Ruolo', type: 'select', options: ['Docente', 'Ata', 'Dirigente'], required: true },
        
        // Dati lavorativi
        { name: 'istituto', label: 'Istituto', type: 'text', section: 'Dati Lavorativi' },
        { name: 'tipologia', label: 'Tipologia Istituto', type: 'text' },
        { name: 'uff_servizio', label: 'Ufficio Servizio', type: 'text' },
        { name: 'descrizione', label: 'Descrizione Ruolo', type: 'text' },
        { name: 'cod_mecc', label: 'Codice Meccanografico', type: 'text' },
        { name: 'indirizzo_ufficio', label: 'Indirizzo Ufficio', type: 'text' },
        { name: 'cap', label: 'CAP', type: 'text' },
        { name: 'localita', label: 'Località', type: 'text' },
        { name: 'qual_liv', label: 'Qualifica/Livello', type: 'text' },
        
        // Dati contrattuali
        { name: 'tipo_di_contratto', label: 'Tipo di Contratto', type: 'select', options: ['Tempo Indeterminato', 'Tempo Determinato'], section: 'Dati Contrattuali' },
        { name: 'scadenza_contratto', label: 'Scadenza Contratto', type: 'date' },
        { name: 'tiporit', label: 'Tipo Ritenuta', type: 'text' },
        { name: 'importoritenuta', label: 'Importo Ritenuta', type: 'number', step: '0.01' },
        { name: 'meserata', label: 'Mese Rata', type: 'text' },
        { name: 'annorata', label: 'Anno Rata', type: 'text' },
        
        // Dati sindacali
        { name: 'rsu_tas', label: 'RSU/TAS', type: 'select', options: ['RSU', 'TAS', 'Nessuno'], section: 'Dati Sindacali' },
        { name: 'riferimento', label: 'Riferimento', type: 'text' },
        { name: 'attuale', label: 'Stato Attuale', type: 'text' },
        { name: 'dpt', label: 'Dipartimento', type: 'text' },
        { name: 'prov_iscrizione', label: 'Provincia Iscrizione', type: 'text' },
        { name: 'anagrafica', label: 'Note Anagrafica', type: 'text' },
        
        // Altri dati
        { name: 'documento', label: 'Documento', type: 'text', section: 'Altri Dati' },
        { name: 'note', label: 'Note', type: 'textarea' }
    ];
    
    let html = '';
    let currentSection = '';
    
    fields.forEach(field => {
        const value = iscritto[field.name] || '';
        
        // Aggiungi header sezione se necessario
        if (field.section && field.section !== currentSection) {
            currentSection = field.section;
            html += `
                <div class="col-span-2 border-b border-gray-200 pb-2 mb-4">
                    <h4 class="text-lg font-medium text-gray-900">${currentSection}</h4>
                </div>
            `;
        }
        
        if (field.type === 'select') {
            html += `
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">${field.label}</label>
                    <select name="${field.name}" ${field.required ? 'required' : ''} 
                            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                        <option value="">Seleziona...</option>
                        ${field.options.map(opt => `<option value="${opt}" ${value === opt ? 'selected' : ''}>${opt}</option>`).join('')}
                    </select>
                </div>
            `;
        } else if (field.type === 'textarea') {
            html += `
                <div class="col-span-2">
                    <label class="block text-sm font-medium text-gray-700 mb-1">${field.label}</label>
                    <textarea name="${field.name}" rows="3" 
                             class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">${value}</textarea>
                </div>
            `;
        } else {
            html += `
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">${field.label}</label>
                    <input type="${field.type}" name="${field.name}" value="${value}" 
                           ${field.required ? 'required' : ''}
                           ${field.step ? `step="${field.step}"` : ''}
                           class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                </div>
            `;
        }
    });
    
    form.innerHTML = `<div class="grid grid-cols-2 gap-4">${html}</div>`;
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
        
        // Crea modal di visualizzazione
        const modalHtml = `
            <div id="viewModal" class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center">
                <div class="relative p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white max-h-screen overflow-y-auto">
                    <div class="flex justify-between items-center mb-4">
                        <h3 class="text-lg font-medium">Dettagli Iscritto</h3>
                        <button onclick="document.getElementById('viewModal').remove()" class="text-gray-400 hover:text-gray-600">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div><strong>Cognome:</strong> ${iscritto.cognome || '-'}</div>
                        <div><strong>Nome:</strong> ${iscritto.nome || '-'}</div>
                        <div><strong>Email:</strong> ${iscritto.email || '-'}</div>
                        <div><strong>Telefono:</strong> ${iscritto.telefono || '-'}</div>
                        <div><strong>Ruolo:</strong> ${iscritto.ruolo || '-'}</div>
                        <div><strong>Istituto:</strong> ${iscritto.istituto || '-'}</div>
                        <div><strong>Tipologia:</strong> ${iscritto.tipologia || '-'}</div>
                        <div><strong>Contratto:</strong> ${iscritto.tipo_di_contratto || '-'}</div>
                        <div><strong>Scadenza:</strong> ${iscritto.scadenza_contratto || '-'}</div>
                        <div><strong>RSU/TAS:</strong> ${iscritto.rsu_tas || '-'}</div>
                        <div class="md:col-span-2"><strong>Indirizzo:</strong> ${iscritto.indirizzo || '-'}</div>
                        <div class="md:col-span-2"><strong>Note:</strong> ${iscritto.note || '-'}</div>
                    </div>
                    <div class="flex justify-end mt-6">
                        <button onclick="document.getElementById('viewModal').remove()" class="bg-gray-300 hover:bg-gray-400 text-gray-700 px-4 py-2 rounded">
                            Chiudi
                        </button>
                        <button onclick="document.getElementById('viewModal').remove(); editIscritto(${id})" class="ml-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded">
                            Modifica
                        </button>
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