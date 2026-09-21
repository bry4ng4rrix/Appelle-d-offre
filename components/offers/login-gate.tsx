"use client";

import Link from "next/link";
import { ArrowRight, Lock, X } from "lucide-react";
import { Glass } from "../common/glass";

/**
 * Invitation à se connecter, en modale ou en encart. `next` est la page à
 * rouvrir après connexion.
 */
export function LoginGate({
  variant = "inline",
  next = "/offres",
  onClose,
  total,
}: {
  variant?: "inline" | "modal";
  next?: string;
  onClose?: () => void;
  total?: number;
}) {
  const body = (
    <Glass className={variant === "modal" ? "auth-modal gate-modal" : "gate-card"}>
      {onClose && (
        <button className="modal-close" onClick={onClose} aria-label="Fermer">
          <X size={18} />
        </button>
      )}
      <span className="gate-icon">
        <Lock size={18} />
      </span>
      <span className="section-kicker">ACCÈS COMPLET</span>
      <h2>Découvrez toutes les opportunités</h2>
      <p className="muted">
        Connectez-vous pour accéder à l’ensemble des appels d’offres disponibles
        {typeof total === "number" && total > 0 ? ` — ${total} offres ouvertes` : ""}.
      </p>
      <div className="gate-actions">
        <Link href={`/connexion?next=${encodeURIComponent(next)}`} className="primary full">
          Se connecter <ArrowRight size={15} />
        </Link>
        <Link href={`/connexion?mode=inscription&next=${encodeURIComponent(next)}`} className="secondary full">
          Créer un compte
        </Link>
      </div>
    </Glass>
  );

  if (variant === "modal") {
    return (
      <div className="modal-backdrop" onClick={onClose} role="dialog" aria-modal="true">
        <div onClick={(e) => e.stopPropagation()}>{body}</div>
      </div>
    );
  }
  return body;
}
