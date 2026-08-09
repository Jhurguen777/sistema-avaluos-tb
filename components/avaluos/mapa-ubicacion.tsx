"use client"

import { useState, useCallback } from "react"
import dynamic from "next/dynamic"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { MapPin, LocateFixed, Link2, Navigation, Loader2 } from "lucide-react"
import { parseGoogleMapsUrl } from "@/lib/parse-google-maps"

const LeafletMap = dynamic(() => import("@/components/leaflet-map-client").then(mod => ({ default: mod.LeafletMapClient })), {
  ssr: false,
  loading: () => (
    <div className="h-full w-full flex items-center justify-center bg-slate-800">
      <Loader2 className="w-6 h-6 animate-spin text-slate-500" />
    </div>
  ),
})

interface MapaUbicacionProps {
  lat: number | null
  lng: number | null
  direccion: string
  zona: string
  onChange: (data: { lat: number | null; lng: number | null; direccion: string; zona: string }) => void
}

export function MapaUbicacion({ lat, lng, direccion, zona, onChange }: MapaUbicacionProps) {
  const [linkInput, setLinkInput] = useState("")
  const [locating, setLocating] = useState(false)
  const [geoError, setGeoError] = useState<string | null>(null)

  // Posición derivada directamente de las props del padre (single source of truth).
  // No se mantiene estado local duplicado para evitar sincronizaciones manuales.
  const selectedPos: [number, number] | null =
    lat != null && lng != null ? [lat, lng] : null

  const handleGeo = useCallback(() => {
    if (!navigator.geolocation) {
      setGeoError("Tu dispositivo no soporta geolocalización")
      return
    }
    setLocating(true)
    setGeoError(null)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords
        onChange({ lat: latitude, lng: longitude, direccion, zona })
        setLocating(false)
      },
      (err) => {
        setGeoError(
          err.code === err.PERMISSION_DENIED
            ? "Permiso de ubicación denegado. Activa el GPS en tu navegador."
            : "No se pudo obtener tu ubicación. Intenta de nuevo.",
        )
        setLocating(false)
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 },
    )
  }, [direccion, zona, onChange])

  const handleLink = useCallback(() => {
    const coords = parseGoogleMapsUrl(linkInput)
    if (!coords) {
      setGeoError("No se pudieron extraer coordenadas del link. Pegá un link válido de Google Maps.")
      return
    }
    onChange({ lat: coords.lat, lng: coords.lng, direccion, zona })
    setGeoError(null)
    setLinkInput("")
  }, [linkInput, direccion, zona, onChange])

  const handleMapSelect = useCallback(
    (property: { lat?: number; lng?: number } | undefined) => {
      // property acá es el click handler del mapa; lat/lng viene directo
      const clickedLat = property?.lat
      const clickedLng = property?.lng
      if (typeof clickedLat === "number" && typeof clickedLng === "number") {
        onChange({ lat: clickedLat, lng: clickedLng, direccion, zona })
      }
    },
    [direccion, zona, onChange],
  )

  // Marcador propio: pasamos una "propiedad" con la posición seleccionada
  const properties = selectedPos
    ? [{ id: "sujeto", codigoInmueble: "SUJETO", nombre: "Inmueble a avaluar", operacion: "VENTA" as const, lat: selectedPos[0], lng: selectedPos[1] }]
    : []

  return (
    <div className="space-y-4">
      {/* MAPA */}
      <Card className="border-2 border-slate-800 bg-slate-900/50 overflow-hidden">
        <div className="relative h-[320px] sm:h-[420px] bg-slate-800">
          <LeafletMap
            properties={properties}
            center={selectedPos ?? [-17.3895, -66.1569]}
            zoom={selectedPos ? 16 : 12}
            selectable={true}
            onPropertySelect={handleMapSelect}
          />
        </div>
      </Card>

      {/* CONTROLES RÁPIDOS: GPS + LINK */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Button
          type="button"
          onClick={handleGeo}
          disabled={locating}
          className="bg-emerald-600 hover:bg-emerald-700 text-white h-12"
        >
          {locating ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <LocateFixed className="w-4 h-4 mr-2" />
          )}
          {locating ? "Obteniendo ubicación..." : "Mi ubicación actual"}
        </Button>

        <div className="flex gap-2">
          <Input
            type="text"
            value={linkInput}
            onChange={(e) => setLinkInput(e.target.value)}
            placeholder="Pegar link de Google Maps"
            className="bg-slate-800 border-slate-700 text-white h-12"
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault()
                handleLink()
              }
            }}
          />
          <Button
            type="button"
            onClick={handleLink}
            className="bg-blue-600 hover:bg-blue-700 text-white h-12 px-3"
            title="Extraer coordenadas del link"
          >
            <Link2 className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {geoError && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-300 text-sm rounded-lg p-3">
          {geoError}
        </div>
      )}

      {/* COORDENADAS ACTUALES */}
      {selectedPos && (
        <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-3 flex items-center gap-3">
          <Navigation className="w-4 h-4 text-emerald-400 shrink-0" />
          <div className="text-sm">
            <p className="text-slate-400 text-xs">Ubicación seleccionada</p>
            <p className="text-white font-medium font-mono">
              {selectedPos[0].toFixed(5)}, {selectedPos[1].toFixed(5)}
            </p>
          </div>
        </div>
      )}

      {/* DATOS DE DIRECCIÓN (manual, opcional) */}
      <Card className="border-2 border-slate-800 bg-slate-900/50">
        <div className="p-4 sm:p-6">
          <h4 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
            <MapPin className="w-4 h-4 text-primary" />
            Datos de la dirección (opcional)
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="dir" className="text-xs text-slate-400">Dirección</Label>
              <Input
                id="dir"
                value={direccion}
                onChange={(e) => onChange({ lat, lng, direccion: e.target.value, zona })}
                className="bg-slate-800 border-slate-700 text-white"
                placeholder="Calle, número, zona"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="zona" className="text-xs text-slate-400">Zona / Barrio</Label>
              <Input
                id="zona"
                value={zona}
                onChange={(e) => onChange({ lat, lng, direccion, zona: e.target.value })}
                className="bg-slate-800 border-slate-700 text-white"
                placeholder="Ej: Calacoto, Centro"
              />
            </div>
          </div>
        </div>
      </Card>
    </div>
  )
}
