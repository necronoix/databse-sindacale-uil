import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { authMiddleware, requireAdmin, requireModerator } from '../middleware/auth';
import type { Iscritto, SearchFilters, PaginatedResponse } from '../types';

const api = new Hono();

api.use('/api/*', cors());
api.use('/api/auth/*', cors());

// API di autenticazione
api.post('/api/auth/login', async (c) => {
  const { username, password } = await c.req.json();
  
  // Recupera l'utente dal database
  const user = await c.env.DB.prepare(
    'SELECT id, username, email, password_hash, role, is_active FROM users WHERE username = ? AND is_active = 1'
  ).bind(username).first();
  
  if (!user) {
    return c.json({ error: 'Credenziali non valide' }, 401);
  }
  
  // Verifica la password - per ora confronto diretto per Tiziana
  let isValidPassword = false;
  
  if (username === 'Tiziana' && password === 'pupo') {
    isValidPassword = true;
  } else if (username === 'admin' && password === 'admin123') {
    isValidPassword = true;
  } else {
    // Per altri utenti, usa il confronto con hash (da implementare con bcrypt)
    isValidPassword = password === user.password_hash;
  }
  
  if (!isValidPassword) {
    return c.json({ error: 'Credenziali non valide' }, 401);
  }
  
  // Aggiorna last_login
  await c.env.DB.prepare(
    'UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?'
  ).bind(user.id).run();
  
  const { generateToken } = await import('../middleware/auth');
  const token = await generateToken(user, c.env.JWT_SECRET);
  
  return c.json({
    token,
    user: {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role
    }
  });
});

// API per la ricerca e gestione anagrafica
api.get('/api/iscritti', authMiddleware, requireModerator, async (c) => {
  const page = parseInt(c.req.query('page') || '1');
  const limit = parseInt(c.req.query('limit') || '20');
  const offset = (page - 1) * limit;
  
  const filters: SearchFilters = {
    cognome: c.req.query('cognome'),
    nome: c.req.query('nome'),
    ruolo: c.req.query('ruolo'),
    istituto: c.req.query('istituto'),
    prov: c.req.query('prov'),
    annoiscrizione: c.req.query('annoiscrizione'),
    rsu_tas: c.req.query('rsu_tas'),
    contratto: c.req.query('contratto')
  };
  
  // Costruisci la query con filtri
  let whereClause = 'WHERE 1=1';
  const params: any[] = [];
  
  Object.entries(filters).forEach(([key, value]) => {
    if (value) {
      whereClause += ` AND ${key} LIKE ?`;
      params.push(`%${value}%`);
    }
  });
  
  // Query per il conteggio totale
  const countResult = await c.env.DB.prepare(
    `SELECT COUNT(*) as total FROM iscritti ${whereClause}`
  ).bind(...params).first();
  
  const total = countResult?.total || 0;
  
  // Query per i dati paginati
  const results = await c.env.DB.prepare(
    `SELECT * FROM iscritti ${whereClause} ORDER BY cognome, nome LIMIT ? OFFSET ?`
  ).bind(...params, limit, offset).all();
  
  const response: PaginatedResponse<Iscritto> = {
    data: results.results as Iscritto[],
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit)
  };
  
  return c.json(response);
});

// API per ottenere un singolo iscritto
api.get('/api/iscritti/:id', authMiddleware, requireModerator, async (c) => {
  const id = c.req.param('id');
  
  const result = await c.env.DB.prepare(
    'SELECT * FROM iscritti WHERE id = ?'
  ).bind(id).first();
  
  if (!result) {
    return c.json({ error: 'Iscritto non trovato' }, 404);
  }
  
  return c.json(result);
});

// API per creare un nuovo iscritto
api.post('/api/iscritti', authMiddleware, requireModerator, async (c) => {
  const data = await c.req.json();
  const user = c.get('user');
  
  const result = await c.env.DB.prepare(`
    INSERT INTO iscritti (
      cognome, nome, iscrizione, invio, prot, ruolo, istituto, tipologia, documento,
      note_attuale, dpt, prov, importoritenuta, meserata, annorata, uff_servizio,
      descrizione, cod_mecc, indirizzo, cap, localita, qual_liv, tiporit, telefono,
      email_personale, trasferimento, pensione, contratto, scadenzacontratto,
      annoiscrizione, rsu_tas, riferimento, iscritto_da_user_id
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(
    data.cognome, data.nome, data.iscrizione, data.invio, data.prot, data.ruolo,
    data.istituto, data.tipologia, data.documento, data.note_attuale, data.dpt,
    data.prov, data.importoritenuta, data.meserata, data.annorata, data.uff_servizio,
    data.descrizione, data.cod_mecc, data.indirizzo, data.cap, data.localita,
    data.qual_liv, data.tiporit, data.telefono, data.email_personale, data.trasferimento,
    data.pensione, data.contratto, data.scadenzacontratto, data.annoiscrizione,
    data.rsu_tas, data.riferimento, user.id
  ).run();
  
  return c.json({ id: result.meta.last_row_id, message: 'Iscritto creato con successo' });
});

// API per aggiornare un iscritto
api.put('/api/iscritti/:id', authMiddleware, requireModerator, async (c) => {
  const id = c.req.param('id');
  const data = await c.req.json();
  const user = c.get('user');
  
  // Registra la modifica nel log
  const iscrittoPrecedente = await c.env.DB.prepare(
    'SELECT * FROM iscritti WHERE id = ?'
  ).bind(id).first();
  
  if (!iscrittoPrecedente) {
    return c.json({ error: 'Iscritto non trovato' }, 404);
  }
  
  // Aggiorna l'iscritto
  await c.env.DB.prepare(`
    UPDATE iscritti SET
      cognome = ?, nome = ?, iscrizione = ?, invio = ?, prot = ?, ruolo = ?,
      istituto = ?, tipologia = ?, documento = ?, note_attuale = ?, dpt = ?,
      prov = ?, importoritenuta = ?, meserata = ?, annorata = ?, uff_servizio = ?,
      descrizione = ?, cod_mecc = ?, indirizzo = ?, cap = ?, localita = ?,
      qual_liv = ?, tiporit = ?, telefono = ?, email_personale = ?, trasferimento = ?,
      pensione = ?, contratto = ?, scadenzacontratto = ?, annoiscrizione = ?,
      rsu_tas = ?, riferimento = ?, data_ultima_modifica = CURRENT_TIMESTAMP,
      modificato_da_user_id = ?
    WHERE id = ?
  `).bind(
    data.cognome, data.nome, data.iscrizione, data.invio, data.prot, data.ruolo,
    data.istituto, data.tipologia, data.documento, data.note_attuale, data.dpt,
    data.prov, data.importoritenuta, data.meserata, data.annorata, data.uff_servizio,
    data.descrizione, data.cod_mecc, data.indirizzo, data.cap, data.localita,
    data.qual_liv, data.tiporit, data.telefono, data.email_personale, data.trasferimento,
    data.pensione, data.contratto, data.scadenzacontratto, data.annoiscrizione,
    data.rsu_tas, data.riferimento, user.id, id
  ).run();
  
  // Log delle modifiche (semplificato - in produzione loggare ogni campo modificato)
  await c.env.DB.prepare(`
    INSERT INTO log_modifiche (iscritto_id, campo_modificato, utente_id)
    VALUES (?, 'aggiornamento_anagrafica', ?)
  `).bind(id, user.id).run();
  
  return c.json({ message: 'Iscritto aggiornato con successo' });
});

// API per eliminare un iscritto
api.delete('/api/iscritti/:id', authMiddleware, requireAdmin, async (c) => {
  const id = c.req.param('id');
  
  await c.env.DB.prepare('DELETE FROM iscritti WHERE id = ?').bind(id).run();
  
  return c.json({ message: 'Iscritto eliminato con successo' });
});

// API per le statistiche della dashboard
api.get('/api/dashboard/stats', authMiddleware, requireModerator, async (c) => {
  const totalIscritti = await c.env.DB.prepare(
    'SELECT COUNT(*) as total FROM iscritti'
  ).first();
  
  const nuoviIscrittiAnno = await c.env.DB.prepare(
    'SELECT COUNT(*) as total FROM iscritti WHERE strftime("%Y", data_iscrizione) = strftime("%Y", "now")'
  ).first();
  
  const iscrittiPerRuolo = await c.env.DB.prepare(`
    SELECT ruolo, COUNT(*) as count FROM iscritti 
    WHERE ruolo IS NOT NULL GROUP BY ruolo ORDER BY count DESC
  `).all();
  
  const iscrittiPerProvincia = await c.env.DB.prepare(`
    SELECT prov, COUNT(*) as count FROM iscritti 
    WHERE prov IS NOT NULL GROUP BY prov ORDER BY count DESC
  `).all();
  
  const iscrittiPerAnno = await c.env.DB.prepare(`
    SELECT strftime("%Y", data_iscrizione) as anno, COUNT(*) as count FROM iscritti 
    GROUP BY anno ORDER BY anno DESC
  `).all();
  
  const ultimiIscritti = await c.env.DB.prepare(`
    SELECT * FROM iscritti ORDER BY data_iscrizione DESC LIMIT 5
  `).all();
  
  return c.json({
    totalIscritti: totalIscritti?.total || 0,
    nuoviIscrittiAnno: nuoviIscrittiAnno?.total || 0,
    iscrittiPerRuolo: Object.fromEntries(iscrittiPerRuolo.results.map((r: any) => [r.ruolo, r.count])),
    iscrittiPerProvincia: Object.fromEntries(iscrittiPerProvincia.results.map((r: any) => [r.prov, r.count])),
    iscrittiPerAnno: Object.fromEntries(iscrittiPerAnno.results.map((r: any) => [r.anno, r.count])),
    ultimiIscritti: ultimiIscritti.results
  });
});

export default api;