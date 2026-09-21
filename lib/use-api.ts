'use client'

import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react'
import {
  CACHE_KEYS,
  getApiIndex,
  getCartePoints,
  getLieux,
  getOffre,
  getOffres,
  getRegions,
  getSecteurs,
  getSources,
  getStatistiques,
  getDataSource,
  invalidateApiCache,
  subscribeDataSource,
  type DataSource,
} from './api'
import type {
  ApiIndex,
  CarteFilters,
  CartePoint,
  Lieu,
  OffreDetail,
  OffresFilters,
  OffresResponse,
  Region,
  Secteur,
  SourceStat,
  Statistiques,
} from './api-types'

export interface AsyncState<T> {
  data: T | undefined
  loading: boolean
  error: string | undefined
  reload: () => void
}

const messageOf = (error: unknown) =>
  error instanceof Error ? error.message : 'Erreur inattendue.'

/**
 * Socle commun : exécute `loader`, annule la requête au démontage ou quand
 * `deps` change, et n'applique jamais le résultat d'une requête périmée.
 * Un `loader` à `null` met le hook en veille (aucun appel réseau).
 */
function useAsync<T>(
  loader: ((signal: AbortSignal) => Promise<T>) | null,
  deps: unknown[],
): AsyncState<T> {
  const [data, setData] = useState<T>()
  const [loading, setLoading] = useState(loader !== null)
  const [error, setError] = useState<string>()
  const [nonce, setNonce] = useState(0)
  const loaderRef = useRef(loader)
  loaderRef.current = loader

  useEffect(() => {
    const run = loaderRef.current
    if (!run) {
      setData(undefined)
      setError(undefined)
      setLoading(false)
      return
    }
    const controller = new AbortController()
    setLoading(true)
    setError(undefined)
    run(controller.signal)
      .then((value) => {
        if (controller.signal.aborted) return
        setData(value)
        setLoading(false)
      })
      .catch((err: unknown) => {
        if (controller.signal.aborted || (err as Error)?.name === 'AbortError') return
        setError(messageOf(err))
        setLoading(false)
      })
    return () => controller.abort()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, nonce])

  const reload = useCallback(() => setNonce((n) => n + 1), [])
  return { data, loading, error, reload }
}

/**
 * Variante pour les endpoints mis en cache : `reload` invalide d'abord
 * l'entrée, sans quoi le bouton « Rafraîchir » resservirait le cache.
 */
function useCachedAsync<T>(key: string, loader: () => Promise<T>): AsyncState<T> {
  const state = useAsync(() => loader(), [])
  const { reload } = state
  const forceReload = useCallback(() => {
    invalidateApiCache(key)
    reload()
  }, [key, reload])
  return { ...state, reload: forceReload }
}

/* ------------------------------------------------------------------- hooks */

/** `GET /` — index auto-décrit de l'API */
export const useApiIndex = (): AsyncState<ApiIndex> =>
  useAsync((signal) => getApiIndex(signal), [])

/** `GET /offres/` — liste filtrée. `key` sérialise les filtres pour les deps. */
export function useOffres(filters: OffresFilters = {}): AsyncState<OffresResponse> {
  const key = JSON.stringify(filters)
  const stable = useMemo(() => JSON.parse(key) as OffresFilters, [key])
  return useAsync((signal) => getOffres(stable, signal), [key])
}

/** `GET /offres/<id>/` — fiche complète (en veille tant que `id` est nul) */
export const useOffre = (id: string | null): AsyncState<OffreDetail> =>
  useAsync(id ? (signal) => getOffre(id, signal) : null, [id])

/** `GET /statistiques/` */
export const useStatistiques = (): AsyncState<Statistiques> =>
  useAsync((signal) => getStatistiques(signal), [])

/** `GET /sources/` */
export const useSources = (): AsyncState<SourceStat[]> =>
  useCachedAsync(CACHE_KEYS.sources, getSources)

/** `GET /secteurs/` */
export const useSecteurs = (): AsyncState<Secteur[]> =>
  useCachedAsync(CACHE_KEYS.secteurs, getSecteurs)

/** `GET /regions/` */
export const useRegions = (): AsyncState<Region[]> =>
  useCachedAsync(CACHE_KEYS.regions, getRegions)

/** `GET /lieux/` */
export const useLieux = (): AsyncState<Lieu[]> =>
  useCachedAsync(CACHE_KEYS.lieux, getLieux)

/** `GET /carte/points/` */
export function useCartePoints(filters: CarteFilters = {}): AsyncState<CartePoint[]> {
  const key = JSON.stringify(filters)
  const stable = useMemo(() => JSON.parse(key) as CarteFilters, [key])
  return useAsync((signal) => getCartePoints(stable, signal), [key])
}

/** Source de données effective (API ou jeu local), pour le bandeau d'information. */
export function useDataSource(): DataSource {
  return useSyncExternalStore(subscribeDataSource, getDataSource, () => 'unknown' as DataSource)
}
