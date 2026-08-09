"use client"

/**
 * Panel de Ajuste de Tamaño del Radar
 * Móvil: Se integra en el área de navegación inferior (reemplaza los iconos)
 * Desktop: Tarjeta flotante draggable
 */

import { useState, useEffect, useRef } from "react"
import { Search, Navigation2, X, ChevronUp, ChevronDown, GripVertical } from "lucide-react"

export interface RadarSizeControlProps {
  radarRadius: number
  onRadiusChange: (radius: number) => void
  onSearch: () => void
  onCancel: () => void
}

export function RadarSizeControl({
  radarRadius,
  onRadiusChange,
  onSearch,
  onCancel
}: RadarSizeControlProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })

  const panelRef = useRef<HTMLDivElement>(null)
  const isDesktop = typeof window !== 'undefined' && window.innerWidth >= 768

  // Convertir metros a texto legible
  const radiusText = radarRadius >= 1000
    ? `${(radarRadius / 1000).toFixed(1)} km`
    : `${radarRadius} m`

  // Iniciar drag (solo desktop)
  const handleMouseDown = (e: React.MouseEvent) => {
    if (!isDesktop) return

    const header = panelRef.current?.querySelector('[data-header="true"]')
    if (header && header.contains(e.target as Node)) {
      setIsDragging(true)
      setDragOffset({
        x: e.clientX - position.x,
        y: e.clientY - position.y
      })
    }
  }

  // Durante el drag
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging && isDesktop) {
        const newX = e.clientX - dragOffset.x
        const newY = e.clientY - dragOffset.y

        const maxX = window.innerWidth - 320
        const maxY = window.innerHeight - 200

        setPosition({
          x: Math.max(-160, Math.min(newX, maxX - 160)),
          y: Math.max(0, Math.min(newY, maxY))
        })
      }
    }

    const handleMouseUp = () => {
      setIsDragging(false)
    }

    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove)
      window.addEventListener('mouseup', handleMouseUp)
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }
  }, [isDragging, dragOffset, isDesktop])

  // Estilos dinámicos para desktop
  const desktopStyle = isDesktop ? {
    transform: `translate(${position.x}px, ${position.y}px)`,
    left: '50%',
    top: '80px',
    marginLeft: '-160px',
  } : {}

  // === VERSIÓN MÓVIL ===
  // Panel horizontal en la parte inferior (versión original)
  if (!isDesktop) {
    return (
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-2 py-2 z-[1000] rounded-t-3xl shadow-[0_-10px_25px_rgba(0,0,0,0.1)]">
        <div className="flex items-center gap-3">
          {/* Icono + Radio actual */}
          <div className="flex items-center gap-2 text-gray-900">
            <Navigation2 className="w-5 h-5 text-cyan-600" />
            <span className="font-bold text-sm">{radiusText}</span>
          </div>

          {/* Slider */}
          <div className="flex-1">
            <input
              type="range"
              min="100"
              max="2000"
              step="50"
              value={radarRadius}
              onChange={(e) => onRadiusChange(parseInt(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-cyan-600"
            />
          </div>

          {/* Botones rápidos */}
          <div className="flex gap-1">
            {[100, 500, 1000, 2000].map((radius) => (
              <button
                key={radius}
                onClick={() => onRadiusChange(radius)}
                className={`px-2 py-1 rounded-lg text-xs font-semibold transition-all ${
                  radarRadius === radius
                    ? 'bg-cyan-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {radius >= 1000 ? `${radius/1000}k` : `${radius}m`}
              </button>
            ))}
          </div>

          {/* Buscar */}
          <button
            onClick={onSearch}
            className="p-2 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-lg hover:from-cyan-600 hover:to-blue-700 transition-colors"
          >
            <Search className="w-4 h-4" />
          </button>

          {/* Cancelar */}
          <button
            onClick={onCancel}
            className="p-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    )
  }

  // === VERSIÓN DESKTOP ===
  // Tarjeta flotante draggable con expand/colapsar
  return (
    <div
      ref={panelRef}
      onMouseDown={handleMouseDown}
      className={`
        fixed z-[1999] bg-white rounded-2xl shadow-2xl
        transition-transform duration-300 ease-out
        md:w-[320px] md:max-h-[80vh]
        ${isDragging ? 'transition-none' : ''}
        ${isExpanded ? 'translate-y-0' : 'translate-y-[calc(100%-60px)]'}
        ${isDesktop ? 'cursor-move' : ''}
      `}
      style={desktopStyle}
    >
      {/* Handle / Header */}
      <div
        data-header="true"
        className={`flex items-center justify-between p-3 cursor-pointer border-b border-gray-100 select-none ${
          isDesktop ? 'hover:bg-gray-50' : ''
        }`}
        onClick={(e) => {
          if (!isDragging) {
            setIsExpanded(!isExpanded)
          }
        }}
      >
        <div className="flex items-center gap-2">
          <GripVertical className="w-4 h-4 text-gray-400" />
          <Navigation2 className="w-4 h-4 text-cyan-600" />
          <span className="font-semibold text-gray-900 text-sm">Radio: {radiusText}</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation()
              onCancel()
            }}
            className="p-1.5 hover:bg-gray-100 rounded-full transition-colors"
            title="Cancelar"
          >
            <X className="w-4 h-4 text-gray-500" />
          </button>
          {isExpanded ? (
            <ChevronDown className="w-5 h-5 text-gray-400" />
          ) : (
            <ChevronUp className="w-5 h-5 text-gray-400" />
          )}
        </div>
      </div>

      {/* Contenido (expande/colapsa) */}
      <div
        className={`
          transition-all duration-300 ease-in-out overflow-hidden
          ${isExpanded ? 'max-h-[400px] opacity-100' : 'max-h-0 opacity-0'}
        `}
      >
        <div className="p-4 space-y-4">
          {/* Slider Control */}
          <div>
            <input
              type="range"
              min="100"
              max="2000"
              step="50"
              value={radarRadius}
              onChange={(e) => onRadiusChange(parseInt(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-cyan-600"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-2">
              <span>100m</span>
              <span>500m</span>
              <span>1km</span>
              <span>1.5km</span>
              <span>2km</span>
            </div>
          </div>

          {/* Quick Select Buttons */}
          <div className="grid grid-cols-5 gap-1.5">
            {[
              { value: 100, label: '100m' },
              { value: 250, label: '250m' },
              { value: 500, label: '500m' },
              { value: 1000, label: '1km' },
              { value: 2000, label: '2km' },
            ].map(({ value, label }) => (
              <button
                key={value}
                onClick={() => onRadiusChange(value)}
                className={`py-2 px-2 rounded-lg font-medium text-xs transition-all ${
                  radarRadius === value
                    ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-sm'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Search Button */}
          <button
            onClick={onSearch}
            className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white font-bold py-2.5 px-4 rounded-xl transition-all hover:shadow-lg active:scale-105"
          >
            <Search className="w-4 h-4" />
            <span>Buscar</span>
          </button>
        </div>
      </div>
    </div>
  )
}
