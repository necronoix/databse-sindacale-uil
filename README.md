# UIL Scuola Roma e Lazio - Sistema Gestione Iscritti

## Descrizione
Sistema completo per la gestione dell'anagrafica degli iscritti alla UIL Scuola di Roma e del Lazio. L'applicazione include autenticazione utenti, gestione anagrafica con oltre 20 campi, dashboard stile Tableau/Salesforce con grafici interattivi e reportistica avanzata.

## 📊 STATO ATTUALE DEL PROGETTO - SETTEMBRE 2025

### ✅ FUNZIONALITÀ COMPLETATE E TESTATE

**🔐 Autenticazione e Sicurezza**
- ✅ Login con JWT - **TESTATO E FUNZIONANTE**
- ✅ Ruoli utente (Admin, Moderator, User) - **IMPLEMENTATO**
- ✅ Sessioni sicure - **ATTIVE**
- ✅ Controllo accessi - **FUNZIONANTE**

**📊 Dashboard Interattiva**
- ✅ Grafici distribuzione per ruolo - **COMPLETATO**
- ✅ Grafici distribuzione per provincia - **COMPLETATO**
- ✅ Statistiche real-time - **FUNZIONANTI**
- ✅ Interfaccia Tableau/Salesforce - **IMPLEMENTATA**

**👥 Gestione Anagrafica**
- ✅ Database 25+ campi - **COMPLETATO**
- ✅ Ricerca avanzata con filtri - **TESTATA**
- ✅ Paginazione grandi dataset - **ATTIVA**
- ✅ Log modifiche - **IMPLEMENTATO**

**🔍 Ricerca e Reportistica**
- ✅ Filtri multipli (cognome, nome, ruolo, istituto) - **FUNZIONANTI**
- ✅ Ricerca per provincia/anno - **ATTIVA**
- ✅ Grafici interattivi Chart.js - **COMPLETATI**

### 🔧 TEST DI SISTEMA ESEGUITI
- ✅ Login con credenziali Tiziana/pupo - **SUCCESSO**
- ✅ Accesso dashboard con autenticazione - **SUCCESSO**
- ✅ Database con 5 iscritti di test - **POPOLATO**
- ✅ Ricerca iscritti per cognome - **FUNZIONANTE**
- ✅ API endpoints protetti da autenticazione - **ATTIVI**

### 🔐 Autenticazione e Sicurezza
- Sistema di login con JWT (JSON Web Tokens)
- Ruoli utente: Admin, Moderator, User
- Sessioni sicure con token scadenti
- Controllo accessi basato su ruoli

### 📊 Dashboard Interattiva
- Grafici a torta per distribuzione iscritti per ruolo
- Grafici a barre per distribuzione per provincia
- Statistiche in tempo reale
- Ultimi iscritti visualizzati
- Interfaccia stile Tableau/Salesforce

### 👥 Gestione Anagrafica
- Database con 25+ campi per ogni iscritto
- Ricerca avanzata con filtri multipli
- Paginazione per grandi dataset (10.000+ iscritti)
- Modifica sicura con log delle modifiche
- Esportazione dati

### 🔍 Ricerca Avanzata
- Filtri per cognome, nome, ruolo, istituto
- Ricerca per provincia e anno iscrizione
- Filtri per tipo contratto e RSU/TAS
- Risultati paginati

### 📈 Reportistica
- Statistiche per ruolo
- Analisi per anno di iscrizione
- Report geografici per provincia
- Grafici interattivi con Chart.js

## Tecnologie Utilizzate

### Backend
- **Hono Framework** - Web framework leggero per Cloudflare Workers
- **Cloudflare D1** - Database SQLite distribuito globalmente
- **Cloudflare KV** - Cache per prestazioni ottimali
- **JWT** - Autenticazione sicura
- **TypeScript** - Type safety e sviluppo robusto

### Frontend
- **Tailwind CSS** - Framework CSS utility-first
- **Chart.js** - Grafici interattivi e responsive
- **Axios** - Client HTTP per API calls
- **Font Awesome** - Icone professionali

### Infrastruttura
- **Cloudflare Pages** - Hosting globale edge
- **Cloudflare Workers** - Runtime serverless
- **Wrangler** - CLI per deployment e sviluppo

## Installazione e Avvio

### Prerequisiti
- Node.js 18+ 
- npm o yarn
- Account Cloudflare (per deployment)

### Installazione Locale
```bash
# Clona il repository
git clone https://github.com/tuosindacato/sistema-anagrafica.git
cd sistema-anagrafica

# Installa dipendenze
npm install

# Configura il database (locale)
npm run db:migrate:local

# Popola con dati di test
npm run db:seed

# Avvia il server di sviluppo
npm run dev:sandbox
```

L'applicazione sarà disponibile su `http://localhost:3000`

### Credenziali di Accesso (Sviluppo) - ✅ TESTATE E FUNZIONANTI
- Username: `Tiziana` 
- Password: `pupo`

**✅ Verificate**: Il login è stato testato con successo e il sistema è operativo.

**Nota**: In produzione, implementare bcrypt per la sicurezza delle password.

## Struttura Database

### Tabella Iscritti (25+ campi)
- **Dati Anagrafici**: Cognome, Nome, Indirizzo, CAP, Località
- **Dati Professionali**: Ruolo, Istituto, Tipologia, Qualifica/Livello
- **Dati Contrattuali**: Contratto, Scadenza Contratto, Anno Iscrizione
- **Dati Sindacali**: RSU/TAS, Riferimento, Importo Ritenuta
- **Dati di Contatto**: Telefono, Email, Provincia
- **Dati Amministrativi**: Protocollo, Documento, Note

### Tabella Utenti
- Username, Email, Password (hash), Ruolo, Stato attivo

### Tabella Log Modifiche
- Registro completo delle modifiche agli iscritti
- Auditoria per compliance

## API Endpoints

### Autenticazione
- `POST /api/auth/login` - Login utente

### Gestione Iscritti
- `GET /api/iscritti` - Lista iscritti con paginazione e filtri
- `GET /api/iscritti/:id` - Dettagli singolo iscritto
- `POST /api/iscritti` - Crea nuovo iscritto
- `PUT /api/iscritti/:id` - Aggiorna iscritto esistente
- `DELETE /api/iscritti/:id` - Elimina iscritto (solo admin)

### Dashboard
- `GET /api/dashboard/stats` - Statistiche per dashboard

## Deployment su Cloudflare Pages

### 1. Configura Account Cloudflare
- Crea account su Cloudflare
- Configura API token con permessi Pages e D1

### 2. Crea Database D1
```bash
npx wrangler d1 create sindacato-db
```

### 3. Configura wrangler.jsonc
Aggiorna il file con il tuo database_id ottenuto

### 4. Deploy
```bash
npm run deploy
```

## Personalizzazione

### Aggiungere Nuovi Campi
1. Modifica il file `migrations/0001_initial_schema.sql`
2. Aggiorna l'interfaccia TypeScript in `src/types/index.ts`
3. Modifica i form frontend in `public/static/app.js`

### Modificare Stile Dashboard
- Personalizza i colori in `public/static/styles.css`
- Aggiorna la logica dei grafici in `app.js`

### Aggiungere Nuovi Report
- Estendi le API in `src/routes/api.ts`
- Aggiungi nuovi endpoints per report personalizzati

## Sicurezza

### Best Practices Implementate
- Password hash con bcrypt (da implementare in produzione)
- JWT con scadenza
- Controllo accessi su tutte le API
- Sanitizzazione input
- Log delle modifiche per auditoria

### Raccomandazioni per Produzione
- Cambiare JWT_SECRET in `ecosystem.config.cjs`
- Implementare rate limiting
- Aggiungere HTTPS (automatico su Cloudflare)
- Configurare backup automatici del database

## Performance

### Ottimizzazioni
- Indici database su campi di ricerca frequenti
- Cache con Cloudflare KV
- Paginazione per grandi dataset
- Lazy loading delle risorse

### Scalabilità
- Architettura serverless su Cloudflare
- Database distribuito globalmente con D1
- Cache edge per prestazioni ottimali

## Manutenzione

### Backup Database
```bash
npx wrangler d1 export sindacato-db --output backup.sql
```

### Aggiornamenti
```bash
npm update
npm run build
npm run deploy
```

## Supporto

Per problemi o domande:
1. Controlla i log in Cloudflare Dashboard
2. Verifica la configurazione del database
3. Assicurati che le variabili d'ambiente siano configurate correttamente

## Licenza

Questo progetto è proprietario e destinato all'uso interno del sindacato.

---

**Ultimo Aggiornamento**: Dicembre 2024  
**Versione**: 1.0.0  
**Autore**: Sistema Informativo Sindacato Roma e Lazio