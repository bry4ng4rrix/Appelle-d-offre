"use client";

import { useMemo, useState } from "react";
import { ArrowRight, Clock3 } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { EXPIRING_SOON_DAYS } from "@/lib/dates";
import { useOffres, useStatistiques } from "@/lib/use-api";
import { byDeadline, isPublicOffer, PUBLIC_FILTERS, PUBLIC_PREVIEW_LIMIT } from "@/lib/visibility";
import Link from "next/link";
import { CardSkeletons, ErrorPanel } from "../common/async-state";
import { Empty } from "../common/empty";
import { LoginGate } from "./login-gate";
import { OfferCard } from "./offer-card";

/**
 * « Offres bientôt expirées » : les offres ouvertes dont l'échéance tombe
 * dans les EXPIRING_SOON_DAYS prochains jours, triées par urgence, limitées
 * à PUBLIC_PREVIEW_LIMIT. « Voir plus » invite à se connecter.
 */
export function ExpiringSection({ className = "" }: { className?: string }) {
  const { authenticated } = useAuth();
  const { data, loading, error, reload } = useOffres(PUBLIC_FILTERS);
  const stats = useStatistiques();
  const [gate, setGate] = useState(false);

  // Le filtre `urgence` de l'API dépend de son horloge ; on refiltre avec
  // la date réelle pour ne jamais afficher une offre déjà expirée.
  const offres = useMemo(
    () => (data?.offres ?? []).filter(isPublicOffer).sort(byDeadline),
    [data],
  );
  const shown = offres.slice(0, PUBLIC_PREVIEW_LIMIT);
  const hidden = Math.max(0, (data?.total ?? offres.length) - shown.length);

  return (
    <section className={`explore-section page-width ${className}`}>
      <div className="section-heading">
        <div>
          <span className="section-kicker">
            <Clock3 size={13} /> À NE PAS MANQUER
          </span>
          <h2>Offres bientôt expirées</h2>
          <p>
            Les appels d’offres qui se clôturent dans les {EXPIRING_SOON_DAYS} prochains jours.
          </p>
        </div>
        {authenticated ? (
          <Link href="/offres" className="outline-button">
            Toutes les offres <ArrowRight size={15} />
          </Link>
        ) : (
          <button className="outline-button" onClick={() => setGate(true)}>
            Voir plus <ArrowRight size={15} />
          </button>
        )}
      </div>

      {error ? (
        <ErrorPanel message={error} onRetry={reload} />
      ) : loading && !data ? (
        <CardSkeletons count={PUBLIC_PREVIEW_LIMIT} />
      ) : shown.length ? (
        <>
          <div className="tender-grid">
            {shown.map((offre) => (
              <OfferCard key={offre.id} offre={offre} />
            ))}
          </div>
          <div className="see-more">
            {authenticated ? (
              <Link href="/offres" className="primary">
                Voir toutes les offres <ArrowRight size={15} />
              </Link>
            ) : (
              <>
                <button className="primary" onClick={() => setGate(true)}>
                  Voir plus <ArrowRight size={15} />
                </button>
                {hidden > 0 && (
                  <small className="muted">
                    {hidden} autre{hidden > 1 ? "s" : ""} offre{hidden > 1 ? "s" : ""} bientôt expirée{hidden > 1 ? "s" : ""} et l’ensemble du catalogue après connexion
                  </small>
                )}
              </>
            )}
          </div>
        </>
      ) : (
        <Empty
          title="Aucune offre actuellement disponible."
          text={`Aucune échéance dans les ${EXPIRING_SOON_DAYS} prochains jours. Connectez-vous pour explorer l’ensemble du catalogue.`}
        />
      )}

      {gate && <LoginGate variant="modal" next="/offres" total={stats.data?.ouvertes} onClose={() => setGate(false)} />}
    </section>
  );
}
