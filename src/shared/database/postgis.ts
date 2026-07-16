/**
 * PostGIS Helpers
 * Funciones auxiliares para operaciones geoespaciales
 */

/**
 * Convierte coordenadas lat/lng a formato PostGIS POINT
 */
export function toPoint(lat: number, lng: number): string {
  return `POINT(${lng} ${lat})`
}

/**
 * Calcula distancia entre dos puntos en metros usando Haversine
 */
export function haversineDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371e3 // Radio de la Tierra en metros
  const φ1 = (lat1 * Math.PI) / 180
  const φ2 = (lat2 * Math.PI) / 180
  const Δφ = ((lat2 - lat1) * Math.PI) / 180
  const Δλ = ((lng2 - lng1) * Math.PI) / 180

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))

  return R * c
}

/**
 * Verifica si un punto está dentro de un radio determinado
 */
export function isWithinRadius(
  centerLat: number,
  centerLng: number,
  pointLat: number,
  pointLng: number,
  radiusMeters: number
): boolean {
  const distance = haversineDistance(centerLat, centerLng, pointLat, pointLng)
  return distance <= radiusMeters
}
