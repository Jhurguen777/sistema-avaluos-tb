"use client"

import { useEffect, useState, useRef } from "react"
import L from "leaflet"
import "leaflet/dist/leaflet.css"

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
  radarPosition = null
}: LeafletMapClientProps) {
  const mapRef = useRef<L.Map | null>(null)
  const mapContainerRef = useRef<HTMLDivElement>(null)
  const markersRef = useRef<L.Marker[]>([])
  const radarCircleRef = useRef<L.Circle | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [loadedCount, setLoadedCount] = useState(0)
  const [currentRadarPosition, setCurrentRadarPosition] = useState<[number, number] | null>(radarPosition)
  const [currentRadius, setCurrentRadius] = useState(radarRadius)

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

  // Crear icono personalizado
  const createCustomIcon = (operacion: OperationType) => {
    const color = getMarkerColor(operacion)
    return L.divIcon({
      className: "custom-marker",
      html: `<div style="
        width: 32px;
        height: 32px;
        background: ${color};
        border: 3px solid white;
        border-radius: 50% 50% 50% 0;
        transform: rotate(-45deg);
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
      "></div>`,
      iconSize: [32, 32],
      iconAnchor: [16, 32],
      popupAnchor: [16, -32]
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
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19
      }).addTo(map)

      mapRef.current = map

      // Simular carga
      setTimeout(() => setIsLoading(false), 500)
    }

    return () => {
      if (mapRef.current) {
        mapRef.current.remove()
        mapRef.current = null
      }
    }
  }, [])

  // Actualizar propiedades
  useEffect(() => {
    if (!mapRef.current) return

    // Limpiar marcadores existentes
    markersRef.current.forEach(marker => marker.remove())
    markersRef.current = []

    // Cargar propiedades en chunks (simulación de lazy loading)
    const chunkSize = 10
    let loaded = 0

    const loadChunk = (chunkIndex: number) => {
      const start = chunkIndex * chunkSize
      const end = start + chunkSize
      const chunk = properties.slice(start, end)

      chunk.forEach((property) => {
        const marker = L.marker([property.lat, property.lng], {
          icon: createCustomIcon(property.operacion)
        })

        // Contenido del popup
        const popupContent = `
          <div style="min-width: 200px;">
            <h3 style="font-weight: bold; margin-bottom: 8px;">${property.nombre}</h3>
            <p style="font-size: 12px; color: #666; margin-bottom: 4px;">${property.codigoInmueble}</p>
            ${property.direccion ? `<p style="font-size: 12px; margin-bottom: 4px;">📍 ${property.direccion}</p>` : ""}
            ${property.precioUsd ? `<p style="font-weight: bold; color: #16a34a;">$${property.precioUsd.toLocaleString()}</p>` : ""}
            ${property.superficieUtil ? `<p style="font-size: 12px;">${property.superficieUtil} m²</p>` : ""}
          </div>
        `

        marker.bindPopup(popupContent)

        // Evento click
        if (selectable && onPropertySelect) {
          marker.on("click", () => {
            onPropertySelect(property)
          })
        }

        marker.addTo(mapRef.current!)
        markersRef.current.push(marker)
      })

      loaded += chunk.length
      setLoadedCount(loaded)

      // Cargar siguiente chunk si hay más
      if (end < properties.length) {
        setTimeout(() => loadChunk(chunkIndex + 1), 100)
      }
    }

    if (properties.length > 0) {
      loadChunk(0)
    }
  }, [properties, selectable, onPropertySelect])

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

      {/* Leyenda */}
      {!showRadar && (
        <div className="absolute bottom-4 left-4 bg-slate-900/90 backdrop-blur-sm p-3 rounded-lg z-[1000]">
          <p className="text-xs font-medium text-white mb-2">Tipo de Operación</p>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-blue-500" />
              <span className="text-xs text-slate-300">Venta</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-red-500" />
              <span className="text-xs text-slate-300">Alquiler</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-yellow-500" />
              <span className="text-xs text-slate-300">Anticrético</span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
