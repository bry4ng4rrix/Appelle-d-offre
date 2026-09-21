"use client";

import Link from "next/link";
import { useMemo } from "react";
import { ArrowRight } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { formatNumber } from "@/lib/format";
import { useOffres } from "@/lib/use-api";
import { isOpen, isPublicOffer, PUBLIC_FILTERS } from "@/lib/visibility";
import { ErrorPanel, Loading } from "../common/async-state";
import { Glass } from "../common/glass";
import { OffersMap } from "../map/offers-map";

/** Section carte du landing : offres publiques (ou l'ensemble une fois connecté). */
export function LandingMap() {
  const { ready, authenticated } = useAuth();
  const { data, loading, error, reload } = useOffres(
    ready && authenticated ? { tri: "echeance", limite: 200 } : PUBLIC_FILTERS,
  );
  const offres = useMemo(() => {
    const items = data?.offres ?? [];
    return ready && authenticated ? items.filter(isOpen) : items.filter(isPublicOffer);
  }, [data, ready, authenticated]);

  return (
    <section className="world-map-section page-width" aria-labelledby="world-offers-title">
      <div className="section-heading map-heading">
        <div>
          <span className="section-kicker">LOCALISATION</span>
          <h2 id="world-offers-title">Les offres sur la carte</h2>
          <p>
            {authenticated
              ? "Chaque point regroupe les offres ouvertes d’un lieu."
              : "Les offres bientôt expirées, localisées. Connectez-vous pour voir l’ensemble."}
          </p>
        </div>
        <Link href="/carte" className="map-total link">
          <strong>{formatNumber(offres.length)}</strong> offres localisées <ArrowRight size={14} />
        </Link>
      </div>
      <Glass className="world-map-card map-panel landing-map">
        {error ? (
          <ErrorPanel message={error} onRetry={reload} />
        ) : !ready || (loading && !data) ? (
          <Loading label="Chargement de la carte…" />
        ) : (
          <OffersMap offres={offres} fill />
        )}
      </Glass>
    </section>
  );
}
