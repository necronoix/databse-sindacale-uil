import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'
import { jwt } from 'hono/jwt'
import { serveStatic } from 'hono/cloudflare-workers'

// Import route modules
import authRoutes from './routes/auth'
import iscrittiRoutes from './routes/iscritti'
import dashboardRoutes from './routes/dashboard'

// Extended Hono app with bindings
type Bindings = {
  DB: D1Database
  JWT_SECRET: string
}

const app = new Hono<{ Bindings: Bindings }>()

// Middleware
app.use('*', logger())
app.use('*', cors({
  origin: ['http://localhost:3000', 'https://*.pages.dev'],
  credentials: true
}))

// Serve static files - FIXED for Cloudflare Pages
// In Cloudflare Pages, static files are served automatically from the public directory
// We don't need serveStatic middleware for basic static file serving
// app.use('/static/*', serveStatic({ root: './public' }))

// Routes
app.route('/api/auth', authRoutes)
app.route('/api/iscritti', iscrittiRoutes)
app.route('/api/dashboard', dashboardRoutes)

// Main page
app.get('/', (c) => {
  return c.html(`
    <!DOCTYPE html>
    <html lang="it">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>UIL Scuola Roma e Lazio - Gestione Iscritti</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
        <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
        <script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
        <link href="/static/styles.css" rel="stylesheet">
    </head>
    <body class="bg-gray-50">
        <div id="app">
            <!-- Login Container -->
            <div id="loginContainer" class="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
                <div class="max-w-md w-full space-y-8">
                    <div class="text-center">
                        <div class="flex justify-center mb-6">
                            <div class="bg-white p-4 rounded-2xl shadow-2xl">
                                <img src="/static/uilscuola-logo.png" alt="UIL Scuola Roma e Lazio" class="h-16 w-auto">
                            </div>
                        </div>
                        <h2 class="text-center text-3xl font-extrabold text-white mb-2">
                            UIL Scuola Roma e Lazio
                        </h2>
                        <p class="text-center text-lg text-gray-100 mb-2">
                            Sistema Gestione Iscritti
                        </p>
                        <p class="text-center text-sm text-gray-200 opacity-90">
                            Accedi con le tue credenziali per continuare
                        </p>
                    </div>
                    <form id="loginForm" class="mt-8 space-y-6">
                        <div class="space-y-4">
                            <div>
                                <label for="username" class="sr-only">Username</label>
                                <div class="relative">
                                    <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <i class="fas fa-user text-gray-400"></i>
                                    </div>
                                    <input id="username" name="username" type="text" required 
                                           class="block w-full pl-10 pr-3 py-3 border border-transparent placeholder-gray-400 text-gray-900 rounded-xl bg-white bg-opacity-90 backdrop-blur focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent focus:bg-opacity-100 transition-all duration-200 shadow-lg" 
                                           placeholder="Nome utente">
                                </div>
                            </div>
                            <div>
                                <label for="password" class="sr-only">Password</label>
                                <div class="relative">
                                    <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <i class="fas fa-lock text-gray-400"></i>
                                    </div>
                                    <input id="password" name="password" type="password" required 
                                           class="block w-full pl-10 pr-3 py-3 border border-transparent placeholder-gray-400 text-gray-900 rounded-xl bg-white bg-opacity-90 backdrop-blur focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent focus:bg-opacity-100 transition-all duration-200 shadow-lg" 
                                           placeholder="Password">
                                </div>
                            </div>
                        </div>
                        <div>
                            <button type="submit" class="group relative w-full flex justify-center py-3 px-4 text-sm font-semibold rounded-xl text-white bg-white bg-opacity-20 hover:bg-opacity-30 focus:outline-none focus:ring-2 focus:ring-white focus:ring-opacity-50 backdrop-blur border border-white border-opacity-20 transition-all duration-200 shadow-xl hover:shadow-2xl">
                                <span class="absolute left-0 inset-y-0 flex items-center pl-3">
                                    <i class="fas fa-sign-in-alt text-white group-hover:text-gray-100"></i>
                                </span>
                                Accedi al Sistema
                            </button>
                        </div>
                        <div id="loginError" class="hidden bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg text-sm text-center"></div>
                    </form>
                </div>
            </div>

            <!-- Dashboard Container (initially hidden) -->
            <div id="dashboardContainer" class="hidden">
                <nav class="bg-white shadow-sm">
                    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div class="flex justify-between h-16">
                            <div class="flex items-center">
                                <img src="/static/uilscuola-logo.png" alt="UIL Scuola" class="h-10 w-auto mr-3">
                                <h1 class="text-xl font-semibold text-gray-900">
                                    UIL Scuola Roma e Lazio
                                </h1>
                            </div>
                            <div class="flex items-center space-x-4">
                                <span id="userInfo" class="text-sm text-gray-700"></span>
                                <button id="logoutBtn" class="text-sm bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded">
                                    <i class="fas fa-sign-out-alt mr-1"></i>Esci
                                </button>
                            </div>
                        </div>
                    </div>
                </nav>

                <div class="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
                    <!-- Navigation Tabs -->
                    <div class="border-b border-gray-200 mb-6">
                        <nav class="-mb-px flex space-x-8">
                            <button class="nav-tab active border-b-2 border-indigo-500 py-2 px-1 text-sm font-medium text-indigo-600" data-tab="dashboard">
                                <i class="fas fa-chart-line mr-1"></i>Dashboard
                            </button>
                            <button class="nav-tab border-b-2 border-transparent py-2 px-1 text-sm font-medium text-gray-500 hover:text-gray-700 hover:border-gray-300" data-tab="anagrafica">
                                <i class="fas fa-users mr-1"></i>Anagrafica
                            </button>
                            <button class="nav-tab border-b-2 border-transparent py-2 px-1 text-sm font-medium text-gray-500 hover:text-gray-700 hover:border-gray-300" data-tab="ricerca">
                                <i class="fas fa-search mr-1"></i>Ricerca
                            </button>
                            <button class="nav-tab border-b-2 border-transparent py-2 px-1 text-sm font-medium text-gray-500 hover:text-gray-700 hover:border-gray-300" data-tab="report">
                                <i class="fas fa-chart-bar mr-1"></i>Report
                            </button>
                        </nav>
                    </div>

                    <!-- Tab Contents -->
                    <div class="space-y-6">
                        <!-- Dashboard Tab -->
                        <div id="dashboardTab" class="tab-content">
                            <div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                                <!-- Card Totale Iscritti -->
                                <div class="bg-gradient-to-br from-indigo-50 to-indigo-100 overflow-hidden shadow-lg rounded-xl border border-indigo-200 hover:shadow-xl transition-all duration-300">
                                    <div class="p-6">
                                        <div class="flex items-center">
                                            <div class="flex-shrink-0">
                                                <div class="w-12 h-12 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                                                    <i class="fas fa-users text-white text-xl"></i>
                                                </div>
                                            </div>
                                            <div class="ml-4 flex-1">
                                                <dt class="text-sm font-medium text-indigo-700 truncate">Totale Iscritti</dt>
                                                <dd id="totalIscritti" class="text-2xl font-bold text-indigo-900 mt-1">-</dd>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                
                                <!-- Card Docenti -->
                                <div class="bg-gradient-to-br from-green-50 to-green-100 overflow-hidden shadow-lg rounded-xl border border-green-200 hover:shadow-xl transition-all duration-300">
                                    <div class="p-6">
                                        <div class="flex items-center">
                                            <div class="flex-shrink-0">
                                                <div class="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center shadow-lg">
                                                    <i class="fas fa-chalkboard-teacher text-white text-xl"></i>
                                                </div>
                                            </div>
                                            <div class="ml-4 flex-1">
                                                <dt class="text-sm font-medium text-green-700 truncate">Docenti</dt>
                                                <dd id="totalDocenti" class="text-2xl font-bold text-green-900 mt-1">-</dd>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                
                                <!-- Card ATA -->
                                <div class="bg-gradient-to-br from-blue-50 to-blue-100 overflow-hidden shadow-lg rounded-xl border border-blue-200 hover:shadow-xl transition-all duration-300">
                                    <div class="p-6">
                                        <div class="flex items-center">
                                            <div class="flex-shrink-0">
                                                <div class="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
                                                    <i class="fas fa-tools text-white text-xl"></i>
                                                </div>
                                            </div>
                                            <div class="ml-4 flex-1">
                                                <dt class="text-sm font-medium text-blue-700 truncate">ATA</dt>
                                                <dd id="totalATA" class="text-2xl font-bold text-blue-900 mt-1">-</dd>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                
                                <!-- Card Dirigenti -->
                                <div class="bg-gradient-to-br from-purple-50 to-purple-100 overflow-hidden shadow-lg rounded-xl border border-purple-200 hover:shadow-xl transition-all duration-300">
                                    <div class="p-6">
                                        <div class="flex items-center">
                                            <div class="flex-shrink-0">
                                                <div class="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                                                    <i class="fas fa-user-tie text-white text-xl"></i>
                                                </div>
                                            </div>
                                            <div class="ml-4 flex-1">
                                                <dt class="text-sm font-medium text-purple-700 truncate">Dirigenti</dt>
                                                <dd id="totalDirigenti" class="text-2xl font-bold text-purple-900 mt-1">-</dd>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            
                            <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                <!-- Grafico Distribuzione Ruoli -->
                                <div class="bg-white p-6 rounded-2xl shadow-lg border border-gray-100 hover:shadow-xl transition-shadow duration-300">
                                    <div class="flex items-center mb-6">
                                        <div class="w-8 h-8 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center mr-3">
                                            <i class="fas fa-chart-pie text-white text-sm"></i>
                                        </div>
                                        <h3 class="text-lg font-semibold text-gray-900">Distribuzione per Ruolo</h3>
                                    </div>
                                    <div class="h-64 flex items-center justify-center">
                                        <canvas id="ruoloChart" width="400" height="250"></canvas>
                                    </div>
                                </div>
                                
                                <!-- Ultimi Iscritti -->
                                <div class="bg-white p-6 rounded-2xl shadow-lg border border-gray-100 hover:shadow-xl transition-shadow duration-300">
                                    <div class="flex items-center mb-6">
                                        <div class="w-8 h-8 bg-gradient-to-r from-green-500 to-blue-500 rounded-lg flex items-center justify-center mr-3">
                                            <i class="fas fa-user-clock text-white text-sm"></i>
                                        </div>
                                        <h3 class="text-lg font-semibold text-gray-900">Ultimi Iscritti</h3>
                                    </div>
                                    <div id="ultimiIscritti" class="space-y-3 max-h-64 overflow-y-auto"></div>
                                </div>
                            </div>
                        </div>

                        <!-- Anagrafica Tab -->
                        <div id="anagraficaTab" class="tab-content hidden">
                            <div class="bg-white shadow-lg rounded-2xl border border-gray-100">
                                <div class="px-6 py-6">
                                    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 space-y-4 sm:space-y-0">
                                        <div class="flex items-center">
                                            <div class="w-10 h-10 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center mr-4">
                                                <i class="fas fa-users text-white"></i>
                                            </div>
                                            <div>
                                                <h3 class="text-xl font-semibold text-gray-900">Gestione Iscritti</h3>
                                                <p class="text-sm text-gray-600 mt-1">Visualizza e gestisci tutti gli iscritti al sindacato</p>
                                            </div>
                                        </div>
                                        <button id="addIscrittoBtn" class="inline-flex items-center px-6 py-3 text-sm font-medium text-white bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-300 shadow-lg hover:shadow-xl">
                                            <i class="fas fa-plus mr-2"></i>Aggiungi Iscritto
                                        </button>
                                    </div>
                                    <div id="iscrittiTable" class="overflow-hidden rounded-xl border border-gray-200"></div>
                                    <div id="pagination" class="mt-6 flex justify-center"></div>
                                </div>
                            </div>
                        </div>

                        <!-- Ricerca Tab -->
                        <div id="ricercaTab" class="tab-content hidden">
                            <div class="bg-white shadow-lg rounded-2xl border border-gray-100">
                                <div class="px-6 py-6">
                                    <div class="flex items-center mb-6">
                                        <div class="w-10 h-10 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center mr-4">
                                            <i class="fas fa-search text-white"></i>
                                        </div>
                                        <div>
                                            <h3 class="text-xl font-semibold text-gray-900">Ricerca Avanzata</h3>
                                            <p class="text-sm text-gray-600 mt-1">Utilizza i filtri per trovare iscritti specifici</p>
                                        </div>
                                    </div>
                                    
                                    <!-- Form di Ricerca -->
                                    <div class="bg-gray-50 rounded-xl p-6 mb-6">
                                        <form id="searchForm" class="grid grid-cols-1 md:grid-cols-3 gap-4">
                                            <div class="space-y-2">
                                                <label class="text-sm font-medium text-gray-700">Cognome</label>
                                                <input type="text" name="cognome" placeholder="Inserisci cognome" class="w-full border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors">
                                            </div>
                                            <div class="space-y-2">
                                                <label class="text-sm font-medium text-gray-700">Nome</label>
                                                <input type="text" name="nome" placeholder="Inserisci nome" class="w-full border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors">
                                            </div>
                                            <div class="space-y-2">
                                                <label class="text-sm font-medium text-gray-700">Ruolo</label>
                                                <select name="ruolo" class="w-full border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors">
                                                    <option value="">Tutti i ruoli</option>
                                                    <option value="Docente">Docente</option>
                                                    <option value="Ata">ATA</option>
                                                    <option value="Dirigente">Dirigente</option>
                                                </select>
                                            </div>
                                            <div class="space-y-2">
                                                <label class="text-sm font-medium text-gray-700">Istituto</label>
                                                <input type="text" name="istituto" placeholder="Inserisci istituto" class="w-full border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors">
                                            </div>
                                            <div class="space-y-2">
                                                <label class="text-sm font-medium text-gray-700">Località</label>
                                                <input type="text" name="localita" placeholder="Inserisci località" class="w-full border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors">
                                            </div>
                                            <div class="flex items-end space-x-3">
                                                <button id="searchBtn" type="button" class="flex-1 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 shadow-lg hover:shadow-xl">
                                                    <i class="fas fa-search mr-2"></i>Cerca
                                                </button>
                                                <button id="resetSearchBtn" type="button" class="px-4 py-2.5 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg text-sm font-medium transition-colors duration-200">
                                                    <i class="fas fa-undo mr-2"></i>Reset
                                                </button>
                                            </div>
                                        </form>
                                    </div>
                                    
                                    <!-- Risultati Ricerca -->
                                    <div id="searchResults"></div>
                                </div>
                            </div>
                        </div>

                        <!-- Report Tab -->
                        <div id="reportTab" class="tab-content hidden">
                            <div class="bg-white p-6 rounded-lg shadow">
                                <h3 class="text-lg font-medium mb-4">Report e Statistiche</h3>
                                <p class="text-gray-600">Sezione in sviluppo...</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Modal per Iscritto - Design Moderno -->
            <div id="iscrittoModal" class="fixed inset-0 z-50 overflow-hidden hidden" aria-labelledby="modal-title" role="dialog" aria-modal="true">
                <!-- Backdrop -->
                <div class="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm transition-opacity"></div>
                
                <!-- Modal Container -->
                <div class="fixed inset-0 z-50 overflow-y-auto">
                    <div class="flex min-h-full items-center justify-center p-4">
                        <!-- Modal Panel -->
                        <div class="relative w-full max-w-4xl max-h-[90vh] bg-white rounded-2xl shadow-2xl transform transition-all">
                            <!-- Header -->
                            <div class="sticky top-0 z-10 bg-white rounded-t-2xl border-b border-gray-100 px-6 py-4">
                                <div class="flex items-center justify-between">
                                    <div class="flex items-center space-x-3">
                                        <div class="flex-shrink-0 w-8 h-8 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center">
                                            <i class="fas fa-user-plus text-white text-sm"></i>
                                        </div>
                                        <h3 id="modalTitle" class="text-xl font-semibold text-gray-900">Aggiungi Iscritto</h3>
                                    </div>
                                    <button id="closeModal" class="flex-shrink-0 w-8 h-8 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors">
                                        <i class="fas fa-times"></i>
                                    </button>
                                </div>
                            </div>
                            
                            <!-- Content with Scroll -->
                            <div class="overflow-y-auto max-h-[calc(90vh-140px)] bg-white">
                                <div class="px-6 py-4">
                                    <form id="iscrittoForm">
                                        <!-- Form fields will be populated by JavaScript -->
                                    </form>
                                </div>
                            </div>
                            
                            <!-- Footer -->
                            <div class="sticky bottom-0 z-10 bg-white rounded-b-2xl border-t border-gray-100 px-6 py-4">
                                <div class="flex justify-end space-x-3">
                                    <button id="cancelIscrittoBtn" type="button" class="px-6 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-gray-300">
                                        <i class="fas fa-times mr-2"></i>Annulla
                                    </button>
                                    <button id="saveIscrittoBtn" type="button" class="px-6 py-2.5 text-sm font-medium text-white bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-300 shadow-lg hover:shadow-xl">
                                        <i class="fas fa-save mr-2"></i>Salva
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        <script src="/static/app.js"></script>
    </body>
    </html>
  `)
})

export default app