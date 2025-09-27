# Sindacato Roma e Lazio - Gestione Anagrafica Iscritti

## Descrizione del Progetto

Sistema completo di gestione anagrafica per gli iscritti alla sezione Roma e Lazio di un sindacato con supporto per 10.000+ iscritti. Il sistema include autenticazione utenti, dashboard analitica stile Tableau/Salesforce, gestione completa delle anagrafiche con funzionalità di ricerca avanzata e reportistica.

## Tecnologie Utilizzate

- **Backend**: Hono framework su Cloudflare Workers
- **Database**: Cloudflare D1 (SQLite)
- **Frontend**: Vanilla JavaScript con TailwindCSS
- **Charts**: Chart.js per visualizzazioni interattive
- **Deploy**: Cloudflare Pages

## Funzionalità Principali

### 🔐 Autenticazione e Sicurezza
- Sistema di login con JWT token
- Ruoli utente: admin, moderator, user
- Password hashing con bcrypt
- Sessioni sicure con scadenza

### 📊 Dashboard Analytics
- KPI principali con indicatori visivi
- Grafici interattivi per distribuzione geografica
- Andamento temporale degli iscritti
- Report personalizzati con filtri avanzati

### 👥 Gestione Anagrafica
- CRUD completo per gli iscritti
- Ricerca avanzata con filtri multipli
- Paginazione per grandi set di dati
- Storico modifiche con audit log

### 🗂️ Campi Anagrafici
Il sistema gestisce tutti i campi richiesti:
- **Dati Personali**: Cognome, Nome, Ruolo, Documento
- **Ubicazione**: Provincia, Istituto, Indirizzo, CAP, Località
- **Dettagli Contrattuali**: Qualifica/Livello, Tipo Ritenuta, Contratto, Scadenza Contratto
- **Contatti**: Telefono, Email
- **Vari**: Iscrizione, Invio, Prot, Note, Pensione, Trasferimento

## Installazione e Configurazione

### Prerequisiti
- Node.js 18+
- Account Cloudflare
- Wrangler CLI

### Installazione

1. **Installa le dipendenze**:
```bash
npm install
```

2. **Configura il database D1**:
```bash
# Crea il database in produzione
npx wrangler d1 create sindacato-roma-lazio-production

# Copia l'ID del database nel file wrangler.jsonc
```

3. **Applica le migrazioni**:
```bash
# Per sviluppo locale
npm run db:migrate:local

# Per produzione
npm run db:migrate:prod
```

4. **Avvia il server di sviluppo**:
```bash
npm run dev
```

### Deploy su Cloudflare Pages

1. **Build del progetto**:
```bash
npm run build
```

2. **Deploy**:
```bash
npm run deploy
```

## Utilizzo

### Accesso Iniziale
- Username: `admin`
- Password: `password` (cambia al primo accesso)

### Dashboard Principale
La dashboard mostra:
- Numero totale degli iscritti
- Nuovi iscritti negli ultimi 30 giorni
- Distribuzione per provincia e istituto
- Andamento mensile degli iscritti
- Attività recenti

### Ricerca Avanzata
È possibile filtrare gli iscritti per:
- Cognome, Nome
- Provincia, Istituto
- Ruolo, Email
- Combinazioni multiple

### Reportistica
Sistema di report personalizzati con:
- Filtri multipli
- Raggruppamenti per vari campi
- Metriche calcolate (conteggi, medie, somme)
- Esportazione dei dati

## Architettura del Database

### Tabelle Principali

#### users
- Gestione utenti e autenticazione
- Ruoli: admin, moderator, user

#### members
- Dati anagrafici completi degli iscritti
- Supporta tutti i campi richiesti
- Soft delete per tracciamento modifiche

#### audit_log
- Registro di tutte le modifiche
- Tracciamento utente e timestamp

## API Endpoints

### Autenticazione
- `POST /api/auth/login` - Login utente
- `POST /api/auth/register` - Registra nuovo utente
- `POST /api/auth/change-password` - Cambio password

### Anagrafica
- `GET /api/members` - Lista iscritti con paginazione
- `GET /api/members/:id` - Dettaglio singolo iscritto
- `POST /api/members` - Crea nuovo iscritto
- `PUT /api/members/:id` - Aggiorna iscritto
- `DELETE /api/members/:id` - Elimina iscritto (soft delete)

### Dashboard
- `GET /api/dashboard/data` - Dati per la dashboard
- `GET /api/dashboard/kpi` - KPI principali
- `POST /api/dashboard/report` - Report personalizzati

## Configurazione Sicurezza

### JWT Secret
Modifica la variabile `JWT_SECRET` in `ecosystem.config.cjs` con una chiave casuale e sicura.

### Ruoli Utente
- **admin**: Accesso completo a tutte le funzionalità
- **moderator**: Gestione anagrafica, report
- **user**: Solo visualizzazione

## Performance

### Ottimizzazioni
- Indici database su campi di ricerca frequenti
- Paginazione server-side per grandi dataset
- Cache locale per dati statici
- Lazy loading per grafici complessi

### Scalabilità
- Architettura serverless su Cloudflare
- Database distribuito globalmente
- Supporto per 10.000+ record
- Query ottimizzate per performance

## Manutenzione

### Backup
- Backup automatici del database D1
- Export dati in formati standard
- Restore da backup precedenti

### Aggiornamenti
- Migrazioni database versionate
- Rollback automatici in caso di errori
- Zero-downtime deployment

## Risoluzione Problemi

### Errori Comuni

1. **Database non trovato**:
   - Verifica che il database D1 sia creato
   - Controlla l'ID nel file wrangler.jsonc

2. **Autenticazione fallita**:
   - Verifica JWT_SECRET
   - Controlla scadenza token

3. **Performance lente**:
   - Verifica indici database
   - Ottimizza query complesse

### Supporto
Per problemi tecnici o domande:
- Controlla i log in Cloudflare
- Verifica la configurazione di wrangler
- Consulta la documentazione Cloudflare

## Sviluppi Futuri

### Funzionalità Pianificate
- [ ] Esportazione Excel/PDF
- [ ] Notifiche email automatiche
- [ ] Integrazione con sistemi esterni
- [ ] App mobile responsive
- [ ] Dashboard personalizzabili
- [ ] Sistema di backup automatico

### Miglioramenti
- [ ] Cache Redis per performance
- [ ] API rate limiting
- [ ] Log centralizzati
- [ ] Monitoraggio uptime
- [ ] Analytics avanzati

## Licenza

Progetto open source per uso interno del sindacato.

## Contatti

Per supporto tecnico o richieste di funzionalità:
- Email: support@sindacato-roma-lazio.it
- Repository: https://github.com/sindacato-roma-lazio/gestione-iscritti