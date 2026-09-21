'use client'

import { useCallback, useEffect, useSyncExternalStore } from 'react'
import { withTimeout } from './api'
import {
  clearCredentials,
  getSession,
  getToken,
  hydrate,
  setCredentials,
  subscribe,
  type Session,
} from './auth-store'

/**
 * Service d'authentification, adossé aux route handlers Next.js :
 *
 *   POST /api/auth/login     { email, password }        → { access, token_type, expires_in, user }
 *   POST /api/auth/register  { email, password, name? } → idem (201)
 *   GET  /api/auth/me        Authorization: Bearer       → user
 */
export const AUTH_URL = (process.env.NEXT_PUBLIC_AUTH_URL ?? '/api/auth').replace(/\/+$/, '')

export class AuthError extends Error {
  constructor(
    message: string,
    readonly code: 'credentials' | 'validation' | 'conflict' | 'network' | 'server',
  ) {
    super(message)
    this.name = 'AuthError'
  }
}

interface AuthResponse {
  access: string
  token_type?: string
  expires_in?: number
  user?: { email: string; name: string | null; role: string }
}

async function postAuth(path: string, body: object): Promise<Session> {
  let response: Response
  try {
    response = await fetch(`${AUTH_URL}/${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(body),
      signal: withTimeout(),
    })
  } catch {
    throw new AuthError('Serveur d’authentification injoignable.', 'network')
  }

  const payload = (await response.json().catch(() => ({}))) as Partial<AuthResponse> & { erreur?: string }
  if (response.status === 401) throw new AuthError(payload.erreur ?? 'Identifiants incorrects.', 'credentials')
  if (response.status === 409) throw new AuthError(payload.erreur ?? 'Compte déjà existant.', 'conflict')
  if (response.status === 400 || response.status === 403) throw new AuthError(payload.erreur ?? 'Requête refusée.', 'validation')
  if (!response.ok) throw new AuthError(`Erreur ${response.status} du serveur.`, 'server')
  if (!payload.access) throw new AuthError('Réponse de connexion invalide.', 'server')

  const session: Session = {
    subject: payload.user?.email ?? (body as { email?: string }).email ?? 'Utilisateur',
    name: payload.user?.name ?? null,
    role: payload.user?.role ?? 'user',
    expiresAt: payload.expires_in ? Date.now() + payload.expires_in * 1000 : null,
  }
  setCredentials(payload.access, session)
  return session
}

export const login = (email: string, password: string) => postAuth('login', { email: email.trim(), password })
export const register = (email: string, password: string, name?: string) =>
  postAuth('register', { email: email.trim(), password, name })

export function logout() {
  clearCredentials()
}

/**
 * Vérifie que la session stockée est encore acceptée par le serveur. Une
 * variable locale ne suffit pas : un 401 révoque la session. Si le serveur
 * est momentanément injoignable, la session non expirée est conservée.
 */
export async function verifySession(): Promise<Session | null> {
  const token = getToken()
  if (!token) return null
  const stored = getSession()
  if (stored?.expiresAt && stored.expiresAt <= Date.now()) {
    clearCredentials()
    return null
  }
  try {
    const response = await fetch(`${AUTH_URL}/me`, {
      headers: { Accept: 'application/json', Authorization: `Bearer ${token}` },
      signal: withTimeout(),
      cache: 'no-store',
    })
    if (response.status === 401 || response.status === 403) {
      clearCredentials()
      return null
    }
    if (response.ok) {
      const me = (await response.json()) as { email: string; name: string | null; role: string }
      const session: Session = {
        subject: me.email,
        name: me.name,
        role: me.role,
        expiresAt: stored?.expiresAt ?? null,
      }
      setCredentials(token, session)
      return session
    }
  } catch {
    /* réseau indisponible : on garde la session stockée */
  }
  return stored
}

/* ------------------------------------------------------------------ hook */

export interface AuthState {
  ready: boolean
  authenticated: boolean
  session: Session | null
  login: typeof login
  register: typeof register
  logout: typeof logout
}

let verifying: Promise<Session | null> | null = null
let verified = false
const readyListeners = new Set<() => void>()

const ensureVerified = () => {
  if (verified || verifying) return
  hydrate()
  verifying = verifySession().finally(() => {
    verified = true
    verifying = null
    readyListeners.forEach((l) => l())
  })
}

const subscribeAll = (listener: () => void) => {
  const off = subscribe(listener)
  readyListeners.add(listener)
  return () => {
    off()
    readyListeners.delete(listener)
  }
}

export function useAuth(): AuthState {
  const session = useSyncExternalStore(subscribeAll, () => (verified ? getSession() : null), () => null)
  const ready = useSyncExternalStore(subscribeAll, () => verified, () => false)
  useEffect(ensureVerified, [])
  const doLogout = useCallback(() => logout(), [])
  return { ready, authenticated: ready && !!session, session, login, register, logout: doLogout }
}
