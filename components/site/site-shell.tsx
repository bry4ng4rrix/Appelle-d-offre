import type { ReactNode } from "react";
import { SiteNavbar } from "./site-navbar";
import { SiteFooter } from "./site-footer";
import { DataSourceBanner } from "./data-source-banner";

/** Enveloppe commune : fond, halo, barre de navigation, pied de page. */
export function SiteShell({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <main className={`app-shell ${className}`}>
      <div className="ambient ambient-one" />
      <SiteNavbar />
      <DataSourceBanner />
      {children}
      <SiteFooter />
    </main>
  );
}
