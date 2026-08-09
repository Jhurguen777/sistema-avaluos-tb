"use client"

/**
 * Sidebar Izquierdo - Panel de Filtros (Drawer)
 * Se desliza desde la izquierda con estilo drawer elegante.
 *
 * Filtros disponibles:
 *  - Categoría del inmueble (Casa, Departamento, Terreno, Local, Oficina, Galpón, Otros)
 *  - Tipo de operación (Venta, Alquiler, Anticrético)
 */

import {
  X,
  Home,
  Building,
  Map as MapIcon,
  Store,
  Briefcase,
  Warehouse,
  Layers,
  Tag,
  Key,
  CalendarClock,
} from "lucide-react"

/** Filtros del mapa: categoría y operación. '' significa "todas". */
export interface FilterState {
  categoria: string
  operacion: string
}

export interface SidebarLeftFiltersProps {
  isOpen: boolean
  onClose: () => void
  filters: FilterState
  onFiltersChange: (filters: FilterState) => void
  onApply: () => void
}

const CATEGORIAS: {
  value: string
  label: string
  icon: React.ComponentType<{ className?: string }>
}[] = [
  { value: "CASA", label: "Casa", icon: Home },
  { value: "DEPARTAMENTO", label: "Departamento", icon: Building },
  { value: "TERRENO", label: "Terreno", icon: MapIcon },
  { value: "LOCAL_COMERCIAL", label: "Local Comercial", icon: Store },
  { value: "OFICINA", label: "Oficina", icon: Briefcase },
  { value: "GALPON", label: "Galpón", icon: Warehouse },
  { value: "OTROS", label: "Otros", icon: Layers },
]

const OPERACIONES: {
  value: string
  label: string
  icon: React.ComponentType<{ className?: string }>
}[] = [
  { value: "VENTA", label: "Venta", icon: Tag },
  { value: "ALQUILER", label: "Alquiler", icon: Key },
  { value: "ANTICRETICO", label: "Anticrético", icon: CalendarClock },
]

export function SidebarLeftFilters({
  isOpen,
  onClose,
  filters,
  onFiltersChange,
  onApply,
}: SidebarLeftFiltersProps) {
  const toggle = (key: keyof FilterState, value: string) => {
    const current = filters[key]
    onFiltersChange({ ...filters, [key]: current === value ? "" : value })
  }

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
          fixed top-0 left-0 h-full z-[2000] bg-white shadow-2xl
          transition-transform duration-300 ease-in-out flex flex-col
          w-[80vw] max-w-[340px] md:w-[400px]
          ${isOpen ? "translate-x-0" : "-translate-x-full"}
        `}
      >
        {/* Header */}
        <div className="shrink-0 bg-white border-b border-gray-200 p-4 flex items-center justify-between z-10">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Filtros</h2>
            <p className="text-sm text-gray-500">Refina tu búsqueda</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            aria-label="Cerrar filtros"
          >
            <X className="w-6 h-6 text-gray-600" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-7">
          {/* Categoría */}
          <div>
            <label className="flex items-center gap-2 font-semibold text-gray-900 mb-1">
              <Home className="w-5 h-5 text-blue-500" />
              Categoría
            </label>
            <p className="text-xs text-gray-500 mb-3">Tipo de propiedad</p>

            <div className="grid grid-cols-2 gap-2">
              {CATEGORIAS.map((option) => {
                const Icon = option.icon
                const active = filters.categoria === option.value
                return (
                  <button
                    key={option.value}
                    onClick={() => toggle("categoria", option.value)}
                    className={`
                      flex items-center justify-center gap-2 p-3 rounded-xl border-2 transition-all
                      ${
                        active
                          ? "border-blue-500 bg-blue-50 text-blue-700"
                          : "border-gray-200 hover:border-gray-300 text-gray-600"
                      }
                    `}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="font-medium text-sm">{option.label}</span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Operación */}
          <div>
            <label className="flex items-center gap-2 font-semibold text-gray-900 mb-1">
              <Tag className="w-5 h-5 text-green-500" />
              Tipo de operación
            </label>
            <p className="text-xs text-gray-500 mb-3">Venta, alquiler o anticrético</p>

            <div className="grid grid-cols-1 gap-2">
              {OPERACIONES.map((option) => {
                const Icon = option.icon
                const active = filters.operacion === option.value
                return (
                  <button
                    key={option.value}
                    onClick={() => toggle("operacion", option.value)}
                    className={`
                      flex items-center gap-2 p-3 rounded-xl border-2 transition-all
                      ${
                        active
                          ? "border-blue-500 bg-blue-50 text-blue-700"
                          : "border-gray-200 hover:border-gray-300 text-gray-600"
                      }
                    `}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="font-medium text-sm">{option.label}</span>
                  </button>
                )
              })}
            </div>
          </div>
        </div>

        {/* Footer — SOLO Aplicar Filtros */}
        <div className="shrink-0 p-4 bg-white border-t border-gray-200">
          <button
            onClick={onApply}
            className="w-full py-3 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-semibold rounded-xl transition-all hover:shadow-lg"
          >
            Aplicar Filtros
          </button>
        </div>
      </div>
    </>
  )
}
