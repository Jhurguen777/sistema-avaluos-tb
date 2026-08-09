/**
 * Parser para extraer coordenadas (lat/lng) de URLs de Google Maps.
 *
 * Soporta múltiples formatos:
 *  - https://www.google.com/maps/place/.../@-17.3895,-66.1569,15z
 *  - https://maps.google.com/?q=-17.3895,-66.1569
 *  - https://maps.google.com/maps?ll=-17.3895,-66.1569
 *  - https://www.google.com/maps?q=-17.3895,-66.1569
 *  - https://maps.app.goo.gl/XYZ (short link - requiere fetch, no soportado)
 */

export interface Coordenadas {
  lat: number
  lng: number
}

const LAT_RE = /(-?\d{1,3}\.\d{1,8})/
const COORD_PAIR_RE = /(-?\d{1,3}\.\d{1,8})\s*,\s*(-?\d{1,3}\.\d{1,8})/

/**
 * Intenta extraer coordenadas desde un texto/URL de Google Maps.
 * Devuelve null si no las encuentra.
 */
export function parseGoogleMapsUrl(input: string): Coordenadas | null {
  if (!input) return null
  const texto = input.trim()

  // 1) Formato @lat,lng (place view): /@-17.3895,-66.1569,15z
  const atMatch = texto.match(/@(-?\d{1,3}\.\d{1,8}),\s*(-?\d{1,3}\.\d{1,8})/)
  if (atMatch) {
    const lat = parseFloat(atMatch[1])
    const lng = parseFloat(atMatch[2])
    if (esLatValida(lat) && esLngValido(lng)) return { lat, lng }
  }

  // 2) Formato ?q=lat,lng o ?q=loc:lat,lng
  const qMatch = texto.match(/[?&]q=(?:loc:)?(-?\d{1,3}\.\d{1,8}),\s*(-?\d{1,3}\.\d{1,8})/)
  if (qMatch) {
    const lat = parseFloat(qMatch[1])
    const lng = parseFloat(qMatch[2])
    if (esLatValida(lat) && esLngValido(lng)) return { lat, lng }
  }

  // 3) Formato ?ll=lat,lng
  const llMatch = texto.match(/[?&]ll=(-?\d{1,3}\.\d{1,8}),\s*(-?\d{1,3}\.\d{1,8})/)
  if (llMatch) {
    const lat = parseFloat(llMatch[1])
    const lng = parseFloat(llMatch[2])
    if (esLatValida(lat) && esLngValido(lng)) return { lat, lng }
  }

  // 4) Formato !3dlat!4dlng (datos de place)
  const d3Match = texto.match(/!3d(-?\d{1,3}\.\d{1,8})!4d(-?\d{1,3}\.\d{1,8})/)
  if (d3Match) {
    const lat = parseFloat(d3Match[1])
    const lng = parseFloat(d3Match[2])
    if (esLatValida(lat) && esLngValido(lng)) return { lat, lng }
  }

  // 5) Cualquier par de coordenadas en el texto (fallback)
  const pairMatch = texto.match(COORD_PAIR_RE)
  if (pairMatch) {
    const lat = parseFloat(pairMatch[1])
    const lng = parseFloat(pairMatch[2])
    if (esLatValida(lat) && esLngValido(lng)) return { lat, lng }
  }

  // 6) Un solo número (probablemente lat)
  const singleMatch = texto.match(LAT_RE)
  if (singleMatch) {
    const lat = parseFloat(singleMatch[1])
    if (esLatValida(lat)) {
      // buscar otro número después
      const after = texto.slice(singleMatch.index! + singleMatch[0].length)
      const secondMatch = after.match(/(-?\d{1,3}\.\d{1,8})/)
      if (secondMatch) {
        const lng = parseFloat(secondMatch[1])
        if (esLngValido(lng)) return { lat, lng }
      }
    }
  }

  return null
}

function esLatValida(lat: number): boolean {
  return Number.isFinite(lat) && lat >= -90 && lat <= 90
}

function esLngValido(lng: number): boolean {
  return Number.isFinite(lng) && lng >= -180 && lng <= 180
}
