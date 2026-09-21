import 'server-only'
import { randomUUID } from 'node:crypto'
import bcrypt from 'bcryptjs'
import { getDb } from './db'

export type Role = 'user' | 'admin'

export interface User {
  id: string
  email: string
  name: string | null
  role: Role
  created_at: string
  last_login_at: string | null
}

interface UserRow extends User {
  password_hash: string
}

const normalizeEmail = (email: string) => email.trim().toLowerCase()
const publicUser = ({ password_hash: _p, ...user }: UserRow): User => user

export async function findByEmail(email: string) {
  const db = await getDb()
  return db.get<UserRow>('SELECT * FROM users WHERE email = ?', [normalizeEmail(email)])
}

export async function findById(id: string): Promise<User | undefined> {
  const db = await getDb()
  const row = await db.get<UserRow>('SELECT * FROM users WHERE id = ?', [id])
  return row ? publicUser(row) : undefined
}

export async function createUser(input: { email: string; password: string; name?: string; role?: Role }): Promise<User> {
  const db = await getDb()
  const user: UserRow = {
    id: randomUUID(),
    email: normalizeEmail(input.email),
    password_hash: await bcrypt.hash(input.password, 12),
    name: input.name?.trim() || null,
    role: input.role ?? 'user',
    created_at: new Date().toISOString(),
    last_login_at: null,
  }
  await db.run(
    'INSERT INTO users (id, email, password_hash, name, role, created_at, last_login_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [user.id, user.email, user.password_hash, user.name, user.role, user.created_at, user.last_login_at],
  )
  return publicUser(user)
}

/** Retourne l'utilisateur si le couple email / mot de passe est valide. */
export async function authenticate(email: string, password: string): Promise<User | null> {
  const row = await findByEmail(email)
  // Comparaison même si l'utilisateur n'existe pas : temps de réponse constant.
  const ok = await bcrypt.compare(password, row?.password_hash ?? '$2a$12$invalidinvalidinvalidinvalidinvalidinvalidinvalidinvalid')
  if (!row || !ok) return null
  const db = await getDb()
  const now = new Date().toISOString()
  await db.run('UPDATE users SET last_login_at = ? WHERE id = ?', [now, row.id])
  return { ...publicUser(row), last_login_at: now }
}

export async function countUsers() {
  const db = await getDb()
  const row = await db.get<{ n: number | string }>('SELECT COUNT(*) AS n FROM users')
  return Number(row?.n ?? 0)
}
