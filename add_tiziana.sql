-- Inserimento nuovo utente amministratore Tiziana
INSERT OR IGNORE INTO users (username, email, password_hash, role, is_active) VALUES 
('Tiziana', 'tiziana@sindacato.it', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin', 1);

-- Aggiornamento password per Tiziana (semplificato per sviluppo)
UPDATE users SET password_hash = 'pupo' WHERE username = 'Tiziana';