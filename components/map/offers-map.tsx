"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowRight, Building2, CalendarDays, ChevronLeft, ChevronRight, MapPin, X } from "lucide-react";
import { geoEqualEarth } from "d3-geo";
import { ComposableMap, Geographies, Geography, Marker, ZoomableGroup } from "react-simple-maps";
import worldAtlas from "world-atlas/countries-110m.json";
import type { Offre } from "@/lib/api-types";
import { expiryLabel, formatDateLong } from "@/lib/dates";
import { deadlineTone, labelSecteur, offreLocation } from "@/lib/format";
import { byDeadline, remainingDays } from "@/lib/visibility";
import { Badge } from "../common/badge";

interface Cluster {
  key: string;
  lat: number;
  lon: number;
  lieu: string;
  offres: Offre[];
  urgentes: number;
}

const PAGE = 4;

/** Regroupe les offres qui partagent exactement les mêmes coordonnées. */
function clusterize(offres: Offre[]): Cluster[] {
  const map = new Map<string, Cluster>();
  for (const o of offres) {
    const { lat, lon } = o.localisation ?? {};
    if (lat === null || lat === undefined || lon === null || lon === undefined) continue;
    const key = `${lat},${lon}`;
    const c = map.get(key) ?? { key, lat, lon, lieu: offreLocation(o), offres: [], urgentes: 0 };
    c.offres.push(o);
    const d = remainingDays(o);
    if (d !== null && d >= 0 && d <= 7) c.urgentes += 1;
    map.set(key, c);
  }
  for (const c of map.values()) c.offres.sort(byDeadline);
  return [...map.values()].sort((a, b) => b.offres.length - a.offres.length);
}

const radiusFor = (count: number, max: number) => 5 + Math.sqrt(count / Math.max(1, max)) * 11;

const MAP_W = 960;
const MAP_H = 540;

/**
 * Échelle de projection déduite de la largeur : à zoom 1 le planisphère
 * occupe exactement la largeur du panneau, sans recadrage ni bande vide.
 */
const scaleFor = (width: number) => width / (2 * Math.PI);

/**
 * Projection construite explicitement plutôt que via `projectionConfig` :
 * ce dernier n'était appliqué qu'aux marqueurs, les fonds de carte restant
 * sur la configuration initiale — les deux couches se désalignaient.
 * Recentrage d3 canonique : `rotate` pour la longitude, `center` pour la latitude.
 */
const makeProjection = (
  width: number,
  height: number,
  center: [number, number],
  zoom: number,
) =>
  geoEqualEarth()
    .scale(scaleFor(width) * zoom)
    .rotate([-center[0], 0, 0])
    .center([0, center[1]])
    .translate([width / 2, height / 2]);

/**
 * Suit la taille réelle du conteneur pour que la projection remplisse
 * exactement le panneau : ni bandes vides, ni recadrage agressif, que le
 * panneau soit large et court (accueil) ou étroit et haut (explorateur).
 */
function useBoxSize(ref: React.RefObject<HTMLElement | null>) {
  const [size, setSize] = useState({ width: MAP_W, height: MAP_H });
  useEffect(() => {
    const node = ref.current;
    if (!node || typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      if (width > 0 && height > 0) setSize({ width: Math.round(width), height: Math.round(height) });
    });
    observer.observe(node);
    return () => observer.disconnect();
  }, [ref]);
  return size;
}

/**
 * Cadre la vue sur l'étendue des points : centre au milieu de l'emprise,
 * zoom d'autant plus fort que les offres sont regroupées (un point seul est
 * vu de près, un jeu mondial en entier). Bornes : 1 (monde) à 6.
 */
function fitView(clusters: Cluster[], width: number, height: number): { center: [number, number]; zoom: number } {
  if (!clusters.length) return { center: [12, 18], zoom: 1 };
  const lons = clusters.map((c) => c.lon);
  const lats = clusters.map((c) => c.lat);
  const minLon = Math.min(...lons), maxLon = Math.max(...lons);
  const minLat = Math.min(...lats), maxLat = Math.max(...lats);
  // Marge autour de l'emprise : les marqueurs ne doivent pas toucher le bord.
  const spanLon = Math.max(12, (maxLon - minLon) * 1.3 + 16);
  const spanLat = Math.max(12, (maxLat - minLat) * 1.3 + 16);
  const deg = 180 / Math.PI;
  const scale = scaleFor(width);
  // Zoom tel que l'emprise tienne dans les deux axes ; 1 = planisphère entier.
  const zoom = Math.min(
    clusters.length === 1 ? 3.2 : 6,
    Math.max(1, Math.min((width / scale) * deg / spanLon, (height / scale) * deg / spanLat)),
  );
  return { center: [(minLon + maxLon) / 2, (minLat + maxLat) / 2], zoom };
}

/**
 * Carte des offres : un marqueur par position, dimensionné par le nombre
 * d'offres qui s'y trouvent ; le clic ouvre l'aperçu de ces offres.
 */
export function OffersMap({
  offres,
  highlightedId,
  onSelectOffer,
  lockedIds,
  /** Hauteur du panneau : la carte le remplit et se recadre sur les données. */
  height = 480,
  fill = false,
}: {
  offres: Offre[];
  highlightedId?: string | null;
  onSelectOffer?: (id: string) => void;
  /** Offres visibles sur la carte mais réservées aux utilisateurs connectés. */
  lockedIds?: Set<string>;
  height?: number;
  /** `true` : occupe 100 % du parent (panneau à hauteur fixe). */
  fill?: boolean;
}) {
  const boxRef = useRef<HTMLDivElement>(null);
  const { width, height: boxHeight } = useBoxSize(boxRef);
  const clusters = useMemo(() => clusterize(offres), [offres]);
  const view = useMemo(() => fitView(clusters, width, boxHeight), [clusters, width, boxHeight]);
  const projection = useMemo(
    () => makeProjection(width, boxHeight, view.center, view.zoom),
    [width, boxHeight, view],
  );
  const max = Math.max(1, ...clusters.map((c) => c.offres.length));
  const unlocated = offres.length - clusters.reduce((n, c) => n + c.offres.length, 0);
  const [activeKey, setActiveKey] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const active = clusters.find((c) => c.key === activeKey) ?? null;
  const highlightedKey = useMemo(
    () => clusters.find((c) => c.offres.some((o) => o.id === highlightedId))?.key ?? null,
    [clusters, highlightedId],
  );

  const open = (key: string) => {
    setActiveKey(key);
    setPage(0);
  };

  const pages = active ? Math.ceil(active.offres.length / PAGE) : 0;
  const slice = active ? active.offres.slice(page * PAGE, page * PAGE + PAGE) : [];

  return (
    <div ref={boxRef} className={fill ? "map-canvas fill" : "map-canvas"} style={fill ? undefined : { height }}>
      <ComposableMap
        projection={projection}
        width={width}
        height={boxHeight}
        style={{ width: "100%", height: "100%" }}
      >
        <ZoomableGroup minZoom={1} maxZoom={6}>
          <Geographies geography={worldAtlas as unknown as string}>
            {({ geographies }) =>
              geographies.map((geo) => (
                <Geography
                  key={geo.rsmKey}
                  geography={geo}
                  fill="rgba(104, 139, 181, .22)"
                  stroke="rgba(147, 191, 224, .3)"
                  strokeWidth={0.55}
                  style={{ outline: "none" }}
                />
              ))
            }
          </Geographies>
          {clusters.map((c) => {
            const r = radiusFor(c.offres.length, max);
            const isActive = c.key === activeKey || c.key === highlightedKey;
            const color = c.urgentes ? "#ff8b6b" : "#4cd8e8";
            return (
              <Marker key={c.key} coordinates={[c.lon, c.lat]} onClick={() => open(c.key)} className="map-marker">
                <g className="marker-node">
                  <title>{`${c.lieu} — ${c.offres.length} offre${c.offres.length > 1 ? "s" : ""}`}</title>
                  <circle r={Math.max(14, r + 8)} fill="transparent" />
                  <circle r={r * 2.1} fill={color} opacity={isActive ? 0.28 : 0.14} />
                  <circle r={isActive ? r + 2 : r} fill={color} stroke="#bdf7ff" strokeWidth={isActive ? 2.5 : 1.5} />
                  {c.offres.length > 1 && (
                    <text textAnchor="middle" y={r * 0.38} className="map-marker-count" style={{ fontSize: Math.max(7, r * 0.95) }}>
                      {c.offres.length}
                    </text>
                  )}
                </g>
              </Marker>
            );
          })}
        </ZoomableGroup>
      </ComposableMap>

      <div className="map-legend overlay">
        <span>
          <i className="map-dot" /> Zone avec offres
        </span>
        <span>
          <i className="map-dot urgent" /> Échéance ≤ 7 jours
        </span>
        {unlocated > 0 && <small>{unlocated} offre(s) sans coordonnées</small>}
      </div>

      {active && (
        <div className="map-popover" role="dialog" aria-label={active.lieu}>
          <button className="modal-close" onClick={() => setActiveKey(null)} aria-label="Fermer">
            <X size={15} />
          </button>
          <span className="eyebrow">
            <i className="category-dot" />
            <MapPin size={12} /> {active.lieu}
          </span>
          <p className="map-count">
            {active.offres.length} offre{active.offres.length > 1 ? "s" : ""}
            {active.urgentes > 0 && ` · ${active.urgentes} bientôt expirée${active.urgentes > 1 ? "s" : ""}`}
          </p>
          <div className="map-previews">
            {slice.map((o) => {
              const days = remainingDays(o);
              const locked = lockedIds?.has(o.id);
              const href = locked ? `/connexion?next=/offres/${encodeURIComponent(o.id)}` : `/offres/${encodeURIComponent(o.id)}`;
              return (
                <div className="map-preview" key={o.id}>
                  <strong title={o.titre}>{o.titre}</strong>
                  <small>
                    <Building2 size={11} /> {o.organisation ?? "Organisme non précisé"} · {labelSecteur(o.secteur)}
                  </small>
                  <small>
                    <CalendarDays size={11} /> {o.date_limite ? formatDateLong(o.date_limite) : "Sans date limite"}
                  </small>
                  <div className="map-preview-foot">
                    <Badge label={expiryLabel(days)} tone={deadlineTone(days, o.ouverte)} />
                    {onSelectOffer && !locked ? (
                      <button className="text-button" onClick={() => onSelectOffer(o.id)}>
                        Voir les détails <ArrowRight size={13} />
                      </button>
                    ) : (
                      <Link href={href} className="text-button">
                        {locked ? "Se connecter" : "Voir les détails"} <ArrowRight size={13} />
                      </Link>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
          {pages > 1 && (
            <div className="map-pager">
              <button className="icon-button" disabled={page === 0} onClick={() => setPage(page - 1)} aria-label="Précédent">
                <ChevronLeft size={15} />
              </button>
              <small>
                {page + 1} / {pages}
              </small>
              <button className="icon-button" disabled={page >= pages - 1} onClick={() => setPage(page + 1)} aria-label="Suivant">
                <ChevronRight size={15} />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
