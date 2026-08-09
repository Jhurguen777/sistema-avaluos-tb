"use client"

/**
 * SearchBar con Nominatim API (OpenStreetMap)
 * Búsqueda de direcciones y lugares con autocompletado 100% gratuito
 * Optimizado para desktop y móvil
 */

import { useState, useCallback, useEffect, useRef } from "react"
import { Search, Loader2, MapPin, X, Clock } from "lucide-react"
import L from "leaflet"

// ============================================================================
// TIPOS
// ============================================================================

export interface NominatimResult {
  place_id: number
  licence: string
  osm_type: string
  osm_id: number
  lat: string
  lon: string
  display_name: string
  address: {
    city?: string
    town?: string
    village?: string
    state?: string
    country?: string
    road?: string
    house_number?: string
    postcode?: string
  }
  boundingbox?: [string, string, string, string]
}

export interface SearchBarProps {
  onLocationFound?: (lat: number, lon: number, result: NominatimResult) => void
  placeholder?: string
  className?: string
  map?: L.Map | null
}

// ============================================================================
// CONFIGURACIÓN
// ============================================================================

const NOMINATIM_API = "https://nominatim.openstreetmap.org"
const SEARCH_DEBOUNCE_MS = 500
const MIN_SEARCH_LENGTH = 3
const MAX_RESULTS = 5

// ============================================================================
// UTILIDADES
// ============================================================================

function formatDisplayName(result: NominatimResult): string {
  const { address } = result
  const parts: string[] = []

  if (address.road) {
    parts.push(address.road)
    if (address.house_number) {
      parts[parts.length - 1] += ` ${address.house_number}`
    }
  }

  if (address.city || address.town || address.village) {
    parts.push(address.city || address.town || address.village!)
  }

  if (address.state && address.state !== "Bolivia") {
    parts.push(address.state)
  }

  if (address.country && address.country !== "Bolivia") {
    parts.push(address.country)
  }

  return parts.length > 0 ? parts.join(", ") : result.display_name.split(",")[0]
}

// ============================================================================
// SEARCHBAR COMPONENT
// ============================================================================

export function SearchBar({
  onLocationFound,
  placeholder = "Buscar dirección, ciudad o lugar...",
  className = "",
  map
}: SearchBarProps) {
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<NominatimResult[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [showResults, setShowResults] = useState(false)
  const [recentSearches, setRecentSearches] = useState<string[]>([])
  const [error, setError] = useState<string | null>(null)

  const searchRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const debounceRef = useRef<NodeJS.Timeout | undefined>(undefined)

  // Cargar búsquedas recientes
  useEffect(() => {
    try {
      const stored = localStorage.getItem("mapa-recent-searches")
      if (stored) {
        setRecentSearches(JSON.parse(stored))
      }
    } catch (e) {
      console.error("Error loading recent searches:", e)
    }
  }, [])

  const saveToRecent = (displayName: string) => {
    const updated = [displayName, ...recentSearches.filter(s => s !== displayName)].slice(0, 5)
    setRecentSearches(updated)
    try {
      localStorage.setItem("mapa-recent-searches", JSON.stringify(updated))
    } catch (e) {
      console.error("Error saving recent searches:", e)
    }
  }

  const searchPlaces = useCallback(async (searchQuery: string) => {
    if (searchQuery.length < MIN_SEARCH_LENGTH) {
      setResults([])
      setShowResults(false)
      return
    }

    setIsSearching(true)
    setError(null)

    try {
      const params = new URLSearchParams({
        q: `${searchQuery}, Bolivia`,
        format: "json",
        addressdetails: "1",
        limit: MAX_RESULTS.toString(),
        "accept-language": "es"
      })

      const response = await fetch(
        `${NOMINATIM_API}/search?${params.toString()}`,
        {
          headers: {
            "User-Agent": "GeoPricer-Avaluos"
          }
        }
      )

      if (!response.ok) {
        throw new Error(`Error ${response.status}`)
      }

      const data: NominatimResult[] = await response.json()

      setResults(data)
      setShowResults(data.length > 0)

      if (data.length === 0) {
        setError("No se encontraron resultados")
      }
    } catch (err) {
      console.error("Error searching places:", err)
      setError("Error al buscar. Intenta nuevamente.")
      setResults([])
    } finally {
      setIsSearching(false)
    }
  }, [])

  const handleQueryChange = (value: string) => {
    setQuery(value)
    setError(null)

    if (debounceRef.current) {
      clearTimeout(debounceRef.current)
    }

    if (value.length >= MIN_SEARCH_LENGTH || value.length === 0) {
      debounceRef.current = setTimeout(() => {
        searchPlaces(value)
      }, SEARCH_DEBOUNCE_MS)
    } else {
      setResults([])
      setShowResults(false)
    }
  }

  const selectResult = (result: NominatimResult) => {
    const lat = parseFloat(result.lat)
    const lon = parseFloat(result.lon)
    const displayName = formatDisplayName(result)

    setQuery(displayName)
    setShowResults(false)
    setResults([])
    saveToRecent(displayName)

    if (map) {
      if (result.boundingbox) {
        const bbox = result.boundingbox
        const southWest = L.latLng(parseFloat(bbox[0]), parseFloat(bbox[2]))
        const northEast = L.latLng(parseFloat(bbox[1]), parseFloat(bbox[3]))
        const bounds = L.latLngBounds(southWest, northEast)
        map.fitBounds(bounds, { padding: [50, 50] })
      } else {
        map.setView([lat, lon], 15)
      }
    }

    if (onLocationFound) {
      onLocationFound(lat, lon, result)
    }
  }

  const selectRecent = (searchTerm: string) => {
    setQuery(searchTerm)
    searchPlaces(searchTerm)
  }

  const clearSearch = () => {
    setQuery("")
    setResults([])
    setShowResults(false)
    setError(null)
    inputRef.current?.focus()
  }

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowResults(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  return (
    <div ref={searchRef} className={`relative w-full ${className}`}>
      {/* Input de búsqueda */}
      <div className="relative flex items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => handleQueryChange(e.target.value)}
            onFocus={() => {
              if (results.length > 0 || recentSearches.length > 0) {
                setShowResults(true)
              }
            }}
            placeholder={placeholder}
            className="w-full pl-12 pr-12 py-3 bg-white/95 backdrop-blur border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-lg text-sm"
          />
          {query && (
            <button
              onClick={clearSearch}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
        {isSearching && (
          <Loader2 className="absolute right-12 top-1/2 -translate-y-1/2 w-5 h-5 text-blue-500 animate-spin pointer-events-none" />
        )}
      </div>

      {/* Resultados de búsqueda */}
      {showResults && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white/95 backdrop-blur rounded-xl shadow-2xl border border-gray-100 overflow-hidden z-[3000] max-h-80 overflow-y-auto">
          {/* Búsquedas recientes */}
          {!isSearching && results.length === 0 && recentSearches.length > 0 && (
            <div className="p-2">
              <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-2">
                <Clock className="w-3 h-3" />
                Recientes
              </div>
              {recentSearches.map((term, idx) => (
                <button
                  key={idx}
                  onClick={() => selectRecent(term)}
                  className="w-full px-3 py-2.5 text-left text-sm text-gray-700 hover:bg-blue-50 rounded-lg transition-colors flex items-center gap-2"
                >
                  <Clock className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  <span className="truncate">{term}</span>
                </button>
              ))}
            </div>
          )}

          {/* Resultados de Nominatim */}
          {!isSearching && results.length > 0 && (
            <div className="p-2">
              <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Resultados
              </div>
              {results.map((result) => (
                <button
                  key={result.place_id}
                  onClick={() => selectResult(result)}
                  className="w-full px-3 py-3 text-left hover:bg-blue-50 rounded-lg transition-colors group"
                >
                  <div className="flex items-start gap-3">
                    <MapPin className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-gray-900 truncate">
                        {formatDisplayName(result)}
                      </div>
                      <div className="text-xs text-gray-500 truncate mt-0.5">
                        {[result.address.city, result.address.town, result.address.village].filter(Boolean)[0]}
                        {result.address.state && `, ${result.address.state}`}
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* Mensaje de error */}
          {error && (
            <div className="p-4 text-sm text-amber-600 bg-amber-50">
              {error}
            </div>
          )}

          {/* Estado vacío */}
          {!isSearching && results.length === 0 && query.length >= MIN_SEARCH_LENGTH && !error && (
            <div className="p-4 text-sm text-gray-500 text-center">
              No se encontraron resultados para "{query}"
            </div>
          )}

          {/* Mensaje de búsqueda corta */}
          {!isSearching && query.length > 0 && query.length < MIN_SEARCH_LENGTH && (
            <div className="p-4 text-sm text-gray-500 text-center">
              Escribe al menos {MIN_SEARCH_LENGTH} caracteres...
            </div>
          )}
        </div>
      )}

      {/* Scrollbar personalizado */}
      <style jsx>{`
        div::-webkit-scrollbar {
          width: 6px;
        }
        div::-webkit-scrollbar-track {
          background: #f1f1f1;
          border-radius: 3px;
        }
        div::-webkit-scrollbar-thumb {
          background: #c1c1c1;
          border-radius: 3px;
        }
        div::-webkit-scrollbar-thumb:hover {
          background: #a1a1a1;
        }
      `}</style>
    </div>
  )
}
