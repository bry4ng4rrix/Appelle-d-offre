"use client";

import dynamic from "next/dynamic";
import type { Offre } from "@/lib/api-types";

export interface OffersMapProps {
  offres: Offre[];
  highlightedId?: string | null;
  onSelectOffer?: (id: string) => void;
  /** Offres visibles sur la carte mais réservées aux utilisateurs connectés. */
  lockedIds?: Set<string>;
  height?: number;
  /** `true` : occupe 100 % du parent (panneau à hauteur fixe). */
  fill?: boolean;
}

/**
 * Leaflet a besoin du DOM : la carte est chargée uniquement côté client.
 * L'API publique du composant est inchangée pour ses trois appelants.
 */
const OffersMapImpl = dynamic(() => import("./offers-map-impl"), {
  ssr: false,
  loading: () => <div className="map-canvas fill map-loading" aria-hidden />,
});

export function OffersMap(props: OffersMapProps) {
  return <OffersMapImpl {...props} />;
}
