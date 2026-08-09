"use client"

import { useRef, useEffect } from "react"
import { MapContainer, TileLayer, Circle, Marker, Tooltip, Polyline } from "react-leaflet"
import L from "leaflet"
import "leaflet/dist/leaflet.css"
import { SATELLITE_TILES, SATELLITE_LABELS, SATELLITE_TRANSPORT, colorPorTipo } from "./mapas-pdf-config"

export interface EquipamientoRadar {
  tipo: string
  nombre: string
  distancia: number
  lat: number
  lng: number
}

interface RadarCapturaPdfProps {
  lat: number
  lng: number
  radioMax: number
  equipamientos: EquipamientoRadar[]
}

/** Pin dorado grande del inmueble con icono casa */
const iconoInmueble = L.divIcon({
  html: `<div style="position:relative;width:38px;height:48px;">
    <div style="position:absolute;left:50%;bottom:0;transform:translateX(-50%);
      width:0;height:0;border-left:9px solid transparent;border-right:9px solid transparent;
      border-top:14px solid #FAB90E;z-index:2;"></div>
    <div style="position:absolute;left:50%;top:0;transform:translateX(-50%);
      width:30px;height:30px;border-radius:50%;
      background:#FAB90E;border:4px solid #fff;
      box-shadow:0 0 0 2px #0f1e47,0 3px 8px rgba(0,0,0,0.7);
      display:flex;align-items:center;justify-content:center;">
      <span style="font-size:15px;line-height:1;">🏠</span>
    </div>
  </div>`,
  className: "",
  iconSize: [38, 48],
  iconAnchor: [19, 48],
})

/**
 * Pin numerado tipo teardrop para equipamientos: muy visible sobre satélite.
 * Fondo blanco fuerte + borde de color grueso + sombra + número grande.
 */
function iconoEquipamientoNumerado(tipo: string, numero: number): L.DivIcon {
  const color = colorPorTipo(tipo)
  return L.divIcon({
    html: `<div style="position:relative;width:30px;height:38px;">
      <div style="position:absolute;left:50%;bottom:0;transform:translateX(-50%);
        width:0;height:0;border-left:7px solid transparent;border-right:7px solid transparent;
        border-top:11px solid #fff;filter:drop-shadow(0 2px 3px rgba(0,0,0,0.7));z-index:2;"></div>
      <div style="position:absolute;left:50%;top:0;transform:translateX(-50%);
        width:26px;height:26px;border-radius:50%;
        background:#fff;border:4px solid ${color};
        box-shadow:0 2px 6px rgba(0,0,0,0.7);
        display:flex;align-items:center;justify-content:center;">
        <span style="font-family:Arial,sans-serif;font-weight:800;font-size:13px;color:${color};line-height:1;">${numero}</span>
      </div>
    </div>`,
    className: "",
    iconSize: [30, 38],
    iconAnchor: [15, 38],
  })
}

/**
 * Mapa RADAR para el PDF: vista satelital híbrida (foto + calles) centrada en
 * el inmueble con 4 círculos concéntricos (250/500/750/1000 m) y los
 * equipamientos como pins numerados en sus coordenadas reales.
 * El número de cada pin coincide con el orden del array (1-based) y se usa
 * también en la tabla y leyenda del PDF.
 */
export const RadarCapturaPdf = ({ lat, lng, radioMax, equipamientos }: RadarCapturaPdfProps) => {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (containerRef.current) {
      ;(window as unknown as Record<string, unknown>).__mapaRadarRef = containerRef.current
    }
    return () => {
      delete (window as unknown as Record<string, unknown>).__mapaRadarRef
    }
  }, [])

  if (!lat || !lng) return null

  const escala = radioMax >= 1000 ? 1 : radioMax / 1000
  const anillos = [
    { r: 250 * escala, color: "#22c55e" },
    { r: 500 * escala, color: "#eab308" },
    { r: 750 * escala, color: "#f97316" },
    { r: 1000 * escala, color: "#dc2626" },
  ]

  return (
    <div
      ref={containerRef}
      style={{
        width: 720,
        height: 390,
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

        {/* Anillos concéntricos (de mayor a menor) */}
        {[...anillos].reverse().map((a, i) => (
          <Circle
            key={`anillo-${i}`}
            center={[lat, lng]}
            radius={a.r}
            pathOptions={{
              color: a.color,
              weight: 2.5,
              fillColor: a.color,
              fillOpacity: 0.05,
              dashArray: i % 2 === 0 ? "8 5" : undefined,
            }}
          />
        ))}

        {/* Líneas finas desde el centro a los 8 equipamientos más cercanos */}
        {equipamientos.slice(0, 8).map((e, i) => (
          <Polyline
            key={`linea-${i}`}
            positions={[
              [lat, lng],
              [e.lat, e.lng],
            ]}
            pathOptions={{ color: "#ffffff", weight: 1.2, opacity: 0.6, dashArray: "4 4" }}
          />
        ))}

        {/* Equipamientos numerados (el número es index+1) */}
        {equipamientos.map((e, i) => (
          <Marker key={`eq-${i}`} position={[e.lat, e.lng]} icon={iconoEquipamientoNumerado(e.tipo, i + 1)}>
            <Tooltip direction="top" offset={[0, -40]} opacity={1} permanent={false}>
              <span style={{ fontSize: 11, fontWeight: 700 }}>
                {i + 1}. {e.nombre}
              </span>
              <br />
              <span style={{ fontSize: 10 }}>{e.distancia} m</span>
            </Tooltip>
          </Marker>
        ))}

        {/* Marcador central del inmueble (al final para quedar encima) */}
        <Marker position={[lat, lng]} icon={iconoInmueble}>
          <Tooltip direction="bottom" offset={[0, -2]} opacity={1} permanent>
            <span style={{ fontSize: 11, fontWeight: 800, color: "#0f1e47", background: "#fff", padding: "1px 4px", borderRadius: 3 }}>
              INMUEBLE
            </span>
          </Tooltip>
        </Marker>
      </MapContainer>
    </div>
  )
}
