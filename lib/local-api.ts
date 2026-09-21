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
import { daysUntil } from './dates'
import { localCollecte, localOffres } from './local-data'

/**
 * Implémentation locale des endpoints publics, avec la même sémantique de
 * filtrage/pagination que le backend. Sert de repli quand l'API est
 * injoignable ; les composants ne voient aucune différence.
 */

const normalize = (s: string) =>
  s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()

/** Recalcule l'échéance au moment de la lecture : le jeu est stable, pas le jour. */
const fresh = (o: OffreDetail): OffreDetail => {
  const jours = daysUntil(o.date_limite)
  return {
    ...o,
    jours_restants: jours,
    urgente: jours !== null && jours >= 0 && jours <= 7,
    ouverte: jours === null || jours >= 0,
  }
}

const toListItem = ({ description: _d, raison: _r, ...offre }: OffreDetail): Offre => offre

function applyFilters(filters: OffresFilters) {
  let items = localOffres.map(fresh)
  if (!filters.cloturees) items = items.filter((o) => o.ouverte)
  if (filters.nature) items = items.filter((o) => o.nature === filters.nature)
  if (filters.secteur) items = items.filter((o) => o.secteur === filters.secteur)
  if (filters.source) items = items.filter((o) => o.source === filters.source)
  if (filters.region) items = items.filter((o) => o.localisation.region === filters.region)
  if (filters.lieu) items = items.filter((o) => o.localisation.lieu === filters.lieu)
  if (filters.pays) items = items.filter((o) => o.pays === filters.pays)
  if (filters.categorie) {
    const c = normalize(filters.categorie)
    items = items.filter((o) => o.categorie && normalize(o.categorie).includes(c))
  }
  if (filters.urgence) {
    const max = Number(filters.urgence)
    items = items.filter((o) => o.jours_restants !== null && o.jours_restants >= 0 && o.jours_restants <= max)
  }
  if (filters.q) {
    const terms = normalize(filters.q).split(/\s+/).filter(Boolean)
    items = items.filter((o) => {
      const hay = normalize(`${o.titre} ${o.organisation ?? ''} ${o.categorie ?? ''} ${o.description ?? ''} ${o.pays ?? ''}`)
      return terms.every((t) => hay.includes(t))
    })
  }
  const tri = filters.tri ?? 'ajout'
  items.sort((a, b) => {
    if (tri === 'echeance') return (a.jours_restants ?? Infinity) - (b.jours_restants ?? Infinity)
    if (tri === 'publication') return (b.date_publication ?? '').localeCompare(a.date_publication ?? '')
    return b.date_ajout.localeCompare(a.date_ajout)
  })
  return items
}

export const localApi = {
  index: (): ApiIndex => ({
    nom: "Veille appels d'offres — jeu local",
    authentification: 'aucune',
    cors: '*',
    sources_exclues: [],
    routes: {},
  }),

  offres: (filters: OffresFilters = {}): OffresResponse => {
    const items = applyFilters(filters)
    const limite = Math.min(200, Math.max(1, filters.limite ?? 50))
    const depuis = Math.max(0, filters.depuis ?? 0)
    return {
      total: items.length,
      depuis,
      limite,
      tri: filters.tri ?? 'ajout',
      offres: items.slice(depuis, depuis + limite).map(toListItem),
    }
  },

  offre: (id: string): OffreDetail | undefined => {
    const found = localOffres.find((o) => o.id === id)
    return found ? fresh(found) : undefined
  },

  statistiques: (): Statistiques => {
    const all = localOffres.map(fresh)
    const open = all.filter((o) => o.ouverte)
    const count = (key: (o: OffreDetail) => string | null) =>
      open.reduce<Record<string, number>>((acc, o) => {
        const k = key(o) ?? 'non_qualifie'
        acc[k] = (acc[k] ?? 0) + 1
        return acc
      }, {})
    return {
      retenues: all.length,
      ouvertes: open.length,
      urgentes: open.filter((o) => o.urgente).length,
      par_nature: count((o) => o.nature),
      par_secteur: count((o) => o.secteur),
      par_source: count((o) => o.source),
      par_region: count((o) => o.localisation.region),
      derniere_collecte: localCollecte,
    }
  },

  sources: (): SourceStat[] => {
    const map = new Map<string, SourceStat>()
    for (const o of localOffres.map(fresh)) {
      const s = map.get(o.source) ?? { source: o.source, retenues: 0, ouvertes: 0, derniere_collecte: localCollecte }
      s.retenues += 1
      if (o.ouverte) s.ouvertes += 1
      map.set(o.source, s)
    }
    return [...map.values()].sort((a, b) => a.source.localeCompare(b.source))
  },

  secteurs: (): Secteur[] => {
    const libelles: Record<string, string> = {
      informatique: 'Informatique', construction: 'Construction', agriculture: 'Agriculture',
      eau: 'Eau', environnement: 'Environnement',
    }
    const open = localOffres.map(fresh).filter((o) => o.ouverte)
    return Object.keys(libelles)
      .map((code) => ({ code, libelle: libelles[code], ouvertes: open.filter((o) => o.secteur === code).length }))
      .sort((a, b) => b.ouvertes - a.ouvertes)
  },

  regions: (): Region[] => {
    const map = new Map<string, Region>()
    for (const o of localOffres.map(fresh).filter((o) => o.ouverte)) {
      const code = o.localisation.region ?? 'inconnue'
      const r = map.get(code) ?? { code, libelle: o.localisation.region_libelle ?? 'Inconnue', lieux: [], ouvertes: 0 }
      if (o.localisation.lieu) r.lieux.push(o.localisation.lieu)
      r.ouvertes += 1
      map.set(code, r)
    }
    return [...map.values()].sort((a, b) => b.ouvertes - a.ouvertes)
  },

  lieux: (): Lieu[] => {
    const map = new Map<string, Lieu>()
    for (const o of localOffres.map(fresh).filter((o) => o.ouverte)) {
      const l = o.localisation
      if (!l.lieu) continue
      const cur = map.get(l.lieu) ?? {
        lieu: l.lieu, region: l.region ?? 'inconnue', region_libelle: l.region_libelle ?? 'Inconnue',
        lat: l.lat, lon: l.lon, ouvertes: 0,
      }
      cur.ouvertes += 1
      map.set(l.lieu, cur)
    }
    return [...map.values()].sort((a, b) => b.ouvertes - a.ouvertes)
  },

  cartePoints: (filters: CarteFilters = {}): CartePoint[] => {
    const map = new Map<string, CartePoint>()
    for (const o of applyFilters({ ...filters })) {
      const l = o.localisation
      if (!l.lieu) continue
      const p = map.get(l.lieu) ?? {
        lieu: l.lieu, lat: l.lat, lon: l.lon, region: l.region_libelle ?? 'Inconnue',
        total: 0, marches: 0, emplois: 0, urgentes: 0,
        informatique: 0, construction: 0, agriculture: 0, eau: 0, environnement: 0, exemples: [],
      }
      p.total += 1
      if (o.nature === 'marche') p.marches += 1
      if (o.nature === 'emploi') p.emplois += 1
      if (o.urgente) p.urgentes += 1
      if (o.secteur && o.secteur in p) (p as unknown as Record<string, number>)[o.secteur] += 1
      if (p.exemples.length < 3) p.exemples.push({ id: o.id, titre: o.titre })
      map.set(l.lieu, p)
    }
    return [...map.values()].sort((a, b) => b.total - a.total)
  },
}
