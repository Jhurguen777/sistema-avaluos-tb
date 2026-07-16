"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { MapPin, Home as HomeIcon, Building, Loader2, ChevronDown } from "lucide-react"
import Link from "next/link"
import { MapaLeaflet } from "@/components/mapa-leaflet"

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

export default function VerInmueblesPage() {
  const [properties, setProperties] = useState<Property[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null)
  const [filtroOperacion, setFiltroOperacion] = useState<string>("todos")

  // Simular carga de propiedades
  useEffect(() => {
    const mockProperties: Property[] = [
      {
        id: "1",
        codigoInmueble: "PROP001",
        nombre: "Departamento Centro",
        operacion: "VENTA",
        precioUsd: 85000,
        superficieUtil: 85,
        lat: -17.3895,
        lng: -66.1569,
        direccion: "Calle Sucre, Centro"
      },
      {
        id: "2",
        codigoInmueble: "PROP002",
        nombre: "Casa Zona Sur",
        operacion: "ALQUILER",
        precioUsd: 450,
        superficieUtil: 150,
        lat: -17.405,
        lng: -66.14,
        direccion: "Av. Costa Verde, Zona Sur"
      },
      {
        id: "3",
        codigoInmueble: "PROP003",
        nombre: "Local Comercial",
        operacion: "VENTA",
        precioUsd: 120000,
        superficieUtil: 80,
        lat: -17.375,
        lng: -66.15,
        direccion: "Calle Florida, Centro Comercial"
      },
      {
        id: "4",
        codigoInmueble: "PROP004",
        nombre: "Penthouse Norte",
        operacion: "ANTICRETICO",
        precioUsd: 150000,
        superficieUtil: 180,
        lat: -17.395,
        lng: -66.145,
        direccion: "Av. Principal, Zona Norte"
      },
      {
        id: "5",
        codigoInmueble: "PROP005",
        nombre: "Oficina Ejecutiva",
        operacion: "VENTA",
        precioUsd: 65000,
        superficieUtil: 60,
        lat: -17.383,
        lng: -66.160,
        direccion: "Calle Bolivar, Centro"
      },
      {
        id: "6",
        codigoInmueble: "PROP006",
        nombre: "Casa Familia",
        operacion: "ALQUILER",
        precioUsd: 550,
        superficieUtil: 200,
        lat: -17.410,
        lng: -66.135,
        direccion: "Calle 3, Zona Este"
      }
    ]

    // Simular carga con delay
    setTimeout(() => {
      setProperties(mockProperties)
      setLoading(false)
    }, 1500)
  }, [])

  // Filtrar propiedades por operación
  const filteredProperties = filtroOperacion === "todos"
    ? properties
    : properties.filter(p => p.operacion === filtroOperacion)

  const getOperationColor = (operacion: OperationType) => {
    switch (operacion) {
      case "VENTA":
        return "text-blue-400 bg-blue-400/10 border-blue-400/30"
      case "ALQUILER":
        return "text-red-400 bg-red-400/10 border-red-400/30"
      case "ANTICRETICO":
        return "text-yellow-400 bg-yellow-400/10 border-yellow-400/30"
      default:
        return "text-slate-400 bg-slate-400/10 border-slate-400/30"
    }
  }

  const getOperationLabel = (operacion: OperationType) => {
    switch (operacion) {
      case "VENTA":
        return "Venta"
      case "ALQUILER":
        return "Alquiler"
      case "ANTICRETICO":
        return "Anticrético"
      default:
        return operacion
    }
  }

  const handlePropertySelect = (property: Property) => {
    setSelectedProperty(property)
    // Scroll al detalle
    document.getElementById("detalle-propiedad")?.scrollIntoView({ behavior: "smooth" })
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white">Ver Inmuebles</h1>
          <p className="text-sm sm:text-base text-slate-400 mt-1">
            Mapa con todas las propiedades registradas
          </p>
        </div>
        <Link href="/dashboard/inmuebles">
          <Button className="w-full sm:w-auto bg-secondary hover:bg-secondary/90">
            Gestionar Inmuebles
          </Button>
        </Link>
      </div>

      {/* Filtros */}
      <Card className="border-2 border-slate-800 bg-slate-900/50">
        <div className="p-4">
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-sm text-slate-400">Filtrar por:</span>
            <button
              onClick={() => setFiltroOperacion("todos")}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                filtroOperacion === "todos"
                  ? "bg-primary text-white"
                  : "bg-slate-800 text-slate-400 hover:bg-slate-700"
              }`}
            >
              Todos ({properties.length})
            </button>
            <button
              onClick={() => setFiltroOperacion("VENTA")}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                filtroOperacion === "VENTA"
                  ? "bg-blue-500 text-white"
                  : "bg-slate-800 text-slate-400 hover:bg-slate-700"
              }`}
            >
              Venta ({properties.filter(p => p.operacion === "VENTA").length})
            </button>
            <button
              onClick={() => setFiltroOperacion("ALQUILER")}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                filtroOperacion === "ALQUILER"
                  ? "bg-red-500 text-white"
                  : "bg-slate-800 text-slate-400 hover:bg-slate-700"
              }`}
            >
              Alquiler ({properties.filter(p => p.operacion === "ALQUILER").length})
            </button>
            <button
              onClick={() => setFiltroOperacion("ANTICRETICO")}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                filtroOperacion === "ANTICRETICO"
                  ? "bg-yellow-500 text-white"
                  : "bg-slate-800 text-slate-400 hover:bg-slate-700"
              }`}
            >
              Anticrético ({properties.filter(p => p.operacion === "ANTICRETICO").length})
            </button>
          </div>
        </div>
      </Card>

      {/* Contenedor del mapa y lista - Layout responsivo */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Mapa */}
        <div className="lg:col-span-2 h-[400px] sm:h-[500px] lg:h-[600px]">
          <Card className="border-2 border-slate-800 bg-slate-900/50 overflow-hidden h-full">
            {loading ? (
              <div className="h-full flex items-center justify-center">
                <div className="text-center space-y-4">
                  <Loader2 className="w-12 h-12 text-primary animate-spin mx-auto" />
                  <p className="text-sm text-slate-500">Cargando propiedades...</p>
                </div>
              </div>
            ) : (
              <MapaLeaflet
                properties={filteredProperties}
                center={[-17.3895, -66.1569]}
                zoom={14}
                selectable={true}
                onPropertySelect={handlePropertySelect}
                selectedProperty={selectedProperty}
              />
            )}
          </Card>
        </div>

        {/* Lista de propiedades */}
        <div className="lg:col-span-1">
          <Card className="border-2 border-slate-800 bg-slate-900/50 h-[400px] sm:h-[500px] lg:h-[600px] overflow-hidden flex flex-col">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-white">Propiedades</h2>
                <p className="text-sm text-slate-400">
                  {filteredProperties.length} inmueble{filteredProperties.length !== 1 ? "s" : ""}
                </p>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {loading ? (
                <div className="flex items-center justify-center h-40">
                  <Loader2 className="w-8 h-8 text-primary animate-spin" />
                </div>
              ) : filteredProperties.length === 0 ? (
                <div className="text-center py-8 text-slate-500">
                  No hay propiedades con este filtro
                </div>
              ) : (
                filteredProperties.map((property) => (
                  <div
                    key={property.id}
                    className={`p-3 rounded-lg border transition-all cursor-pointer ${
                      selectedProperty?.id === property.id
                        ? "bg-primary/20 border-primary/50"
                        : "bg-slate-800/50 border-slate-700 hover:border-slate-600"
                    }`}
                    onClick={() => handlePropertySelect(property)}
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-semibold text-white truncate">
                          {property.nombre}
                        </h3>
                        <p className="text-xs text-slate-400">
                          {property.codigoInmueble}
                        </p>
                      </div>
                      <span className={`px-2 py-1 text-xs font-medium rounded border shrink-0 ${getOperationColor(property.operacion)}`}>
                        {getOperationLabel(property.operacion)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-xs text-slate-500">
                      {property.superficieUtil && (
                        <span>{property.superficieUtil} m²</span>
                      )}
                      {property.precioUsd && (
                        <span className="text-green-400 font-medium">
                          ${property.precioUsd.toLocaleString()}
                        </span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>
      </div>

      {/* Panel de detalle de propiedad seleccionada */}
      {selectedProperty && (
        <Card id="detalle-propiedad" className="border-2 border-slate-800 bg-slate-900/50">
          <div className="p-4 sm:p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">Detalle de Propiedad</h3>
              <button
                onClick={() => setSelectedProperty(null)}
                className="text-slate-400 hover:text-white transition-colors"
              >
                ✕
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <p className="text-xs text-slate-500 mb-1">Código</p>
                <p className="text-sm font-medium text-white">{selectedProperty.codigoInmueble}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 mb-1">Nombre</p>
                <p className="text-sm font-medium text-white">{selectedProperty.nombre}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 mb-1">Operación</p>
                <span className={`px-2 py-1 text-xs font-medium rounded border ${getOperationColor(selectedProperty.operacion)}`}>
                  {getOperationLabel(selectedProperty.operacion)}
                </span>
              </div>
              <div>
                <p className="text-xs text-slate-500 mb-1">Precio</p>
                <p className="text-sm font-medium text-green-400">
                  ${selectedProperty.precioUsd?.toLocaleString()}
                </p>
              </div>
              {selectedProperty.direccion && (
                <div className="sm:col-span-2">
                  <p className="text-xs text-slate-500 mb-1">Dirección</p>
                  <p className="text-sm font-medium text-white">{selectedProperty.direccion}</p>
                </div>
              )}
              <div>
                <p className="text-xs text-slate-500 mb-1">Superficie</p>
                <p className="text-sm font-medium text-white">
                  {selectedProperty.superficieUtil} m²
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-500 mb-1">Coordenadas</p>
                <p className="text-sm font-medium text-white">
                  {selectedProperty.lat.toFixed(4)}, {selectedProperty.lng.toFixed(4)}
                </p>
              </div>
            </div>
          </div>
        </Card>
      )}
    </div>
  )
}
