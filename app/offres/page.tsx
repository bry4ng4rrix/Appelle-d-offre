import { Suspense } from "react";
import { SiteShell } from "@/components/site/site-shell";
import { OffersExplorer } from "@/components/offers/offers-explorer";
import { Loading } from "@/components/common/async-state";

export const metadata = { title: "Appels d’offres — Appel d’offre" };

export default function OffresPage() {
  return (
    <SiteShell className="page-shell">
      <Suspense fallback={<Loading label="Chargement…" />}>
        <OffersExplorer initialTab="list" basePath="/offres" />
      </Suspense>
    </SiteShell>
  );
}
