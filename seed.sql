-- Dati di esempio per test

-- Inserisci utenti di test
INSERT OR IGNORE INTO users (username, email, password_hash, role, is_active) VALUES 
('admin', 'admin@sindacato.it', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin', 1),
('moderator', 'mod@sindacato.it', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'moderator', 1),
('user', 'user@sindacato.it', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'user', 1);

-- Inserisci dati di esempio per i membri
INSERT OR IGNORE INTO members (
    cognome, nome, iscrizione, invio, prot, ruolo, istituto, tipologia, documento, 
    note_attuale, dpt, prov, iscrizione_data, anagrafica_data, importoritenuta, 
    meserata, annorata, uff_servizio, descrizione, cod_mecc, indirizzo, cap, 
    localita, qual_liv, tiporit, telefono, email, traferimento, pensione, 
    contratto, scadenzacontratto, annoiscrizione, rsu_tas, riferimento, 
    created_by, updated_by
) VALUES 
-- Roma
('Rossi', 'Mario', '2023-01', 'SI', '12345', 'Docente', 'Istituto Comprensivo Roma 1', 'Personale ATA', 'CD123456', 'Iscritto dal 2020', 'DPT1', 'RM', '2023-01-15', '2023-01-15', 150.50, '12', 2023, 'UFF1', 'Docente scuola primaria', 'RMIC123', 'Via Roma 1', '00100', 'Roma', 'Docente - I fascia', 'Mensile', '06 1234567', 'mario.rossi@email.it', NULL, 'NO', 'Tempo indeterminato', '2025-12-31', 2023, 'SI', 'Riferimento Roma 1', 1, 1),
('Bianchi', 'Anna', '2023-02', 'SI', '12346', 'Docente', 'Istituto Comprensivo Roma 2', 'Personale Docente', 'CD123457', 'Nuova iscrizione', 'DPT2', 'RM', '2023-02-20', '2023-02-20', 145.75, '12', 2023, 'UFF2', 'Docente scuola secondaria', 'RMIC124', 'Via Roma 2', '00100', 'Roma', 'Docente - II fascia', 'Mensile', '06 1234568', 'anna.bianchi@email.it', NULL, 'NO', 'Tempo indeterminato', '2025-12-31', 2023, 'NO', 'Riferimento Roma 2', 1, 1),
('Verdi', 'Luca', '2023-03', 'SI', '12347', 'ATA', 'Istituto Comprensivo Roma 3', 'Personale ATA', 'CD123458', 'Aggiornato 2024', 'DPT3', 'RM', '2023-03-10', '2023-03-10', 120.00, '12', 2023, 'UFF3', 'Assistente tecnico', 'RMIC125', 'Via Roma 3', '00100', 'Roma', 'ATA - III fascia', 'Mensile', '06 1234569', 'luca.verdi@email.it', NULL, 'NO', 'Tempo indeterminato', '2025-12-31', 2023, 'SI', 'Riferimento Roma 3', 1, 1),

-- Latina
('Neri', 'Giulia', '2023-04', 'SI', '12348', 'Docente', 'Istituto Comprensivo Latina 1', 'Personale Docente', 'CD123459', 'Iscritta dal 2021', 'DPT4', 'LT', '2023-04-05', '2023-04-05', 155.25, '12', 2023, 'UFF4', 'Docente scuola primaria', 'LTIC126', 'Via Latina 1', '04100', 'Latina', 'Docente - I fascia', 'Mensile', '0773 123457', 'giulia.neri@email.it', NULL, 'NO', 'Tempo indeterminato', '2025-12-31', 2023, 'SI', 'Riferimento Latina 1', 1, 1),
('Marroni', 'Paolo', '2023-05', 'SI', '12349', 'Dirigente', 'Istituto Comprensivo Latina 2', 'Dirigenza', 'CD123460', 'Dirigente scolastico', 'DPT5', 'LT', '2023-05-15', '2023-05-15', 200.00, '12', 2023, 'UFF5', 'Dirigente scolastico', 'LTIC127', 'Via Latina 2', '04100', 'Latina', 'Dirigente - I fascia', 'Mensile', '0773 123458', 'paolo.marroni@email.it', NULL, 'NO', 'Tempo indeterminato', '2025-12-31', 2023, 'NO', 'Riferimento Latina 2', 1, 1),

-- Frosinone
('Gialli', 'Sara', '2023-06', 'SI', '12350', 'Docente', 'Istituto Comprensivo Frosinone 1', 'Personale Docente', 'CD123461', 'In servizio dal 2022', 'DPT6', 'FR', '2023-06-20', '2023-06-20', 140.50, '12', 2023, 'UFF6', 'Docente scuola secondaria', 'FRIC128', 'Via Frosinone 1', '03100', 'Frosinone', 'Docente - II fascia', 'Mensile', '0775 123459', 'sara.gialli@email.it', NULL, 'NO', 'Tempo indeterminato', '2025-12-31', 2023, 'SI', 'Riferimento Frosinone 1', 1, 1),

-- Viterbo
('Azzurri', 'Marco', '2023-07', 'SI', '12351', 'ATA', 'Istituto Comprensivo Viterbo 1', 'Personale ATA', 'CD123462', 'Tecnico di laboratorio', 'DPT7', 'VT', '2023-07-01', '2023-07-01', 125.75, '12', 2023, 'UFF7', 'Tecnico di laboratorio', 'VTIC129', 'Via Viterbo 1', '01100', 'Viterbo', 'ATA - II fascia', 'Mensile', '0761 123460', 'marco.azzurri@email.it', NULL, 'NO', 'Tempo indeterminato', '2025-12-31', 2023, 'NO', 'Riferimento Viterbo 1', 1, 1),

-- Rieti
('Rosa', 'Elena', '2023-08', 'SI', '12352', 'Docente', 'Istituto Comprensivo Rieti 1', 'Personale Docente', 'CD123463', 'Specializzata in matematica', 'DPT8', 'RI', '2023-08-10', '2023-08-10', 160.00, '12', 2023, 'UFF8', 'Docente specializzata', 'RIIC130', 'Via Rieti 1', '02100', 'Rieti', 'Docente - I fascia', 'Mensile', '0746 123461', 'elena.rosa@email.it', NULL, 'NO', 'Tempo indeterminato', '2025-12-31', 2023, 'SI', 'Riferimento Rieti 1', 1, 1);