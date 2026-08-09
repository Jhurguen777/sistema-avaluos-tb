"use client"

import { MapContainer, TileLayer, Marker, Popup, Circle } from "react-leaflet"
import L from "leaflet"
import "leaflet/dist/leaflet.css"
import { colorPorTipo } from "./mapas-pdf-config"

export interface EquipamientoMapa {
  tipo: string
  nombre: string
  distancia: number
  lat: number
  lng: number
}

interface MapaAvaluoCapturaProps {
  lat: number
  lng: number
  radio: number
  equipamientos: EquipamientoMapa[]
}

// Icono del inmueble (mismo dorado que en los mapas del PDF)
const iconoPropiedad = L.divIcon({
  html: `<div style="background:#FAB90E;width:24px;height:24px;border-radius:50%;border:3px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,0.4)"></div>`,
  className: "",
  iconSize: [24, 24],
  iconAnchor: [12, 12],
})

function iconoEquipamiento(tipo: string) {
  const color = colorPorTipo(tipo)
  return L.divIcon({
    html: `<div style="background:${color};width:16px;height:16px;border-radius:3px;border:2px solid #fff;box-shadow:0 1px 3px rgba(0,0,0,0.3)"></div>`,
    className: "",
    iconSize: [16, 16],
    iconAnchor: [8, 8],
  })
}

/**
 * Mapa visible de "Ubicación y Entorno" en la página del avalúo.
 * Usa los mismos colores de equipamiento que los mapas del PDF (paleta única
 * en mapas-pdf-config.ts) para que la página y el PDF se vean consistentes.
 */
export const MapaAvaluoCaptura = ({
  lat,
  lng,
  radio,
  equipamientos,
}: MapaAvaluoCapturaProps) => {
  if (!lat || !lng) {
    return (
      <div className="h-[300px] rounded-lg bg-slate-800/50 flex items-center justify-center text-slate-500 text-sm">
        Mapa no disponible (el inmueble no tiene coordenadas)
      </div>
    )
  }

  return (
    <div className="h-[300px] rounded-lg overflow-hidden border border-slate-700">
      <MapContainer
        center={[lat, lng]}
        zoom={15}
        style={{ height: "100%", width: "100%" }}
        scrollWheelZoom={false}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; OpenStreetMap'
          crossOrigin="anonymous"
        />

        {/* Radio del radar */}
        <Circle
          center={[lat, lng]}
          radius={radio}
          pathOptions={{ color: "#FAB90E", fillColor: "#FAB90E", fillOpacity: 0.05 }}
        />

        {/* Marcador de la propiedad */}
        <Marker position={[lat, lng]} icon={iconoPropiedad}>
          <Popup>
            <strong>Inmueble</strong>
          </Popup>
        </Marker>

        {/* Marcadores de equipamientos */}
        {equipamientos.map((e, i) => (
          <Marker
            key={`${e.nombre}-${i}`}
            position={[e.lat, e.lng]}
            icon={iconoEquipamiento(e.tipo)}
          >
            <Popup>
              <strong>{e.nombre}</strong>
              <br />
              {e.tipo} · {e.distancia}m
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  )
}
