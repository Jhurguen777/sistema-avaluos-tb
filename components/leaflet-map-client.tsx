"use client"

import { useEffect, useState, useRef } from "react"
import L from "leaflet"
import "leaflet/dist/leaflet.css"
import "leaflet.markercluster"
import "leaflet.markercluster/dist/MarkerCluster.css"
import "leaflet.markercluster/dist/MarkerCluster.Default.css"

// Fix para los iconos de Leaflet en Next.js
if (typeof window !== "undefined") {
  delete (L.Icon.Default.prototype as any)._getIconUrl
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
    iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
    shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
  })
}

type OperationType = "VENTA" | "ALQUILER" | "ANTICRETICO"

interface Property {
  id: string
  codigoInmueble: string
  nombre: string
  operacion: OperationType
  precioUsd?: number
  superficieUtil?: number
  lat: number
  lng: number
  direccion?: string
  categoria?: string
}

// Íconos SVG por categoría (paths exactos de lucide-react, mismos que Crear Avalúo)
const ICON_PATHS: Record<string, string> = {
  house: '<path d="M15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8"/><path d="M3 10a2 2 0 0 1 .709-1.528l7-6a2 2 0 0 1 2.582 0l7 6A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>',
  apartment: '<path d="M10 12h4"/><path d="M10 8h4"/><path d="M14 21v-3a2 2 0 0 0-4 0v3"/><path d="M6 10H4a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-2"/><path d="M6 21V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v16"/>',
  land: '<path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0"/><circle cx="12" cy="10" r="3"/>',
}

// Mapa categoría (ProductCategoryEnum) → tipo de ícono
const CATEGORIA_TO_ICON: Record<string, string> = {
  CASA: "house",
  QUINTA: "house",
  DUPLEX: "house",
  DEPARTAMENTO: "apartment",
  PENTHOUSE: "apartment",
  MONOAMBIENTE: "apartment",
  CONDOMINIO: "apartment",
  TERRENO: "land",
}

interface LeafletMapClientProps {
  properties?: Property[]
  center?: [number, number]
  zoom?: number
  selectable?: boolean
  onPropertySelect?: (property: Property) => void
  selectedProperty?: Property | null
  showRadar?: boolean
  radarRadius?: number
  onRadarChange?: (lat: number, lng: number, radius: number) => void
  radarPosition?: [number, number] | null
  /** Agrupar marcadores cuando hay muchos (recomendado para >50). */
  cluster?: boolean
}

export function LeafletMapClient({
  properties = [],
  center = [-17.3895, -66.1569],
  zoom = 14,
  selectable = false,
  onPropertySelect,
  selectedProperty = null,
  showRadar = false,
  radarRadius = 500,
  onRadarChange,
  radarPosition = null,
  cluster = false
}: LeafletMapClientProps) {
  const mapRef = useRef<L.Map | null>(null)
  const mapContainerRef = useRef<HTMLDivElement>(null)
  const markersMapRef = useRef<Map<string, L.Marker>>(new Map())
  const prevSelectedRef = useRef<Property | null>(null)
  const clusterLayerRef = useRef<L.MarkerClusterGroup | null>(null)
  const radarCircleRef = useRef<L.Circle | null>(null)
  const tileLayerRef = useRef<L.TileLayer | null>(null)
  const labelsLayerRef = useRef<L.TileLayer | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [loadedCount, setLoadedCount] = useState(0)
  const [currentRadarPosition, setCurrentRadarPosition] = useState<[number, number] | null>(radarPosition)
  const [currentRadius, setCurrentRadius] = useState(radarRadius)
  const [mapType, setMapType] = useState<"street" | "satellite">("street")

  /** Configuración de teselas: calle (OpenStreetMap) o satélite (Esri World Imagery). */
  const TILE_LAYERS = {
    street: {
      url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    },
    satellite: {
      url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
      attribution:
        "Tiles &copy; Esri &mdash; Source: Esri, Maxar, Earthstar Geographics, and the GIS User Community",
    },
  }
  const SATELLITE_LABELS_URL =
    "https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}"

  // Colores por tipo de operación
  const getMarkerColor = (operacion: OperationType) => {
    switch (operacion) {
      case "VENTA":
        return "#3b82f6" // blue
      case "ALQUILER":
        return "#ef4444" // red
      case "ANTICRETICO":
        return "#eab308" // yellow
      default:
        return "#64748b" // slate
    }
  }

  // Círculo color por OPERACIÓN + ícono lucide por CATEGORÍA.
  // Renderizado como <img> (data URI SVG) vía L.icon: 100% confiable en Leaflet.
  const createPinIcon = (operacion: OperationType, categoria?: string) => {
    const color = getMarkerColor(operacion)
    const iconKey = (categoria && CATEGORIA_TO_ICON[categoria]) || "house"
    const path = ICON_PATHS[iconKey] ?? ICON_PATHS.house
    const svg =
      `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24">` +
      `<circle cx="12" cy="12" r="11" fill="${color}" stroke="#ffffff" stroke-width="2"/>` +
      `<g fill="none" stroke="#ffffff" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">${path}</g>` +
      `</svg>`
    const iconUrl = `data:image/svg+xml;base64,${btoa(svg)}`
    return L.icon({ iconUrl, iconSize: [32, 32], iconAnchor: [16, 16], popupAnchor: [0, -16] })
  }

  // Ícono del marcador SELECCIONADO: MISMO círculo (no cambia el pin),
  // solo envuelto para animarse (caída + rebote + pulso) y destacar.
  const createSelectedPinIcon = (operacion: OperationType, categoria?: string) => {
    const color = getMarkerColor(operacion)
    const iconKey = (categoria && CATEGORIA_TO_ICON[categoria]) || "house"
    const path = ICON_PATHS[iconKey] ?? ICON_PATHS.house
    const svg =
      `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24">` +
      `<circle cx="12" cy="12" r="11" fill="${color}" stroke="#ffffff" stroke-width="2"/>` +
      `<g fill="none" stroke="#ffffff" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">${path}</g>` +
      `</svg>`
    const url = `data:image/svg+xml;base64,${btoa(svg)}`
    return L.divIcon({
      className: "custom-marker marker-selected",
      html: `<img src="${url}" width="32" height="32" alt="" class="marker-selected-img"/>`,
      iconSize: [32, 32],
      iconAnchor: [16, 16],
      popupAnchor: [0, -16],
    })
  }

  // Icono de cluster: color según la operación dominante de sus marcadores
  const buildClusterIcon = (c: L.MarkerCluster) => {
    const children = c.getAllChildMarkers() as any[]
    const counts: Record<string, number> = { VENTA: 0, ALQUILER: 0, ANTICRETICO: 0 }
    children.forEach((m) => {
      const op = m.__operacion as OperationType | undefined
      if (op) counts[op] = (counts[op] || 0) + 1
    })
    const entries = Object.entries(counts) as [OperationType, number][]
    const max = Math.max(...entries.map(([, n]) => n))
    const dominantes = entries.filter(([, n]) => n === max && n > 0)
    // Color: operación dominante si hay una sola; neutro si hay empate/mezcla pareja
    const color = dominantes.length === 1 ? getMarkerColor(dominantes[0][0]) : "#334155"
    const size = children.length >= 100 ? 50 : children.length >= 10 ? 44 : 38
    const svg =
      `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 40 40">` +
      `<circle cx="20" cy="20" r="18" fill="${color}" stroke="#ffffff" stroke-width="2"/>` +
      `<text x="20" y="20" text-anchor="middle" dominant-baseline="central" fill="#ffffff" font-size="14" font-weight="700" font-family="system-ui,sans-serif">${children.length}</text>` +
      `</svg>`
    const url = `data:image/svg+xml;base64,${btoa(svg)}`
    return L.divIcon({
      className: "custom-cluster",
      html: `<img src="${url}" width="${size}" height="${size}" alt="" style="display:block;"/>`,
      iconSize: L.point(size, size),
    })
  }

  // Inicializar mapa
  useEffect(() => {
    if (typeof window !== "undefined" && mapContainerRef.current && !mapRef.current) {
      // Crear mapa
      const map = L.map(mapContainerRef.current, {
        center,
        zoom,
        zoomControl: true,
        scrollWheelZoom: true
      })

      // Agregar tile layer de OpenStreetMap
      const baseLayer = L.tileLayer(TILE_LAYERS.street.url, {
        attribution: TILE_LAYERS.street.attribution,
        maxZoom: 19
      }).addTo(map)
      tileLayerRef.current = baseLayer

      mapRef.current = map

      // Simular carga
      setTimeout(() => setIsLoading(false), 500)
    }

    return () => {
      if (mapRef.current) {
        mapRef.current.remove()
        mapRef.current = null
        tileLayerRef.current = null
        labelsLayerRef.current = null
      }
    }
  }, [])

  // Volar a la nueva vista cuando el padre cambia center/zoom por VALOR
  // (ej. al fijar la ubicación en el paso 3 del wizard). Se compara como string
  // porque los consumidores suelen pasar arrays inline (identidad nueva por render).
  // El primer render no vuela: la vista inicial ya se aplicó al crear el mapa.
  const centerKey = center ? `${center[0]},${center[1]}` : ""
  const primerRenderRef = useRef(true)
  useEffect(() => {
    const map = mapRef.current
    if (!map || !centerKey) return
    if (primerRenderRef.current) {
      primerRenderRef.current = false
      return
    }
    map.flyTo([Number(centerKey.split(",")[0]), Number(centerKey.split(",")[1])], zoom, {
      duration: 0.8,
    })
  }, [centerKey, zoom])

  // Cambiar capa de teselas cuando se alterna entre calle y satélite
  useEffect(() => {
    const map = mapRef.current
    if (!map) return

    // Remover capa base y de etiquetas anteriores
    if (tileLayerRef.current) {
      map.removeLayer(tileLayerRef.current)
      tileLayerRef.current = null
    }
    if (labelsLayerRef.current) {
      map.removeLayer(labelsLayerRef.current)
      labelsLayerRef.current = null
    }

    const config = TILE_LAYERS[mapType]
    const baseLayer = L.tileLayer(config.url, { attribution: config.attribution, maxZoom: 19 })
    baseLayer.addTo(map)
    tileLayerRef.current = baseLayer

    // En satélite, superponer etiquetas (límites, lugares, rutas) por encima
    if (mapType === "satellite") {
      const labels = L.tileLayer(SATELLITE_LABELS_URL, { maxZoom: 19 })
      labels.addTo(map)
      labels.bringToFront()
      labelsLayerRef.current = labels
    }
  }, [mapType])

  // Actualizar propiedades (con clustering opcional)
  useEffect(() => {
    if (!mapRef.current) return
    const map = mapRef.current

    // Limpiar capa anterior
    if (clusterLayerRef.current) {
      map.removeLayer(clusterLayerRef.current)
      clusterLayerRef.current = null
    }
    markersMapRef.current.forEach((m) => m.remove())
    markersMapRef.current.clear()

    // Capa destino: cluster group o layer group simple
    const layer: L.LayerGroup = cluster
      ? L.markerClusterGroup({
          iconCreateFunction: buildClusterIcon,
          showCoverageOnHover: false,
          maxClusterRadius: 55,
          spiderfyOnMaxZoom: true,
        })
      : L.layerGroup()

    properties.forEach((property) => {
      const marker = L.marker([property.lat, property.lng], {
        icon: createPinIcon(property.operacion, property.categoria),
      })
      // Se adjunta la operación para que el cluster pueda colorearse por dominancia
      ;(marker as any).__operacion = property.operacion

      if (selectable && onPropertySelect) {
        marker.on("click", () => {
          onPropertySelect(property)
        })
      }

      marker.addTo(layer)
      markersMapRef.current.set(property.id, marker)
    })

    layer.addTo(map)
    if (cluster) clusterLayerRef.current = layer as L.MarkerClusterGroup
    setLoadedCount(properties.length)
  }, [properties, selectable, cluster, onPropertySelect])

  // Al seleccionar una propiedad (lista o marker): vuela hasta ella y la anima.
  // El marcador previamente seleccionado vuelve a su ícono normal.
  useEffect(() => {
    if (!mapRef.current) return

    // Revertir el marcador previo a su círculo normal
    const prev = prevSelectedRef.current
    if (prev && prev.id !== selectedProperty?.id) {
      const pm = markersMapRef.current.get(prev.id)
      if (pm) pm.setIcon(createPinIcon(prev.operacion, prev.categoria))
    }

    if (!selectedProperty) {
      prevSelectedRef.current = null
      return
    }

    const targetZoom = Math.max(mapRef.current.getZoom(), 16)
    mapRef.current.flyTo([selectedProperty.lat, selectedProperty.lng], targetZoom, { duration: 0.8 })

    const marker = markersMapRef.current.get(selectedProperty.id)
    if (marker) {
      marker.setIcon(createSelectedPinIcon(selectedProperty.operacion, selectedProperty.categoria))
    }
    prevSelectedRef.current = selectedProperty
  }, [selectedProperty])

  // Radar
  useEffect(() => {
    if (!mapRef.current || !showRadar) return

    // Limpiar radar existente
    if (radarCircleRef.current) {
      radarCircleRef.current.remove()
      radarCircleRef.current = null
    }

    // Crear nuevo radar
    if (currentRadarPosition) {
      const circle = L.circle(currentRadarPosition, {
        radius: currentRadius,
        color: "#3b82f6",
        fillColor: "#3b82f6",
        fillOpacity: 0.2,
        weight: 2
      })

      circle.addTo(mapRef.current)
      radarCircleRef.current = circle

      // Centrar mapa en el radar
      mapRef.current.setView(currentRadarPosition, 15)
    }
  }, [showRadar, currentRadarPosition, currentRadius])

  // Evento click en mapa: si selectable y sin property pre-existente, permite elegir ubicación
  useEffect(() => {
    if (!mapRef.current || !selectable) return

    const handleMapClick = (e: L.LeafletMouseEvent) => {
      const { lat, lng } = e.latlng
      // Si el caller pasó onPropertySelect, lo invocamos con las coords clickeadas
      // (sin id/codigoInmueble, solo lat/lng) para que el padre pueda usarlas.
      if (onPropertySelect) {
        onPropertySelect({
          id: "_map_click",
          codigoInmueble: "",
          nombre: "",
          operacion: "VENTA",
          lat,
          lng,
        })
      }
    }

    mapRef.current.on("click", handleMapClick)

    return () => {
      if (mapRef.current) {
        mapRef.current.off("click", handleMapClick)
      }
    }
  }, [selectable, onPropertySelect])

  // Evento click en mapa para mover radar
  useEffect(() => {
    if (!mapRef.current || !showRadar) return

    const handleMapClick = (e: L.LeafletMouseEvent) => {
      const { lat, lng } = e.latlng
      setCurrentRadarPosition([lat, lng])
      if (onRadarChange) {
        onRadarChange(lat, lng, currentRadius)
      }
    }

    mapRef.current.on("click", handleMapClick)

    return () => {
      if (mapRef.current) {
        mapRef.current.off("click", handleMapClick)
      }
    }
  }, [showRadar, currentRadius, onRadarChange])

  return (
    <div className="relative h-full w-full">
      {/* Contenedor del mapa */}
      <div ref={mapContainerRef} className="h-full w-full" style={{ zIndex: 0 }} />

      {/* Botón Vista Satélite / Calle */}
      <button
        onClick={() => setMapType((prev) => (prev === "street" ? "satellite" : "street"))}
        className={`absolute top-4 left-4 z-[1000] flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium shadow-lg transition-all hover:scale-105 ${
          mapType === "satellite"
            ? "bg-gradient-to-r from-emerald-500 to-teal-600 text-white"
            : "bg-white text-gray-700 border border-gray-200 hover:text-emerald-600"
        }`}
        title={mapType === "satellite" ? "Ver mapa de calles" : "Ver vista satélite"}
      >
        {mapType === "satellite" ? "🗺️ Calle" : "🛰️ Satélite"}
      </button>

      {/* Indicador de carga */}
      {isLoading && (
        <div className="absolute top-4 right-4 bg-slate-900/90 backdrop-blur-sm text-white px-3 py-2 rounded-lg text-sm z-[1000]">
          Cargando propiedades...
        </div>
      )}

      {/* Contador de propiedades cargadas */}
      {!isLoading && properties.length > 0 && (
        <div className="absolute top-4 right-4 bg-slate-900/90 backdrop-blur-sm text-white px-3 py-2 rounded-lg text-sm z-[1000]">
          {loadedCount} de {properties.length} propiedades
        </div>
      )}

      {/* Controles del radar */}
      {showRadar && (
        <div className="absolute bottom-4 left-4 right-4 sm:right-auto bg-slate-900/90 backdrop-blur-sm p-4 rounded-lg z-[1000]">
          <div className="space-y-3">
            <p className="text-sm font-medium text-white">Radio del Radar</p>
            <input
              type="range"
              min="100"
              max="1000"
              step="50"
              value={currentRadius}
              onChange={(e) => setCurrentRadius(parseInt(e.target.value))}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-slate-400">
              <span>100m</span>
              <span className="font-medium text-white">{currentRadius}m</span>
              <span>1000m</span>
            </div>
            {currentRadarPosition && (
              <p className="text-xs text-slate-400 mt-2">
                Posición: {currentRadarPosition[0].toFixed(4)}, {currentRadarPosition[1].toFixed(4)}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Estilos del popup de Leaflet (tema oscuro coordinado con el dashboard) */}
      <style>{`
        .leaflet-container { background: #0f172a; }
        .leaflet-popup-content-wrapper {
          background: #1e293b;
          color: #f1f5f9;
          border: 1px solid rgba(51, 65, 85, 0.5);
          border-radius: 0.75rem;
          box-shadow: 0 12px 32px rgba(0, 0, 0, 0.5);
          padding: 10px;
        }
        .leaflet-popup-tip { background: #1e293b; border: 1px solid rgba(51, 65, 85, 0.5); }
        .leaflet-popup-content { margin: 0; }
        .leaflet-popup-close-button { color: #94a3b8 !important; top: 8px !important; right: 8px !important; }
        .leaflet-popup-close-button:hover { color: #fff !important; }

        /* Animación del marcador seleccionado (caída + rebote, luego pulso continuo) */
        .marker-selected-img {
          animation: marker-drop 0.7s cubic-bezier(0.2, 0.8, 0.3, 1) both,
                     marker-pulse 1.6s ease-in-out 0.7s infinite;
        }
        @keyframes marker-drop {
          0%   { transform: translateY(-26px) scale(1.3); opacity: 0; }
          55%  { opacity: 1; }
          66%  { transform: translateY(0) scale(1); }
          78%  { transform: translateY(-8px) scale(1.04); }
          90%  { transform: translateY(0) scale(0.97); }
          100% { transform: translateY(0) scale(1); }
        }
        @keyframes marker-pulse {
          0%, 100% { transform: scale(1); }
          50%      { transform: scale(1.18); }
        }
      `}</style>
    </div>
  )
}
