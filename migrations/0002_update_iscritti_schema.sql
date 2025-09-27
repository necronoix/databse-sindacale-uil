-- Rimozione della tabella iscritti esistente e creazione con nuovi campi
DROP TABLE IF EXISTS iscritti;

-- Tabella anagrafica iscritti con i nuovi campi richiesti
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
  note TEXT,
  indirizzo TEXT,
  email TEXT,
  telefono TEXT,
  attuale TEXT,
  dpt TEXT,
  prov_iscrizione TEXT,
  anagrafica TEXT,
  importoritenuta REAL,
  meserata TEXT,
  annorata TEXT,
  uff_servizio TEXT,
  descrizione TEXT,
  cod_mecc TEXT,
  indirizzo_ufficio TEXT,
  cap TEXT,
  localita TEXT,
  qual_liv TEXT,
  tiporit TEXT,
  tipo_di_contratto TEXT,
  scadenza_contratto TEXT,
  rsu_tas TEXT,
  riferimento TEXT,
  data_iscrizione DATETIME DEFAULT CURRENT_TIMESTAMP,
  data_ultima_modifica DATETIME DEFAULT CURRENT_TIMESTAMP,
  iscritto_da_user_id INTEGER,
  modificato_da_user_id INTEGER,
  FOREIGN KEY (iscritto_da_user_id) REFERENCES users(id),
  FOREIGN KEY (modificato_da_user_id) REFERENCES users(id)
);

-- Indici per ottimizzare le ricerche sui nuovi campi
CREATE INDEX IF NOT EXISTS idx_iscritti_cognome_nome ON iscritti(cognome, nome);
CREATE INDEX IF NOT EXISTS idx_iscritti_istituto ON iscritti(istituto);
CREATE INDEX IF NOT EXISTS idx_iscritti_ruolo ON iscritti(ruolo);
CREATE INDEX IF NOT EXISTS idx_iscritti_prov_iscrizione ON iscritti(prov_iscrizione);
CREATE INDEX IF NOT EXISTS idx_iscritti_annorata ON iscritti(annorata);
CREATE INDEX IF NOT EXISTS idx_iscritti_email ON iscritti(email);
CREATE INDEX IF NOT EXISTS idx_iscritti_tipo_di_contratto ON iscritti(tipo_di_contratto);