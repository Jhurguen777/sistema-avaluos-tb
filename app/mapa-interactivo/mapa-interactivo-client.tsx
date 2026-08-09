"use client"

import dynamic from "next/dynamic"

// Importación dinámica sin SSR para Leaflet (usa window)
const InteractiveMap = dynamic(
  () => import("@/components/mapa-interactivo/interactive-map").then(mod => ({ default: mod.InteractiveMap })),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando mapa...</p>
        </div>
      </div>
    )
  }
)

export function MapaInteractivoClient() {
  return <InteractiveMap />
}
