"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { ArrowRight, LogOut, Menu, UserRound, X } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { Logo } from "../common/logo";

const links = [
  { href: "/", label: "Accueil" },
  { href: "/offres", label: "Offres" },
  { href: "/carte", label: "Carte" },
];

/**
 * Barre de navigation commune (issue du landing : mêmes classes `.topbar`,
 * `.nav`, `.top-actions`). Les actions dépendent de l'état de session.
 */
export function SiteNavbar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { ready, authenticated, session, logout } = useAuth();

  // La barre gagne en contraste dès que la page défile : elle se détache
  // du contenu sans être opaque en haut de page.
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Le menu mobile se referme au changement de page.
  useEffect(() => setOpen(false), [pathname]);

  const isActive = (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));

  return (
    <header className={scrolled ? "topbar scrolled" : "topbar"}>
      <Link href="/" className="logo-link" aria-label="Accueil">
        <Logo />
      </Link>
      <nav className={open ? "nav open" : "nav"}>
        {links.map((l) => (
          <Link
            key={l.href}
            href={l.href}
            className={isActive(l.href) ? "nav-link active" : "nav-link"}
            onClick={() => setOpen(false)}
          >
            {l.label}
          </Link>
        ))}
        {authenticated && (
          <>
            <Link href="/compte" className="nav-link mobile-only" onClick={() => setOpen(false)}>
              Mon compte
            </Link>
            <button className="nav-link mobile-only" onClick={() => { logout(); setOpen(false); }}>
              Déconnexion
            </button>
          </>
        )}
        {ready && !authenticated && (
          <Link href="/connexion" className="nav-link mobile-only" onClick={() => setOpen(false)}>
            Se connecter
          </Link>
        )}
      </nav>
      <div className="top-actions">
        {!ready ? null : authenticated ? (
          <>
            <Link href="/compte" className="login account-link" title={session?.subject}>
              <UserRound size={15} /> Mon compte
            </Link>
            <button className="primary small" onClick={logout}>
              <LogOut size={14} /> Déconnexion
            </button>
          </>
        ) : (
          <>
            <Link href="/offres" className="login">
              Voir les offres
            </Link>
            <Link href="/connexion" className="primary small">
              Se connecter <ArrowRight size={14} />
            </Link>
          </>
        )}
      </div>
      <button className="mobile-menu" onClick={() => setOpen(!open)} aria-label="Menu" aria-expanded={open}>
        {open ? <X /> : <Menu />}
      </button>
    </header>
  );
}
