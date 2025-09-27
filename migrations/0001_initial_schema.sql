-- Tabella utenti per autenticazione
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT UNIQUE NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'user', -- 'admin', 'moderator', 'user'
  is_active BOOLEAN DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  last_login DATETIME
);

-- Tabella anagrafica iscritti
CREATE TABLE IF NOT EXISTS iscritti (
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
  importoritenuta REAL,
  meserata TEXT,
  annorata TEXT,
  uff_servizio TEXT,
  descrizione TEXT,
  cod_mecc TEXT,
  indirizzo TEXT,
  cap TEXT,
  localita TEXT,
  qual_liv TEXT,
  tiporit TEXT,
  telefono TEXT,
  email_personale TEXT,
  trasferimento TEXT,
  pensione TEXT,
  contratto TEXT,
  scadenzacontratto TEXT,
  annoiscrizione TEXT,
  rsu_tas TEXT,
  riferimento TEXT,
  data_iscrizione DATETIME DEFAULT CURRENT_TIMESTAMP,
  data_ultima_modifica DATETIME DEFAULT CURRENT_TIMESTAMP,
  iscritto_da_user_id INTEGER,
  modificato_da_user_id INTEGER,
  FOREIGN KEY (iscritto_da_user_id) REFERENCES users(id),
  FOREIGN KEY (modificato_da_user_id) REFERENCES users(id)
);

-- Tabella log modifiche
CREATE TABLE IF NOT EXISTS log_modifiche (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  iscritto_id INTEGER NOT NULL,
  campo_modificato TEXT NOT NULL,
  valore_precedente TEXT,
  valore_nuovo TEXT,
  data_modifica DATETIME DEFAULT CURRENT_TIMESTAMP,
  utente_id INTEGER,
  FOREIGN KEY (iscritto_id) REFERENCES iscritti(id),
  FOREIGN KEY (utente_id) REFERENCES users(id)
);

-- Indici per ottimizzare le ricerche
CREATE INDEX IF NOT EXISTS idx_iscritti_cognome_nome ON iscritti(cognome, nome);
CREATE INDEX IF NOT EXISTS idx_iscritti_istituto ON iscritti(istituto);
CREATE INDEX IF NOT EXISTS idx_iscritti_ruolo ON iscritti(ruolo);
CREATE INDEX IF NOT EXISTS idx_iscritti_prov ON iscritti(prov);
CREATE INDEX IF NOT EXISTS idx_iscritti_annoiscrizione ON iscritti(annoiscrizione);
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);