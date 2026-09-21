import 'server-only'
import { mkdirSync } from 'node:fs'
import { dirname, resolve } from 'node:path'

/**
 * Accès base de données, côté serveur uniquement.
 *
 * Le moteur est choisi par DATABASE_URL :
 *   - absent ou `file:…`            → SQLite via `node:sqlite` (aucun module natif)
 *   - `postgres://` / `postgresql://` → PostgreSQL via `pg`
 *
 * Les requêtes s'écrivent avec des `?` ; l'adaptateur les convertit en `$n`
 * pour Postgres. Le SQL du schéma reste volontairement commun aux deux.
 */

type Row = object

export interface Db {
  engine: 'sqlite' | 'postgres'
  all<T extends Row = Row>(sql: string, params?: unknown[]): Promise<T[]>
  get<T extends Row = Row>(sql: string, params?: unknown[]): Promise<T | undefined>
  run(sql: string, params?: unknown[]): Promise<void>
}

const SCHEMA = [
  `CREATE TABLE IF NOT EXISTS users (
     id TEXT PRIMARY KEY,
     email TEXT NOT NULL UNIQUE,
     password_hash TEXT NOT NULL,
     name TEXT,
     role TEXT NOT NULL DEFAULT 'user',
     created_at TEXT NOT NULL,
     last_login_at TEXT
   )`,
  `CREATE INDEX IF NOT EXISTS users_email_idx ON users (email)`,
]

const DATABASE_URL = process.env.DATABASE_URL?.trim() || 'file:./data/appelpro.sqlite'

/* --------------------------------------------------------------- SQLite */

async function openSqlite(): Promise<Db> {
  const { DatabaseSync } = await import('node:sqlite')
  const file = DATABASE_URL.replace(/^file:/, '')
  const path = file === ':memory:' ? file : resolve(process.cwd(), file)
  if (path !== ':memory:') mkdirSync(dirname(path), { recursive: true })
  const db = new DatabaseSync(path)
  db.exec('PRAGMA journal_mode = WAL')
  db.exec('PRAGMA foreign_keys = ON')
  for (const statement of SCHEMA) db.exec(statement)
  const bind = (params: unknown[] = []) =>
    params.map((p) => (p === undefined ? null : p)) as (string | number | bigint | null | Uint8Array)[]
  return {
    engine: 'sqlite',
    async all(sql, params) {
      return db.prepare(sql).all(...bind(params)) as never
    },
    async get(sql, params) {
      return db.prepare(sql).get(...bind(params)) as never
    },
    async run(sql, params) {
      db.prepare(sql).run(...bind(params))
    },
  }
}

/* ------------------------------------------------------------- Postgres */

const toPg = (sql: string) => {
  let i = 0
  return sql.replace(/\?/g, () => `$${++i}`)
}

async function openPostgres(): Promise<Db> {
  const { Pool } = await import('pg')
  const pool = new Pool({
    connectionString: DATABASE_URL,
    ssl: process.env.DATABASE_SSL === '1' ? { rejectUnauthorized: false } : undefined,
    max: 5,
  })
  for (const statement of SCHEMA) await pool.query(statement)
  return {
    engine: 'postgres',
    async all(sql, params = []) {
      return (await pool.query(toPg(sql), params)).rows as never
    },
    async get(sql, params = []) {
      return (await pool.query(toPg(sql), params)).rows[0] as never
    },
    async run(sql, params = []) {
      await pool.query(toPg(sql), params)
    },
  }
}

/* ------------------------------------------------------------ singleton */

// Conservé sur `globalThis` pour survivre au rechargement à chaud de Next.
const g = globalThis as unknown as { __appelproDb?: Promise<Db> }

export function getDb(): Promise<Db> {
  if (!g.__appelproDb) {
    g.__appelproDb = /^postgres(ql)?:\/\//.test(DATABASE_URL) ? openPostgres() : openSqlite()
    g.__appelproDb.catch(() => {
      g.__appelproDb = undefined
    })
  }
  return g.__appelproDb
}
