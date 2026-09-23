"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowRight,
  Building2,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Layers as LayersIcon,
  MapPin,
  X,
} from "lucide-react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { Offre } from "@/lib/api-types";
import { expiryLabel, formatDateLong } from "@/lib/dates";
import { deadlineTone, labelSecteur, offreLocation } from "@/lib/format";
import { byDeadline, remainingDays } from "@/lib/visibility";
import { Badge } from "../common/badge";
import {
  DEFAULT_LAYER,
  isLayerId,
  LAYER_ORDER,
  LAYER_STORAGE_KEY,
  TILE_LAYERS,
  type LayerId,
} from "./tile-layers";

export interface Cluster {
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

/** Diamètre du marqueur, proportionnel au volume d'offres du point. */
const sizeFor = (count: number, max: number) => 22 + Math.sqrt(count / Math.max(1, max)) * 20;

/** Marqueur HTML : mêmes codes visuels que le reste de l'interface. */
function buildIcon(cluster: Cluster, max: number, active: boolean) {
  const size = sizeFor(cluster.offres.length, max);
  const urgent = cluster.urgentes > 0;
  const classes = [
    "offer-pin",
    urgent ? "urgent" : "",
    active ? "active" : "",
    cluster.offres.length > 1 ? "grouped" : "",
  ]
    .filter(Boolean)
    .join(" ");
  return L.divIcon({
    className: "offer-pin-wrap",
    html: `<span class="${classes}" style="--pin:${size}px">${
      cluster.offres.length > 1 ? `<b>${cluster.offres.length}</b>` : ""
    }</span>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
}

/**
 * Carte des offres, adossée à OpenStreetMap (tuiles raster) avec bascule
 * vers une vue satellite. Un marqueur par position ; le clic ouvre l'aperçu
 * des offres de ce point.
 *
 * Leaflet est piloté impérativement : les marqueurs sont peu nombreux et
 * leur cycle de vie est simple, ce qui évite une dépendance de plus.
 */
export default function OffersMapImpl({
  offres,
  highlightedId,
  onSelectOffer,
  lockedIds,
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
  const mapRef = useRef<L.Map | null>(null);
  const baseRef = useRef<L.TileLayer | null>(null);
  const overlayRef = useRef<L.TileLayer | null>(null);
  const markersRef = useRef<Map<string, L.Marker>>(new Map());

  const [layer, setLayer] = useState<LayerId>(DEFAULT_LAYER);
  const [activeKey, setActiveKey] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [interactive, setInteractive] = useState(false);

  const clusters = useMemo(() => clusterize(offres), [offres]);
  const max = Math.max(1, ...clusters.map((c) => c.offres.length));
  const unlocated = offres.length - clusters.reduce((n, c) => n + c.offres.length, 0);
  const active = clusters.find((c) => c.key === activeKey) ?? null;
  const highlightedKey = useMemo(
    () => clusters.find((c) => c.offres.some((o) => o.id === highlightedId))?.key ?? null,
    [clusters, highlightedId],
  );

  const open = useCallback((key: string) => {
    setActiveKey(key);
    setPage(0);
  }, []);

  /* ── Choix du fond mémorisé d'une visite à l'autre ──────────────────── */
  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(LAYER_STORAGE_KEY);
      if (isLayerId(saved)) setLayer(saved);
    } catch {
      /* stockage indisponible */
    }
  }, []);

  const chooseLayer = (id: LayerId) => {
    setLayer(id);
    try {
      window.localStorage.setItem(LAYER_STORAGE_KEY, id);
    } catch {
      /* ignore */
    }
  };

  /* ── Création de la carte ───────────────────────────────────────────── */
  useEffect(() => {
    const node = boxRef.current;
    if (!node || mapRef.current) return;

    const calm = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const map = L.map(node, {
      zoomControl: false,
      attributionControl: true,
      // La molette ne doit pas capturer le défilement de la page : elle est
      // activée seulement après un clic sur la carte.
      scrollWheelZoom: false,
      worldCopyJump: true,
      minZoom: 2,
      zoomAnimation: !calm,
      fadeAnimation: !calm,
      markerZoomAnimation: !calm,
    });
    map.setView([20, 10], 2);
    L.control.zoom({ position: "topright" }).addTo(map);
    map.attributionControl.setPrefix("");
    mapRef.current = map;

    const enable = () => {
      map.scrollWheelZoom.enable();
      setInteractive(true);
    };
    const disable = () => {
      map.scrollWheelZoom.disable();
      setInteractive(false);
    };
    map.on("click", enable);
    map.on("focus", enable);
    map.on("blur", disable);
    node.addEventListener("mouseleave", disable);

    // Leaflet doit recalculer sa taille quand le panneau change de dimensions.
    const observer =
      typeof ResizeObserver !== "undefined"
        ? new ResizeObserver(() => map.invalidateSize({ animate: false }))
        : null;
    observer?.observe(node);

    return () => {
      observer?.disconnect();
      node.removeEventListener("mouseleave", disable);
      map.remove();
      mapRef.current = null;
      baseRef.current = null;
      overlayRef.current = null;
      markersRef.current.clear();
    };
  }, []);

  /* ── Fond de carte (et libellés pour le satellite) ──────────────────── */
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const def = TILE_LAYERS[layer];

    baseRef.current?.remove();
    overlayRef.current?.remove();
    overlayRef.current = null;

    baseRef.current = L.tileLayer(def.url, {
      attribution: def.attribution,
      maxZoom: def.maxZoom,
      subdomains: def.subdomains ?? "abc",
      detectRetina: true,
      className: def.tone === "sombre" ? "tiles-sombre" : "tiles-brut",
    }).addTo(map);

    if (def.overlayUrl) {
      overlayRef.current = L.tileLayer(def.overlayUrl, {
        maxZoom: def.maxZoom,
        detectRetina: true,
        className: "tiles-labels",
      }).addTo(map);
    }
  }, [layer]);

  /* ── Marqueurs et cadrage sur les données ───────────────────────────── */
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    for (const marker of markersRef.current.values()) marker.remove();
    markersRef.current.clear();

    for (const cluster of clusters) {
      const marker = L.marker([cluster.lat, cluster.lon], {
        icon: buildIcon(cluster, max, false),
        title: `${cluster.lieu} — ${cluster.offres.length} offre${cluster.offres.length > 1 ? "s" : ""}`,
        keyboard: true,
        riseOnHover: true,
      })
        .addTo(map)
        .on("click", () => open(cluster.key))
        .on("keypress", () => open(cluster.key));
      markersRef.current.set(cluster.key, marker);
    }

    if (clusters.length) {
      const bounds = L.latLngBounds(clusters.map((c) => [c.lat, c.lon] as [number, number]));
      map.fitBounds(bounds, {
        padding: [48, 48],
        // Un point isolé ne doit pas être vu de trop près.
        maxZoom: clusters.length === 1 ? 9 : 12,
        animate: false,
      });
    }
  }, [clusters, max, open]);

  /* ── Mise en avant du point survolé dans la liste ───────────────────── */
  useEffect(() => {
    for (const cluster of clusters) {
      const marker = markersRef.current.get(cluster.key);
      const isActive = cluster.key === activeKey || cluster.key === highlightedKey;
      marker?.setIcon(buildIcon(cluster, max, isActive));
    }
  }, [clusters, max, activeKey, highlightedKey]);

  const pages = active ? Math.ceil(active.offres.length / PAGE) : 0;
  const slice = active ? active.offres.slice(page * PAGE, page * PAGE + PAGE) : [];

  return (
    <div className={fill ? "map-canvas fill" : "map-canvas"} style={fill ? undefined : { height }}>
      <div ref={boxRef} className="leaflet-host" />

      <div className="map-layers" role="group" aria-label="Fond de carte">
        <LayersIcon size={13} aria-hidden />
        {LAYER_ORDER.map((id) => (
          <button
            key={id}
            type="button"
            className={layer === id ? "active" : ""}
            onClick={() => chooseLayer(id)}
            aria-pressed={layer === id}
            title={TILE_LAYERS[id].hint}
          >
            {TILE_LAYERS[id].label}
          </button>
        ))}
      </div>

      <div className="map-legend overlay">
        <span>
          <i className="map-dot" /> Zone avec offres
        </span>
        <span>
          <i className="map-dot urgent" /> Échéance ≤ 7 jours
        </span>
        {unlocated > 0 && <small>{unlocated} offre(s) sans coordonnées</small>}
      </div>

      {!interactive && <p className="map-hint">Cliquez sur la carte pour zoomer à la molette</p>}

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
              const href = locked
                ? `/connexion?next=/offres/${encodeURIComponent(o.id)}`
                : `/offres/${encodeURIComponent(o.id)}`;
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
              <button
                className="icon-button"
                disabled={page >= pages - 1}
                onClick={() => setPage(page + 1)}
                aria-label="Suivant"
              >
                <ChevronRight size={15} />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
