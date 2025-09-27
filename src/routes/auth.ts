import { Hono } from 'hono'
import { sign } from 'hono/jwt'

const auth = new Hono<{ Bindings: { DB: D1Database; JWT_SECRET: string } }>()

// Simple hash function for demo (use proper bcrypt in production)
async function simpleHash(password: string): Promise<string> {
  // In production, use proper bcrypt or similar
  const encoder = new TextEncoder()
  const data = encoder.encode(password)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
}

async function comparePassword(password: string, hash: string): Promise<boolean> {
  const hashed = await simpleHash(password)
  return hashed === hash
}

// Login
auth.post('/login', async (c) => {
  const { username, password } = await c.req.json<{ username: string; password: string }>()

  try {
    // Trova utente
    const user = await c.env.DB.prepare(`
      SELECT id, username, email, role, password_hash, is_active 
      FROM users 
      WHERE username = ? AND is_active = 1
    `).bind(username).first()

    if (!user) {
      return c.json({ error: 'Credenziali non valide' }, 401)
    }

    // Verifica password
    const isValid = await comparePassword(password, user.password_hash)
    if (!isValid) {
      return c.json({ error: 'Credenziali non valide' }, 401)
    }

    // Aggiorna last_login
    await c.env.DB.prepare(`
      UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?
    `).bind(user.id).run()

    // Crea JWT token
    const payload = {
      sub: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60) // 24 ore
    }

    const token = await sign(payload, c.env.JWT_SECRET)

    return c.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role
      }
    })

  } catch (error) {
    console.error('Login error:', error)
    return c.json({ error: 'Errore durante il login' }, 500)
  }
})

// Registra nuovo utente (solo admin)
auth.post('/register', async (c) => {
  const { username, email, password, role = 'user' } = await c.req.json()

  try {
    // Hash password
    const passwordHash = await simpleHash(password)

    // Inserisci nuovo utente
    const result = await c.env.DB.prepare(`
      INSERT INTO users (username, email, password_hash, role) 
      VALUES (?, ?, ?, ?)
    `).bind(username, email, passwordHash, role).run()

    return c.json({
      success: true,
      userId: result.meta.last_row_id
    })

  } catch (error) {
    console.error('Registration error:', error)
    return c.json({ error: 'Errore durante la registrazione' }, 500)
  }
})

// Cambia password
auth.post('/change-password', async (c) => {
  const { currentPassword, newPassword } = await c.req.json()
  const userId = c.get('jwtPayload').sub

  try {
    // Trova utente corrente
    const user = await c.env.DB.prepare(`
      SELECT password_hash FROM users WHERE id = ?
    `).bind(userId).first()

    if (!user) {
      return c.json({ error: 'Utente non trovato' }, 404)
    }

    // Verifica password corrente
    const isValid = await comparePassword(currentPassword, user.password_hash)
    if (!isValid) {
      return c.json({ error: 'Password corrente non valida' }, 400)
    }

    // Hash nuova password
    const newPasswordHash = await simpleHash(newPassword)

    // Aggiorna password
    await c.env.DB.prepare(`
      UPDATE users SET password_hash = ? WHERE id = ?
    `).bind(newPasswordHash, userId).run()

    return c.json({ success: true })

  } catch (error) {
    console.error('Change password error:', error)
    return c.json({ error: 'Errore durante il cambio password' }, 500)
  }
})

export default auth