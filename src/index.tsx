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
        <title>Sindacato Roma e Lazio - Gestione Iscritti</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
        <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
        <script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
        <link href="/static/styles.css" rel="stylesheet">
    </head>
    <body class="bg-gray-50">
        <div id="app">
            <!-- Login Container -->
            <div id="loginContainer" class="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
                <div class="max-w-md w-full space-y-8">
                    <div>
                        <h2 class="mt-6 text-center text-3xl font-extrabold text-gray-900">
                            <i class="fas fa-users mr-3"></i>Sindacato Roma e Lazio
                        </h2>
                        <p class="mt-2 text-center text-sm text-gray-600">
                            Accedi alla gestione iscritti
                        </p>
                    </div>
                    <form id="loginForm" class="mt-8 space-y-6">
                        <div class="rounded-md shadow-sm -space-y-px">
                            <div>
                                <input id="username" name="username" type="text" required 
                                       class="relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm" 
                                       placeholder="Username">
                            </div>
                            <div>
                                <input id="password" name="password" type="password" required 
                                       class="relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm" 
                                       placeholder="Password">
                            </div>
                        </div>
                        <div>
                            <button type="submit" class="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                                Accedi
                            </button>
                        </div>
                        <div id="loginError" class="hidden text-red-600 text-sm text-center"></div>
                    </form>
                </div>
            </div>

            <!-- Dashboard Container (initially hidden) -->
            <div id="dashboardContainer" class="hidden">
                <nav class="bg-white shadow-sm">
                    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div class="flex justify-between h-16">
                            <div class="flex items-center">
                                <h1 class="text-xl font-semibold text-gray-900">
                                    <i class="fas fa-users mr-2"></i>
                                    Sindacato Roma e Lazio
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
                            <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                                <div class="bg-white overflow-hidden shadow rounded-lg">
                                    <div class="p-5">
                                        <div class="flex items-center">
                                            <div class="flex-shrink-0">
                                                <i class="fas fa-users text-indigo-600 text-2xl"></i>
                                            </div>
                                            <div class="ml-5 w-0 flex-1">
                                                <dl>
                                                    <dt class="text-sm font-medium text-gray-500 truncate">Totale Iscritti</dt>
                                                    <dd id="totalIscritti" class="text-lg font-medium text-gray-900">-</dd>
                                                </dl>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div class="bg-white overflow-hidden shadow rounded-lg">
                                    <div class="p-5">
                                        <div class="flex items-center">
                                            <div class="flex-shrink-0">
                                                <i class="fas fa-chalkboard-teacher text-green-600 text-2xl"></i>
                                            </div>
                                            <div class="ml-5 w-0 flex-1">
                                                <dl>
                                                    <dt class="text-sm font-medium text-gray-500 truncate">Docenti</dt>
                                                    <dd id="totalDocenti" class="text-lg font-medium text-gray-900">-</dd>
                                                </dl>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div class="bg-white overflow-hidden shadow rounded-lg">
                                    <div class="p-5">
                                        <div class="flex items-center">
                                            <div class="flex-shrink-0">
                                                <i class="fas fa-tools text-blue-600 text-2xl"></i>
                                            </div>
                                            <div class="ml-5 w-0 flex-1">
                                                <dl>
                                                    <dt class="text-sm font-medium text-gray-500 truncate">ATA</dt>
                                                    <dd id="totalATA" class="text-lg font-medium text-gray-900">-</dd>
                                                </dl>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div class="bg-white overflow-hidden shadow rounded-lg">
                                    <div class="p-5">
                                        <div class="flex items-center">
                                            <div class="flex-shrink-0">
                                                <i class="fas fa-user-tie text-purple-600 text-2xl"></i>
                                            </div>
                                            <div class="ml-5 w-0 flex-1">
                                                <dl>
                                                    <dt class="text-sm font-medium text-gray-500 truncate">Dirigenti</dt>
                                                    <dd id="totalDirigenti" class="text-lg font-medium text-gray-900">-</dd>
                                                </dl>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            
                            <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                <div class="bg-white p-6 rounded-lg shadow">
                                    <h3 class="text-lg font-medium mb-4">Distribuzione per Ruolo</h3>
                                    <canvas id="ruoloChart" width="400" height="200"></canvas>
                                </div>
                                <div class="bg-white p-6 rounded-lg shadow">
                                    <h3 class="text-lg font-medium mb-4">Ultimi Iscritti</h3>
                                    <div id="ultimiIscritti"></div>
                                </div>
                            </div>
                        </div>

                        <!-- Anagrafica Tab -->
                        <div id="anagraficaTab" class="tab-content hidden">
                            <div class="bg-white shadow rounded-lg">
                                <div class="px-4 py-5 sm:p-6">
                                    <div class="flex justify-between items-center mb-4">
                                        <h3 class="text-lg font-medium">Gestione Iscritti</h3>
                                        <button id="addIscrittoBtn" class="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md text-sm font-medium">
                                            <i class="fas fa-plus mr-1"></i>Aggiungi Iscritto
                                        </button>
                                    </div>
                                    <div id="iscrittiTable"></div>
                                    <div id="pagination" class="mt-4 flex justify-center"></div>
                                </div>
                            </div>
                        </div>

                        <!-- Ricerca Tab -->
                        <div id="ricercaTab" class="tab-content hidden">
                            <div class="bg-white shadow rounded-lg">
                                <div class="px-4 py-5 sm:p-6">
                                    <h3 class="text-lg font-medium mb-4">Ricerca Avanzata</h3>
                                    <form id="searchForm" class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                                        <input type="text" name="cognome" placeholder="Cognome" class="border rounded px-3 py-2">
                                        <input type="text" name="nome" placeholder="Nome" class="border rounded px-3 py-2">
                                        <select name="ruolo" class="border rounded px-3 py-2">
                                            <option value="">Tutti i ruoli</option>
                                            <option value="Docente">Docente</option>
                                            <option value="Ata">ATA</option>
                                            <option value="Dirigente">Dirigente</option>
                                        </select>
                                        <input type="text" name="istituto" placeholder="Istituto" class="border rounded px-3 py-2">
                                        <input type="text" name="localita" placeholder="Località" class="border rounded px-3 py-2">
                                        <div class="flex space-x-2">
                                            <button id="searchBtn" type="button" class="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded text-sm">
                                                <i class="fas fa-search mr-1"></i>Cerca
                                            </button>
                                            <button id="resetSearchBtn" type="button" class="bg-gray-300 hover:bg-gray-400 text-gray-700 px-4 py-2 rounded text-sm">
                                                <i class="fas fa-undo mr-1"></i>Reset
                                            </button>
                                        </div>
                                    </form>
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

            <!-- Modal per Iscritto -->
            <div id="iscrittoModal" class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full hidden">
                <div class="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
                    <div class="mt-3">
                        <div class="flex justify-between items-center mb-4">
                            <h3 id="modalTitle" class="text-lg font-medium">Aggiungi Iscritto</h3>
                            <button id="closeModal" class="text-gray-400 hover:text-gray-600">
                                <i class="fas fa-times"></i>
                            </button>
                        </div>
                        <form id="iscrittoForm" class="space-y-4">
                            <!-- Form fields will be populated by JavaScript -->
                        </form>
                        <div class="flex justify-end space-x-2 mt-6">
                            <button id="cancelIscrittoBtn" type="button" class="bg-gray-300 hover:bg-gray-400 text-gray-700 px-4 py-2 rounded">
                                Annulla
                            </button>
                            <button id="saveIscrittoBtn" type="button" class="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded">
                                Salva
                            </button>
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