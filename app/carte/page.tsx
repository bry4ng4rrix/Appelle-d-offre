import { Suspense } from "react";
import { SiteShell } from "@/components/site/site-shell";
import { OffersExplorer } from "@/components/offers/offers-explorer";
import { Loading } from "@/components/common/async-state";

export const metadata = { title: "Carte des offres — Appel d’offre" };

export default function CartePage() {
  return (
    <SiteShell className="page-shell">
      <Suspense fallback={<Loading label="Chargement…" />}>
        <OffersExplorer initialTab="map" basePath="/carte" />
      </Suspense>
    </SiteShell>
  );
}
