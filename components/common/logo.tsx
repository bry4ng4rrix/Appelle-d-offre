import Image from "next/image";

/**
 * Identité de la plateforme : le logo Label Technology (`public/logo.png`,
 * détouré dans `logo-mark.png` pour supprimer sa marge transparente) et le
 * nom du produit.
 *
 * `size` est la hauteur du sigle en pixels ; la largeur suit son ratio.
 */
const RATIO = 376 / 256;

export function Logo({ size = 30, withName = true }: { size?: number; withName?: boolean }) {
  return (
    <div className="logo">
      <Image
        src="/logo-mark.png"
        alt="Label Technology"
        width={Math.round(size * RATIO)}
        height={size}
        priority
        className="logo-mark"
      />
      {withName && (
        <span className="logo-name">
          Appel <span className="accent">d’offre</span>
        </span>
      )}
    </div>
  );
}
