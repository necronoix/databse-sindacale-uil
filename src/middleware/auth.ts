import { Context, Next } from 'hono';
import { sign, verify } from 'hono/jwt';
import type { User } from '../types';

export interface AuthBindings {
  JWT_SECRET: string;
}

export interface Variables {
  user: User;
}

export const generateToken = async (user: User, secret: string): Promise<string> => {
  const payload = {
    id: user.id,
    username: user.username,
    email: user.email,
    role: user.role,
    exp: Math.floor(Date.now() / 1000) + (60 * 60 * 24) // 24 ore
  };
  
  return await sign(payload, secret);
};

export const verifyToken = async (token: string, secret: string): Promise<any> => {
  try {
    return await verify(token, secret);
  } catch (error) {
    return null;
  }
};

export const authMiddleware = async (c: Context, next: Next) => {
  const token = c.req.header('Authorization')?.replace('Bearer ', '');
  
  if (!token) {
    return c.json({ error: 'Token mancante' }, 401);
  }
  
  const secret = c.env.JWT_SECRET;
  const decoded = await verifyToken(token, secret);
  
  if (!decoded) {
    return c.json({ error: 'Token non valido o scaduto' }, 401);
  }
  
  // Recupera l'utente dal database
  const user = await c.env.DB.prepare(
    'SELECT id, username, email, role, is_active, created_at, last_login FROM users WHERE id = ?'
  ).bind(decoded.id).first();
  
  if (!user || !user.is_active) {
    return c.json({ error: 'Utente non autorizzato' }, 401);
  }
  
  c.set('user', user);
  await next();
};

export const requireRole = (roles: string[]) => {
  return async (c: Context, next: Next) => {
    const user = c.get('user') as User;
    
    if (!user || !roles.includes(user.role)) {
      return c.json({ error: 'Permessi insufficienti' }, 403);
    }
    
    await next();
  };
};

export const requireAdmin = requireRole(['admin']);
export const requireModerator = requireRole(['admin', 'moderator']);