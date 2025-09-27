-- Dati di esempio per la tabella iscritti con il nuovo schema

INSERT INTO iscritti (
  cognome, nome, iscrizione, invio, prot, ruolo, istituto, tipologia, documento, note,
  indirizzo, email, telefono, attuale, dpt, prov_iscrizione, anagrafica, importoritenuta,
  meserata, annorata, uff_servizio, descrizione, cod_mecc, indirizzo_ufficio, cap,
  localita, qual_liv, tiporit, tipo_di_contratto, scadenza_contratto, rsu_tas, riferimento
) VALUES 
(
  'Rossi', 'Mario', '2024-01-15', '2024-01-16', 'PROT001', 'Docente', 'IC Dante Alighieri', 
  'Scuola Primaria', 'DOC001', 'Note varie', 'Via Roma 123', 'mario.rossi@email.com', 
  '3331234567', 'In servizio', 'Dipartimento A', 'Roma', 'Completa', 150.50, 
  'Gennaio 2024', '2024', 'Segreteria', 'Insegnante di classe', 'MECC001', 
  'Via Scuola 45', '00100', 'Roma', 'Laurea/A1', 'Tipo A', 'Tempo Indeterminato', 
  '31/08/2025', 'RSU', 'RIF001'
),
(
  'Bianchi', 'Anna', '2024-02-01', '2024-02-02', 'PROT002', 'ATA', 'ITIS Marconi', 
  'Istituto Tecnico', 'DOC002', 'Collaboratore scolastico', 'Via Milano 67', 'anna.bianchi@email.com', 
  '3339876543', 'In servizio', 'Dipartimento B', 'Milano', 'Parziale', 120.00, 
  'Febbraio 2024', '2024', 'Amministrazione', 'Personale ATA', 'MECC002', 
  'Via Tecnica 12', '20100', 'Milano', 'Diploma/B1', 'Tipo B', 'Tempo Determinato', 
  '30/06/2024', 'TAS', 'RIF002'
),
(
  'Verdi', 'Giuseppe', '2023-09-01', '2023-09-02', 'PROT003', 'Dirigente', 'Liceo Classico Virgilio', 
  'Liceo', 'DOC003', 'Dirigente Scolastico', 'Corso Vittorio 89', 'giuseppe.verdi@email.com', 
  '3345678901', 'In servizio', 'Direzione', 'Napoli', 'Completa', 200.75, 
  'Settembre 2023', '2023', 'Direzione', 'Dirigente Scolastico', 'MECC003', 
  'Piazza Centrale 1', '80100', 'Napoli', 'Laurea/Dir', 'Dirigenziale', 'Tempo Indeterminato', 
  '31/08/2026', 'Dirigente', 'RIF003'
);