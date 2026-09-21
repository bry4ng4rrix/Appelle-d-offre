import { NextResponse } from 'next/server'
import type { Nature, OffresFilters, Tri } from '@/lib/api-types'
import { jsonError, requireAuth } from '@/lib/server/guard'
import { listOffres } from '@/lib/server/offres'

export const runtime = 'nodejs'

const TRIS: Tri[] = ['echeance', 'publication', 'ajout']
const NATURES: Nature[] = ['marche', 'emploi']

/** Reprend les filtres de l'API publique, bornés. */
function readFilters(params: URLSearchParams): OffresFilters {
  const str = (k: string) => params.get(k)?.trim() || undefined
  const int = (k: string, min: number, max: number) => {
    const v = Number(params.get(k))
    return Number.isFinite(v) && v > 0 ? Math.min(max, Math.max(min, Math.floor(v))) : undefined
  }
  const tri = str('tri') as Tri | undefined
  const nature = str('nature') as Nature | undefined
  return {
    q: str('q'),
    nature: nature && NATURES.includes(nature) ? nature : undefined,
    secteur: str('secteur'),
    source: str('source'),
    categorie: str('categorie'),
    pays: str('pays'),
    region: str('region'),
    lieu: str('lieu'),
    urgence: int('urgence', 1, 365),
    cloturees: params.get('cloturees') === '1',
    tri: tri && TRIS.includes(tri) ? tri : 'echeance',
    limite: int('limite', 1, 200) ?? 50,
    depuis: int('depuis', 0, 1_000_000) ?? 0,
  }
}

/** GET /api/offres — catalogue complet, réservé aux utilisateurs connectés. */
export async function GET(request: Request) {
  const auth = await requireAuth(request)
  if (!auth.ok) return auth.response
  try {
    const { data, source } = await listOffres(readFilters(new URL(request.url).searchParams))
    return NextResponse.json(data, { headers: { 'Cache-Control': 'no-store', 'X-Data-Source': source } })
  } catch {
    return jsonError('Source des offres indisponible.', 502)
  }
}
