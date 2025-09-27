import { Hono } from 'hono'
import { jwt } from 'hono/jwt'

const iscritti = new Hono<{ 
  Bindings: { 
    DB: D1Database; 
    JWT_SECRET: string 
  } 
}>()

// Middleware di autenticazione - FIXED con stringa diretta
const JWT_SECRET = 'super-secret-jwt-key-for-sindacato-roma-lazio-2024'
const authMiddleware = jwt({
  secret: JWT_SECRET
})

// Ottieni tutti gli iscritti con paginazione e ricerca
iscritti.get('/', authMiddleware, async (c) => {
  const page = parseInt(c.req.query('page') || '1')
  const limit = parseInt(c.req.query('limit') || '50')
  const offset = (page - 1) * limit
  
  const search = c.req.query('search') || ''
  const cognome = c.req.query('cognome')
  const nome = c.req.query('nome') 
  const ruolo = c.req.query('ruolo')
  const istituto = c.req.query('istituto')
  const localita = c.req.query('localita')
  const email = c.req.query('email')
  const prov_iscrizione = c.req.query('prov_iscrizione')

  try {
    let query = 'SELECT * FROM iscritti WHERE 1=1'
    let countQuery = 'SELECT COUNT(*) as total FROM iscritti WHERE 1=1'
    const params: any[] = []

    // Aggiungi filtri
    if (search) {
      query += ' AND (cognome LIKE ? OR nome LIKE ? OR email LIKE ? OR istituto LIKE ?)'
      countQuery += ' AND (cognome LIKE ? OR nome LIKE ? OR email LIKE ? OR istituto LIKE ?)'
      const searchParam = `%${search}%`
      params.push(searchParam, searchParam, searchParam, searchParam)
    }

    if (cognome) {
      query += ' AND cognome LIKE ?'
      countQuery += ' AND cognome LIKE ?'
      params.push(`%${cognome}%`)
    }

    if (nome) {
      query += ' AND nome LIKE ?'
      countQuery += ' AND nome LIKE ?'
      params.push(`%${nome}%`)
    }

    if (ruolo) {
      query += ' AND ruolo = ?'
      countQuery += ' AND ruolo = ?'
      params.push(ruolo)
    }

    if (istituto) {
      query += ' AND istituto LIKE ?'
      countQuery += ' AND istituto LIKE ?'
      params.push(`%${istituto}%`)
    }

    if (localita) {
      query += ' AND localita LIKE ?'
      countQuery += ' AND localita LIKE ?'
      params.push(`%${localita}%`)
    }

    if (email) {
      query += ' AND email LIKE ?'
      countQuery += ' AND email LIKE ?'
      params.push(`%${email}%`)
    }

    if (prov_iscrizione) {
      query += ' AND prov_iscrizione = ?'
      countQuery += ' AND prov_iscrizione = ?'
      params.push(prov_iscrizione)
    }

    // Ordina per cognome e nome
    query += ' ORDER BY cognome, nome LIMIT ? OFFSET ?'
    
    // Prepara parametri per la query principale
    const queryParams = [...params, limit, offset]
    
    // Prepara parametri per il conteggio (senza limit/offset)
    const countParams = [...params]

    // Esegui query
    const iscritti = await c.env.DB.prepare(query).bind(...queryParams).all()
    const countResult = await c.env.DB.prepare(countQuery).bind(...countParams).first()

    const total = countResult?.total || 0
    const totalPages = Math.ceil(total / limit)

    return c.json({
      data: iscritti.results,
      page,
      limit,
      total,
      totalPages
    })

  } catch (error) {
    console.error('Get iscritti error:', error)
    return c.json({ error: 'Errore durante il recupero degli iscritti' }, 500)
  }
})

// Ottieni un singolo iscritto
iscritti.get('/:id', authMiddleware, async (c) => {
  const id = c.req.param('id')

  try {
    const iscritto = await c.env.DB.prepare(`
      SELECT * FROM iscritti WHERE id = ?
    `).bind(id).first()

    if (!iscritto) {
      return c.json({ error: 'Iscritto non trovato' }, 404)
    }

    return c.json(iscritto)

  } catch (error) {
    console.error('Get iscritto error:', error)
    return c.json({ error: 'Errore durante il recupero dell\'iscritto' }, 500)
  }
})

// Crea nuovo iscritto
iscritti.post('/', authMiddleware, async (c) => {
  const iscrittoData = await c.req.json()
  const userId = c.get('jwtPayload').sub

  try {
    // Lista dei campi validi per la tabella iscritti
    const validFields = [
      'cognome', 'nome', 'iscrizione', 'invio', 'prot', 'ruolo', 'istituto', 
      'tipologia', 'documento', 'note', 'indirizzo', 'email', 'telefono', 
      'attuale', 'dpt', 'prov_iscrizione', 'anagrafica', 'importoritenuta', 
      'meserata', 'annorata', 'uff_servizio', 'descrizione', 'cod_mecc', 
      'indirizzo_ufficio', 'cap', 'localita', 'qual_liv', 'tiporit', 
      'tipo_di_contratto', 'scadenza_contratto', 'rsu_tas', 'riferimento'
    ]

    // Filtra solo i campi validi
    const fields = []
    const placeholders = []
    const values = []

    validFields.forEach(field => {
      if (iscrittoData[field] !== undefined && iscrittoData[field] !== '') {
        fields.push(field)
        placeholders.push('?')
        values.push(iscrittoData[field])
      }
    })

    // Aggiungi campi di sistema
    fields.push('iscritto_da_user_id', 'data_iscrizione', 'data_ultima_modifica')
    placeholders.push('?', 'CURRENT_TIMESTAMP', 'CURRENT_TIMESTAMP')
    values.push(userId)

    const query = `
      INSERT INTO iscritti (${fields.join(', ')}) 
      VALUES (${placeholders.join(', ')})
    `

    const result = await c.env.DB.prepare(query).bind(...values).run()

    // Log dell'azione nella tabella log_modifiche
    await c.env.DB.prepare(`
      INSERT INTO log_modifiche (iscritto_id, campo_modificato, valore_nuovo, utente_id)
      VALUES (?, 'CREAZIONE', ?, ?)
    `).bind(result.meta.last_row_id, JSON.stringify(iscrittoData), userId).run()

    return c.json({
      success: true,
      id: result.meta.last_row_id
    })

  } catch (error) {
    console.error('Create iscritto error:', error)
    return c.json({ error: 'Errore durante la creazione dell\'iscritto' }, 500)
  }
})

// Aggiorna iscritto
iscritti.put('/:id', authMiddleware, async (c) => {
  const id = c.req.param('id')
  const iscrittoData = await c.req.json()
  const userId = c.get('jwtPayload').sub

  try {
    // Ottieni i valori attuali per il log
    const currentIscritto = await c.env.DB.prepare(`
      SELECT * FROM iscritti WHERE id = ?
    `).bind(id).first()

    if (!currentIscritto) {
      return c.json({ error: 'Iscritto non trovato' }, 404)
    }

    // Lista dei campi validi per l'aggiornamento
    const validFields = [
      'cognome', 'nome', 'iscrizione', 'invio', 'prot', 'ruolo', 'istituto', 
      'tipologia', 'documento', 'note', 'indirizzo', 'email', 'telefono', 
      'attuale', 'dpt', 'prov_iscrizione', 'anagrafica', 'importoritenuta', 
      'meserata', 'annorata', 'uff_servizio', 'descrizione', 'cod_mecc', 
      'indirizzo_ufficio', 'cap', 'localita', 'qual_liv', 'tiporit', 
      'tipo_di_contratto', 'scadenza_contratto', 'rsu_tas', 'riferimento'
    ]

    // Prepara l'update
    const updates = []
    const values = []

    validFields.forEach(field => {
      if (iscrittoData[field] !== undefined) {
        updates.push(`${field} = ?`)
        values.push(iscrittoData[field] === '' ? null : iscrittoData[field])
        
        // Log delle modifiche per ogni campo cambiato
        if (currentIscritto[field] !== iscrittoData[field]) {
          c.env.DB.prepare(`
            INSERT INTO log_modifiche (iscritto_id, campo_modificato, valore_precedente, valore_nuovo, utente_id)
            VALUES (?, ?, ?, ?, ?)
          `).bind(id, field, currentIscritto[field], iscrittoData[field], userId).run()
        }
      }
    })

    if (updates.length === 0) {
      return c.json({ error: 'Nessun campo da aggiornare' }, 400)
    }

    // Aggiungi i campi di sistema
    updates.push('data_ultima_modifica = CURRENT_TIMESTAMP')
    updates.push('modificato_da_user_id = ?')
    values.push(userId)
    values.push(id)

    const query = `
      UPDATE iscritti 
      SET ${updates.join(', ')}
      WHERE id = ?
    `

    await c.env.DB.prepare(query).bind(...values).run()

    return c.json({ success: true })

  } catch (error) {
    console.error('Update iscritto error:', error)
    return c.json({ error: 'Errore durante l\'aggiornamento dell\'iscritto' }, 500)
  }
})

// Elimina iscritto (elimina fisicamente dal database)
iscritti.delete('/:id', authMiddleware, async (c) => {
  const id = c.req.param('id')
  const userId = c.get('jwtPayload').sub

  try {
    // Ottieni i valori attuali per il log
    const currentIscritto = await c.env.DB.prepare(`
      SELECT * FROM iscritti WHERE id = ?
    `).bind(id).first()

    if (!currentIscritto) {
      return c.json({ error: 'Iscritto non trovato' }, 404)
    }

    // Log dell'azione prima dell'eliminazione
    await c.env.DB.prepare(`
      INSERT INTO log_modifiche (iscritto_id, campo_modificato, valore_precedente, utente_id)
      VALUES (?, 'ELIMINAZIONE', ?, ?)
    `).bind(id, JSON.stringify(currentIscritto), userId).run()

    // Elimina fisicamente dal database
    await c.env.DB.prepare(`
      DELETE FROM iscritti WHERE id = ?
    `).bind(id).run()

    return c.json({ success: true })

  } catch (error) {
    console.error('Delete iscritto error:', error)
    return c.json({ error: 'Errore durante l\'eliminazione dell\'iscritto' }, 500)
  }
})

// Esportazione completa dei dati
iscritti.get('/export', authMiddleware, async (c) => {
  const format = c.req.query('format') || 'json'
  const filters = c.req.query('filters') ? JSON.parse(c.req.query('filters') as string) : {}

  try {
    let query = 'SELECT * FROM iscritti WHERE 1=1'
    const params: any[] = []

    // Applica filtri se presenti
    if (filters.ruolo) {
      query += ' AND ruolo = ?'
      params.push(filters.ruolo)
    }
    if (filters.istituto) {
      query += ' AND istituto LIKE ?'
      params.push(`%${filters.istituto}%`)
    }
    if (filters.prov_iscrizione) {
      query += ' AND prov_iscrizione = ?'
      params.push(filters.prov_iscrizione)
    }
    if (filters.tipo_di_contratto) {
      query += ' AND tipo_di_contratto = ?'
      params.push(filters.tipo_di_contratto)
    }
    if (filters.annorata) {
      query += ' AND annorata = ?'
      params.push(filters.annorata)
    }

    query += ' ORDER BY cognome, nome'

    const result = await c.env.DB.prepare(query).bind(...params).all()

    return c.json({
      data: result.results,
      total: result.results.length,
      exportDate: new Date().toISOString(),
      filters: filters,
      format: format
    })

  } catch (error) {
    console.error('Export iscritti error:', error)
    return c.json({ error: 'Errore durante l\'esportazione degli iscritti' }, 500)
  }
})

export default iscritti