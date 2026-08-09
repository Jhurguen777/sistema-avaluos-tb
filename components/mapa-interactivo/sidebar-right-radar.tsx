"use client"

/**
 * Sidebar Derecho - Resultados del Radar (Drawer)
 * Se desliza desde la derecha con estilo drawer elegante.
 *
 * Muestra:
 *  - Lista compacta de propiedades dentro del radio del radar.
 *  - Footer con el promedio de precios de los resultados.
 *
 * El control del tamaño del radar (1km/2km, etc.) NO va aquí: se maneja
 * con RadarSizeControl flotante sobre el mapa.
 */

import { X, MapPin, Bed, Bath, Maximize, Navigation2, Settings, BarChart3 } from "lucide-react"
import type { Property } from "./mock-data"

export interface SidebarRightRadarProps {
  isOpen: boolean
  onClose: () => void
  results: Property[]
  /** Permite volver al modo configuración del radar (mover/resize). */
  onReconfigureRadar?: () => void
}

/** Calcula el promedio de precios de los resultados. */
function calcularPromedio(resultados: Property[]): number {
  if (resultados.length === 0) return 0
  const total = resultados.reduce((acc, p) => acc + (p.price ?? 0), 0)
  return total / resultados.length
}

export function SidebarRightRadar({
  isOpen,
  onClose,
  results,
  onReconfigureRadar,
}: SidebarRightRadarProps) {
  const promedio = calcularPromedio(results)

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-[1999] transition-opacity"
          onClick={onClose}
        />
      )}

      {/* Sidebar - Drawer estilo */}
      <div
        className={`
          fixed top-0 right-0 h-full z-[2000] bg-white shadow-2xl
          transition-transform duration-300 ease-in-out flex flex-col
          w-[80vw] max-w-[340px] md:w-[400px]
          ${isOpen ? "translate-x-0" : "translate-x-full"}
        `}
      >
        {/* Header */}
        <div className="shrink-0 bg-gradient-to-r from-cyan-500 to-blue-600 text-white p-4 flex items-center justify-between z-10">
          <div>
            <h2 className="text-xl font-bold flex items-center gap-2">
              <Navigation2 className="w-6 h-6" />
              Radar
            </h2>
            <p className="text-sm text-cyan-100">
              {results.length} {results.length === 1 ? "propiedad" : "propiedades"} encontradas
            </p>
          </div>
          <div className="flex items-center gap-2">
            {onReconfigureRadar && (
              <button
                onClick={onReconfigureRadar}
                className="p-2 hover:bg-white/20 rounded-full transition-colors"
                title="Ajustar radar"
              >
                <Settings className="w-5 h-5" />
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-full transition-colors"
              aria-label="Cerrar resultados"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Results List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {results.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <MapPin className="w-8 h-8 text-gray-400" />
              </div>
              <p className="text-gray-600 font-medium">No se encontraron propiedades</p>
              <p className="text-sm text-gray-500 mt-1">Probá con un radio mayor</p>
            </div>
          ) : (
            results.map((property) => (
              <PropertyCardCompact key={property.id} property={property} />
            ))
          )}
        </div>

        {/* Footer — Promedio de precios */}
        <div className="shrink-0 p-4 bg-gradient-to-r from-emerald-50 to-green-50 border-t border-emerald-200">
          {results.length > 0 ? (
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center shrink-0">
                <BarChart3 className="w-5 h-5 text-emerald-600" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs text-emerald-700 font-medium">Promedio del radar</p>
                <p className="text-xl font-bold text-emerald-700 truncate">
                  US$ {promedio.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                </p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-[10px] text-gray-500">propiedades</p>
                <p className="text-lg font-bold text-gray-700">{results.length}</p>
              </div>
            </div>
          ) : (
            <p className="text-center text-sm text-gray-500">
              Activá el radar sobre el mapa para ver propiedades cercanas.
            </p>
          )}
        </div>
      </div>
    </>
  )
}

// ============================================================================
// CARD COMPACTA PARA RESULTADOS DEL RADAR
// ============================================================================

function PropertyCardCompact({ property }: { property: Property }) {
  const estado =
    property.status === "available"
      ? "Disponible"
      : property.status === "sold"
      ? "Vendido"
      : "Alquilado"

  const estadoColor =
    property.status === "available"
      ? "bg-emerald-100 text-emerald-700"
      : property.status === "sold"
      ? "bg-red-100 text-red-700"
      : "bg-blue-100 text-blue-700"

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-3 hover:border-blue-300 hover:shadow-sm transition-all">
      {/* Fila 1: precio + estado */}
      <div className="flex items-center justify-between gap-2 mb-1">
        <span className="text-base font-bold text-blue-600">
          US$ {property.price.toLocaleString()}
        </span>
        <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${estadoColor}`}>
          {estado}
        </span>
      </div>

      {/* Fila 2: título + dirección */}
      <p className="text-sm font-semibold text-gray-900 leading-tight truncate">
        {property.title}
      </p>
      <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5 truncate">
        <MapPin className="w-3 h-3 shrink-0" />
        <span className="truncate">
          {property.city ? `${property.address}, ${property.city}` : property.address}
        </span>
      </p>

      {/* Fila 3: características compactas */}
      <div className="flex items-center gap-3 text-xs text-gray-600 mt-2">
        {property.bedrooms > 0 && (
          <div className="flex items-center gap-1">
            <Bed className="w-3.5 h-3.5" />
            <span>{property.bedrooms}</span>
          </div>
        )}
        {property.bathrooms > 0 && (
          <div className="flex items-center gap-1">
            <Bath className="w-3.5 h-3.5" />
            <span>{property.bathrooms}</span>
          </div>
        )}
        <div className="flex items-center gap-1">
          <Maximize className="w-3.5 h-3.5" />
          <span>{property.area} m²</span>
        </div>
      </div>
    </div>
  )
}
