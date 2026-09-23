"use client";

import { DatabaseZap } from "lucide-react";
import { useDataSource } from "@/lib/use-api";

/** Informe que les données affichées viennent du jeu local, pas de l'API. */
export function DataSourceBanner() {
  const source = useDataSource();
  if (source !== "local") return null;
  return (
    <div className="data-banner" role="status">
      <DatabaseZap size={15} />
      API injoignable — affichage du jeu de données local de démonstration.
    </div>
  );
}
