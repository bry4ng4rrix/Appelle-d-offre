"use client";

import { formatNumber, formatRelative } from "@/lib/format";
import { useSources, useStatistiques } from "@/lib/use-api";

const display = (value: number | undefined) => (value === undefined ? "—" : formatNumber(value));

/** Chiffres du landing, alimentés par `/statistiques/` et `/sources/`. */
export function LandingStats() {
  const { data } = useStatistiques();
  const sources = useSources();
  return (
    <section className="stats page-width">
      <div>
        <strong>{display(data?.ouvertes)}</strong>
        <small>offres ouvertes</small>
      </div>
      <div>
        <strong>{display(data?.urgentes)}</strong>
        <small>expirent sous 7 jours</small>
      </div>
      <div>
        <strong>{display(data?.retenues)}</strong>
        <small>offres collectées</small>
      </div>
      <div>
        <strong>{display(sources.data?.length)}</strong>
        <small>sources · mise à jour {formatRelative(data?.derniere_collecte)}</small>
      </div>
    </section>
  );
}
