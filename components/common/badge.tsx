/** Pastille de statut. `tone` : success | warning | danger | blue | neutral. */
export function Badge({ label, tone = "neutral" }: { label: string; tone?: string }) {
  return <span className={`badge ${tone}`}>{label}</span>;
}
