import { Suspense } from "react";
import { SiteShell } from "@/components/site/site-shell";
import { LoginForm } from "@/components/auth/login-form";
import { Loading } from "@/components/common/async-state";

export const metadata = { title: "Connexion — Appel d’offre" };

export default function ConnexionPage() {
  return (
    <SiteShell className="page-shell">
      <section className="page-width auth-page">
        <Suspense fallback={<Loading label="Chargement…" />}>
          <LoginForm />
        </Suspense>
      </section>
    </SiteShell>
  );
}
