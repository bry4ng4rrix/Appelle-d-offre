"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import { ArrowRight, Eye, EyeOff, Loader2, LockKeyhole, UserPlus } from "lucide-react";
import { AuthError, useAuth } from "@/lib/auth";
import { Glass } from "../common/glass";

/** Ne redirige que vers une page interne, jamais vers un domaine externe. */
const safeNext = (value: string | null) => (value && value.startsWith("/") && !value.startsWith("//") ? value : "/offres");
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const next = safeNext(params.get("next"));
  const signup = params.get("mode") === "inscription";
  const { ready, authenticated, login, register } = useAuth();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [show, setShow] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldError, setFieldError] = useState<{ email?: string; password?: string; confirm?: string }>({});

  // Déjà connecté : inutile de montrer le formulaire.
  useEffect(() => {
    if (ready && authenticated) router.replace(next);
  }, [ready, authenticated, next, router]);

  const validate = () => {
    const errs: typeof fieldError = {};
    if (!email.trim()) errs.email = "L’email est requis.";
    else if (!EMAIL.test(email.trim())) errs.email = "Format d’email invalide.";
    if (!password) errs.password = "Le mot de passe est requis.";
    else if (password.length < 8) errs.password = "8 caractères minimum.";
    if (signup && confirm !== password) errs.confirm = "Les mots de passe ne correspondent pas.";
    setFieldError(errs);
    return Object.keys(errs).length === 0;
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!validate()) return;
    setSubmitting(true);
    try {
      if (signup) await register(email, password, name);
      else await login(email, password);
      router.replace(next);
    } catch (err) {
      setError(err instanceof AuthError ? err.message : "Connexion impossible.");
      setSubmitting(false);
    }
  };

  const switchHref = `/connexion?${signup ? "" : "mode=inscription&"}next=${encodeURIComponent(next)}`;

  return (
    <Glass className="auth-modal login-card">
      <span className="gate-icon">{signup ? <UserPlus size={18} /> : <LockKeyhole size={18} />}</span>
      <span className="section-kicker">{signup ? "CRÉER UN COMPTE" : "CONNEXION"}</span>
      <h2>{signup ? "Rejoignez la veille" : "Accédez à toutes les offres"}</h2>
      <p className="muted">
        {signup
          ? "Un compte suffit pour consulter l’ensemble des appels d’offres disponibles."
          : "Connectez-vous pour consulter l’ensemble des appels d’offres disponibles."}
      </p>

      <form onSubmit={submit} noValidate>
        {signup && (
          <label>
            Nom (facultatif)
            <input type="text" name="name" autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} disabled={submitting} />
          </label>
        )}
        <label>
          Email
          <input
            type="email"
            name="email"
            autoComplete={signup ? "email" : "username"}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            aria-invalid={!!fieldError.email}
            disabled={submitting}
          />
          {fieldError.email && <small className="field-error">{fieldError.email}</small>}
        </label>
        <label>
          Mot de passe
          <span className="password-wrap">
            <input
              type={show ? "text" : "password"}
              name="password"
              autoComplete={signup ? "new-password" : "current-password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              aria-invalid={!!fieldError.password}
              disabled={submitting}
            />
            <button type="button" className="icon-button" onClick={() => setShow(!show)} aria-label={show ? "Masquer" : "Afficher"}>
              {show ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
          </span>
          {fieldError.password && <small className="field-error">{fieldError.password}</small>}
        </label>
        {signup && (
          <label>
            Confirmer le mot de passe
            <input
              type={show ? "text" : "password"}
              name="confirm"
              autoComplete="new-password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              aria-invalid={!!fieldError.confirm}
              disabled={submitting}
            />
            {fieldError.confirm && <small className="field-error">{fieldError.confirm}</small>}
          </label>
        )}

        {error && <p className="notice danger" role="alert">{error}</p>}

        <button className="primary full" type="submit" disabled={submitting}>
          {submitting ? (
            <><Loader2 size={15} className="spin" /> {signup ? "Création…" : "Connexion…"}</>
          ) : (
            <>{signup ? "Créer mon compte" : "Se connecter"} <ArrowRight size={15} /></>
          )}
        </button>
      </form>

      <div className="demo-hint">
        <small className="muted">{signup ? "Vous avez déjà un compte ?" : "Pas encore de compte ?"}</small>
        <Link href={switchHref} className="text-button">
          {signup ? "Se connecter" : "Créer un compte"}
        </Link>
      </div>
    </Glass>
  );
}
