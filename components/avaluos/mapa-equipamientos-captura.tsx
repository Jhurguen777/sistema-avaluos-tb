"use client"

import { useRef, useEffect } from "react"
import { MapContainer, TileLayer, Circle, Marker, Tooltip } from "react-leaflet"
import L from "leaflet"
import "leaflet/dist/leaflet.css"
import { SATELLITE_TILES, SATELLITE_LABELS, SATELLITE_TRANSPORT, colorPorTipo } from "./mapas-pdf-config"

export interface EquipamientoMapaPdf {
  tipo: string
  nombre: string
  distancia: number
  lat: number
  lng: number
}

interface MapaEquipamientosCapturaProps {
  lat: number
  lng: number
  radio: number
  equipamientos: EquipamientoMapaPdf[]
}

const iconoInmueble = L.divIcon({
  html: `<div style="position:relative;width:32px;height:40px;">
    <div style="position:absolute;left:50%;bottom:0;transform:translateX(-50%);
      width:0;height:0;border-left:8px solid transparent;border-right:8px solid transparent;
      border-top:12px solid #FAB90E;z-index:2;"></div>
    <div style="position:absolute;left:50%;top:0;transform:translateX(-50%);
      width:26px;height:26px;border-radius:50%;
      background:#FAB90E;border:4px solid #fff;
      box-shadow:0 0 0 2px #0f1e47,0 2px 6px rgba(0,0,0,0.7);
      display:flex;align-items:center;justify-content:center;">
      <span style="font-size:13px;line-height:1;">🏠</span>
    </div>
  </div>`,
  className: "",
  iconSize: [32, 40],
  iconAnchor: [16, 40],
})

/** Pin numerado idéntico al del radar para consistencia visual */
function iconoEquipamientoNumerado(tipo: string, numero: number): L.DivIcon {
  const color = colorPorTipo(tipo)
  return L.divIcon({
    html: `<div style="position:relative;width:28px;height:36px;">
      <div style="position:absolute;left:50%;bottom:0;transform:translateX(-50%);
        width:0;height:0;border-left:7px solid transparent;border-right:7px solid transparent;
        border-top:11px solid #fff;filter:drop-shadow(0 2px 3px rgba(0,0,0,0.7));z-index:2;"></div>
      <div style="position:absolute;left:50%;top:0;transform:translateX(-50%);
        width:24px;height:24px;border-radius:50%;
        background:#fff;border:4px solid ${color};
        box-shadow:0 2px 6px rgba(0,0,0,0.7);
        display:flex;align-items:center;justify-content:center;">
        <span style="font-family:Arial,sans-serif;font-weight:800;font-size:12px;color:${color};line-height:1;">${numero}</span>
      </div>
    </div>`,
    className: "",
    iconSize: [28, 36],
    iconAnchor: [14, 36],
  })
}

/**
 * Mapa de EQUIPAMIENTOS (evidencia): vista satelital híbrida más limpia que el
 * radar, sin anillos concéntricos. Un círculo suave del radio de análisis y
 * los equipamientos como pins numerados (mismo número que en el radar y la tabla).
 */
export const MapaEquipamientosCaptura = ({
  lat,
  lng,
  radio,
  equipamientos,
}: MapaEquipamientosCapturaProps) => {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (containerRef.current) {
      ;(window as unknown as Record<string, unknown>).__mapaEquipamientosRef = containerRef.current
    }
    return () => {
      delete (window as unknown as Record<string, unknown>).__mapaEquipamientosRef
    }
  }, [])

  if (!lat || !lng) return null

  return (
    <div
      ref={containerRef}
      style={{
        width: 700,
        height: 395,
        background: "#0f1e47",
        borderRadius: 8,
        overflow: "hidden",
      }}
    >
      <MapContainer
        center={[lat, lng]}
        zoom={15}
        style={{ height: "100%", width: "100%", background: "#0a1430" }}
        scrollWheelZoom={false}
        zoomControl={false}
        attributionControl={false}
      >
        <TileLayer url={SATELLITE_TILES.url} crossOrigin="anonymous" maxZoom={SATELLITE_TILES.maxZoom} />
        <TileLayer url={SATELLITE_TRANSPORT.url} crossOrigin="anonymous" maxZoom={SATELLITE_TRANSPORT.maxZoom} />
        <TileLayer url={SATELLITE_LABELS.url} crossOrigin="anonymous" maxZoom={SATELLITE_LABELS.maxZoom} />

        <Circle
          center={[lat, lng]}
          radius={radio}
          pathOptions={{ color: "#FAB90E", weight: 2.5, fillColor: "#FAB90E", fillOpacity: 0.07 }}
        />

        {equipamientos.slice(0, 30).map((e, i) => (
          <Marker key={`eq-${i}`} position={[e.lat, e.lng]} icon={iconoEquipamientoNumerado(e.tipo, i + 1)}>
            <Tooltip direction="top" offset={[0, -38]} opacity={1} permanent={false}>
              <span style={{ fontSize: 11, fontWeight: 700 }}>
                {i + 1}. {e.nombre}
              </span>
            </Tooltip>
          </Marker>
        ))}

        <Marker position={[lat, lng]} icon={iconoInmueble} />
      </MapContainer>
    </div>
  )
}
