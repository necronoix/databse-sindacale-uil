import { Hono } from 'hono'
import { jwt } from 'hono/jwt'

const members = new Hono<{ 
  Bindings: { 
    DB: D1Database; 
    JWT_SECRET: string 
  } 
}>()

// Middleware di autenticazione
const authMiddleware = jwt({
  secret: (c) => c.env.JWT_SECRET
})

// Ottieni tutti gli iscritti con paginazione e ricerca
members.get('/', authMiddleware, async (c) => {
  const page = parseInt(c.req.query('page') || '1')
  const limit = parseInt(c.req.query('limit') || '50')
  const offset = (page - 1) * limit
  
  const search = c.req.query('search') || ''
  const prov = c.req.query('prov')
  const istituto = c.req.query('istituto')
  const ruolo = c.req.query('ruolo')

  try {
    let query = 'SELECT * FROM members WHERE is_active = 1'
    let countQuery = 'SELECT COUNT(*) as total FROM members WHERE is_active = 1'
    const params: any[] = []

    // Aggiungi filtri
    if (search) {
      query += ' AND (cognome LIKE ? OR nome LIKE ? OR email LIKE ?)'
      countQuery += ' AND (cognome LIKE ? OR nome LIKE ? OR email LIKE ?)'
      const searchParam = `%${search}%`
      params.push(searchParam, searchParam, searchParam)
    }

    if (prov) {
      query += ' AND prov = ?'
      countQuery += ' AND prov = ?'
      params.push(prov)
    }

    if (istituto) {
      query += ' AND istituto = ?'
      countQuery += ' AND istituto = ?'
      params.push(istituto)
    }

    if (ruolo) {
      query += ' AND ruolo = ?'
      countQuery += ' AND ruolo = ?'
      params.push(ruolo)
    }

    // Ordina per cognome e nome
    query += ' ORDER BY cognome, nome LIMIT ? OFFSET ?'
    params.push(limit, offset)

    // Esegui query
    const members = await c.env.DB.prepare(query).bind(...params).all()
    const countResult = await c.env.DB.prepare(countQuery).bind(...params.slice(0, -2)).first()

    return c.json({
      members: members.results,
      pagination: {
        page,
        limit,
        total: countResult?.total || 0,
        pages: Math.ceil((countResult?.total || 0) / limit)
      }
    })

  } catch (error) {
    console.error('Get members error:', error)
    return c.json({ error: 'Errore durante il recupero degli iscritti' }, 500)
  }
})

// Ottieni un singolo iscritto
members.get('/:id', authMiddleware, async (c) => {
  const id = c.req.param('id')

  try {
    const member = await c.env.DB.prepare(`
      SELECT * FROM members WHERE id = ? AND is_active = 1
    `).bind(id).first()

    if (!member) {
      return c.json({ error: 'Iscritto non trovato' }, 404)
    }

    return c.json(member)

  } catch (error) {
    console.error('Get member error:', error)
    return c.json({ error: 'Errore durante il recupero dell\'iscritto' }, 500)
  }
})

// Crea nuovo iscritto
members.post('/', authMiddleware, async (c) => {
  const memberData = await c.req.json()
  const userId = c.get('jwtPayload').sub

  try {
    // Prepara i campi per l'inserimento
    const fields = []
    const placeholders = []
    const values = []

    Object.keys(memberData).forEach(key => {
      const dbField = key.replace(/([A-Z])/g, '_$1').toLowerCase() // Converte camelCase a snake_case
      fields.push(dbField)
      placeholders.push('?')
      values.push(memberData[key])
    })

    fields.push('created_by')
    placeholders.push('?')
    values.push(userId)

    const query = `
      INSERT INTO members (${fields.join(', ')}) 
      VALUES (${placeholders.join(', ')})
    `

    const result = await c.env.DB.prepare(query).bind(...values).run()

    // Log dell'azione
    await c.env.DB.prepare(`
      INSERT INTO audit_log (table_name, record_id, action, new_values, user_id)
      VALUES ('members', ?, 'INSERT', ?, ?)
    `).bind(result.meta.last_row_id, JSON.stringify(memberData), userId).run()

    return c.json({
      success: true,
      memberId: result.meta.last_row_id
    })

  } catch (error) {
    console.error('Create member error:', error)
    return c.json({ error: 'Errore durante la creazione dell\'iscritto' }, 500)
  }
})

// Aggiorna iscritto
members.put('/:id', authMiddleware, async (c) => {
  const id = c.req.param('id')
  const memberData = await c.req.json()
  const userId = c.get('jwtPayload').sub

  try {
    // Ottieni i valori attuali per il log
    const currentMember = await c.env.DB.prepare(`
      SELECT * FROM members WHERE id = ?
    `).bind(id).first()

    if (!currentMember) {
      return c.json({ error: 'Iscritto non trovato' }, 404)
    }

    // Prepara l'update
    const updates = []
    const values = []

    Object.keys(memberData).forEach(key => {
      const dbField = key.replace(/([A-Z])/g, '_$1').toLowerCase()
      updates.push(`${dbField} = ?`)
      values.push(memberData[key])
    })

    updates.push('updated_at = CURRENT_TIMESTAMP')
    updates.push('updated_by = ?')
    values.push(userId, id)

    const query = `
      UPDATE members 
      SET ${updates.join(', ')}
      WHERE id = ?
    `

    await c.env.DB.prepare(query).bind(...values).run()

    // Log dell'azione
    await c.env.DB.prepare(`
      INSERT INTO audit_log (table_name, record_id, action, old_values, new_values, user_id)
      VALUES ('members', ?, 'UPDATE', ?, ?, ?)
    `).bind(id, JSON.stringify(currentMember), JSON.stringify(memberData), userId).run()

    return c.json({ success: true })

  } catch (error) {
    console.error('Update member error:', error)
    return c.json({ error: 'Errore durante l\'aggiornamento dell\'iscritto' }, 500)
  }
})

// Elimina iscritto (soft delete)
members.delete('/:id', authMiddleware, async (c) => {
  const id = c.req.param('id')
  const userId = c.get('jwtPayload').sub

  try {
    // Ottieni i valori attuali per il log
    const currentMember = await c.env.DB.prepare(`
      SELECT * FROM members WHERE id = ?
    `).bind(id).first()

    if (!currentMember) {
      return c.json({ error: 'Iscritto non trovato' }, 404)
    }

    // Soft delete
    await c.env.DB.prepare(`
      UPDATE members 
      SET is_active = 0, updated_at = CURRENT_TIMESTAMP, updated_by = ?
      WHERE id = ?
    `).bind(userId, id).run()

    // Log dell'azione
    await c.env.DB.prepare(`
      INSERT INTO audit_log (table_name, record_id, action, old_values, user_id)
      VALUES ('members', ?, 'DELETE', ?, ?)
    `).bind(id, JSON.stringify(currentMember), userId).run()

    return c.json({ success: true })

  } catch (error) {
    console.error('Delete member error:', error)
    return c.json({ error: 'Errore durante l\'eliminazione dell\'iscritto' }, 500)
  }
})

// Statistiche per la dashboard
members.get('/stats/summary', authMiddleware, async (c) => {
  try {
    const totalMembers = await c.env.DB.prepare(`
      SELECT COUNT(*) as total FROM members WHERE is_active = 1
    `).first()

    const membersByProvince = await c.env.DB.prepare(`
      SELECT prov, COUNT(*) as count 
      FROM members 
      WHERE is_active = 1 AND prov IS NOT NULL 
      GROUP BY prov 
      ORDER BY count DESC
    `).all()

    const membersByIstituto = await c.env.DB.prepare(`
      SELECT istituto, COUNT(*) as count 
      FROM members 
      WHERE is_active = 1 AND istituto IS NOT NULL 
      GROUP BY istituto 
      ORDER BY count DESC
      LIMIT 10
    `).all()

    const recentMembers = await c.env.DB.prepare(`
      SELECT COUNT(*) as recent 
      FROM members 
      WHERE is_active = 1 AND created_at >= date('now', '-30 days')
    `).first()

    return c.json({
      total: totalMembers?.total || 0,
      recent: recentMembers?.recent || 0,
      byProvince: membersByProvince.results,
      byIstituto: membersByIstituto.results
    })

  } catch (error) {
    console.error('Stats error:', error)
    return c.json({ error: 'Errore durante il recupero delle statistiche' }, 500)
  }
})

export default members