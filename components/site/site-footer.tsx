import Link from "next/link";
import { Logo } from "../common/logo";

export function SiteFooter() {
  return (
    <footer className="footer page-width">
      <Logo />
      <span>Découvrez rapidement les appels d’offres disponibles et consultez leurs informations.</span>
      <nav className="footer-links">
        <Link href="/offres">Offres</Link>
        <Link href="/carte">Carte</Link>
        <Link href="/connexion">Connexion</Link>
      </nav>
    </footer>
  );
}
