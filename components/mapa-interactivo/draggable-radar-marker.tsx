"use client"

/**
 * Marcador central del Radar (siempre arrastrable mientras el radar está colocado).
 *
 * FIX: antes se recreaba el Marker en cada cambio de `position` (también durante
 * el arrastre), lo que rompía el drag. Ahora se crea una sola vez y la posición
 * externa (click en mapa / búsqueda) se sincroniza con setLatLng(), respetando
 * el arrastre manual del usuario.
 *
 * Se usan refs para `position` y `onDrag` dentro del efecto de creación, de modo
 * que un cambio de identidad de `onDrag` (inline en el padre) NO recrea el marker.
 */

import { useEffect, useRef } from "react"
import { useMap } from "react-leaflet"
import L from "leaflet"

export interface RadarDragMarkerProps {
  position: L.LatLngExpression
  onDrag: (lat: number, lng: number) => void
  /** Se dispara UNA vez al soltar el marcador: para recálculos costosos */
  onDragEnd?: (lat: number, lng: number) => void
  isRadarConfiguring: boolean
}

export function RadarDragMarker({
  position,
  onDrag,
  onDragEnd,
  isRadarConfiguring,
}: RadarDragMarkerProps) {
  const map = useMap()
  const markerRef = useRef<L.Marker | null>(null)
  const draggingRef = useRef(false)

  // Valores más recientes accesibles desde el efecto de creación (sin dispararlo).
  const positionRef = useRef(position)
  const onDragRef = useRef(onDrag)
  const onDragEndRef = useRef(onDragEnd)
  useEffect(() => {
    positionRef.current = position
  }, [position])
  useEffect(() => {
    onDragRef.current = onDrag
  }, [onDrag])
  useEffect(() => {
    onDragEndRef.current = onDragEnd
  }, [onDragEnd])

  // Crear el marcador una sola vez (o cuando cambia el modo configuración).
  useEffect(() => {
    if (!map) return

    const icon = L.divIcon({
      className: "draggable-radar-marker-container",
      html: `
        <div class="radar-center-wrapper" style="
          width: 44px; height: 44px;
          display: flex; align-items: center; justify-content: center;
        ">
          <div class="radar-center-pin ${isRadarConfiguring ? "configuring" : ""}" style="
            width: 28px; height: 28px;
            background: linear-gradient(135deg, #0891b2, #06b6d4);
            border: 4px solid white;
            border-radius: 50%;
            box-shadow: 0 4px 16px rgba(8, 145, 178, 0.5);
            position: relative;
            cursor: grab;
            transition: transform 0.2s ease;
          ">
            <div style="
              width: 10px; height: 10px;
              background: white; border-radius: 50%;
              position: absolute; top: 50%; left: 50%;
              transform: translate(-50%, -50%);
            "></div>
          </div>
          <div class="radar-ripple" style="
            position: absolute;
            width: 44px; height: 44px;
            border: 2px solid rgba(6, 182, 212, 0.6);
            border-radius: 50%;
            animation: ripple 2s infinite;
          "></div>
        </div>
        <style>
          @keyframes ripple {
            0% { transform: scale(0.6); opacity: 0.8; }
            100% { transform: scale(1.4); opacity: 0; }
          }
          .radar-center-pin.configuring {
            animation: pulse-glow 1.5s infinite;
          }
          @keyframes pulse-glow {
            0%, 100% { box-shadow: 0 4px 16px rgba(8, 145, 178, 0.5); }
            50% { box-shadow: 0 6px 24px rgba(6, 182, 212, 0.8); }
          }
          .radar-center-pin:hover { transform: scale(1.1); }
          .radar-center-pin:active { cursor: grabbing; }
        </style>
      `,
      iconSize: L.point(44, 44),
      iconAnchor: L.point(22, 22),
    })

    const marker = L.marker(positionRef.current, {
      icon,
      draggable: true,
      autoPan: true,
    }).addTo(map)

    marker.on("dragstart", () => {
      draggingRef.current = true
    })
    marker.on("drag", (e: L.LeafletEvent) => {
      const { lat, lng } = (e as L.LeafletMouseEvent).latlng
      onDragRef.current(lat, lng)
    })
    marker.on("dragend", (e: L.LeafletEvent) => {
      draggingRef.current = false
      const { lat, lng } = (e as L.LeafletMouseEvent).latlng
      onDragEndRef.current?.(lat, lng)
    })

    markerRef.current = marker

    return () => {
      map.removeLayer(marker)
      markerRef.current = null
    }
  }, [map, isRadarConfiguring])

  // Sincronizar posición externa (click/búsqueda) sin interrumpir el arrastre manual.
  useEffect(() => {
    if (markerRef.current && !draggingRef.current) {
      markerRef.current.setLatLng(position)
    }
  }, [position])

  return null
}
