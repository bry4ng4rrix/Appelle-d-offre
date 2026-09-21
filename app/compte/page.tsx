import { SiteShell } from "@/components/site/site-shell";
import { AccountCard } from "@/components/auth/account-card";

export const metadata = { title: "Mon compte — AppelPro" };

export default function ComptePage() {
  return (
    <SiteShell className="page-shell">
      <section className="page-width auth-page">
        <AccountCard />
      </section>
    </SiteShell>
  );
}
