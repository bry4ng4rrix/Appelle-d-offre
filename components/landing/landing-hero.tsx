"use client";

import Link from "next/link";
import { ArrowRight, Clock3 } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { EXPIRING_SOON_DAYS } from "@/lib/dates";
import { formatNumber } from "@/lib/format";
import { useStatistiques } from "@/lib/use-api";
import { Glass } from "../common/glass";

/** Hero du landing, conservé ; seuls le texte et les boutons suivent le nouveau concept. */
export function LandingHero() {
  const { authenticated } = useAuth();
  const { data } = useStatistiques();
  const ratio = data ? Math.min(100, Math.round((data.urgentes / Math.max(1, data.ouvertes)) * 100)) : 0;

  return (
    <section className="hero page-width">
      <div className="hero-copy">
        <div className="status-pill">
          <span className="pulse" /> Veille d’appels d’offres, mise à jour en continu
        </div>
        <h1>
          Les bonnes opportunités.
          <br />
          <span>Au bon moment.</span>
        </h1>
        <p>
          Découvrez les appels d’offres disponibles, repérez ceux qui expirent bientôt,
          localisez-les sur la carte et consultez toutes leurs informations en un clic.
        </p>
        <div className="hero-actions">
          <Link href="/offres" className="primary">
            Voir les offres <ArrowRight size={16} />
          </Link>
          {authenticated ? (
            <Link href="/carte" className="secondary">Explorer la carte</Link>
          ) : (
            <Link href="/connexion" className="secondary">Se connecter</Link>
          )}
        </div>
        <div className="trust">
          <strong>{data ? `${formatNumber(data.ouvertes)} offres ouvertes` : "…"}</strong>
          <small>{data ? `dont ${formatNumber(data.urgentes)} qui expirent sous ${EXPIRING_SOON_DAYS} jours` : "chargement des chiffres"}</small>
        </div>
      </div>
      <div className="hero-visual">
        <Glass className="dashboard-preview">
          <div className="preview-head">
            <div>
              <span className="mini-label">VUE D’ENSEMBLE</span>
              <h4>Échéances à venir</h4>
            </div>
            <span className="live-dot">● En direct</span>
          </div>
          <div className="metric-row">
            <strong>{data ? formatNumber(data.urgentes) : "—"}</strong>
            <span>offres à moins de {EXPIRING_SOON_DAYS} jours</span>
          </div>
          <div className="chart">
            {[38, 54, 45, 72, 62, 84, 96].map((h, i) => (
              <i key={i} style={{ height: `${Math.max(12, Math.round((h * (ratio || 60)) / 60))}%` }} />
            ))}
          </div>
          <small className="muted">Part des offres urgentes · {data ? `${ratio}%` : "—"}</small>
        </Glass>
        <div className="floating-card floating-one">
          <Clock3 size={15} /> Expire dans 3 jours
        </div>
      </div>
    </section>
  );
}
