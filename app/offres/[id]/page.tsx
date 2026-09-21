import { SiteShell } from "@/components/site/site-shell";
import { OfferDetail } from "@/components/offers/offer-detail";

export const metadata = { title: "Détail de l’offre — AppelPro" };

export default async function OffreDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <SiteShell className="page-shell">
      <section className="page-width detail-page">
        <OfferDetail id={decodeURIComponent(id)} />
      </section>
    </SiteShell>
  );
}
