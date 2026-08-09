import { Suspense } from "react"
import { MapaInteractivoClient } from "./mapa-interactivo-client"

export default function MapaInteractivoPage() {
  return (
    <Suspense
      fallback={
        <div className="w-full h-screen flex items-center justify-center bg-gray-100">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <MapaInteractivoClient />
    </Suspense>
  )
}
