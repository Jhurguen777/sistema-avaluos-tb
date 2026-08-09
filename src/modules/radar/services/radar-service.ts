/**
 * Radar Service
 * Genera el análisis de equipamientos cercanos usando OpenStreetMap (Overpass API)
 * y lo almacena como AvaluoEntorno + Equipamientos (distancia por Haversine).
 */

import { prisma } from '@/shared/database/prisma'
import { haversineDistance } from '@/shared/database/postgis'
import { TIPO_EQUIPAMIENTO_LABELS } from '@/constants/tipos-equipamiento'
import type { TipoEquipamiento } from '@prisma/client'

/** Mapea tags de OSM → TipoEquipamiento del sistema */
const OSM_A_TIPO: Record<string, TipoEquipamiento> = {
  hospital: 'HOSPITAL',
  clinic: 'CLINICA',
  university: 'UNIVERSIDAD',
  college: 'COLEGIO',
  school: 'COLEGIO',
  kindergarten: 'COLEGIO',
  bank: 'BANCO',
  bus_station: 'TRANSPORTE',
  marketplace: 'MERCADO',
  place_of_worship: 'IGLESIA',
  townhall: 'ENTIDAD_PUBLICA',
  police: 'ENTIDAD_PUBLICA',
  post_office: 'ENTIDAD_PUBLICA',
  mall: 'CENTRO_COMERCIAL',
}

const TIPO_LABEL: Record<TipoEquipamiento, string> = Object.fromEntries(
  Object.entries(TIPO_EQUIPAMIENTO_LABELS),
) as Record<TipoEquipamiento, string>

interface ElementoOSM {
  id: number
  lat?: number
  lon?: number
  center?: { lat: number; lon: number }
  tags?: { name?: string; amenity?: string; leisure?: string; shop?: string }
}

/** Endpoints de Overpass (espejos). Si se define OVERPASS_URL, se usa solo ese. */
const OVERPASS_ENDPOINTS =
  process.env.OVERPASS_URL
    ? [process.env.OVERPASS_URL]
    : [
        'https://overpass-api.de/api/interpreter',
        'https://overpass.kumi.systems/api/interpreter',
        'https://overpass.openstreetmap.fr/api/interpreter',
      ]

const OVERPASS_TIMEOUT_MS = 30_000
const OVERPASS_USER_AGENT = 'GeoPricer-Avaluos/1.0 (Next.js)'
const OVERPASS_REINTENTOS = 2

/** Llamada única a un endpoint de Overpass. Lanza con causa real si falla. */
async function fetchOverpassOnce(
  endpoint: string,
  body: string,
  signal: AbortSignal,
): Promise<ElementoOSM[]> {
  const res = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'User-Agent': OVERPASS_USER_AGENT,
    },
    body,
    cache: 'no-store',
    signal,
  })
  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(`Overpass HTTP ${res.status} (${endpoint}): ${text.slice(0, 200)}`)
  }
  const json = await res.json()
  // Overpass puede responder 200 con un remark de timeout interno y 0 elementos
  if (json.remark) {
    throw new Error(`Overpass remark (${endpoint}): ${json.remark}`)
  }
  return (json.elements ?? []) as ElementoOSM[]
}

/**
 * Consulta Overpass API para amenities dentro del radio.
 * Recorre los espejos con reintentos y backoff corto para superar
 * saturación (429) o caídas del endpoint principal.
 */
async function fetchOverpass(lat: number, lng: number, radio: number): Promise<ElementoOSM[]> {
  const q = `[out:json][timeout:25];(
    node(around:${radio},${lat},${lng})["amenity"~"^(hospital|clinic|university|college|school|kindergarten|bank|bus_station|marketplace|place_of_worship|townhall|police|post_office)$"];
    way(around:${radio},${lat},${lng})["amenity"~"^(hospital|clinic|university|college|school|kindergarten|bank|bus_station|marketplace|place_of_worship|townhall|police|post_office)$"];
    node(around:${radio},${lat},${lng})["leisure"="park"];
    way(around:${radio},${lat},${lng})["leisure"="park"];
    node(around:${radio},${lat},${lng})["shop"="mall"];
    way(around:${radio},${lat},${lng})["shop"="mall"];
  );out center 80;`
  const body = 'data=' + encodeURIComponent(q)

  let lastError: Error | null = null
  for (const endpoint of OVERPASS_ENDPOINTS) {
    for (let intento = 0; intento < OVERPASS_REINTENTOS; intento++) {
      const controller = new AbortController()
      const timer = setTimeout(() => controller.abort(), OVERPASS_TIMEOUT_MS)
      try {
        return await fetchOverpassOnce(endpoint, body, controller.signal)
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error))
      } finally {
        clearTimeout(timer)
      }
      // Backoff corto solo si habrá otro intento sobre este endpoint
      if (intento < OVERPASS_REINTENTOS - 1) {
        await new Promise((r) => setTimeout(r, 1500))
      }
    }
  }
  throw lastError ?? new Error('No se pudo consultar OpenStreetMap (Overpass)')
}

export const radarService = {
  /**
   * Genera (o regenera) el radar de equipamientos para un avalúo.
   * Requiere que el inmueble asociado tenga lat/lng.
   */
  async generar(avaluoId: string, radio: number) {
    const avaluo = await prisma.avaluo.findUnique({
      where: { id: avaluoId },
      include: { product: true },
    })
    if (!avaluo) throw new Error('Avalúo no encontrado')
    const lat = avaluo.product?.lat
    const lng = avaluo.product?.lng
    if (lat == null || lng == null) {
      throw new Error('El inmueble no tiene coordenadas. Edita el inmueble para asignar lat/lng.')
    }

    const elementos = await fetchOverpass(lat, lng, radio)

    // Procesar y desduplicar elementos ANTES de la transacción
    const vistos = new Set<string>()
    const equipamientos: Array<{ tipo: TipoEquipamiento; nombre: string; distancia: number; lat: number; lng: number }> = []
    for (const el of elementos) {
      const elLat = el.lat ?? el.center?.lat
      const elLon = el.lon ?? el.center?.lon
      if (elLat == null || elLon == null) continue

      const amenity = el.tags?.amenity
      const leisure = el.tags?.leisure
      const shop = el.tags?.shop
      let tipo: TipoEquipamiento | undefined
      if (amenity && OSM_A_TIPO[amenity]) tipo = OSM_A_TIPO[amenity]
      else if (leisure === 'park') tipo = 'PARQUE'
      else if (shop && OSM_A_TIPO[shop]) tipo = OSM_A_TIPO[shop]
      if (!tipo) continue

      const nombre = el.tags?.name?.trim() || TIPO_LABEL[tipo]
      const key = `${tipo}-${nombre}-${elLat.toFixed(5)}-${elLon.toFixed(5)}`
      if (vistos.has(key)) continue
      vistos.add(key)

      const distancia = Math.round(haversineDistance(lat, lng, elLat, elLon))
      equipamientos.push({ tipo, nombre, distancia, lat: elLat, lng: elLon })
    }

    // Reemplazo atómico del entorno + equipamientos en una sola transacción
    await prisma.$transaction(async (tx) => {
      await tx.avaluoEntorno.deleteMany({ where: { avaluoId } })
      const entorno = await tx.avaluoEntorno.create({ data: { avaluoId, radio } })
      if (equipamientos.length > 0) {
        await tx.equipamiento.createMany({
          data: equipamientos.map((e) => ({ entornoId: entorno.id, ...e })),
        })
      }
    })

    return this.obtener(avaluoId)
  },

  /** Obtiene el entorno y equipamientos almacenados de un avalúo */
  async obtener(avaluoId: string) {
    const entorno = await prisma.avaluoEntorno.findUnique({
      where: { avaluoId },
      include: { equipamientos: { orderBy: { distancia: 'asc' } } },
    })
    return entorno
  },

  /** Elimina un equipamiento concreto por su ID (borrado permanente de la BD) */
  async eliminarEquipamiento(equipamientoId: string) {
    return prisma.equipamiento.delete({ where: { id: equipamientoId } })
  },
}
