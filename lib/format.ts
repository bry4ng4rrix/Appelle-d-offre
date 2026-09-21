import type { Nature, Offre } from './api-types'

export const natureLabels: Record<string, string> = {
  marche: 'Marché',
  emploi: 'Emploi',
  non_qualifiee: 'Non qualifiée',
}

export const secteurLabels: Record<string, string> = {
  informatique: 'Informatique',
  construction: 'Construction',
  agriculture: 'Agriculture',
  eau: 'Eau',
  environnement: 'Environnement',
  non_qualifie: 'Non qualifié',
}

export const regionLabels: Record<string, string> = {
  afrique: 'Afrique',
  ameriques: 'Amériques',
  'asie-pacifique': 'Asie-Pacifique',
  europe: 'Europe',
  international: 'International',
  madagascar: 'Madagascar',
  'moyen-orient': 'Moyen-Orient',
  'ocean-indien': 'Océan Indien',
  inconnue: 'Non localisées',
}

/** Les codes source sont des slugs de collecteur — on les rend lisibles. */
export const sourceLabels: Record<string, string> = {
  armp: 'ARMP Madagascar',
  bad: 'Banque africaine de dév.',
  banquemondiale: 'Banque mondiale',
  'banquemondiale-avis': 'Banque mondiale (avis)',
  boamp: 'BOAMP France',
  coi: 'Commission Océan Indien',
  fid: 'FID Madagascar',
  ted: 'TED Europe',
  unjobnet: 'UN Jobnet',
  wwf: 'WWF',
  mnp: 'Madagascar National Parks',
  conservation: 'Conservation Intl.',
  afriquedusud: 'Afrique du Sud',
  namibie: 'Namibie',
  maurice: 'Maurice',
  cameroun: 'Cameroun',
  maroc: 'Maroc',
  kenya: 'Kenya',
  ghana: 'Ghana',
  malawi: 'Malawi',
  benin: 'Bénin',
}

const titleCase = (value: string) =>
  value.replace(/[-_]/g, ' ').replace(/^./, (c) => c.toUpperCase())

/** Codes « bucket » renvoyés par /statistiques/ pour les offres non qualifiées. */
export const UNQUALIFIED = ['non_qualifie', 'non_qualifiee']

/** L'API ne sait pas filtrer sur les buckets non qualifiés : ils valent null. */
export const isFilterable = (code: string | null | undefined): code is string =>
  !!code && !UNQUALIFIED.includes(code)

export const labelSecteur = (code: string | null | undefined) =>
  !code ? 'Non qualifié' : (secteurLabels[code] ?? titleCase(code))
export const labelNature = (nature: Nature | string | null | undefined) =>
  !nature ? 'Non qualifiée' : (natureLabels[nature] ?? titleCase(nature))
export const labelSource = (code: string | null | undefined) =>
  !code ? 'Source inconnue' : (sourceLabels[code] ?? titleCase(code))
export const labelRegion = (code: string | null | undefined) =>
  !code ? 'Non localisées' : (regionLabels[code] ?? titleCase(code))

export const formatNumber = (value: number) => new Intl.NumberFormat('fr-FR').format(value)

export function formatRelative(value: string | null | undefined) {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  const minutes = Math.round((Date.now() - date.getTime()) / 60000)
  if (minutes < 1) return 'à l’instant'
  if (minutes < 60) return `il y a ${minutes} min`
  const hours = Math.round(minutes / 60)
  if (hours < 24) return `il y a ${hours} h`
  const days = Math.round(hours / 24)
  return days < 31 ? `il y a ${days} j` : date.toLocaleDateString('fr-FR')
}

export const offreLocation = (offre: Pick<Offre, 'localisation' | 'pays'>) =>
  offre.localisation?.lieu ?? offre.pays ?? 'Localisation inconnue'

/** Tonalité visuelle des badges d'échéance. */
export function deadlineTone(days: number | null, ouverte = true) {
  if (!ouverte || (days !== null && days < 0)) return 'neutral'
  if (days === null) return 'neutral'
  if (days <= 2) return 'danger'
  if (days <= 7) return 'warning'
  return 'success'
}

/** Statut affichable d'une offre, déduit de l'échéance réelle. */
export function offreStatus(days: number | null, ouverte: boolean) {
  if (!ouverte || (days !== null && days < 0)) return { label: 'Expirée', tone: 'neutral' }
  if (days !== null && days <= 7) return { label: 'Expire bientôt', tone: 'warning' }
  return { label: 'Ouverte', tone: 'success' }
}
