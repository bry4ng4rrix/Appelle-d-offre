// Types miroir des réponses de l'API publique « Veille appels d'offres »
// http://<host>/api/public/

export type Nature = 'marche' | 'emploi' | 'non_qualifiee'
export type Tri = 'echeance' | 'publication' | 'ajout'

export interface Localisation {
  lieu: string | null
  region: string | null
  region_libelle: string | null
  lat: number | null
  lon: number | null
}

/** Élément de la liste `GET /offres/` */
export interface Offre {
  id: string
  source: string
  titre: string
  organisation: string | null
  pays: string | null
  localisation: Localisation
  /** `null` pour les offres que le collecteur n'a pas su qualifier. */
  nature: Nature | null
  /** `null` pour les offres que le collecteur n'a pas su qualifier. */
  secteur: string | null
  categorie: string | null
  date_publication: string | null
  date_limite: string | null
  jours_restants: number | null
  urgente: boolean
  ouverte: boolean
  lien: string | null
  lien_etat: string | null
  date_ajout: string
  date_maj: string
}

/** `GET /offres/<id>/` : l'offre complète, avec description et raison de rétention */
export interface OffreDetail extends Offre {
  description: string | null
  raison: string | null
}

export interface OffresResponse {
  total: number
  depuis: number
  limite: number
  tri: Tri
  offres: Offre[]
}

/** Filtres acceptés par `GET /offres/` */
export interface OffresFilters {
  nature?: Nature | ''
  secteur?: string
  source?: string
  categorie?: string
  pays?: string
  region?: string
  lieu?: string
  /** n'expose que les offres dont l'échéance tombe dans les N prochains jours */
  urgence?: number
  q?: string
  /** inclure les offres déjà closes */
  cloturees?: boolean
  tri?: Tri
  /** 1..200 */
  limite?: number
  depuis?: number
}

export interface Statistiques {
  retenues: number
  ouvertes: number
  urgentes: number
  par_nature: Record<string, number>
  par_secteur: Record<string, number>
  par_source: Record<string, number>
  par_region: Record<string, number>
  derniere_collecte: string | null
}

export interface SourceStat {
  source: string
  retenues: number
  ouvertes: number
  derniere_collecte: string | null
}

export interface Secteur {
  code: string
  libelle: string
  ouvertes: number
}

export interface Region {
  code: string
  libelle: string
  lieux: string[]
  ouvertes: number
}

export interface Lieu {
  lieu: string
  region: string
  region_libelle: string
  lat: number | null
  lon: number | null
  ouvertes: number
}

export interface CartePointExemple {
  id: string
  titre: string
}

export interface CartePoint {
  lieu: string
  lat: number | null
  lon: number | null
  region: string
  total: number
  marches: number
  emplois: number
  urgentes: number
  informatique: number
  construction: number
  agriculture: number
  eau: number
  environnement: number
  exemples: CartePointExemple[]
}

/** Filtres acceptés par `GET /carte/points/` */
export interface CarteFilters {
  nature?: Nature | ''
  secteur?: string
  source?: string
  region?: string
  urgence?: number
  q?: string
}

/** `GET /` : index auto-décrit de l'API */
export interface ApiIndex {
  nom: string
  authentification: string
  cors: string
  sources_exclues: string[]
  routes: Record<string, { url: string; filtres?: string[] }>
}
