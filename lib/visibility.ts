import type { Offre } from './api-types'
import { daysUntil, EXPIRING_SOON_DAYS, isExpiringSoon } from './dates'

/**
 * Règle d'accès côté client.
 *
 * Sans connexion, seules les offres ouvertes qui expirent dans les
 * EXPIRING_SOON_DAYS prochains jours sont consultables, et la page
 * d'accueil n'en met en avant qu'un nombre limité. Tout le reste
 * nécessite une session.
 */
export const PUBLIC_PREVIEW_LIMIT = 6

/** Jours restants recalculés côté client, à partir de la date réelle. */
export const remainingDays = (offre: Pick<Offre, 'date_limite' | 'jours_restants'>) =>
  offre.date_limite ? daysUntil(offre.date_limite) : (offre.jours_restants ?? null)

export const isOpen = (offre: Pick<Offre, 'date_limite' | 'jours_restants' | 'ouverte'>) => {
  const days = remainingDays(offre)
  return days === null ? offre.ouverte : days >= 0
}

export const isPublicOffer = (offre: Pick<Offre, 'date_limite' | 'jours_restants' | 'ouverte'>) =>
  isOpen(offre) && isExpiringSoon(remainingDays(offre))

export const canView = (offre: Pick<Offre, 'date_limite' | 'jours_restants' | 'ouverte'>, authenticated: boolean) =>
  authenticated || isPublicOffer(offre)

/** Filtres API correspondant à l'aperçu public. */
export const PUBLIC_FILTERS = { urgence: EXPIRING_SOON_DAYS, tri: 'echeance' as const, limite: 50 }

/** Tri par échéance croissante, offres sans date en dernier. */
export const byDeadline = (a: Offre, b: Offre) =>
  (remainingDays(a) ?? Infinity) - (remainingDays(b) ?? Infinity)
