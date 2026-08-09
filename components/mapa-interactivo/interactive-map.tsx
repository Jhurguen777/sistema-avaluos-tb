"use client"

/**
 * Mapa Interactivo GeoPricer - Diseño Responsivo con Radar
 * Desktop: [🏠][FILTROS][BUSCAR] | [20][📍][📡][🌎]
 * Móvil: [20][BUSCAR] | [🏠][📍][📡][🌎][≡]
 */

import { useState, useEffect, useRef } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap, useMapEvents } from "react-leaflet"
import MarkerClusterGroup from "react-leaflet-cluster"
import L from "leaflet"
import "leaflet/dist/leaflet.css"
import "leaflet.markercluster/dist/MarkerCluster.css"
import "leaflet.markercluster/dist/MarkerCluster.Default.css"

import { type Property } from "./mock-data"
import { PropertyDetailModal } from "./property-detail-modal"
import { listInmueblesPublicAction } from "@/modules/inmuebles/actions"
import type { InmuebleDTO } from "@/modules/inmuebles/types/inmueble.types"
import { SearchBar, type NominatimResult } from "./search-bar"
import { SidebarLeftFilters, type FilterState } from "./sidebar-left-filters"
import { SidebarRightRadar } from "./sidebar-right-radar"
import { RadarCircle } from "./radar-circle"
import { RadarTooltip } from "./radar-tooltip"
import { RadarSizeControl } from "./radar-size-control"
import { RadarDragMarker } from "./draggable-radar-marker"
import {
  Home as HomeIcon,
  Filter,
  MapPin,
  Radar,
  Globe,
  LocateFixed,
  Satellite,
  Map as MapIcon,
  X,
} from "lucide-react"

// ============================================================================
// TIPOS
// ============================================================================

type ViewMode = "desktop" | "mobile"

/** Tipo de vista del mapa: calle (OpenStreetMap) o satélite (Esri World Imagery). */
type MapType = "street" | "satellite"

/**
 * Configuración de capas de teselas (tile layers).
 * - street: OpenStreetMap estándar (gratis, sin API key).
 * - satellite: Esri World Imagery (alta resolución global, gratis).
 */
const TILE_LAYERS: Record<MapType, { url: string; attribution: string }> = {
  street: {
    url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
  },
  satellite: {
    url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    attribution:
      "Tiles &copy; Esri &mdash; Source: Esri, Maxar, Earthstar Geographics, and the GIS User Community",
  },
}

/** Capa de etiquetas (límites, lugares, carreteras) que se superpone al satélite. */
const SATELLITE_LABELS_URL =
  "https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}"

/** Bounding box de Bolivia (sur,oeste -> norte,este) para "Ver todo Bolivia". */
const BOLIVIA_BOUNDS: L.LatLngBoundsExpression = [
  [-22.898, -69.641],
  [-10.392, -57.453],
]

interface UserLocation {
  lat: number
  lng: number
  accuracy: number
}

// ============================================================================
// ICONOS PERSONALIZADOS - CLUSTERS
// ============================================================================

const createClusterIcon = (cluster: { getChildCount: () => number }) => {
  const count = cluster.getChildCount()
  let sizeClass = ""
  let colorClass = ""
  let size = 40

  if (count < 10) {
    sizeClass = "w-10 h-10 text-xs"
    colorClass = "bg-blue-500 border-3 border-white text-white font-bold shadow-lg"
    size = 40
  } else if (count < 100) {
    sizeClass = "w-12 h-12 text-sm"
    colorClass = "bg-orange-500 border-3 border-white text-white font-bold shadow-xl"
    size = 48
  } else {
    sizeClass = "w-14 h-14 text-base"
    colorClass = "bg-red-500 border-3 border-white text-white font-bold shadow-2xl"
    size = 56
  }

  return L.divIcon({
    className: "custom-cluster-icon",
    html: `
      <div class="flex items-center justify-center ${sizeClass} ${colorClass} rounded-full">
        ${count}
      </div>
    `,
    iconSize: L.point(size, size),
    iconAnchor: L.point(size / 2, size / 2),
  })
}

const MARKER_STYLES: Record<string, { color: string; label: string }> = {
  house: { color: "#10b981", label: "Casa" },
  apartment: { color: "#3b82f6", label: "Departamento" },
  land: { color: "#f59e0b", label: "Terreno" },
}

const ICON_PATHS: Record<string, string> = {
  house: '<path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>',
  apartment: '<rect x="4" y="3" width="16" height="18" rx="1"/><path d="M9 21V3"/><path d="M15 21V3"/><path d="M4 9h16"/><path d="M4 15h16"/>',
  land: '<path d="m17 14 3 3.3a1 1 0 0 1-.7 1.7H4.7a1 1 0 0 1-.7-1.7L7 14h-.3a1 1 0 0 1-.7-1.7L9 9h-.2A1 1 0 0 1 8 7.3L12 3l4 4.3a1 1 0 0 1-.8 1.7H15l3 3.3a1 1 0 0 1-.7 1.7H17Z"/><path d="M12 22v-3"/>',
}

/**
 * Pin con icono y color según el tipo de inmueble (sin el "ping" anterior).
 */
const createPropertyMarkerIcon = (type: string) => {
  const style = MARKER_STYLES[type] ?? MARKER_STYLES.house
  const path = ICON_PATHS[type] ?? ICON_PATHS.house
  return L.divIcon({
    className: "custom-marker-icon",
    html: `
      <svg width="34" height="44" viewBox="0 0 24 32" xmlns="http://www.w3.org/2000/svg" style="filter: drop-shadow(0 3px 3px rgba(0,0,0,0.35));">
        <path d="M12 0C5.4 0 0 5.4 0 12c0 9 12 20 12 20s12-11 12-20C24 5.4 18.6 0 12 0z" fill="${style.color}" stroke="white" stroke-width="1.5"/>
        <circle cx="12" cy="12" r="6.6" fill="white"/>
        <g fill="none" stroke="${style.color}" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${path}</g>
      </svg>
    `,
    iconSize: L.point(34, 44),
    iconAnchor: L.point(17, 44),
    popupAnchor: L.point(0, -38),
  })
}

/**
 * Punto azul pulsante (estilo Google Maps) para "Mi ubicación".
 */
const createUserDotIcon = () => {
  return L.divIcon({
    className: "user-location-dot",
    html: `<div class="uld"><div class="uld-pulse"></div><div class="uld-core"></div></div>`,
    iconSize: L.point(22, 22),
    iconAnchor: L.point(11, 11),
  })
}

// ============================================================================
// COMPONENTE: POPUP DE PROPIEDAD
// ============================================================================

function PropertyPopup({
  property,
  onOpenDetail,
}: {
  property: Property
  onOpenDetail: (property: Property) => void
}) {
  return (
    <div className="w-56 overflow-hidden rounded-lg border border-slate-700/50 bg-card shadow-xl">
      {/* Miniatura (placeholder oscuro) */}
      <div className="flex h-20 items-center justify-center bg-gradient-to-br from-slate-800 to-slate-900">
        <HomeIcon className="h-7 w-7 text-slate-600" strokeWidth={1.5} />
      </div>
      <div className="space-y-1 p-2.5">
        <div className="bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-sm font-bold text-transparent">
          US$ {property.price.toLocaleString('es-BO')}
        </div>
        <div className="flex items-start gap-1">
          <MapPin className="mt-0.5 h-3 w-3 flex-shrink-0 text-slate-500" strokeWidth={1.8} />
          <span className="truncate text-xs text-slate-400">{property.address}</span>
        </div>
        <button
          onClick={() => onOpenDetail(property)}
          className="pt-1 text-xs font-semibold text-blue-400 transition-colors hover:text-blue-300 hover:underline"
        >
          Ver Detalles →
        </button>
      </div>
    </div>
  )
}

// ============================================================================
// COMPONENTE: MAP EVENTS PARA RADAR
// ============================================================================

function MapRadarEvents({
  isRadarModeActive,
  isRadarConfiguring,
  onMapClick
}: {
  isRadarModeActive: boolean
  isRadarConfiguring: boolean
  onMapClick: (lat: number, lng: number) => void
}) {
  const map = useMap()

  // Cambiar cursor cuando el modo radar está activo o configurando
  useEffect(() => {
    if (isRadarModeActive || isRadarConfiguring) {
      const mapContainer = map.getContainer()
      mapContainer.style.cursor = 'crosshair'
      return () => {
        mapContainer.style.cursor = ''
      }
    }
  }, [isRadarModeActive, isRadarConfiguring, map])

  useMapEvents({
    click(e) {
      // Clic en modo radar activo O en modo configuración (para mover radar)
      if (isRadarModeActive || isRadarConfiguring) {
        onMapClick(e.latlng.lat, e.latlng.lng)
      }
    }
  })

  return null
}

// ============================================================================
// COMPONENTE: MARCADOR DE MI UBICACIÓN
// ============================================================================

function LocationMarker({ location }: { location: UserLocation | null }) {
  if (!location) return null
  return (
    <>
      <Circle
        center={[location.lat, location.lng]}
        radius={location.accuracy}
        pathOptions={{ color: "#3b82f6", fillColor: "#3b82f6", fillOpacity: 0.12, weight: 1 }}
      />
      <Marker
        position={[location.lat, location.lng]}
        icon={createUserDotIcon()}
        interactive={false}
      />
    </>
  )
}

// ============================================================================
// COMPONENTE: CONTROLES DESKTOP
// ============================================================================

function DesktopControls({
  onLocationFound,
  onToggleFilters,
  onRadarClick,
  radarActive,
  propertyCount,
  onGoHome,
  onUserLocation,
  mapType,
  onToggleMapType
}: {
  onLocationFound: (lat: number, lon: number, result: NominatimResult) => void
  onToggleFilters: () => void
  onRadarClick: () => void
  radarActive: boolean
  propertyCount: number
  onGoHome: () => void
  onUserLocation: (lat: number, lng: number, accuracy: number) => void
  mapType: MapType
  onToggleMapType: () => void
}) {
  const map = useMap()

  const handleRecenterBolivia = () => map?.fitBounds(BOLIVIA_BOUNDS, { padding: [40, 40] })
  const handleGoToMyLocation = () => {
    if (navigator.geolocation && map) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude, accuracy } = position.coords
          map.setView([latitude, longitude], 16)
          onUserLocation(latitude, longitude, accuracy)
        },
        (error) => {
          console.error("Error getting location:", error)
        }
      )
    }
  }

  return (
    <>
      {/* Panel Superior Izquierdo - [🏠] [FILTROS] [BUSCADOR] */}
      <div className="absolute top-4 left-4 z-[1000] flex items-center gap-3">
        {/* Botón Inicio - Navega a /home */}
        <button
          onClick={onGoHome}
          className="w-12 h-12 flex items-center justify-center bg-white text-slate-700 border border-slate-200 rounded-xl shadow-lg hover:bg-slate-50 transition-all cursor-pointer"
          title="Ir a Inicio"
        >
          <HomeIcon className="w-5 h-5" />
        </button>

        {/* Botón Filtros */}
        <button
          onClick={onToggleFilters}
          className="flex items-center justify-center gap-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-bold py-3 px-5 rounded-xl shadow-lg transition-all hover:shadow-xl hover:scale-105"
        >
          <Filter className="w-5 h-5" />
          <span>Filtros</span>
        </button>

        {/* Buscador */}
        <SearchBar
          placeholder="Buscar dirección, ciudad o lugar..."
          onLocationFound={onLocationFound}
          map={map}
          className="w-80"
        />
      </div>

      {/* Panel Superior Derecho - [20] [📍] [📡] [🌎] */}
      <div className="absolute top-4 right-4 z-[1000] flex items-center gap-3">
        {/* Badge de Conteo */}
        <div className="bg-white/95 backdrop-blur text-gray-700 border border-gray-200 py-2 px-4 rounded-xl text-sm font-semibold shadow-lg">
          {propertyCount} propiedades
        </div>

        {/* Botón Geolocalización */}
        <button
          onClick={handleGoToMyLocation}
          className="p-3 bg-white border border-gray-200 text-gray-600 hover:text-blue-600 hover:bg-blue-50 hover:border-blue-200 rounded-xl shadow-lg transition-all hover:scale-105"
          title="Mi ubicación"
        >
          <LocateFixed className="w-5 h-5" />
        </button>

        {/* Botón Radar / Cancelar */}
        <button
          onClick={onRadarClick}
          className={`p-3 rounded-xl shadow-lg transition-all hover:scale-105 ${
            radarActive
              ? 'bg-gradient-to-r from-rose-500 to-red-600 text-white border-2 border-rose-300'
              : 'bg-white border border-gray-200 text-gray-600 hover:text-cyan-600 hover:bg-cyan-50 hover:border-cyan-200'
          }`}
          title={radarActive ? "Quitar radar" : "Activar radar"}
        >
          {radarActive ? <X className="w-5 h-5" /> : <Radar className="w-5 h-5" />}
        </button>

        {/* Botón Ver todo Bolivia */}
        <button
          onClick={handleRecenterBolivia}
          className="p-3 bg-white border border-gray-200 text-gray-600 hover:text-green-600 hover:bg-green-50 hover:border-green-200 rounded-xl shadow-lg transition-all hover:scale-105"
          title="Ver todo Bolivia"
        >
          <Globe className="w-5 h-5" />
        </button>

        {/* Botón Vista Satélite / Calle */}
        <button
          onClick={onToggleMapType}
          className={`p-3 rounded-xl shadow-lg transition-all hover:scale-105 ${
            mapType === "satellite"
              ? "bg-gradient-to-r from-emerald-500 to-teal-600 text-white border-2 border-emerald-300"
              : "bg-white border border-gray-200 text-gray-600 hover:text-emerald-600 hover:bg-emerald-50 hover:border-emerald-200"
          }`}
          title={mapType === "satellite" ? "Ver mapa de calles" : "Ver vista satélite"}
        >
          {mapType === "satellite" ? <MapIcon className="w-5 h-5" /> : <Satellite className="w-5 h-5" />}
        </button>
      </div>
    </>
  )
}

// ============================================================================
// COMPONENTE: HEADER MÓVIL
// ============================================================================

function MobileHeader({
  onLocationFound,
  map,
  propertyCount
}: {
  onLocationFound: (lat: number, lon: number, result: NominatimResult) => void
  map: L.Map | null
  propertyCount: number
}) {
  return (
    <div className="absolute top-0 left-0 right-0 z-[1000] bg-gradient-to-b from-black/50 to-transparent p-4">
      <div className="flex items-center gap-3">
        {/* Badge de Conteo - Ahora en móvil arriba */}
        <div className="bg-white/95 backdrop-blur text-gray-700 border border-gray-200 py-2 px-4 rounded-xl text-sm font-semibold shadow-lg">
          {propertyCount} props
        </div>

        {/* Buscador */}
        <SearchBar
          placeholder="Buscar lugar..."
          onLocationFound={onLocationFound}
          map={map}
          className="flex-1"
        />
      </div>
    </div>
  )
}

// ============================================================================
// COMPONENTE: PANEL INFERIOR MÓVIL
// ============================================================================

function MobileBottomPanel({
  onToggleFilters,
  onRadarClick,
  radarActive,
  onGoHome,
  onUserLocation,
  mapType,
  onToggleMapType
}: {
  onToggleFilters: () => void
  onRadarClick: () => void
  radarActive: boolean
  onGoHome: () => void
  onUserLocation: (lat: number, lng: number, accuracy: number) => void
  mapType: MapType
  onToggleMapType: () => void
}) {
  const map = useMap()

  const handleRecenterBolivia = () => map?.fitBounds(BOLIVIA_BOUNDS, { padding: [30, 30] })
  const handleGoToMyLocation = () => {
    if (navigator.geolocation && map) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude, accuracy } = position.coords
          map.setView([latitude, longitude], 16)
          onUserLocation(latitude, longitude, accuracy)
        },
        (error) => {
          console.error("Error getting location:", error)
        }
      )
    }
  }

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-2 py-2 z-[1000] rounded-t-3xl shadow-[0_-10px_25px_rgba(0,0,0,0.1)]">
      {/* Grid de 6 columnas idénticas */}
      <div className="grid grid-cols-6 w-full items-center justify-items-center">
        {/* Botón Inicio - Navega a /home */}
        <button
          onClick={onGoHome}
          className="w-full flex flex-col items-center justify-center gap-1 py-2 text-gray-600 hover:text-blue-600 active:scale-95 transition-all"
        >
          <HomeIcon className="w-6 h-6" />
          <span className="text-xs font-medium">Inicio</span>
        </button>

        {/* Botón Ubicar */}
        <button
          onClick={handleGoToMyLocation}
          className="w-full flex flex-col items-center justify-center gap-1 py-2 text-gray-600 hover:text-blue-600 active:scale-95 transition-all"
        >
          <LocateFixed className="w-6 h-6" />
          <span className="text-xs font-medium">Ubicar</span>
        </button>

        {/* Botón Radar / Cancelar */}
        <button
          onClick={onRadarClick}
          className="w-full flex flex-col items-center justify-center py-2"
        >
          <div className={`px-4 py-1.5 rounded-2xl flex flex-col items-center justify-center w-[90%] mx-auto transition-all ${
            radarActive
              ? 'bg-gradient-to-r from-rose-500 to-red-600 text-white'
              : 'bg-gradient-to-r from-cyan-50 to-blue-50 text-cyan-600'
          }`}>
            {radarActive ? <X className="w-6 h-6" /> : <Radar className="w-6 h-6" />}
            <span className="text-xs font-bold">{radarActive ? 'QUITAR' : 'RADAR'}</span>
          </div>
        </button>

        {/* Botón Ver todo Bolivia */}
        <button
          onClick={handleRecenterBolivia}
          className="w-full flex flex-col items-center justify-center gap-1 py-2 text-gray-600 hover:text-green-600 active:scale-95 transition-all"
        >
          <Globe className="w-6 h-6" />
          <span className="text-xs font-medium">Bolivia</span>
        </button>

        {/* Botón Vista Satélite / Calle */}
        <button
          onClick={onToggleMapType}
          className="w-full flex flex-col items-center justify-center gap-1 py-2 active:scale-95 transition-all"
        >
          <div className={`px-3 py-1.5 rounded-2xl flex flex-col items-center justify-center w-[90%] mx-auto transition-all ${
            mapType === "satellite"
              ? "bg-gradient-to-r from-emerald-500 to-teal-600 text-white"
              : "bg-gradient-to-r from-emerald-50 to-teal-50 text-emerald-600"
          }`}>
            {mapType === "satellite" ? <MapIcon className="w-6 h-6" /> : <Satellite className="w-6 h-6" />}
            <span className="text-xs font-bold">{mapType === "satellite" ? "CALLE" : "SATÉLITE"}</span>
          </div>
        </button>

        {/* Botón Filtros */}
        <button
          onClick={onToggleFilters}
          className="w-full flex flex-col items-center justify-center gap-1 py-2 text-gray-600 hover:text-blue-600 active:scale-95 transition-all"
        >
          <Filter className="w-6 h-6" />
          <span className="text-xs font-medium">Filtros</span>
        </button>
      </div>
    </div>
  )
}

// ============================================================================
// COMPONENTE: CONTENIDO DEL MAPA
// ============================================================================

function MapContent({
  viewMode,
  mapType,
  onToggleMapType,
  onLocationFound,
  onToggleFilters,
  onRadarClick,
  radarActive,
  isRadarModeActive,
  isRadarConfiguring,
  onRadarMapClick,
  propertyCount,
  onGoHome,
  onUserLocation,
  userLocation,
  properties,
  setSelectedProperty,
  onOpenDetail
}: {
  viewMode: ViewMode
  mapType: MapType
  onToggleMapType: () => void
  onLocationFound: (lat: number, lon: number, result: NominatimResult) => void
  onToggleFilters: () => void
  onRadarClick: () => void
  radarActive: boolean
  isRadarModeActive: boolean
  isRadarConfiguring: boolean
  onRadarMapClick: (lat: number, lng: number) => void
  propertyCount: number
  onGoHome: () => void
  onUserLocation: (lat: number, lng: number, accuracy: number) => void
  userLocation: UserLocation | null
  properties: Property[]
  setSelectedProperty: (property: Property | null) => void
  onOpenDetail: (property: Property) => void
}) {
  const map = useMap()
  const mapRef = useRef<L.Map | null>(null)

  useEffect(() => {
    if (map) {
      mapRef.current = map
    }
  }, [map])

  return (
    <>
      {/* Tile Layer dinámico: calle (OpenStreetMap) o satélite (Esri) */}
      <TileLayer
        key={mapType}
        url={TILE_LAYERS[mapType].url}
        attribution={TILE_LAYERS[mapType].attribution}
      />
      {/* Capa de etiquetas (límites, lugares, rutas) sobre el satélite */}
      {mapType === "satellite" && (
        <TileLayer url={SATELLITE_LABELS_URL} attribution="" zIndex={5} />
      )}

      {/* Map Events para Radar */}
      <MapRadarEvents
        isRadarModeActive={isRadarModeActive}
        isRadarConfiguring={isRadarConfiguring}
        onMapClick={onRadarMapClick}
      />

      {/* Marcador de Mi Ubicación */}
      <LocationMarker location={userLocation} />

      {/* Controles Flotantes - Desktop */}
      {viewMode === "desktop" && (
        <DesktopControls
          onLocationFound={onLocationFound}
          onToggleFilters={onToggleFilters}
          onRadarClick={onRadarClick}
          radarActive={radarActive}
          propertyCount={propertyCount}
          onGoHome={onGoHome}
          onUserLocation={onUserLocation}
          mapType={mapType}
          onToggleMapType={onToggleMapType}
        />
      )}

      {/* Header Móvil */}
      {viewMode === "mobile" && (
        <MobileHeader
          onLocationFound={onLocationFound}
          map={mapRef.current}
          propertyCount={propertyCount}
        />
      )}

      {/* Panel Inferior Móvil */}
      {viewMode === "mobile" && (
        <MobileBottomPanel
          onToggleFilters={onToggleFilters}
          onRadarClick={onRadarClick}
          radarActive={radarActive}
          onGoHome={onGoHome}
          onUserLocation={onUserLocation}
          mapType={mapType}
          onToggleMapType={onToggleMapType}
        />
      )}

      {/* Marcadores Agrupados con Clustering */}
      <MarkerClusterGroup
        iconCreateFunction={createClusterIcon}
        showCoverageOnHover={false}
        zoomToBoundsOnClick={true}
        spiderfyDistanceMultiplier={1.5}
        maxClusterRadius={viewMode === "mobile" ? 60 : 80}
        spiderfyOnMaxZoom={true}
      >
        {properties.map((property) => (
          <Marker
            key={property.id}
            position={[property.lat, property.lng]}
            icon={createPropertyMarkerIcon(property.type)}
            eventHandlers={{
              click: () => {
                setSelectedProperty(property)
              },
            }}
          >
            <Popup
              position={[property.lat, property.lng]}
              className="custom-popup"
              maxWidth={400}
            >
              <PropertyPopup property={property} onOpenDetail={onOpenDetail} />
            </Popup>
          </Marker>
        ))}
      </MarkerClusterGroup>
    </>
  )
}

// ============================================================================
// COMPONENTE PRINCIPAL DEL MAPA
// ============================================================================

/** Mapea un InmuebleDTO (real) a la forma Property que usa el mapa */
function mapInmuebleToProperty(i: InmuebleDTO): Property {
  const tipoPorCategoria: Record<string, Property['type']> = {
    CASA: 'house',
    QUINTA: 'house',
    DUPLEX: 'house',
    DEPARTAMENTO: 'apartment',
    PENTHOUSE: 'apartment',
    MONOAMBIENTE: 'apartment',
    CONDOMINIO: 'apartment',
    TERRENO: 'land',
  }

  return {
    id: i.id,
    title: i.nombre,
    address: i.direccion ?? 'Sin dirección',
    city: '',
    price: i.precioUsd ?? 0,
    bedrooms: i.habitaciones ?? 0,
    bathrooms: i.banos ?? 0,
    area: i.superficieUtil ?? i.superficieConstruida ?? 0,
    lat: i.lat!,
    lng: i.lng!,
    image: '',
    type: tipoPorCategoria[i.categoria] ?? 'house',
    status: 'available',
    categoria: i.categoria,
    operacion: i.operacion,
    cocheras: i.cocheras ?? 0,
    superficieConstruida: i.superficieConstruida ?? undefined,
    anoConstruccion: i.anoConstruccion,
    codigoInmueble: i.codigoInmueble,
    descripcion: i.descripcion,
  }
}

export function InteractiveMap() {
  const router = useRouter()
  const searchParams = useSearchParams()

  // Datos reales (inmuebles geolocalizados)
  const [allProperties, setAllProperties] = useState<Property[]>([])

  // Estado de carga progresiva (barra de progreso)
  const [isLoading, setIsLoading] = useState(true)
  const [loadedCount, setLoadedCount] = useState(0)
  const [totalCount, setTotalCount] = useState(0)

  // Cargar inmuebles reales por LOTES + aplicar filtros iniciales desde la URL (?tipo=&operacion=)
  useEffect(() => {
    let cancelled = false
    const CHUNK = 250

    // Pre-filtrar por parámetros de la URL (desde home-filtros)
    const tipoParam = searchParams.get('tipo')
    const operacionParam = searchParams.get('operacion')

    let categoriaInicial = ''
    let operacionInicial = ''

    if (operacionParam && operacionParam !== 'todos' && operacionParam !== '__none__') {
      operacionInicial = operacionParam.toUpperCase()
    }
    if (tipoParam && tipoParam !== 'todos' && tipoParam !== '__none__') {
      const categoriaEnum = {
        casa: 'CASA',
        departamento: 'DEPARTAMENTO',
        terreno: 'TERRENO',
        local: 'LOCAL_COMERCIAL',
        oficina: 'OFICINA',
        galpon: 'GALPON',
      }[tipoParam]
      if (categoriaEnum) {
        categoriaInicial = categoriaEnum
      }
    }

    async function loadAll() {
      let page = 1
      const acumulados: InmuebleDTO[] = []

      while (true) {
        try {
          const res = await listInmueblesPublicAction(page, CHUNK)
          if (cancelled) return
          if (!res.success || !res.data) break

          // Total conocido desde la primera petición
          setTotalCount(res.total)
          acumulados.push(...res.data)
          setLoadedCount(acumulados.length)

          // Aplicar filtros de URL sobre lo acumulado (markers visibles poco a poco)
          const visibles = acumulados.filter((i) => {
            if (operacionInicial && i.operacion !== operacionInicial) return false
            if (categoriaInicial && i.categoria !== categoriaInicial) return false
            return true
          })
          setAllProperties(acumulados.map(mapInmuebleToProperty))
          setFilteredProperties(visibles.map(mapInmuebleToProperty))

          // Última página: lote menor al tamaño del chunk
          if (res.data.length < CHUNK) break
          page++
        } catch (err) {
          console.error('Error cargando inmuebles para el mapa:', err)
          break
        }
      }

      if (cancelled) return
      setFilters({ categoria: categoriaInicial, operacion: operacionInicial })
      // Pequeña pausa para que el usuario perciba el 100%
      setTimeout(() => { if (!cancelled) setIsLoading(false) }, 350)
    }

    loadAll()
    return () => { cancelled = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // View Mode
  const [viewMode, setViewMode] = useState<ViewMode>("desktop")

  // Tipo de vista del mapa (calle / satélite)
  const [mapType, setMapType] = useState<MapType>("street")

  const handleToggleMapType = () => {
    setMapType((prev) => (prev === "street" ? "satellite" : "street"))
  }

  // Radar State
  const [isRadarModeActive, setIsRadarModeActive] = useState(false)
  const [isRadarConfiguring, setIsRadarConfiguring] = useState(false) // Nuevo: radar visible, configurando tamaño
  const [radarCenter, setRadarCenter] = useState<[number, number] | null>(null)
  const [radarRadius, setRadarRadius] = useState(100) // metros - cambiado a 100m como inicial
  const [radarResults, setRadarResults] = useState<Property[]>([])

  // Filters State
  const [isLeftSidebarOpen, setIsLeftSidebarOpen] = useState(false)
  const [isRightSidebarOpen, setIsRightSidebarOpen] = useState(false)
  const [filters, setFilters] = useState<FilterState>({
    categoria: '',
    operacion: '',
  })

  // Property selection
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null)
  const [detailProperty, setDetailProperty] = useState<Property | null>(null)
  const [filteredProperties, setFilteredProperties] = useState<Property[]>([])

  // Mi ubicación (punto azul)
  const [userLocation, setUserLocation] = useState<UserLocation | null>(null)

  // Detectar view mode
  useEffect(() => {
    const checkViewMode = () => {
      setViewMode(window.innerWidth < 768 ? "mobile" : "desktop")
    }

    checkViewMode()
    window.addEventListener("resize", checkViewMode)

    return () => window.removeEventListener("resize", checkViewMode)
  }, [])

  // Center y zoom - Bolivia completo
  const center: [number, number] = [-17.5, -65.0]
  const zoom = 7

  // Handlers
  const handleLocationFound = () => {
    // Reservado para futuras acciones al encontrar una dirección
  }

  const handleToggleFilters = () => {
    setIsLeftSidebarOpen(!isLeftSidebarOpen)
  }

  const handleClearRadar = () => {
    setIsRadarModeActive(false)
    setIsRadarConfiguring(false)
    setRadarCenter(null)
    setRadarResults([])
    setIsRightSidebarOpen(false)
    setRadarRadius(100)
  }

  const handleRadarButtonClick = () => {
    if (radarCenter || isRadarModeActive || isRadarConfiguring) {
      handleClearRadar()
    } else {
      setIsRadarModeActive(true)
      setIsRadarConfiguring(false)
      setIsLeftSidebarOpen(false)
      setIsRightSidebarOpen(false)
    }
  }

  const handleUserLocation = (lat: number, lng: number, accuracy: number) => {
    setUserLocation({ lat, lng, accuracy })
  }

  const handleRadarMapClick = (lat: number, lng: number) => {
    setRadarCenter([lat, lng])
    setIsRadarModeActive(false)
    setIsRadarConfiguring(true) // Activar modo configuración
    setIsRightSidebarOpen(false) // Cerrar sidebar si estaba abierto
    // NO buscar automáticamente - esperar a que usuario ajuste y confirme
  }

  const handleRadarSearch = () => {
    if (!radarCenter) return

    const [lat, lng] = radarCenter
    const tempResults = allProperties.filter((property) => {
      const distance = L.latLng(property.lat, property.lng).distanceTo([lat, lng])
      return distance <= radarRadius
    })

    setRadarResults(tempResults)
    setIsRadarConfiguring(false) // Salir del modo configuración
    setIsRightSidebarOpen(true) // Abrir sidebar con resultados
  }

  const handleRadarCancel = () => {
    setIsRadarConfiguring(false)
    setRadarCenter(null)
    setRadarRadius(100) // Resetear a valor inicial
  }

  const handleRadarRadiusChange = (newRadius: number) => {
    setRadarRadius(newRadius)

    // Si estamos en modo configuración, no actualizar resultados aún
    if (isRadarConfiguring) return

    // Solo actualizar resultados si el sidebar está abierto
    if (radarCenter && isRightSidebarOpen) {
      const [lat, lng] = radarCenter
      const newResults = allProperties.filter((property) => {
        const distance = L.latLng(property.lat, property.lng).distanceTo([lat, lng])
        return distance <= newRadius
      })
      setRadarResults(newResults)
    }
  }

  const handleRightSidebarClose = () => {
    setIsRightSidebarOpen(false)
    // NO borrar el radar - mantener persistencia
    // setRadarCenter(null) // Comentado - mantener el radar
    // setRadarRadius(1000) // Comentado - mantener el tamaño
    // setRadarResults([]) // Comentado - mantener resultados
  }

  const handleFiltersChange = (newFilters: FilterState) => {
    setFilters(newFilters)
  }

  const handleApplyFilters = () => {
    let results = [...allProperties]

    if (filters.categoria) {
      results = results.filter((p) => p.categoria === filters.categoria)
    }

    if (filters.operacion) {
      results = results.filter((p) => p.operacion === filters.operacion)
    }

    setFilteredProperties(results)
    // Cerrar el panel al instante para que se reflejen los markers en el mapa
    setIsLeftSidebarOpen(false)
  }

  const handleGoHome = () => {
    router.push('/home')
  }

  const radarActive = !!(radarCenter || isRadarModeActive || isRadarConfiguring)

  return (
    <div className="relative w-full h-screen overflow-hidden bg-[#0f172a]">
      {/* Overlay de carga progresiva */}
      {isLoading && (
        <div className="absolute inset-0 z-[2000] flex items-center justify-center bg-[#0f172a]/95 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-slate-700/50 bg-card p-6 shadow-2xl sm:p-8">
            <div className="mb-5 flex items-center gap-3">
              <div className="h-10 w-10 flex-shrink-0 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" />
              <div className="min-w-0">
                <h3 className="text-base font-bold text-white">Cargando propiedades</h3>
                <p className="truncate text-xs text-slate-400">Preparando el mapa interactivo…</p>
              </div>
            </div>

            <div className="mb-2 h-3 w-full overflow-hidden rounded-full bg-slate-700/60">
              <div
                className="h-full rounded-full bg-gradient-to-r from-blue-500 to-cyan-500 transition-all duration-300 ease-out"
                style={{
                  width: `${totalCount > 0 ? Math.min(100, (loadedCount / totalCount) * 100) : 0}%`,
                }}
              />
            </div>

            <div className="flex justify-between text-xs font-semibold text-slate-300">
              <span>{totalCount > 0 ? `${loadedCount} de ${totalCount} propiedades` : 'Iniciando…'}</span>
              <span className="text-blue-400">
                {totalCount > 0 ? `${Math.round(Math.min(100, (loadedCount / totalCount) * 100))}%` : ''}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Map Container */}
      <MapContainer
        center={center}
        zoom={zoom}
        className="w-full h-screen"
        zoomControl={false}
        style={{ background: '#0f172a' }}
      >
        <MapContent
          viewMode={viewMode}
          mapType={mapType}
          onToggleMapType={handleToggleMapType}
          onLocationFound={handleLocationFound}
          onToggleFilters={handleToggleFilters}
          onRadarClick={handleRadarButtonClick}
          radarActive={radarActive}
          isRadarModeActive={isRadarModeActive}
          isRadarConfiguring={isRadarConfiguring}
          onRadarMapClick={handleRadarMapClick}
          propertyCount={filteredProperties.length}
          onGoHome={handleGoHome}
          onUserLocation={handleUserLocation}
          userLocation={userLocation}
          properties={filteredProperties}
          setSelectedProperty={setSelectedProperty}
          onOpenDetail={setDetailProperty}
        />

        {/* Círculo del Radar */}
        {radarCenter && (
          <>
            <RadarCircle center={radarCenter} radius={radarRadius} />
            {/* Marcador Draggable del Centro del Radar */}
            <RadarDragMarker
              position={radarCenter}
              onDrag={(lat, lng) => {
                setRadarCenter([lat, lng])
                // Actualizar resultados si el sidebar está abierto
                if (isRightSidebarOpen) {
                  const tempResults = allProperties.filter((property) => {
                    const distance = L.latLng(property.lat, property.lng).distanceTo([lat, lng])
                    return distance <= radarRadius
                  })
                  setRadarResults(tempResults)
                }
              }}
              isRadarConfiguring={isRadarConfiguring}
            />
          </>
        )}
      </MapContainer>

      {/* Tooltip de activación del Radar */}
      <RadarTooltip isVisible={isRadarModeActive} />

      {/* Control Flotante de Tamaño del Radar */}
      {isRadarConfiguring && !isRightSidebarOpen && (
        <RadarSizeControl
          radarRadius={radarRadius}
          onRadiusChange={handleRadarRadiusChange}
          onSearch={handleRadarSearch}
          onCancel={handleRadarCancel}
        />
      )}

      {/* Sidebar Izquierdo - Filtros */}
      <SidebarLeftFilters
        isOpen={isLeftSidebarOpen}
        onClose={() => setIsLeftSidebarOpen(false)}
        filters={filters}
        onFiltersChange={handleFiltersChange}
        onApply={handleApplyFilters}
      />

      {/* Sidebar Derecho - Resultados Radar */}
      <SidebarRightRadar
        isOpen={isRightSidebarOpen}
        onClose={handleRightSidebarClose}
        results={radarResults}
        onReconfigureRadar={() => setIsRadarConfiguring(true)}
      />

      {/* Modal de detalle de propiedad */}
      <PropertyDetailModal property={detailProperty} onClose={() => setDetailProperty(null)} />

      {/* Estilos globales */}
      <style jsx global>{`
        /* Reset de Leaflet */
        .leaflet-container {
          background: #0f172a !important;
          font-family: system-ui, -apple-system, sans-serif;
        }

        .leaflet-popup-content-wrapper {
          padding: 0;
          border-radius: 0.75rem;
          background: #1e293b;
          border: 1px solid rgba(51, 65, 85, 0.5);
          box-shadow: 0 12px 32px rgba(0, 0, 0, 0.55);
          color: #f1f5f9;
        }

        .leaflet-popup-tip {
          background: #1e293b;
          border: 1px solid rgba(51, 65, 85, 0.5);
        }

        .leaflet-popup-content {
          margin: 0;
        }

        /* Ocultar botón de cerrar por defecto de Leaflet (la mini-tarjeta usa su propio CTA) */
        .leaflet-popup-close-button {
          display: none !important;
        }

        /* Clusters personalizados */
        .custom-cluster-icon {
          background: transparent;
          border: none;
        }

        .marker-cluster {
          background: transparent;
          border: none;
        }

        .marker-cluster span {
          background: transparent;
          border: none;
        }

        /* Mi ubicación - punto azul estilo Google Maps */
        .user-location-dot {
          background: transparent;
          border: none;
        }
        .uld {
          position: relative;
          width: 22px;
          height: 22px;
        }
        .uld-core {
          position: absolute;
          top: 4px;
          left: 4px;
          width: 14px;
          height: 14px;
          border-radius: 50%;
          background: #1d4ed8;
          border: 3px solid white;
          box-shadow: 0 0 8px rgba(37, 99, 235, 0.8);
          z-index: 2;
        }
        .uld-pulse {
          position: absolute;
          inset: 0;
          border-radius: 50%;
          background: rgba(37, 99, 235, 0.35);
          animation: uld-pulse 2s ease-out infinite;
          z-index: 1;
        }
        @keyframes uld-pulse {
          0% { transform: scale(0.6); opacity: 0.8; }
          100% { transform: scale(2.2); opacity: 0; }
        }

        /* Scrollbar personalizado */
        ::-webkit-scrollbar {
          width: 8px;
          height: 8px;
        }

        ::-webkit-scrollbar-track {
          background: #e5e7eb;
          border-radius: 4px;
        }

        ::-webkit-scrollbar-thumb {
          background: #9ca3af;
          border-radius: 4px;
        }

        ::-webkit-scrollbar-thumb:hover {
          background: #6b7280;
        }

        /* Animación del borde-3 */
        .border-3 {
          border-width: 3px;
        }
      `}</style>
    </div>
  )
}
