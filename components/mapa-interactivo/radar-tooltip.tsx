"use client"

/**
 * Radar Activation Tooltip
 * Tooltip flotante que indica al usuario cómo activar el radar
 */

import { Navigation2 } from "lucide-react"

export interface RadarTooltipProps {
  isVisible: boolean
}

export function RadarTooltip({ isVisible }: RadarTooltipProps) {
  if (!isVisible) return null

  return (
    <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[3000] animate-bounce">
      <div className="bg-gradient-to-r from-cyan-500 to-blue-600 text-white px-6 py-3 rounded-xl shadow-2xl flex items-center gap-3">
        <Navigation2 className="w-6 h-6 animate-pulse" />
        <p className="font-semibold">
          Selecciona un punto en el mapa para activar el radar
        </p>
      </div>

      {/* Flecha indicadora */}
      <div className="w-0 h-0 border-l-8 border-l-transparent border-r-8 border-r-transparent border-t-8 border-t-cyan-500 mx-auto mt-1" />
    </div>
  )
}
