/**
 * Logique d'échéance, centralisée pour être cohérente partout.
 *
 * Le backend travaille en `Indian/Antananarivo` et publie `date_limite`
 * au format YYYY-MM-DD (une date civile, sans heure). On compare donc des
 * dates civiles dans ce fuseau : pas de « 6.4 jours », pas de décalage
 * quand le navigateur est dans un autre fuseau.
 */
export const APP_TIMEZONE = 'Indian/Antananarivo'

/** Seuil (en jours) sous lequel une offre est « bientôt expirée ». */
export const EXPIRING_SOON_DAYS = 7

const civil = new Intl.DateTimeFormat('en-CA', {
  timeZone: APP_TIMEZONE,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
})

/** Date civile du jour dans le fuseau de l'application, en YYYY-MM-DD. */
export const todayCivil = (now: Date = new Date()) => civil.format(now)

/** YYYY-MM-DD → nombre de jours depuis l'époque (UTC, sans heure). */
const dayNumber = (ymd: string) => {
  const [y, m, d] = ymd.slice(0, 10).split('-').map(Number)
  if (!y || !m || !d) return null
  return Math.round(Date.UTC(y, m - 1, d) / 86_400_000)
}

/**
 * Jours restants avant `dateLimite` (inclus) : 0 = expire aujourd'hui,
 * négatif = déjà expirée, `null` si la date est absente ou illisible.
 */
export function daysUntil(dateLimite: string | null | undefined, now: Date = new Date()) {
  if (!dateLimite) return null
  const target = dayNumber(dateLimite)
  const today = dayNumber(todayCivil(now))
  if (target === null || today === null) return null
  return target - today
}

export const isExpired = (days: number | null) => days !== null && days < 0
export const isExpiringSoon = (days: number | null) =>
  days !== null && days >= 0 && days <= EXPIRING_SOON_DAYS

/** « Expire aujourd’hui », « Expire demain », « Expire dans 6 jours »… */
export function expiryLabel(days: number | null) {
  if (days === null) return 'Sans date limite'
  if (days < 0) return 'Expirée'
  if (days === 0) return 'Expire aujourd’hui'
  if (days === 1) return 'Expire demain'
  return `Expire dans ${days} jours`
}

const longDate = new Intl.DateTimeFormat('fr-FR', {
  timeZone: APP_TIMEZONE,
  day: 'numeric',
  month: 'long',
  year: 'numeric',
})
const shortDate = new Intl.DateTimeFormat('fr-FR', {
  timeZone: APP_TIMEZONE,
  day: 'numeric',
  month: 'short',
  year: 'numeric',
})
const dateTime = new Intl.DateTimeFormat('fr-FR', {
  timeZone: APP_TIMEZONE,
  day: 'numeric',
  month: 'short',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
})

const parse = (value: string) => {
  // Une date civile seule est interprétée à midi pour éviter tout glissement.
  const date = new Date(/^\d{4}-\d{2}-\d{2}$/.test(value) ? `${value}T12:00:00` : value)
  return Number.isNaN(date.getTime()) ? null : date
}

export const formatDateLong = (value: string | null | undefined) => {
  const d = value ? parse(value) : null
  return d ? longDate.format(d) : '—'
}
export const formatDateShort = (value: string | null | undefined) => {
  const d = value ? parse(value) : null
  return d ? shortDate.format(d) : '—'
}
export const formatDateTime = (value: string | null | undefined) => {
  const d = value ? parse(value) : null
  return d ? dateTime.format(d) : '—'
}

/** Ajoute `days` jours à la date civile du jour (utilisé par le jeu local). */
export function civilDatePlus(days: number, now: Date = new Date()) {
  const base = dayNumber(todayCivil(now)) ?? 0
  return new Date((base + days) * 86_400_000).toISOString().slice(0, 10)
}
