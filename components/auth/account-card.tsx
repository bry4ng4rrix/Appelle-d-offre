"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";
import { ArrowRight, LogOut, UserRound } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { formatDateTime } from "@/lib/dates";
import { Loading } from "../common/async-state";
import { Glass } from "../common/glass";

/** Page compte, volontairement minimale : identité de session et déconnexion. */
export function AccountCard() {
  const router = useRouter();
  const { ready, authenticated, session, logout } = useAuth();
  // Après une déconnexion volontaire, on retourne à l'accueil plutôt qu'au login.
  const leaving = useRef(false);

  useEffect(() => {
    if (ready && !authenticated && !leaving.current) router.replace("/connexion?next=/compte");
  }, [ready, authenticated, router]);

  if (!ready || !authenticated) return <Loading label="Vérification de la session…" />;

  return (
    <Glass className="auth-modal login-card">
      <span className="gate-icon"><UserRound size={17} /></span>
      <span className="section-kicker">MON COMPTE</span>
      <h2>{session?.name || session?.subject}</h2>
      <p className="muted">
        {session?.subject}
        {session?.role === "admin" ? " · administrateur" : ""}
        <br />
        {session?.expiresAt
          ? `Session valable jusqu’au ${formatDateTime(new Date(session.expiresAt).toISOString())}.`
          : "Session active."}
      </p>
      <div className="gate-actions">
        <Link href="/offres" className="primary full">
          Voir toutes les offres <ArrowRight size={15} />
        </Link>
        <button className="secondary full" onClick={() => { leaving.current = true; router.replace("/"); logout(); }}>
          <LogOut size={15} /> Déconnexion
        </button>
      </div>
    </Glass>
  );
}
