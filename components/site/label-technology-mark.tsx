/**
 * Monogramme « LT » de Label Technology, dessiné en SVG pour ne dépendre
 * d'aucun fichier image. À remplacer par le logo officiel si un fichier est
 * fourni (même emprise : 100 × 100).
 */
export function LabelTechnologyMark({ size = 96 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      role="img"
      aria-label="Label Technology"
      className="lt-mark"
    >
      {/* L blanc en perspective */}
      <path d="M12 8 L36 8 L36 62 L60 62 L60 78 L12 78 Z" fill="#f4f7fb" />
      <path d="M12 78 L60 78 L54 84 L12 84 Z" fill="#c9d3e0" />
      {/* T bleu */}
      <path d="M40 8 L92 8 L92 24 L74 24 L74 58 L58 58 L58 24 L40 24 Z" fill="#2f9be8" />
      <path d="M58 58 L74 58 L74 64 L58 64 Z" fill="#1c6fb0" />
      {/* Grille de pixels */}
      <rect x="66" y="66" width="8" height="8" fill="#2f9be8" />
      <rect x="76" y="66" width="8" height="8" fill="#2f9be8" />
      <rect x="86" y="66" width="8" height="8" fill="#2f9be8" opacity=".55" />
      <rect x="76" y="76" width="8" height="8" fill="#2f9be8" />
      <rect x="86" y="76" width="8" height="8" fill="#2f9be8" opacity=".55" />
      <rect x="86" y="86" width="8" height="8" fill="#2f9be8" opacity=".3" />
      {/* Libellé */}
      <text
        x="12"
        y="97"
        fontSize="8.4"
        fontWeight="700"
        fill="#f4f7fb"
        fontFamily="var(--font-sans), sans-serif"
        textLength="82"
        lengthAdjust="spacingAndGlyphs"
      >
        LABEL <tspan fill="#2f9be8">TECHNOLOGY</tspan>
      </text>
    </svg>
  );
}
