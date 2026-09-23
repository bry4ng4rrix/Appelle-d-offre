/**
 * Fonds de carte — tous librement accessibles, **sans clé d'API ni jeton**.
 *
 * Le rendu sombre passe par un filtre CSS appliqué aux tuiles OpenStreetMap
 * d'origine : les services de tuiles sombres prêtes à l'emploi (CARTO, Stadia)
 * exigent désormais une clé, et renvoient sinon une image filigranée.
 *
 * L'attribution affichée par Leaflet est imposée par les licences : ne pas
 * la retirer. Le service de tuiles d'OpenStreetMap vise un trafic modéré ;
 * pour une mise en production à fort volume, prévoir un miroir dédié
 * (la bascule se fait ici, sans toucher au reste du code).
 */
export interface TileLayerDef {
  id: LayerId;
  label: string;
  /** Description courte affichée en infobulle du sélecteur. */
  hint: string;
  url: string;
  attribution: string;
  maxZoom: number;
  subdomains?: string;
  /** Couche de libellés superposée (frontières, villes) pour le satellite. */
  overlayUrl?: string;
  /** Rendu des tuiles : `sombre` applique la correction colorimétrique. */
  tone: "sombre" | "brut";
}

export type LayerId = "plan" | "satellite" | "clair";

const OSM_ATTR =
  '&copy; les contributeurs <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>';
const OSM_URL = "https://tile.openstreetmap.org/{z}/{x}/{y}.png";

export const TILE_LAYERS: Record<LayerId, TileLayerDef> = {
  satellite: {
    id: "satellite",
    label: "Satellite",
    hint: "Imagerie aérienne avec libellés",
    url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    overlayUrl:
      "https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}",
    attribution: "Imagerie &copy; Esri, Maxar, Earthstar Geographics",
    maxZoom: 19,
    tone: "brut",
  },
  plan: {
    id: "plan",
    label: "Plan",
    hint: "OpenStreetMap, rendu sombre",
    url: OSM_URL,
    attribution: OSM_ATTR,
    maxZoom: 19,
    tone: "sombre",
  },
  clair: {
    id: "clair",
    label: "Clair",
    hint: "Rendu OpenStreetMap d’origine",
    url: OSM_URL,
    attribution: OSM_ATTR,
    maxZoom: 19,
    tone: "brut",
  },
};

/** Ordre d'affichage du sélecteur, et fond retenu par défaut. */
export const LAYER_ORDER: LayerId[] = ["satellite", "plan", "clair"];
export const DEFAULT_LAYER: LayerId = "satellite";
export const LAYER_STORAGE_KEY = "appelpro.fond-carte";

export const isLayerId = (value: unknown): value is LayerId =>
  typeof value === "string" && value in TILE_LAYERS;
