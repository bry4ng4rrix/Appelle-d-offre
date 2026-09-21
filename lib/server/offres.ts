import 'server-only'
import type { OffreDetail, OffresFilters, OffresResponse } from '../api-types'
import { localApi } from '../local-api'

/**
 * Source des offres côté serveur : l'API publique de veille, avec repli sur
 * le jeu local quand elle est injoignable. Les routes protégées de Next
 * s'appuient dessus pour servir le catalogue complet aux utilisateurs
 * authentifiés.
 */
const UPSTREAM = (
  process.env.API_UPSTREAM_URL ?? process.env.NEXT_PUBLIC_API_URL ?? 'http://192.168.88.12:8001/api/public'
).replace(/\/+$/, '')
const TIMEOUT = Number(process.env.API_UPSTREAM_TIMEOUT ?? 5000)
const RETRY_AFTER = 60_000

let downSince = 0

export type Source = 'api' | 'local'

async function upstream<T>(path: string, params: Record<string, unknown> = {}): Promise<T> {
  const url = new URL(`${UPSTREAM}/${path}`)
  for (const [k, v] of Object.entries(params)) {
    if (v === undefined || v === null || v === '' || v === false) continue
    url.searchParams.set(k, v === true ? '1' : String(v))
  }
  const response = await fetch(url, { signal: AbortSignal.timeout(TIMEOUT), headers: { Accept: 'application/json' }, cache: 'no-store' })
  if (!response.ok) throw Object.assign(new Error(`upstream ${response.status}`), { status: response.status })
  return (await response.json()) as T
}

async function withFallback<T>(remote: () => Promise<T>, local: () => T | undefined): Promise<{ data: T; source: Source }> {
  const resolveLocal = () => {
    const value = local()
    if (value === undefined) throw Object.assign(new Error('introuvable'), { status: 404 })
    return { data: value, source: 'local' as const }
  }
  if (downSince && Date.now() - downSince < RETRY_AFTER) return resolveLocal()
  try {
    const data = await remote()
    downSince = 0
    return { data, source: 'api' }
  } catch (error) {
    const status = (error as { status?: number }).status
    if (status && status !== 0) throw error // erreur HTTP réelle (404…)
    downSince = Date.now()
    return resolveLocal()
  }
}

export const listOffres = (filters: OffresFilters) =>
  withFallback(() => upstream<OffresResponse>('offres/', filters as Record<string, unknown>), () => localApi.offres(filters))

export const getOffreDetail = (id: string) =>
  withFallback(() => upstream<OffreDetail>(`offres/${encodeURIComponent(id)}/`), () => localApi.offre(id))
