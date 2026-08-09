"use client"

import { useState, useMemo, useCallback } from "react"
import dynamic from "next/dynamic"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Search, Loader2, MapPin, Check, X } from "lucide-react"
import { buscarComparablesCercanosAction } from "@/modules/avaluos/actions"
import type { ComparableCercanoDTO } from "@/modules/avaluos/types/avaluo.types"
import { toast } from "@/components/ui/use-toast"

const LeafletMap = dynamic(() => import("@/components/leaflet-map-client").then(mod => ({ default: mod.LeafletMapClient })), {
  ssr: false,
  loading: () => (
    <div className="h-full w-full flex items-center justify-center bg-slate-800">
      <Loader2 className="w-6 h-6 animate-spin text-slate-500" />
    </div>
  ),
})

interface ComparablesMapaProps {
  /** Coordenadas del inmueble a avaluar (centro de la búsqueda) */
  sujetoLat: number | null
  sujetoLng: number | null
  /** Comparables ya seleccionados */
  seleccionados: ComparableCercanoDTO[]
  onSeleccionChange: (sels: ComparableCercanoDTO[]) => void
}

const RADIOS = [250, 500, 1000, 2000, 5000]

export function ComparablesMapa({ sujetoLat, sujetoLng, seleccionados, onSeleccionChange }: ComparablesMapaProps) {
  const [radio, setRadio] = useState(1000)
  const [buscando, setBuscando] = useState(false)
  const [resultados, setResultados] = useState<ComparableCercanoDTO[]>([])

  const buscar = useCallback(async () => {
    if (sujetoLat == null || sujetoLng == null) {
      toast.error("Primero definí la ubicación del inmueble en el paso 3")
      return
    }
    setBuscando(true)
    try {
      const res = await buscarComparablesCercanosAction({ lat: sujetoLat, lng: sujetoLng, radioMetros: radio })
      if (!res.success) {
        toast.error(res.error || "Error al buscar comparables")
        return
      }
      setResultados(res.data ?? [])
      if ((res.data ?? []).length === 0) {
        toast.info("No se encontraron propiedades en ese radio. Probá con un radio mayor.")
      }
    } catch (e) {
      const err = e as Error
      toast.error(err.message || "Error inesperado")
    } finally {
      setBuscando(false)
    }
  }, [sujetoLat, sujetoLng, radio])

  const toggleSeleccion = useCallback((comp: ComparableCercanoDTO) => {
    const ya = seleccionados.some((s) => s.id === comp.id)
    if (ya) {
      onSeleccionChange(seleccionados.filter((s) => s.id !== comp.id))
    } else {
      onSeleccionChange([...seleccionados, comp])
    }
  }, [seleccionados, onSeleccionChange])

  const seleccionIds = useMemo(() => new Set(seleccionados.map((s) => s.id)), [seleccionados])

  // Propiedades para el mapa: sujeto (centro) + resultados
  const properties = useMemo(() => {
    const sujeto =
      sujetoLat != null && sujetoLng != null
        ? [{
            id: "sujeto",
            codigoInmueble: "SUJETO",
            nombre: "Inmueble a avaluar",
            operacion: "VENTA" as const,
            lat: sujetoLat,
            lng: sujetoLng,
          }]
        : []
    const comps = resultados.map((r) => ({
      id: r.id,
      codigoInmueble: r.codigoInmueble,
      nombre: `${r.nombre} (${r.distanciaMetros}m)`,
      operacion: "ALQUILER" as const, // marcador rojo para comparables
      lat: r.lat,
      lng: r.lng,
      precioUsd: r.precioUsd ?? undefined,
    }))
    return [...sujeto, ...comps]
  }, [sujetoLat, sujetoLng, resultados])

  return (
    <div className="space-y-4">
      {/* MAPA + RADIO */}
      <Card className="border-2 border-slate-800 bg-slate-900/50 overflow-hidden">
        <div className="relative h-[300px] sm:h-[400px] bg-slate-800">
          <LeafletMap
            properties={properties}
            center={sujetoLat != null && sujetoLng != null ? [sujetoLat, sujetoLng] : [-17.3895, -66.1569]}
            zoom={14}
          />
        </div>

        {/* CONTROL DE RADIO + BOTÓN BUSCAR */}
        <div className="p-4 border-t border-slate-800 bg-slate-900/70">
          <div className="flex flex-col sm:flex-row sm:items-end gap-3">
            <div className="flex-1 space-y-1.5">
              <Label className="text-xs text-slate-400">
                Radio de búsqueda: <span className="text-white font-medium">{radio >= 1000 ? `${radio / 1000} km` : `${radio} m`}</span>
              </Label>
              <div className="flex gap-2 flex-wrap">
                {RADIOS.map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setRadio(r)}
                    className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${
                      radio === r
                        ? "bg-primary text-white"
                        : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                    }`}
                  >
                    {r >= 1000 ? `${r / 1000} km` : `${r} m`}
                  </button>
                ))}
              </div>
            </div>
            <Button
              type="button"
              onClick={buscar}
              disabled={buscando || sujetoLat == null}
              className="bg-primary hover:bg-primary/90 h-11"
            >
              {buscando ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Search className="w-4 h-4 mr-2" />}
              {buscando ? "Buscando..." : "Buscar comparables"}
            </Button>
          </div>
        </div>
      </Card>

      {/* RESULTADOS DE BÚSQUEDA */}
      {resultados.length > 0 && (
        <Card className="border-2 border-slate-800 bg-slate-900/50">
          <div className="p-4 sm:p-6">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-semibold text-white">
                Comparables cercanos ({resultados.length})
              </h4>
              <p className="text-xs text-slate-400">
                Seleccionados: <span className="text-white font-medium">{seleccionados.length}</span>
                <span className="text-slate-500"> (mín. 4)</span>
              </p>
            </div>

            <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
              {resultados.map((r) => {
                const sel = seleccionIds.has(r.id)
                return (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => toggleSeleccion(r)}
                    className={`w-full text-left rounded-lg border p-3 transition-colors ${
                      sel
                        ? "bg-emerald-500/15 border-emerald-500/50"
                        : "bg-slate-800/40 border-slate-700 hover:bg-slate-800/70"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-white truncate">{r.nombre}</p>
                        <p className="text-xs text-slate-400 truncate">{r.direccion || "Sin dirección"}</p>
                        <div className="flex flex-wrap gap-x-3 gap-y-1 mt-1.5 text-xs">
                          <span className="text-slate-300">
                            <span className="text-slate-500">Precio:</span> ${r.precioUsd?.toLocaleString() ?? "—"}
                          </span>
                          <span className="text-slate-300">
                            <span className="text-slate-500">m²:</span> {r.superficieUtil ?? r.superficieConstruida ?? "—"}
                          </span>
                          <span className="text-emerald-400 font-medium">
                            ${r.precioM2?.toFixed(2) ?? "—"}/m²
                          </span>
                          <span className="text-slate-400">
                            <MapPin className="inline w-3 h-3 mr-0.5" />
                            {r.distanciaMetros >= 1000 ? `${(r.distanciaMetros / 1000).toFixed(1)} km` : `${r.distanciaMetros} m`}
                          </span>
                        </div>
                      </div>
                      <div
                        className={`shrink-0 w-6 h-6 rounded-full flex items-center justify-center border ${
                          sel ? "bg-emerald-500 border-emerald-500 text-white" : "border-slate-600 text-transparent"
                        }`}
                      >
                        <Check className="w-4 h-4" />
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>
        </Card>
      )}

      {/* SELECCIONADOS */}
      {seleccionados.length > 0 && (
        <Card className="border-2 border-emerald-500/30 bg-emerald-500/5">
          <div className="p-4 sm:p-6">
            <h4 className="text-sm font-semibold text-emerald-300 mb-3">
              Comparables seleccionados ({seleccionados.length})
            </h4>
            <div className="space-y-2">
              {seleccionados.map((r) => (
                <div key={r.id} className="flex items-center justify-between bg-slate-900/40 rounded p-2">
                  <div className="text-xs text-slate-300">
                    <span className="text-white font-medium">{r.nombre}</span> · ${r.precioM2?.toFixed(2)}/m²
                  </div>
                  <button
                    type="button"
                    onClick={() => toggleSeleccion(r)}
                    className="text-red-400 hover:text-red-300 p-1"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </Card>
      )}
    </div>
  )
}
