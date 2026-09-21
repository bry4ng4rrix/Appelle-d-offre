import type {
  ApiIndex,
  CarteFilters,
  CartePoint,
  Lieu,
  Offre,
  OffreDetail,
  OffresFilters,
  OffresResponse,
  Region,
  Secteur,
  SourceStat,
  Statistiques,
} from './api-types'
import { clearCredentials, getToken } from './auth-store'
import { localApi } from './local-api'

/**
 * Base de l'API publique. Surchargeable via NEXT_PUBLIC_API_URL.
 */
export const API_BASE = (
  process.env.NEXT_PUBLIC_API_URL ?? 'http://192.168.88.12:8001/api/public'
).replace(/\/+$/, '')

/**
 * Mode de données :
 *  - `auto`  : réseau d'abord, repli local si l'API est injoignable ;
 *  - `local` : jeu local uniquement (démo hors ligne) ;
 *  - `api`   : réseau uniquement, les pannes remontent en erreur.
 */
export const DATA_MODE = (process.env.NEXT_PUBLIC_DATA_MODE ?? 'auto') as 'auto' | 'local' | 'api'

/** Délai maximal d'une requête ; au-delà, l'API est considérée injoignable. */
const REQUEST_TIMEOUT = 6000
/** Une fois l'API vue injoignable, on ne la re-sonde qu'après ce délai. */
const RETRY_AFTER = 60_000

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly url: string,
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

/* --------------------------------------------------- source de données */

export type DataSource = 'unknown' | 'api' | 'local'
let dataSource: DataSource = DATA_MODE === 'local' ? 'local' : 'unknown'
/**
 * Instant de la dernière panne réseau constatée (disjoncteur). Persisté en
 * sessionStorage pour qu'un rechargement de page ne refasse pas attendre
 * l'utilisateur le temps du délai réseau.
 */
const DOWN_KEY = 'appelpro.api-down-since'
const readDown = () => {
  try {
    return Number(sessionStorage.getItem(DOWN_KEY) ?? 0) || 0
  } catch {
    return 0
  }
}
const writeDown = (value: number) => {
  try {
    if (value) sessionStorage.setItem(DOWN_KEY, String(value))
    else sessionStorage.removeItem(DOWN_KEY)
  } catch {
    /* stockage indisponible */
  }
}
let downSince = typeof window !== 'undefined' ? readDown() : 0
if (downSince && Date.now() - downSince < RETRY_AFTER && DATA_MODE === 'auto') dataSource = 'local'
const sourceListeners = new Set<() => void>()
const setDataSource = (next: DataSource) => {
  if (dataSource === next) return
  dataSource = next
  sourceListeners.forEach((l) => l())
}
export const getDataSource = () => dataSource
export const subscribeDataSource = (l: () => void) => {
  sourceListeners.add(l)
  return () => {
    sourceListeners.delete(l)
  }
}

/* ------------------------------------------------------------- requête */

type Params = Record<string, string | number | boolean | undefined | null>

/** Combine le signal de l'appelant avec un délai d'attente. */
export function withTimeout(signal?: AbortSignal, ms = REQUEST_TIMEOUT) {
  const timeout = AbortSignal.timeout(ms)
  return signal ? AbortSignal.any([signal, timeout]) : timeout
}

const buildUrl = (path: string, params?: Params) => {
  const url = new URL(`${API_BASE}/${path.replace(/^\/+/, '')}`)
  for (const [key, value] of Object.entries(params ?? {})) {
    if (value === undefined || value === null || value === '' || value === false) continue
    url.searchParams.set(key, value === true ? '1' : String(value))
  }
  return url.toString()
}

/** Requête vers l'API publique de veille. */
async function request<T>(path: string, params?: Params, signal?: AbortSignal): Promise<T> {
  const url = buildUrl(path, params)
  // API publique tierce : jamais de jeton ici, il ne quitte pas notre origine.
  const headers: Record<string, string> = { Accept: 'application/json' }

  let response: Response
  try {
    response = await fetch(url, { signal: withTimeout(signal), headers })
  } catch (error) {
    // Annulation demandée par l'appelant : on la laisse remonter telle quelle.
    if (signal?.aborted) throw error
    throw new ApiError('Impossible de joindre l’API.', 0, url)
  }
  if (!response.ok) {
    throw new ApiError(
      response.status === 404 ? 'Ressource introuvable.' : `Erreur ${response.status} de l’API.`,
      response.status,
      url,
    )
  }
  return (await response.json()) as T
}

/**
 * Exécute la version réseau, ou bascule sur la version locale si l'API est
 * injoignable (statut 0) en mode `auto`. Les erreurs HTTP réelles (404…)
 * remontent telles quelles : elles ne signifient pas que l'API est absente.
 */
async function withFallback<T>(
  remote: () => Promise<T>,
  local: () => T | undefined,
  signal?: AbortSignal,
): Promise<T> {
  if (DATA_MODE === 'local') return resolveLocal(local)
  // Disjoncteur : API vue injoignable il y a peu → local direct, sans attendre.
  if (DATA_MODE === 'auto' && downSince && Date.now() - downSince < RETRY_AFTER) {
    return resolveLocal(local)
  }
  try {
    const value = await remote()
    downSince = 0
    writeDown(0)
    setDataSource('api')
    return value
  } catch (error) {
    if (signal?.aborted) throw error
    if (DATA_MODE === 'api' || !(error instanceof ApiError) || error.status !== 0) throw error
    downSince = Date.now()
    writeDown(downSince)
    setDataSource('local')
    return resolveLocal(local)
  }
}

const resolveLocal = <T,>(local: () => T | undefined): T => {
  const value = local()
  if (value === undefined) throw new ApiError('Ressource introuvable.', 404, 'local')
  return value
}

/* ---------------------------------------------------------------- cache */

const CACHE_TTL = 5 * 60 * 1000
const cache = new Map<string, { at: number; value: unknown }>()
const inflight = new Map<string, Promise<unknown>>()

function cached<T>(key: string, loader: () => Promise<T>): Promise<T> {
  const hit = cache.get(key)
  if (hit && Date.now() - hit.at < CACHE_TTL) return Promise.resolve(hit.value as T)
  const pending = inflight.get(key)
  if (pending) return pending as Promise<T>
  const promise = loader()
    .then((value) => {
      cache.set(key, { at: Date.now(), value })
      return value
    })
    .finally(() => inflight.delete(key))
  inflight.set(key, promise)
  return promise
}

export const invalidateApiCache = (key?: string) => {
  if (key === undefined) {
    cache.clear()
    inflight.clear()
    return
  }
  cache.delete(key)
  inflight.delete(key)
}

export const CACHE_KEYS = {
  sources: 'sources',
  secteurs: 'secteurs',
  regions: 'regions',
  lieux: 'lieux',
} as const

/* -------------------------------------------------- routes protégées Next */

/** Base des routes Next.js réservées aux utilisateurs connectés (même origine). */
export const PROTECTED_BASE = (process.env.NEXT_PUBLIC_PROTECTED_API_URL ?? '/api').replace(/\/+$/, '')

/**
 * Appelle une route protégée de Next.js avec le Bearer. Le serveur assure
 * lui-même le repli local et l'annonce dans `X-Data-Source`.
 */
async function requestProtected<T>(path: string, params?: Params, signal?: AbortSignal): Promise<T> {
  const token = getToken()
  if (!token) throw new ApiError('Authentification requise.', 401, path)
  const query = new URLSearchParams()
  for (const [key, value] of Object.entries(params ?? {})) {
    if (value === undefined || value === null || value === '' || value === false) continue
    query.set(key, value === true ? '1' : String(value))
  }
  const url = `${PROTECTED_BASE}/${path}${query.size ? `?${query}` : ''}`
  let response: Response
  try {
    response = await fetch(url, {
      signal: withTimeout(signal, 15_000),
      headers: { Accept: 'application/json', Authorization: `Bearer ${token}` },
      cache: 'no-store',
    })
  } catch (error) {
    if (signal?.aborted) throw error
    throw new ApiError('Serveur injoignable.', 0, url)
  }
  if (response.status === 401) {
    clearCredentials()
    throw new ApiError('Session expirée, veuillez vous reconnecter.', 401, url)
  }
  if (!response.ok) {
    const body = (await response.json().catch(() => ({}))) as { erreur?: string }
    throw new ApiError(body.erreur ?? `Erreur ${response.status}.`, response.status, url)
  }
  setDataSource(response.headers.get('X-Data-Source') === 'local' ? 'local' : 'api')
  return (await response.json()) as T
}

/* ------------------------------------------------------------ endpoints */

export const getApiIndex = (signal?: AbortSignal) =>
  withFallback(() => request<ApiIndex>('', undefined, signal), () => localApi.index(), signal)

/**
 * Offres : connecté → catalogue complet via la route protégée Next ;
 * sinon → API publique (avec repli local côté client).
 */
export const getOffres = (filters: OffresFilters = {}, signal?: AbortSignal) =>
  getToken()
    ? requestProtected<OffresResponse>('offres', filters as Params, signal)
    : withFallback(
        () => request<OffresResponse>('offres/', filters as Params, signal),
        () => localApi.offres(filters),
        signal,
      )

export const getOffre = (id: string, signal?: AbortSignal) =>
  getToken()
    ? requestProtected<OffreDetail>(`offres/${encodeURIComponent(id)}`, undefined, signal)
    : withFallback(
        () => request<OffreDetail>(`offres/${encodeURIComponent(id)}/`, undefined, signal),
        () => localApi.offre(id),
        signal,
      )

export const getStatistiques = (signal?: AbortSignal) =>
  withFallback(
    () => request<Statistiques>('statistiques/', undefined, signal),
    () => localApi.statistiques(),
    signal,
  )

export const getSources = () =>
  cached(CACHE_KEYS.sources, () =>
    withFallback(
      () => request<{ sources: SourceStat[] }>('sources/').then((r) => r.sources),
      () => localApi.sources(),
    ),
  )

export const getSecteurs = () =>
  cached(CACHE_KEYS.secteurs, () =>
    withFallback(
      () => request<{ secteurs: Secteur[] }>('secteurs/').then((r) => r.secteurs),
      () => localApi.secteurs(),
    ),
  )

export const getRegions = () =>
  cached(CACHE_KEYS.regions, () =>
    withFallback(
      () => request<{ regions: Region[] }>('regions/').then((r) => r.regions),
      () => localApi.regions(),
    ),
  )

export const getLieux = () =>
  cached(CACHE_KEYS.lieux, () =>
    withFallback(
      () => request<{ lieux: Lieu[] }>('lieux/').then((r) => r.lieux),
      () => localApi.lieux(),
    ),
  )

export const getCartePoints = (filters: CarteFilters = {}, signal?: AbortSignal) =>
  withFallback(
    () => request<{ points: CartePoint[] }>('carte/points/', filters as Params, signal).then((r) => r.points),
    () => localApi.cartePoints(filters),
    signal,
  )

export type { Offre, OffreDetail, CartePoint, Lieu, Region, Secteur, SourceStat, Statistiques }
