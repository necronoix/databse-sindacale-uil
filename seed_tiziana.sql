-- Inserimento utente amministratore di default
INSERT OR IGNORE INTO users (username, email, password_hash, role, is_active) VALUES 
('admin', 'admin@sindacato.it', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin', 1);

-- Inserimento nuovo utente Tiziana
INSERT OR IGNORE INTO users (username, email, password_hash, role, is_active) VALUES 
('Tiziana', 'tiziana@sindacato.it', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin', 1);

-- Inserimento dati di test
INSERT OR IGNORE INTO iscritti (
  cognome, nome, iscrizione, invio, prot, ruolo, istituto, tipologia, documento,
  note_attuale, dpt, prov, importoritenuta, meserata, annorata, uff_servizio,
  descrizione, cod_mecc, indirizzo, cap, localita, qual_liv, tiporit, telefono,
  email_personale, trasferimento, pensione, contratto, scadenzacontratto,
  annoiscrizione, rsu_tas, riferimento, iscritto_da_user_id
) VALUES 
('Rossi', 'Mario', '2024-01-15', 'EMAIL', '12345', 'DOCENTE', 'ISTITUTO COMPRENSIVO ROMA NORD', 'PERSONALE DOCENTE', 'CARTA_IDENTITA', 'Iscritto dal 2020', 'ROMA', 'RM', 150.00, '12', '2024', 'UFFICIO PERSONALE', 'Docente scuola primaria', 'RMIC12', 'Via Roma 123', '00100', 'ROMA', 'DOCENTE - LIVELLO 8', 'QUOTA_ASSOCIATIVA', '06 1234567', 'mario.rossi@email.it', 'NO', 'NO', 'TEMPO INDETERMINATO', '2025-12-31', '2024', 'RSU', 'SEDE CENTRALE', 1),
('Bianchi', 'Anna', '2024-02-20', 'PEC', '12346', 'ATA', 'ISTITUTO TECNICO ROMA EST', 'PERSONALE ATA', 'PASSAPORTO', 'Nuova iscrizione', 'ROMA', 'RM', 120.00, '06', '2024', 'UFFICIO PERSONALE', 'Assistente amministrativo', 'RMIT34', 'Via Milano 45', '00144', 'ROMA', 'ATA - LIVELLO 5', 'QUOTA_ASSOCIATIVA', '06 2345678', 'anna.bianchi@pec.it', 'NO', 'NO', 'TEMPO DETERMINATO', '2025-06-30', '2024', 'TAS', 'SEDE PERIFERICA', 1),
('Verdi', 'Luca', '2023-11-10', 'EMAIL', '12347', 'DOCENTE', 'LICEO CLASSICO ROMA CENTRO', 'PERSONALE DOCENTE', 'CARTA_IDENTITA', 'Iscritto dal 2018', 'ROMA', 'RM', 150.00, '11', '2023', 'UFFICIO PERSONALE', 'Docente liceo classico', 'RMLC56', 'Via Napoli 78', '00185', 'ROMA', 'DOCENTE - LIVELLO 9', 'QUOTA_ASSOCIATIVA', '06 3456789', 'luca.verdi@email.it', 'NO', 'NO', 'TEMPO INDETERMINATO', '2025-12-31', '2023', 'RSU', 'SEDE CENTRALE', 1),
('Ferrari', 'Maria', '2024-03-05', 'EMAIL', '12348', 'DOCENTE', 'SCUOLA SECONDARIA ROMA SUD', 'PERSONALE DOCENTE', 'CARTA_IDENTITA', 'Iscritta dal 2021', 'ROMA', 'RM', 150.00, '03', '2024', 'UFFICIO PERSONALE', 'Docente scuola secondaria', 'RMSS78', 'Via Firenze 32', '00146', 'ROMA', 'DOCENTE - LIVELLO 8', 'QUOTA_ASSOCIATIVA', '06 4567890', 'maria.ferrari@email.it', 'NO', 'NO', 'TEMPO INDETERMINATO', '2025-12-31', '2024', 'RSU', 'SEDE PERIFERICA', 1),
('Romano', 'Giuseppe', '2024-01-30', 'PEC', '12349', 'ATA', 'ISTITUTO PROFESSIONALE ROMA OVEST', 'PERSONALE ATA', 'CARTA_IDENTITA', 'Nuovo iscritto', 'ROMA', 'RM', 120.00, '01', '2024', 'UFFICIO PERSONALE', 'Tecnico di laboratorio', 'RMIP90', 'Via Bologna 67', '00153', 'ROMA', 'ATA - LIVELLO 6', 'QUOTA_ASSOCIATIVA', '06 5678901', 'giuseppe.romano@pec.it', 'NO', 'NO', 'TEMPO DETERMINATO', '2025-07-31', '2024', 'TAS', 'SEDE PERIFERICA', 1);