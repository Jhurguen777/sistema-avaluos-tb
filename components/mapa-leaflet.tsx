"use client"

import dynamic from "next/dynamic"

// Import dinámico para evitar problemas de SSR con Leaflet
const LeafletMap = dynamic(() => import("./leaflet-map-client").then(mod => ({ default: mod.LeafletMapClient })), {
  ssr: false,
  loading: () => (
    <div className="h-full w-full flex items-center justify-center bg-slate-800">
      <div className="text-center text-slate-500">Cargando mapa...</div>
    </div>
  )
})

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

interface MapaLeafletProps {
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

export function MapaLeaflet(props: MapaLeafletProps) {
  return <LeafletMap {...props} />
}
