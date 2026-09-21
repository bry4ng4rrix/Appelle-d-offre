"use client";

import Link from "next/link";
import { ArrowLeft, Building2, CalendarClock, CalendarDays, ExternalLink, Globe2, Info, Layers, MapPin, Radio, RefreshCw, Tag } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { expiryLabel, formatDateLong, formatDateTime } from "@/lib/dates";
import { deadlineTone, formatRelative, labelNature, labelRegion, labelSecteur, labelSource, offreLocation, offreStatus } from "@/lib/format";
import { useOffre } from "@/lib/use-api";
import { canView, remainingDays } from "@/lib/visibility";
import { Badge } from "../common/badge";
import { ErrorPanel, Loading } from "../common/async-state";
import { Glass } from "../common/glass";
import { OffersMap } from "../map/offers-map";
import { LoginGate } from "./login-gate";

/** Fiche complète d'une offre : uniquement les champs réellement fournis par l'API. */
export function OfferDetail({ id }: { id: string }) {
  const { ready, authenticated } = useAuth();
  const { data: offre, loading, error, reload } = useOffre(id);

  const back = (
    <Link href="/offres" className="back-button">
      <ArrowLeft size={15} /> Retour aux offres
    </Link>
  );

  if (error) return <>{back}<ErrorPanel message={error} onRetry={reload} /></>;
  if (!ready || loading || !offre) return <>{back}<Loading label="Chargement de l’offre…" /></>;

  const days = remainingDays(offre);
  const status = offreStatus(days, offre.ouverte);
  const expired = status.label === "Expirée";

  if (!canView(offre, authenticated)) {
    return (
      <>
        {back}
        <div className="detail-title">
          <div>
            <span className="eyebrow"><i className="category-dot" />{labelSecteur(offre.secteur)}</span>
            <h2>{offre.titre}</h2>
            <p className="company"><Building2 size={15} />{offre.organisation ?? "Organisme non précisé"} · {offreLocation(offre)}</p>
          </div>
          <Badge label={status.label} tone={status.tone} />
        </div>
        <LoginGate next={`/offres/${encodeURIComponent(offre.id)}`} />
      </>
    );
  }

  return (
    <>
      {back}
      <div className="detail-layout">
        <div>
          <div className="detail-title">
            <div>
              <span className="eyebrow">
                <i className="category-dot" />
                {labelSecteur(offre.secteur)}{offre.categorie && ` · ${offre.categorie}`}
              </span>
              <h2>{offre.titre}</h2>
              <p className="company">
                <Building2 size={15} />
                {offre.organisation ?? "Organisme non précisé"} · {offreLocation(offre)}
              </p>
            </div>
            <div className="detail-badges">
              <Badge label={labelNature(offre.nature)} tone={offre.nature === "emploi" ? "blue" : "neutral"} />
              <Badge label={status.label} tone={status.tone} />
            </div>
          </div>

          {expired && (
            <p className="notice danger">
              <Info size={14} /> Cette offre est expirée : elle n’est plus ouverte aux réponses.
            </p>
          )}

          <div className="detail-stats">
            <div>
              <small>Date de publication</small>
              <strong>{formatDateLong(offre.date_publication)}</strong>
            </div>
            <div>
              <small>Date limite</small>
              <strong>{formatDateLong(offre.date_limite)}</strong>
            </div>
            <div>
              <small>Échéance</small>
              <strong className={`tone-${deadlineTone(days, offre.ouverte)}`}>{expiryLabel(days)}</strong>
            </div>
            <div>
              <small>Statut</small>
              <strong>{status.label}</strong>
            </div>
          </div>

          <Glass className="content-card">
            <h3>Description</h3>
            <p className="prewrap">
              {offre.description?.trim() || "Aucune description n’a été publiée par la source. Consultez l’avis original pour le dossier complet."}
            </p>
            {offre.raison && (
              <>
                <h3>Pourquoi cette offre a été retenue</h3>
                <p className="veille-reason"><Info size={14} /> {offre.raison}</p>
              </>
            )}
          </Glass>

          <Glass className="content-card">
            <h3>Informations générales</h3>
            <div className="criteria-list">
              <div className="criteria-line"><span>Organisme</span><strong>{offre.organisation ?? "—"}</strong></div>
              <div className="criteria-line"><span>Catégorie</span><strong>{labelSecteur(offre.secteur)}{offre.categorie ? ` — ${offre.categorie}` : ""}</strong></div>
              <div className="criteria-line"><span>Nature</span><strong>{labelNature(offre.nature)}</strong></div>
              <div className="criteria-line"><span>Source</span><strong>{labelSource(offre.source)}</strong></div>
              <div className="criteria-line"><span>Identifiant</span><code>{offre.id}</code></div>
            </div>
            <h3>Localisation</h3>
            <div className="criteria-list">
              <div className="criteria-line"><span>Lieu</span><strong>{offre.localisation?.lieu ?? "—"}</strong></div>
              <div className="criteria-line"><span>Pays</span><strong>{offre.pays ?? "—"}</strong></div>
              <div className="criteria-line"><span>Région</span><strong>{offre.localisation?.region_libelle ?? labelRegion(offre.localisation?.region)}</strong></div>
              <div className="criteria-line">
                <span>Coordonnées</span>
                <strong>{offre.localisation?.lat != null ? `${offre.localisation.lat}, ${offre.localisation.lon}` : "Non géocodée"}</strong>
              </div>
            </div>
            <div className="chip-row">
              <Link className="chip" href={`/offres?secteur=${encodeURIComponent(offre.secteur ?? "")}`}><Layers size={13} /> {labelSecteur(offre.secteur)}</Link>
              <Link className="chip" href={`/offres?source=${encodeURIComponent(offre.source)}`}><Radio size={13} /> {labelSource(offre.source)}</Link>
              {offre.localisation?.lieu && (
                <Link className="chip" href={`/offres?lieu=${encodeURIComponent(offre.localisation.lieu)}`}><MapPin size={13} /> {offre.localisation.lieu}</Link>
              )}
              {offre.categorie && <span className="chip static"><Tag size={13} /> {offre.categorie}</span>}
            </div>
          </Glass>

          {offre.localisation?.lat != null && (
            <Glass className="content-card">
              <h3>Position sur la carte</h3>
              <div className="map-panel mini"><OffersMap offres={[offre]} fill /></div>
            </Glass>
          )}
        </div>

        <aside className="detail-aside">
          <Glass className="action-card">
            {offre.lien ? (
              <a className="primary full" href={offre.lien} target="_blank" rel="noreferrer noopener">
                Consulter l’avis original <ExternalLink size={15} />
              </a>
            ) : (
              <button className="primary full" disabled>Lien source indisponible</button>
            )}
            {offre.lien_etat && (
              <a className="secondary full" href={offre.lien_etat} target="_blank" rel="noreferrer noopener">
                Portail officiel <Globe2 size={15} />
              </a>
            )}
            <div className="side-info">
              <h4>Dates</h4>
              <div className="document"><CalendarDays size={15} /><span>Publication<small>{formatDateLong(offre.date_publication)}</small></span></div>
              <div className="document"><CalendarClock size={15} /><span>Date limite<small>{formatDateLong(offre.date_limite)} · {expiryLabel(days)}</small></span></div>
              <div className="document"><CalendarDays size={15} /><span>Ajoutée à la veille<small>{formatDateTime(offre.date_ajout)}</small></span></div>
              <div className="document"><RefreshCw size={15} /><span>Dernière mise à jour<small>{formatRelative(offre.date_maj)}</small></span></div>
            </div>
          </Glass>
          <Glass className="client-card">
            <span className="section-kicker">SOURCE</span>
            <h3>{labelSource(offre.source)}</h3>
            <p className="muted">{offre.localisation?.region_libelle ?? "Région inconnue"}</p>
            <Link href={`/offres?source=${encodeURIComponent(offre.source)}`} className="text-button">
              Voir les offres de cette source <ArrowLeft size={14} style={{ transform: "rotate(180deg)" }} />
            </Link>
          </Glass>
        </aside>
      </div>
    </>
  );
}
