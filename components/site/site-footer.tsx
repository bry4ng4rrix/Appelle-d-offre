import Link from "next/link";
import Image from "next/image";
import { LabelTechnologyMark } from "./label-technology-mark";

const SITE = "https://labeltechnology.mg";

const services = [
  "Développement Web & Mobile",
  "Marketing Digital",
  "Digitalisation",
  "Traitement de données",
  "Matériel informatique",
];

const entreprise = [
  "À propos",
  "Nos projets",
  "Blog",
  "Contact",
  "Mentions légales",
];

const plateforme = [
  { href: "/", label: "Accueil" },
  { href: "/offres", label: "Offres" },
  { href: "/carte", label: "Carte" },
  { href: "/connexion", label: "Connexion" },
];

/** Pied de page Label Technology : identité, coordonnées, services, entreprise, plateforme. */
export function SiteFooter() {
  return (
    <footer className="footer">
      <div className="page-width footer-grid">
        <div className="footer-brand">
          <a
            href={SITE}
            target="_blank"
            rel="noreferrer noopener"
            className="footer-logo"
            aria-label="Label Technology"
          >
            <Image
              src="/logo.png"
              alt="Label Technology"
              width={150}
              height={50}
            />
          </a>
          <p className="footer-tagline">
            Votre partenaire technologique premium depuis Antananarivo,
            Madagascar. Développement, Marketing, Data et Matériel IT.
          </p>
          <address className="footer-address">
            Akany Riandrano, Manjaka Ilafy
            <br />
            Antananarivo Avaradrano, Madagascar
            <br />
            <a href="mailto:contact@labeltechnology.mg">
              contact@labeltechnology.mg
            </a>
          </address>
        </div>

        <nav className="footer-col" aria-labelledby="footer-services">
          <h4 id="footer-services" className="footer-title">
            Services
          </h4>
          <ul>
            {services.map((label) => (
              <li key={label}>
                <a href={SITE} target="_blank" rel="noreferrer noopener">
                  {label}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <nav className="footer-col" aria-labelledby="footer-entreprise">
          <h4 id="footer-entreprise" className="footer-title">
            Entreprise
          </h4>
          <ul>
            {entreprise.map((label) => (
              <li key={label}>
                <a href={SITE} target="_blank" rel="noreferrer noopener">
                  {label}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <nav className="footer-col" aria-labelledby="footer-plateforme">
          <h4 id="footer-plateforme" className="footer-title">
            Plateforme
          </h4>
          <ul>
            {plateforme.map((item) => (
              <li key={item.href}>
                <Link href={item.href}>{item.label}</Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>

      <div className="page-width footer-bottom">
        <span>
          © 2026 Label Technology · Consulting & Services · Antananarivo,
          Madagascar
        </span>
        <a
          href={SITE}
          target="_blank"
          rel="noreferrer noopener"
          className="footer-site"
        >
          <i className="footer-live" aria-hidden /> labeltechnology.mg
        </a>
      </div>
    </footer>
  );
}
