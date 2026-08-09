"use client"

/**
 * RadarCircle - Visualización tipo "radar real"
 * - Área de búsqueda + anillos de rango geográficos (1/3 y 2/3 del radio)
 * - Barrido giratorio (conic-gradient) calibrado al radio en píxeles según el zoom
 * - Crosshair N/S/E/O + pulso del anillo externo
 * El punto central arrastrable lo provee DraggableRadarMarker.
 */

import { useEffect, useState } from "react"
import { Circle, Marker, useMap } from "react-leaflet"
import L from "leaflet"

export interface RadarCircleProps {
  center: L.LatLngExpression
  radius: number
}

/**
 * Barrido + crosshair en espacio de pantalla, dimensionado al radio geográfico
 * según el zoom actual del mapa (se recalcula al hacer zoom/pan).
 */
function RadarSweep({ center, radius }: { center: L.LatLngExpression; radius: number }) {
  const map = useMap()
  const [px, setPx] = useState(60)

  useEffect(() => {
    const compute = () => {
      const lat = L.latLng(center).lat
      const metersPerPixel =
        (156543.03392 * Math.cos((lat * Math.PI) / 180)) / Math.pow(2, map.getZoom())
      const p = radius / metersPerPixel
      setPx(Number.isFinite(p) && p > 0 ? p : 60)
    }
    compute()
    map.on("zoomend moveend", compute)
    return () => {
      map.off("zoomend moveend", compute)
    }
  }, [map, center, radius])

  const size = Math.round(px * 2)

  const icon = L.divIcon({
    className: "radar-sweep-icon",
    html: `
      <div class="rs-wrap" style="width:${size}px;height:${size}px;">
        <div class="rs-beam"></div>
        <div class="rs-ring"></div>
        <div class="rs-cross-h"></div>
        <div class="rs-cross-v"></div>
      </div>
    `,
    iconSize: L.point(size, size),
    iconAnchor: L.point(size / 2, size / 2),
  })

  return <Marker position={center} interactive={false} keyboard={false} icon={icon} />
}

export function RadarCircle({ center, radius }: RadarCircleProps) {
  return (
    <>
      {/* Área principal de búsqueda */}
      <Circle
        center={center}
        radius={radius}
        pathOptions={{
          color: "#0891b2",
          fillColor: "#06b6d4",
          fillOpacity: 0.12,
          weight: 2,
        }}
      />

      {/* Anillo de rango 2/3 */}
      <Circle
        center={center}
        radius={radius * 0.66}
        pathOptions={{
          color: "#22d3ee",
          fillOpacity: 0,
          weight: 1,
          dashArray: "6, 8",
          opacity: 0.6,
        }}
      />

      {/* Anillo de rango 1/3 */}
      <Circle
        center={center}
        radius={radius * 0.33}
        pathOptions={{
          color: "#22d3ee",
          fillOpacity: 0,
          weight: 1,
          dashArray: "6, 8",
          opacity: 0.6,
        }}
      />

      {/* Pulso del borde externo */}
      <Circle
        center={center}
        radius={radius}
        pathOptions={{
          color: "#22d3ee",
          fillColor: "#22d3ee",
          fillOpacity: 0.04,
          weight: 1,
          dashArray: "10, 10",
          className: "radar-circle-pulse",
        }}
      />

      {/* Barrido giratorio + crosshair */}
      <RadarSweep center={center} radius={radius} />

      <style>{`
        .radar-sweep-icon {
          background: transparent !important;
          border: none !important;
        }
        .rs-wrap {
          position: relative;
          border-radius: 50%;
          pointer-events: none;
        }
        .rs-beam {
          position: absolute;
          inset: 0;
          border-radius: 50%;
          background: conic-gradient(
            from 0deg,
            rgba(34, 211, 238, 0.55) 0deg,
            rgba(34, 211, 238, 0.15) 50deg,
            rgba(34, 211, 238, 0) 90deg,
            rgba(34, 211, 238, 0) 360deg
          );
          animation: rs-spin 3.2s linear infinite;
        }
        .rs-ring {
          position: absolute;
          inset: 0;
          border-radius: 50%;
          border: 1px solid rgba(34, 211, 238, 0.35);
        }
        .rs-cross-h,
        .rs-cross-v {
          position: absolute;
          background: rgba(34, 211, 238, 0.45);
        }
        .rs-cross-h {
          left: 0;
          right: 0;
          top: 50%;
          height: 1px;
          transform: translateY(-50%);
        }
        .rs-cross-v {
          top: 0;
          bottom: 0;
          left: 50%;
          width: 1px;
          transform: translateX(-50%);
        }
        @keyframes rs-spin {
          to {
            transform: rotate(360deg);
          }
        }
        @keyframes radar-pulse {
          0% {
            opacity: 0.3;
          }
          50% {
            opacity: 0.6;
          }
          100% {
            opacity: 0.3;
          }
        }
        .radar-circle-pulse {
          animation: radar-pulse 2.4s ease-in-out infinite;
        }
      `}</style>
    </>
  )
}
