"use client";

import Link from "next/link";
import { ArrowRight, Building2, CalendarDays, Clock3, Lock, MapPin } from "lucide-react";
import type { Offre } from "@/lib/api-types";
import { expiryLabel, formatDateLong } from "@/lib/dates";
import { deadlineTone, labelNature, labelSecteur, offreLocation } from "@/lib/format";
import { usePointerTilt } from "@/lib/use-pointer-tilt";
import { remainingDays } from "@/lib/visibility";
import { Badge } from "../common/badge";
import { Glass } from "../common/glass";

/**
 * Carte d'une offre. `locked` signale une offre réservée aux utilisateurs
 * connectés : le titre reste visible, le détail renvoie vers la connexion.
 */
export function OfferCard({
  offre,
  locked = false,
  dense = false,
  highlighted = false,
  onHover,
}: {
  offre: Offre;
  locked?: boolean;
  /** Variante resserrée pour la liste de l’explorateur. */
  dense?: boolean;
  highlighted?: boolean;
  onHover?: (id: string | null) => void;
}) {
  const tilt = usePointerTilt<HTMLDivElement>(4);
  const days = remainingDays(offre);
  const href = locked ? `/connexion?next=/offres/${encodeURIComponent(offre.id)}` : `/offres/${encodeURIComponent(offre.id)}`;

  return (
    <Glass
      className={`tender-card offer-card${dense ? " dense" : ""}${highlighted ? " highlighted" : ""}${locked ? " locked" : ""}`}
      {...tilt}
      onPointerLeave={(event) => {
        tilt.onPointerLeave?.(event);
        onHover?.(null);
      }}
      onPointerEnter={onHover ? () => onHover(offre.id) : undefined}
    >
      <div>
        <div className="card-top">
          <span className="eyebrow">
            <i className="category-dot" />
            {labelSecteur(offre.secteur)}
            {offre.categorie && !dense && <small className="eyebrow-sub">· {offre.categorie}</small>}
          </span>
          {/* En mode dense l'échéance tient dans le badge ; sinon elle a sa propre ligne. */}
          {offre.nature === "emploi" ? (
            <Badge label={labelNature(offre.nature)} tone="blue" />
          ) : dense ? (
            <Badge label={expiryLabel(days)} tone={deadlineTone(days, offre.ouverte)} />
          ) : null}
        </div>
        <h3 title={offre.titre}>
          <Link href={href}>{offre.titre}</Link>
        </h3>
        <p className="company">
          <Building2 size={15} />
          {offre.organisation ?? "Organisme non précisé"}
        </p>
        <div className="card-meta">
          <span>
            <MapPin size={15} />
            {offreLocation(offre)}
          </span>
          <span>
            <CalendarDays size={15} />
            {offre.date_limite ? formatDateLong(offre.date_limite) : "Sans date limite"}
          </span>
        </div>
        {!dense && (
          <div className="expiry-row">
            <span className={`expiry ${deadlineTone(days, offre.ouverte)}`}>
              <Clock3 size={15} />
              {days === null ? "Sans échéance" : days < 0 ? "Expirée" : `Expire dans : ${days === 0 ? "aujourd’hui" : days === 1 ? "1 jour" : `${days} jours`}`}
            </span>
          </div>
        )}
        <div className="card-bottom">
          <small className="muted-label">
            {offre.date_publication ? `Publiée le ${formatDateLong(offre.date_publication)}` : `Ajoutée le ${formatDateLong(offre.date_ajout)}`}
          </small>
          <Link href={href} className="text-button">
            {locked ? (
              <>
                <Lock size={13} /> Se connecter
              </>
            ) : (
              <>
                Voir les détails <ArrowRight size={15} />
              </>
            )}
          </Link>
        </div>
      </div>
    </Glass>
  );
}
