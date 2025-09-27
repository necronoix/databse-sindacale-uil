-- Tabella utenti per autenticazione
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role TEXT CHECK(role IN ('admin', 'moderator', 'user')) DEFAULT 'user',
    is_active BOOLEAN DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    last_login DATETIME
);

-- Tabella anagrafica iscritti
CREATE TABLE IF NOT EXISTS members (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    cognome TEXT NOT NULL,
    nome TEXT NOT NULL,
    iscrizione TEXT,
    invio TEXT,
    prot TEXT,
    ruolo TEXT,
    istituto TEXT,
    tipologia TEXT,
    documento TEXT,
    note_attuale TEXT,
    dpt TEXT,
    prov TEXT,
    iscrizione_data DATE,
    anagrafica_data DATE,
    importoritenuta REAL,
    meserata TEXT,
    annorata INTEGER,
    uff_servizio TEXT,
    descrizione TEXT,
    cod_mecc TEXT,
    indirizzo TEXT,
    cap TEXT,
    localita TEXT,
    qual_liv TEXT,
    tiporit TEXT,
    telefono TEXT,
    email TEXT,
    traferimento TEXT,
    pensione TEXT,
    contratto TEXT,
    scadenzacontratto DATE,
    annoiscrizione INTEGER,
    rsu_tas TEXT,
    riferimento TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    created_by INTEGER,
    updated_by INTEGER,
    is_active BOOLEAN DEFAULT 1,
    FOREIGN KEY (created_by) REFERENCES users(id),
    FOREIGN KEY (updated_by) REFERENCES users(id)
);

-- Indici per ottimizzare le ricerche
CREATE INDEX IF NOT EXISTS idx_members_cognome ON members(cognome);
CREATE INDEX IF NOT EXISTS idx_members_nome ON members(nome);
CREATE INDEX IF NOT EXISTS idx_members_istituto ON members(istituto);
CREATE INDEX IF NOT EXISTS idx_members_prov ON members(prov);
CREATE INDEX IF NOT EXISTS idx_members_email ON members(email);
CREATE INDEX IF NOT EXISTS idx_members_is_active ON members(is_active);

-- Tabella log delle modifiche
CREATE TABLE IF NOT EXISTS audit_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    table_name TEXT NOT NULL,
    record_id INTEGER NOT NULL,
    action TEXT CHECK(action IN ('INSERT', 'UPDATE', 'DELETE')) NOT NULL,
    old_values TEXT,
    new_values TEXT,
    user_id INTEGER,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Inserisci utente admin di default
INSERT OR IGNORE INTO users (username, email, password_hash, role, is_active) VALUES 
('admin', 'admin@sindacato.it', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin', 1);