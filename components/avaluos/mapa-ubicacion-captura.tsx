"use client"

import { useRef, useEffect } from "react"
import { MapContainer, TileLayer, Marker, Tooltip } from "react-leaflet"
import L from "leaflet"
import "leaflet/dist/leaflet.css"
import { SATELLITE_TILES, SATELLITE_LABELS, SATELLITE_TRANSPORT } from "./mapas-pdf-config"

interface MapaUbicacionCapturaProps {
  lat: number
  lng: number
  direccion?: string | null
}

const iconoInmueble = L.divIcon({
  html: `<div style="position:relative;width:26px;height:26px;">
    <div style="position:absolute;inset:0;background:#FAB90E;border-radius:50%;border:3px solid #fff;box-shadow:0 0 0 2px #0f1e47,0 2px 6px rgba(0,0,0,0.6)"></div>
  </div>`,
  className: "",
  iconSize: [26, 26],
  iconAnchor: [13, 13],
})

/**
 * Mapa de UBICACIÓN del inmueble (sin círculos, sin equipamientos).
 * Vista satelital centrada con zoom alto para mostrar el entorno inmediato.
 * Se captura con html-to-image desde el padre.
 */
export const MapaUbicacionCaptura = ({ lat, lng, direccion }: MapaUbicacionCapturaProps) => {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (containerRef.current) {
      ;(window as unknown as Record<string, unknown>).__mapaUbicacionRef = containerRef.current
    }
    return () => {
      delete (window as unknown as Record<string, unknown>).__mapaUbicacionRef
    }
  }, [])

  if (!lat || !lng) return null

  return (
    <div
      ref={containerRef}
      style={{
        width: 700,
        height: 200,
        background: "#0f1e47",
        borderRadius: 8,
        overflow: "hidden",
      }}
    >
      <MapContainer
        center={[lat, lng]}
        zoom={17}
        style={{ height: "100%", width: "100%", background: "#0a1430" }}
        scrollWheelZoom={false}
        zoomControl={false}
        attributionControl={false}
      >
        <TileLayer url={SATELLITE_TILES.url} crossOrigin="anonymous" maxZoom={SATELLITE_TILES.maxZoom} />
        <TileLayer url={SATELLITE_TRANSPORT.url} crossOrigin="anonymous" maxZoom={SATELLITE_TRANSPORT.maxZoom} />
        <TileLayer url={SATELLITE_LABELS.url} crossOrigin="anonymous" maxZoom={SATELLITE_LABELS.maxZoom} />
        <Marker position={[lat, lng]} icon={iconoInmueble}>
          {direccion && (
            <Tooltip direction="top" offset={[0, -14]} opacity={1} permanent>
              <span style={{ fontSize: 10, fontWeight: 700, color: "#0f1e47" }}>INMUEBLE</span>
            </Tooltip>
          )}
        </Marker>
      </MapContainer>
    </div>
  )
}
