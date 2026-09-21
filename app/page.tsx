import { SiteShell } from "@/components/site/site-shell";
import { LandingHero } from "@/components/landing/landing-hero";
import { LandingStats } from "@/components/landing/landing-stats";
import { ExpiringSection } from "@/components/offers/expiring-section";
import { LandingMap } from "@/components/landing/landing-map";

export default function Page() {
  return (
    <SiteShell>
      <LandingHero />
      <LandingStats />
      <LandingMap />
      <ExpiringSection />
    </SiteShell>
  );
}
