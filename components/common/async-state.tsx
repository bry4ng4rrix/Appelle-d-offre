import { AlertTriangle, Loader2, RefreshCw } from "lucide-react";
import { Glass } from "./glass";

export function Loading({ label = "Chargement…" }: { label?: string }) {
  return (
    <div className="async-state" role="status" aria-live="polite">
      <Loader2 size={20} className="spin" aria-hidden />
      <p>{label}</p>
    </div>
  );
}

export function ErrorPanel({
  message,
  onRetry,
}: {
  message: string;
  onRetry?: () => void;
}) {
  return (
    <Glass className="async-state error">
      <span className="state-icon alert" aria-hidden>
        <AlertTriangle size={17} />
      </span>
      <div>
        <h3>Données indisponibles</h3>
        <p>{message}</p>
      </div>
      {onRetry && (
        <button className="secondary" onClick={onRetry}>
          <RefreshCw size={15} aria-hidden /> Réessayer
        </button>
      )}
    </Glass>
  );
}

/**
 * Squelettes calqués sur la composition réelle d'une carte d'offre :
 * en-tête, titre, organisme, métadonnées, pied. Évite le saut de mise en page.
 */
export function CardSkeletons({ count = 6, dense = false }: { count?: number; dense?: boolean }) {
  return (
    <div className={dense ? "tender-grid explorer-grid" : "tender-grid"} aria-hidden>
      {Array.from({ length: count }, (_, i) => (
        <div className="glass tender-card skeleton" key={i} style={{ animationDelay: `${i * 55}ms` }}>
          <div className="sk-row">
            <span className="sk sk-line short" />
            <span className="sk sk-pill" />
          </div>
          <span className="sk sk-line title" />
          <span className="sk sk-line half" />
          <div className="sk-divider" />
          <div className="sk-row">
            <span className="sk sk-line third" />
            <span className="sk sk-line third" />
          </div>
        </div>
      ))}
    </div>
  );
}
