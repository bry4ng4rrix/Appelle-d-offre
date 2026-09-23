"use client";

import { useRouter, useSearchParams } from "next/navigation";
import type React from "react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ChevronDown, ChevronLeft, ChevronRight, List, Map as MapIcon, RotateCcw, Search } from "lucide-react";
import type { Nature, Offre, OffresFilters, Tri } from "@/lib/api-types";
import { useAuth } from "@/lib/auth";
import { EXPIRING_SOON_DAYS } from "@/lib/dates";
import { formatNumber, labelSource } from "@/lib/format";
import { useOffres, useRegions, useSecteurs, useSources, useStatistiques } from "@/lib/use-api";
import { byDeadline, isOpen, isPublicOffer, PUBLIC_FILTERS } from "@/lib/visibility";
import { CardSkeletons, ErrorPanel, Loading } from "../common/async-state";
import { Empty } from "../common/empty";
import { Glass } from "../common/glass";
import { OffersMap } from "../map/offers-map";
import { LoginGate } from "./login-gate";
import { OfferCard } from "./offer-card";

const PAGE_SIZE = 12;
const MAP_LIMIT = 200;

const TRIS: { value: Tri; label: string }[] = [
  { value: "echeance", label: "Échéance proche" },
  { value: "ajout", label: "Ajout récent" },
  { value: "publication", label: "Publication" },
];

/** Les filtres vivent dans l'URL : partageables, et conservés au retour. */
function readFilters(params: URLSearchParams): OffresFilters {
  const num = (k: string) => (params.get(k) ? Number(params.get(k)) : undefined);
  return {
    q: params.get("q") ?? undefined,
    nature: (params.get("nature") as Nature) || undefined,
    secteur: params.get("secteur") ?? undefined,
    region: params.get("region") ?? undefined,
    source: params.get("source") ?? undefined,
    lieu: params.get("lieu") ?? undefined,
    urgence: num("urgence"),
    cloturees: params.get("cloturees") === "1",
    tri: (params.get("tri") as Tri) || "echeance",
    depuis: num("depuis") ?? 0,
  };
}

function writeFilters(f: OffresFilters) {
  const p = new URLSearchParams();
  if (f.q) p.set("q", f.q);
  if (f.nature) p.set("nature", f.nature);
  if (f.secteur) p.set("secteur", f.secteur);
  if (f.region) p.set("region", f.region);
  if (f.source) p.set("source", f.source);
  if (f.lieu) p.set("lieu", f.lieu);
  if (f.urgence) p.set("urgence", String(f.urgence));
  if (f.cloturees) p.set("cloturees", "1");
  if (f.tri && f.tri !== "echeance") p.set("tri", f.tri);
  if (f.depuis) p.set("depuis", String(f.depuis));
  const s = p.toString();
  return s ? `?${s}` : "";
}

/**
 * Catalogue : liste + carte. Sans session, seules les offres à échéance
 * proche sont servies, et un encart invite à se connecter pour le reste.
 */
export function OffersExplorer({ initialTab = "list", basePath = "/offres" }: { initialTab?: "list" | "map"; basePath?: string }) {
  const router = useRouter();
  const params = useSearchParams();
  const { ready, authenticated } = useAuth();
  const [tab, setTab] = useState<"list" | "map">(initialTab);
  const [highlighted, setHighlighted] = useState<string | null>(null);

  const filters = useMemo(() => readFilters(params), [params]);
  const [search, setSearch] = useState(filters.q ?? "");
  useEffect(() => setSearch(filters.q ?? ""), [filters.q]);

  const setFilters = useCallback(
    (next: OffresFilters) => router.replace(`${basePath}${writeFilters(next)}`, { scroll: false }),
    [router, basePath],
  );
  const patch = (next: Partial<OffresFilters>) => setFilters({ ...filters, ...next, depuis: 0 });

  useEffect(() => {
    const id = window.setTimeout(() => {
      if ((filters.q ?? "") !== search) patch({ q: search || undefined });
    }, 350);
    return () => window.clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  // Requêtes : en public, un seul jeu (échéances proches) alimente liste et
  // carte ; connecté, la liste est paginée et la carte reçoit l'ensemble filtré.
  const publicMode = ready && !authenticated;
  const listFilters: OffresFilters = publicMode
    ? PUBLIC_FILTERS
    : { ...filters, limite: PAGE_SIZE };
  const list = useOffres(ready ? listFilters : PUBLIC_FILTERS);
  const mapAll = useOffres(!publicMode && ready ? { ...filters, depuis: 0, limite: MAP_LIMIT } : PUBLIC_FILTERS);
  const stats = useStatistiques();
  const secteurs = useSecteurs();
  const regions = useRegions();
  const sources = useSources();

  const visible = useMemo(() => {
    const items = list.data?.offres ?? [];
    if (publicMode) return items.filter(isPublicOffer).sort(byDeadline);
    return filters.cloturees ? items : items.filter(isOpen);
  }, [list.data, publicMode, filters.cloturees]);

  const mapOffres = useMemo(() => {
    const items = mapAll.data?.offres ?? [];
    return publicMode ? items.filter(isPublicOffer) : items.filter((o) => filters.cloturees || isOpen(o));
  }, [mapAll.data, publicMode, filters.cloturees]);

  const total = list.data?.total ?? 0;
  const depuis = filters.depuis ?? 0;
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const page = Math.floor(depuis / PAGE_SIZE) + 1;
  const activeCount = [filters.q, filters.nature, filters.secteur, filters.region, filters.source, filters.lieu, filters.urgence, filters.cloturees ? "1" : ""].filter(Boolean).length;

  const listBody = list.error ? (
    <ErrorPanel message={list.error} onRetry={list.reload} />
  ) : !ready || (list.loading && !list.data) ? (
    <CardSkeletons count={4} dense />
  ) : visible.length ? (
    <>
      <div className={list.loading ? "tender-grid explorer-grid stale" : "tender-grid explorer-grid"}>
        {visible.map((o) => (
          <OfferCard key={o.id} offre={o} dense highlighted={highlighted === o.id} onHover={setHighlighted} />
        ))}
      </div>
      {!publicMode && pages > 1 && (
        <div className="pagination">
          <button className="secondary" disabled={depuis <= 0} onClick={() => setFilters({ ...filters, depuis: Math.max(0, depuis - PAGE_SIZE) })}>
            <ChevronLeft size={15} /> Précédent
          </button>
          <span className="muted">Page {page} / {pages}</span>
          <button className="secondary" disabled={depuis + PAGE_SIZE >= total} onClick={() => setFilters({ ...filters, depuis: depuis + PAGE_SIZE })}>
            Suivant <ChevronRight size={15} />
          </button>
        </div>
      )}
      {publicMode && <LoginGate next={basePath} total={stats.data?.ouvertes} />}
    </>
  ) : (
    <>
      <Empty
        title="Aucune offre actuellement disponible."
        text={publicMode ? `Aucune échéance dans les ${EXPIRING_SOON_DAYS} prochains jours.` : "Modifiez vos filtres ou élargissez votre recherche."}
        action={
          !publicMode && activeCount > 0 ? (
            <button className="secondary" onClick={() => setFilters({ tri: filters.tri })}>
              <RotateCcw size={15} aria-hidden /> Réinitialiser les filtres
            </button>
          ) : undefined
        }
      />
      {publicMode && <LoginGate next={basePath} total={stats.data?.ouvertes} />}
    </>
  );

  return (
    <section className="explorer page-width">
      <div className="section-heading explorer-heading">
        <div>
          <span className="section-kicker">{publicMode ? "APERÇU PUBLIC" : "CATALOGUE"}</span>
          <h2>{publicMode ? "Offres bientôt expirées" : "Tous les appels d’offres"}</h2>
          <p>
            {!ready
              ? "Chargement…"
              : publicMode
                ? `Connectez-vous pour voir toutes les offres${stats.data ? ` (${formatNumber(stats.data.ouvertes)} ouvertes)` : ""}.`
                : list.data
                  ? `${formatNumber(total)} offre${total > 1 ? "s" : ""} correspondant à votre recherche.`
                  : "Chargement…"}
          </p>
        </div>
        <div
          className="segmented view-tabs"
          role="tablist"
          style={{ "--seg": 2, "--i": tab === "list" ? 0 : 1 } as React.CSSProperties}
        >
          <button role="tab" aria-selected={tab === "list"} onClick={() => setTab("list")}>
            <List size={15} aria-hidden /> Liste
          </button>
          <button role="tab" aria-selected={tab === "map"} onClick={() => setTab("map")}>
            <MapIcon size={15} aria-hidden /> Carte
          </button>
        </div>
      </div>

      {!publicMode && ready && (
        <div className="filter-bar">
          <div className="search-box">
            <Search size={17} />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Rechercher un titre, un organisme, une catégorie…" />
          </div>
          <div className="select-wrap">
            <select value={filters.nature ?? ""} onChange={(e) => patch({ nature: (e.target.value || undefined) as Nature })} aria-label="Nature">
              <option value="">Toutes natures</option>
              <option value="marche">Marchés</option>
              <option value="emploi">Emplois</option>
            </select>
            <ChevronDown size={15} />
          </div>
          <div className="select-wrap">
            <select value={filters.secteur ?? ""} onChange={(e) => patch({ secteur: e.target.value || undefined })} aria-label="Catégorie">
              <option value="">Toutes catégories</option>
              {(secteurs.data ?? []).map((s) => (
                <option key={s.code} value={s.code}>{s.libelle} ({s.ouvertes})</option>
              ))}
            </select>
            <ChevronDown size={15} />
          </div>
          <div className="select-wrap">
            <select value={filters.region ?? ""} onChange={(e) => patch({ region: e.target.value || undefined })} aria-label="Région">
              <option value="">Toutes régions</option>
              {(regions.data ?? []).map((r) => (
                <option key={r.code} value={r.code}>{r.libelle} ({r.ouvertes})</option>
              ))}
            </select>
            <ChevronDown size={15} />
          </div>
          <div className="select-wrap">
            <select value={filters.source ?? ""} onChange={(e) => patch({ source: e.target.value || undefined })} aria-label="Source">
              <option value="">Toutes sources</option>
              {(sources.data ?? []).filter((s) => s.ouvertes > 0).map((s) => (
                <option key={s.source} value={s.source}>{labelSource(s.source)} ({s.ouvertes})</option>
              ))}
            </select>
            <ChevronDown size={15} />
          </div>
          <div className="select-wrap">
            <select value={filters.urgence ?? 0} onChange={(e) => patch({ urgence: Number(e.target.value) || undefined })} aria-label="Échéance">
              <option value={0}>Toute échéance</option>
              <option value={3}>≤ 3 jours</option>
              <option value={7}>≤ 7 jours</option>
              <option value={15}>≤ 15 jours</option>
              <option value={30}>≤ 30 jours</option>
            </select>
            <ChevronDown size={15} />
          </div>
          <div className="select-wrap">
            <select value={filters.tri ?? "echeance"} onChange={(e) => patch({ tri: e.target.value as Tri })} aria-label="Tri">
              {TRIS.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
            <ChevronDown size={15} />
          </div>
          <button className={filters.cloturees ? "filter-button active" : "filter-button"} onClick={() => patch({ cloturees: !filters.cloturees })} aria-pressed={!!filters.cloturees}>
            Inclure les expirées
          </button>
          {filters.lieu && (
            <button className="filter-button active" onClick={() => patch({ lieu: undefined })}>
              Lieu : {filters.lieu} ✕
            </button>
          )}
          {activeCount > 0 && (
            <button className="filter-button" onClick={() => setFilters({ tri: filters.tri })}>
              <RotateCcw size={13} /> Réinitialiser
            </button>
          )}
        </div>
      )}

      <div className={`explorer-layout tab-${tab}`}>
        <div className="explorer-list">{listBody}</div>
        <div className="explorer-map">
          <Glass className="world-map-card map-panel sticky">
            {mapAll.error ? (
              <ErrorPanel message={mapAll.error} onRetry={mapAll.reload} />
            ) : !ready || (mapAll.loading && !mapAll.data) ? (
              <Loading label="Chargement de la carte…" />
            ) : (
              <OffersMap
                offres={mapOffres}
                highlightedId={highlighted}
                onSelectOffer={(id) => router.push(`/offres/${encodeURIComponent(id)}`)}
                fill
              />
            )}
            {!publicMode && ready && mapAll.data && mapAll.data.total > MAP_LIMIT && (
              <small className="muted map-note">Carte limitée aux {MAP_LIMIT} premières offres du filtre courant.</small>
            )}
          </Glass>
        </div>
      </div>
    </section>
  );
}
