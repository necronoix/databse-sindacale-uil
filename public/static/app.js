// Applicazione principale per la gestione iscritti sindacato

class SindacatoApp {
    constructor() {
        this.apiUrl = window.location.origin + '/api';
        this.token = localStorage.getItem('token');
        this.user = JSON.parse(localStorage.getItem('user') || '{}');
        this.currentPage = 'dashboard';
        this.members = [];
        this.filters = {};
        this.charts = {};
        
        this.init();
    }

    init() {
        if (this.token) {
            this.showDashboard();
        } else {
            this.showLogin();
        }
        
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Gestione logout
        document.addEventListener('click', (e) => {
            if (e.target.closest('#logout-btn')) {
                this.logout();
            }
        });
    }

    showLogin() {
        document.getElementById('app').innerHTML = `
            <div class="login-container">
                <div class="login-card">
                    <div class="text-center mb-8">
                        <i class="fas fa-users text-6xl text-blue-600 mb-4"></i>
                        <h1 class="text-3xl font-bold text-gray-800 mb-2">
                            Sindacato Roma e Lazio
                        </h1>
                        <p class="text-gray-600">Gestione Anagrafica Iscritti</p>
                    </div>
                    
                    <form id="login-form" class="space-y-6">
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">
                                Username
                            </label>
                            <input 
                                type="text" 
                                id="username" 
                                class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                placeholder="Inserisci username"
                                required
                            >
                        </div>
                        
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">
                                Password
                            </label>
                            <input 
                                type="password" 
                                id="password" 
                                class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                placeholder="Inserisci password"
                                required
                            >
                        </div>
                        
                        <button 
                            type="submit" 
                            class="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 px-4 rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 transition duration-300"
                        >
                            Accedi
                        </button>
                    </form>
                </div>
            </div>
        `;

        document.getElementById('login-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.login();
        });
    }

    async login() {
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;

        try {
            const response = await axios.post(`${this.apiUrl}/auth/login`, {
                username,
                password
            });

            const { token, user } = response.data;
            
            localStorage.setItem('token', token);
            localStorage.setItem('user', JSON.stringify(user));
            
            this.token = token;
            this.user = user;
            
            this.showDashboard();
            
        } catch (error) {
            alert('Login fallito: ' + (error.response?.data?.error || 'Errore di connessione'));
        }
    }

    logout() {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        this.token = null;
        this.user = {};
        this.showLogin();
    }

    showDashboard() {
        document.getElementById('app').innerHTML = `
            <div class="dashboard-container min-h-screen">
                <!-- Header -->
                <header class="salesforce-header shadow-lg">
                    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div class="flex justify-between items-center py-4">
                            <div class="flex items-center">
                                <i class="fas fa-users text-3xl text-blue-600 mr-3"></i>
                                <div>
                                    <h1 class="text-2xl font-bold text-gray-900">Sindacato Roma e Lazio</h1>
                                    <p class="text-sm text-gray-600">Gestione Anagrafica Iscritti</p>
                                </div>
                            </div>
                            
                            <div class="flex items-center space-x-4">
                                <span class="text-sm text-gray-600">
                                    <i class="fas fa-user mr-1"></i>
                                    ${this.user.username} (${this.user.role})
                                </span>
                                <button id="logout-btn" class="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition">
                                    <i class="fas fa-sign-out-alt mr-2"></i>Logout
                                </button>
                            </div>
                        </div>
                    </div>
                </header>

                <!-- Navigation -->
                <nav class="bg-white shadow-sm">
                    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div class="flex space-x-8">
                            <button class="nav-btn active" data-page="dashboard">
                                <i class="fas fa-chart-bar mr-2"></i>Dashboard
                            </button>
                            <button class="nav-btn" data-page="members">
                                <i class="fas fa-users mr-2"></i>Anagrafica
                            </button>
                            <button class="nav-btn" data-page="reports">
                                <i class="fas fa-file-alt mr-2"></i>Report
                            </button>
                            ${this.user.role === 'admin' ? `
                            <button class="nav-btn" data-page="admin">
                                <i class="fas fa-cog mr-2"></i>Amministrazione
                            </button>
                            ` : ''}
                        </div>
                    </div>
                </nav>

                <!-- Main Content -->
                <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    <div id="main-content">
                        <!-- Content will be loaded here -->
                    </div>
                </main>
            </div>
        `;

        this.setupNavigation();
        this.loadDashboard();
    }

    setupNavigation() {
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
                e.target.closest('.nav-btn').classList.add('active');
                
                const page = e.target.closest('.nav-btn').dataset.page;
                this.currentPage = page;
                
                switch (page) {
                    case 'dashboard':
                        this.loadDashboard();
                        break;
                    case 'members':
                        this.loadMembers();
                        break;
                    case 'reports':
                        this.loadReports();
                        break;
                    case 'admin':
                        this.loadAdmin();
                        break;
                }
            });
        });
    }

    async loadDashboard() {
        const content = document.getElementById('main-content');
        content.innerHTML = `
            <div class="space-y-6">
                <!-- KPI Cards -->
                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6" id="kpi-cards">
                    <div class="text-center py-8">
                        <div class="loading-spinner mx-auto mb-4"></div>
                        <p class="text-gray-600">Caricamento dati...</p>
                    </div>
                </div>

                <!-- Charts Row 1 -->
                <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div class="tableau-card">
                        <div class="p-6">
                            <h3 class="text-lg font-semibold text-gray-800 mb-4">
                                <i class="fas fa-map-marker-alt mr-2 text-blue-600"></i>
                                Distribuzione per Provincia
                            </h3>
                            <canvas id="provinceChart" width="400" height="200"></canvas>
                        </div>
                    </div>

                    <div class="tableau-card">
                        <div class="p-6">
                            <h3 class="text-lg font-semibold text-gray-800 mb-4">
                                <i class="fas fa-building mr-2 text-green-600"></i>
                                Distribuzione per Istituto
                            </h3>
                            <canvas id="istitutoChart" width="400" height="200"></canvas>
                        </div>
                    </div>
                </div>

                <!-- Charts Row 2 -->
                <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div class="tableau-card">
                        <div class="p-6">
                            <h3 class="text-lg font-semibold text-gray-800 mb-4">
                                <i class="fas fa-chart-line mr-2 text-purple-600"></i>
                                Andamento Mensile
                            </h3>
                            <canvas id="monthlyChart" width="400" height="200"></canvas>
                        </div>
                    </div>

                    <div class="tableau-card">
                        <div class="p-6">
                            <h3 class="text-lg font-semibold text-gray-800 mb-4">
                                <i class="fas fa-users-cog mr-2 text-orange-600"></i>
                                Distribuzione per Ruolo
                            </h3>
                            <canvas id="ruoloChart" width="400" height="200"></canvas>
                        </div>
                    </div>
                </div>

                <!-- Recent Activity -->
                <div class="tableau-card">
                    <div class="p-6">
                        <h3 class="text-lg font-semibold text-gray-800 mb-4">
                            <i class="fas fa-clock mr-2 text-red-600"></i>
                            Attività Recente
                        </h3>
                        <div id="recent-activity" class="space-y-3">
                            <!-- Activity items will be loaded here -->
                        </div>
                    </div>
                </div>
            </div>
        `;

        await this.loadDashboardData();
    }

    async loadDashboardData() {
        try {
            const response = await axios.get(`${this.apiUrl}/dashboard/data`, {
                headers: { 'Authorization': `Bearer ${this.token}` }
            });

            const { stats, charts } = response.data;

            // Update KPI cards
            document.getElementById('kpi-cards').innerHTML = `
                <div class="kpi-card fade-in-up">
                    <div class="kpi-number">${stats.total_members || 0}</div>
                    <div class="text-gray-600 text-sm">Totale Iscritti</div>
                </div>
                <div class="kpi-card fade-in-up" style="animation-delay: 0.1s">
                    <div class="kpi-number">${stats.recent || 0}</div>
                    <div class="text-gray-600 text-sm">Nuovi (30gg)</div>
                </div>
                <div class="kpi-card fade-in-up" style="animation-delay: 0.2s">
                    <div class="kpi-number">${stats.provinces || 0}</div>
                    <div class="text-gray-600 text-sm">Province</div>
                </div>
                <div class="kpi-card fade-in-up" style="animation-delay: 0.3s">
                    <div class="kpi-number">${stats.institutes || 0}</div>
                    <div class="text-gray-600 text-sm">Istituti</div>
                </div>
            `;

            // Create charts
            this.createCharts(charts);

        } catch (error) {
            console.error('Error loading dashboard data:', error);
            alert('Errore nel caricamento dei dati della dashboard');
        }
    }

    createCharts(charts) {
        // Province chart
        const provinceCtx = document.getElementById('provinceChart').getContext('2d');
        new Chart(provinceCtx, {
            type: 'doughnut',
            data: {
                labels: charts.province.map(p => p.prov),
                datasets: [{
                    data: charts.province.map(p => p.count),
                    backgroundColor: [
                        '#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#06b6d4'
                    ]
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

        // Istituto chart
        const istitutoCtx = document.getElementById('istitutoChart').getContext('2d');
        new Chart(istitutoCtx, {
            type: 'bar',
            data: {
                labels: charts.istituto.map(i => i.istituto?.substring(0, 20) + '...'),
                datasets: [{
                    label: 'Iscritti',
                    data: charts.istituto.map(i => i.count),
                    backgroundColor: '#10b981'
                }]
            },
            options: {
                responsive: true,
                indexAxis: 'y',
                plugins: {
                    legend: {
                        display: false
                    }
                }
            }
        });

        // Monthly chart
        const monthlyCtx = document.getElementById('monthlyChart').getContext('2d');
        new Chart(monthlyCtx, {
            type: 'line',
            data: {
                labels: charts.monthly.map(m => m.month),
                datasets: [{
                    label: 'Nuovi iscritti',
                    data: charts.monthly.map(m => m.count),
                    borderColor: '#8b5cf6',
                    backgroundColor: 'rgba(139, 92, 246, 0.1)',
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        display: false
                    }
                }
            }
        });

        // Ruolo chart
        const ruoloCtx = document.getElementById('ruoloChart').getContext('2d');
        new Chart(ruoloCtx, {
            type: 'polarArea',
            data: {
                labels: charts.ruolo.map(r => r.ruolo),
                datasets: [{
                    data: charts.ruolo.map(r => r.count),
                    backgroundColor: [
                        'rgba(59, 130, 246, 0.8)',
                        'rgba(16, 185, 129, 0.8)',
                        'rgba(245, 158, 11, 0.8)',
                        'rgba(139, 92, 246, 0.8)'
                    ]
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
    }

    async loadMembers() {
        const content = document.getElementById('main-content');
        content.innerHTML = `
            <div class="space-y-6">
                <!-- Header with search -->
                <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h2 class="text-2xl font-bold text-gray-800">Anagrafica Iscritti</h2>
                        <p class="text-gray-600">Gestione degli iscritti al sindacato</p>
                    </div>
                    <div class="flex gap-3">
                        <button id="advanced-search-btn" class="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
                            <i class="fas fa-search mr-2"></i>Ricerca Avanzata
                        </button>
                        <button id="add-member-btn" class="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700">
                            <i class="fas fa-plus mr-2"></i>Nuovo Iscritto
                        </button>
                    </div>
                </div>

                <!-- Advanced Search Panel -->
                <div id="advanced-search-panel" class="filter-panel hidden">
                    <h3 class="text-lg font-semibold text-gray-800 mb-4">Ricerca Avanzata</h3>
                    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <input type="text" id="search-cognome" placeholder="Cognome" class="px-3 py-2 border rounded-lg">
                        <input type="text" id="search-nome" placeholder="Nome" class="px-3 py-2 border rounded-lg">
                        <input type="text" id="search-prov" placeholder="Provincia" class="px-3 py-2 border rounded-lg">
                        <input type="text" id="search-istituto" placeholder="Istituto" class="px-3 py-2 border rounded-lg">
                        <input type="text" id="search-ruolo" placeholder="Ruolo" class="px-3 py-2 border rounded-lg">
                        <input type="text" id="search-email" placeholder="Email" class="px-3 py-2 border rounded-lg">
                        <button id="search-btn" class="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
                            <i class="fas fa-search mr-2"></i>Cerca
                        </button>
                        <button id="clear-search-btn" class="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700">
                            <i class="fas fa-times mr-2"></i>Pulisci
                        </button>
                    </div>
                </div>

                <!-- Members Table -->
                <div class="tableau-card">
                    <div class="p-6">
                        <div class="overflow-x-auto">
                            <table class="data-table w-full">
                                <thead>
                                    <tr>
                                        <th>Cognome</th>
                                        <th>Nome</th>
                                        <th>Provincia</th>
                                        <th>Istituto</th>
                                        <th>Ruolo</th>
                                        <th>Email</th>
                                        <th>Telefono</th>
                                        <th>Azioni</th>
                                    </tr>
                                </thead>
                                <tbody id="members-tbody">
                                    <tr>
                                        <td colspan="8" class="text-center py-8">
                                            <div class="loading-spinner mx-auto mb-4"></div>
                                            <p class="text-gray-600">Caricamento iscritti...</p>
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                        
                        <!-- Pagination -->
                        <div class="mt-6 flex justify-between items-center">
                            <div class="text-sm text-gray-600">
                                <span id="pagination-info">Caricamento...</span>
                            </div>
                            <div class="flex space-x-2" id="pagination-controls">
                                <!-- Pagination buttons will be added here -->
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        this.setupMembersEventListeners();
        this.loadMembersData();
    }

    setupMembersEventListeners() {
        document.getElementById('advanced-search-btn').addEventListener('click', () => {
            const panel = document.getElementById('advanced-search-panel');
            panel.classList.toggle('hidden');
        });

        document.getElementById('search-btn').addEventListener('click', () => {
            this.searchMembers();
        });

        document.getElementById('clear-search-btn').addEventListener('click', () => {
            this.clearSearch();
        });

        document.getElementById('add-member-btn').addEventListener('click', () => {
            this.showAddMemberModal();
        });
    }

    async loadMembersData(page = 1) {
        try {
            const response = await axios.get(`${this.apiUrl}/members`, {
                headers: { 'Authorization': `Bearer ${this.token}` },
                params: { 
                    page, 
                    limit: 50,
                    ...this.filters 
                }
            });

            const { members, pagination } = response.data;
            this.displayMembers(members);
            this.displayPagination(pagination);

        } catch (error) {
            console.error('Error loading members:', error);
            alert('Errore nel caricamento degli iscritti');
        }
    }

    displayMembers(members) {
        const tbody = document.getElementById('members-tbody');
        
        if (members.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="8" class="text-center py-8 text-gray-600">
                        Nessun iscritto trovato
                    </td>
                </tr>
            `;
            return;
        }

        tbody.innerHTML = members.map(member => `
            <tr>
                <td class="font-semibold">${member.cognome}</td>
                <td>${member.nome}</td>
                <td>${member.prov || '-'}</td>
                <td>${member.istituto || '-'}</td>
                <td>${member.ruolo || '-'}</td>
                <td>${member.email || '-'}</td>
                <td>${member.telefono || '-'}</td>
                <td>
                    <div class="flex space-x-2">
                        <button class="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700" 
                                onclick="app.editMember(${member.id})">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700" 
                                onclick="app.deleteMember(${member.id})">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');
    }

    displayPagination(pagination) {
        document.getElementById('pagination-info').textContent = 
            `Pagina ${pagination.page} di ${pagination.pages} (${pagination.total} totali)`;

        const controls = document.getElementById('pagination-controls');
        controls.innerHTML = '';

        if (pagination.page > 1) {
            controls.innerHTML += `
                <button class="bg-gray-600 text-white px-3 py-1 rounded hover:bg-gray-700" 
                        onclick="app.loadMembersData(${pagination.page - 1})">
                    Precedente
                </button>
            `;
        }

        if (pagination.page < pagination.pages) {
            controls.innerHTML += `
                <button class="bg-gray-600 text-white px-3 py-1 rounded hover:bg-gray-700" 
                        onclick="app.loadMembersData(${pagination.page + 1})">
                    Successiva
                </button>
            `;
        }
    }

    searchMembers() {
        this.filters = {
            cognome: document.getElementById('search-cognome').value,
            nome: document.getElementById('search-nome').value,
            prov: document.getElementById('search-prov').value,
            istituto: document.getElementById('search-istituto').value,
            ruolo: document.getElementById('search-ruolo').value,
            email: document.getElementById('search-email').value
        };

        // Rimuovi filtri vuoti
        Object.keys(this.filters).forEach(key => {
            if (!this.filters[key]) delete this.filters[key];
        });

        this.loadMembersData();
    }

    clearSearch() {
        this.filters = {};
        document.getElementById('search-cognome').value = '';
        document.getElementById('search-nome').value = '';
        document.getElementById('search-prov').value = '';
        document.getElementById('search-istituto').value = '';
        document.getElementById('search-ruolo').value = '';
        document.getElementById('search-email').value = '';
        this.loadMembersData();
    }

    // Metodi per report e admin verranno aggiunti in seguito
    async loadReports() {
        document.getElementById('main-content').innerHTML = `
            <div class="text-center py-12">
                <i class="fas fa-file-alt text-6xl text-gray-400 mb-4"></i>
                <h2 class="text-2xl font-bold text-gray-800 mb-2">Report</h2>
                <p class="text-gray-600">Funzionalità in sviluppo...</p>
            </div>
        `;
    }

    async loadAdmin() {
        if (this.user.role !== 'admin') {
            alert('Accesso negato');
            return;
        }
        
        document.getElementById('main-content').innerHTML = `
            <div class="text-center py-12">
                <i class="fas fa-cog text-6xl text-gray-400 mb-4"></i>
                <h2 class="text-2xl font-bold text-gray-800 mb-2">Amministrazione</h2>
                <p class="text-gray-600">Funzionalità in sviluppo...</p>
            </div>
        `;
    }
}

// Inizializza l'applicazione quando il DOM è pronto
document.addEventListener('DOMContentLoaded', () => {
    window.app = new SindacatoApp();
});