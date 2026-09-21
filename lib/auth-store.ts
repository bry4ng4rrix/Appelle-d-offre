'use client'

/**
 * Stockage du jeton Bearer, seul endroit qui le lit ou l'écrit.
 * Le jeton n'est jamais journalisé ni exposé dans l'UI ; les composants
 * ne voient qu'un booléen `authenticated` et le profil de session.
 */

export interface Session {
  /** Identifiant affichable (email). */
  subject: string
  name: string | null
  role: string
  /** Expiration (ms epoch) si connue. */
  expiresAt: number | null
}

const TOKEN_KEY = 'appelpro.token'
const SESSION_KEY = 'appelpro.session'

let token: string | null = null
let session: Session | null = null
let hydrated = false
const listeners = new Set<() => void>()

const notify = () => listeners.forEach((l) => l())

const storage = () => {
  try {
    return typeof window !== 'undefined' ? window.localStorage : null
  } catch {
    return null
  }
}

/** Recharge l'état depuis le stockage (une fois, côté client). */
export function hydrate() {
  if (hydrated) return
  hydrated = true
  const store = storage()
  if (!store) return
  token = store.getItem(TOKEN_KEY)
  try {
    const raw = store.getItem(SESSION_KEY)
    session = raw ? (JSON.parse(raw) as Session) : null
  } catch {
    session = null
  }
}

export const getToken = () => {
  hydrate()
  return token
}
export const getSession = () => {
  hydrate()
  return session
}

export function setCredentials(nextToken: string, nextSession: Session) {
  token = nextToken
  session = nextSession
  const store = storage()
  store?.setItem(TOKEN_KEY, nextToken)
  store?.setItem(SESSION_KEY, JSON.stringify(nextSession))
  notify()
}

export function clearCredentials() {
  token = null
  session = null
  const store = storage()
  store?.removeItem(TOKEN_KEY)
  store?.removeItem(SESSION_KEY)
  notify()
}

export function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}
