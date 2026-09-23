import { SearchX } from "lucide-react";

/**
 * État vide composé : halo, glyphe encadré, titre et explication.
 * `action` permet d'offrir une sortie plutôt qu'un cul-de-sac.
 */
export function Empty({
  title,
  text,
  action,
}: {
  title: string;
  text: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="empty">
      <span className="empty-glyph" aria-hidden>
        <SearchX size={20} strokeWidth={1.5} />
      </span>
      <h3>{title}</h3>
      <p>{text}</p>
      {action}
    </div>
  );
}
