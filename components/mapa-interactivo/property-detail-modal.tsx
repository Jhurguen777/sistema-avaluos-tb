"use client"

import { useEffect } from "react"
import {
  X,
  Bed,
  Bath,
  Car,
  Maximize,
  MapPin,
  Calendar,
  Building2,
  Tag,
  Hash,
  Home,
  type LucideIcon,
} from "lucide-react"
import { cn } from "@/lib/utils"
import type { Property } from "./mock-data"

interface PropertyDetailModalProps {
  property: Property | null
  onClose: () => void
}

/** Placeholder oscuro elegante para cuando no hay fotos (sin inventar imágenes). */
function PhotoPlaceholder({ className = "", small = false }: { className?: string; small?: boolean }) {
  return (
    <div
      className={cn(
        "relative flex flex-col items-center justify-center overflow-hidden",
        "bg-gradient-to-br from-slate-800 to-slate-900",
        className
      )}
    >
      <div className="pointer-events-none absolute inset-0 opacity-30 bg-[radial-gradient(circle_at_30%_20%,rgba(59,130,246,0.15),transparent_60%)]" />
      <Home className={cn("relative text-slate-600", small ? "w-5 h-5" : "w-10 h-10")} strokeWidth={1.5} />
      {!small && (
        <span className="relative mt-1.5 text-[10px] font-medium uppercase tracking-widest text-slate-500">
          Sin fotos
        </span>
      )}
    </div>
  )
}

function StatCard({ icon: Icon, value, label }: { icon: LucideIcon; value: number | string; label: string }) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-slate-700/50 bg-slate-800/40 px-4 py-3 backdrop-blur-sm transition-colors hover:border-slate-600/60">
      <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-slate-900/60">
        <Icon className="h-[18px] w-[18px] text-blue-400" strokeWidth={1.8} />
      </div>
      <div className="min-w-0">
        <div className="text-sm font-bold leading-tight text-white">{value}</div>
        <div className="text-[11px] font-medium uppercase tracking-wide text-slate-400">{label}</div>
      </div>
    </div>
  )
}

function FeatureRow({ icon: Icon, label, value }: { icon: LucideIcon; label: string; value: string }) {
  return (
    <div className="flex items-center justify-between border-b border-slate-700/40 py-2.5 last:border-0">
      <div className="flex items-center gap-2.5 text-sm text-slate-400">
        <Icon className="h-4 w-4 text-slate-500" strokeWidth={1.8} />
        <span>{label}</span>
      </div>
      <span className="text-sm font-semibold text-slate-200">{value}</span>
    </div>
  )
}

const CATEGORIA_LABEL: Record<string, string> = {
  CASA: "Casa",
  DEPARTAMENTO: "Departamento",
  TERRENO: "Terreno",
  LOCAL_COMERCIAL: "Local comercial",
  OFICINA: "Oficina",
  QUINTA: "Quinta",
}

const OPERACION_LABEL: Record<string, string> = {
  VENTA: "Venta",
  ALQUILER: "Alquiler",
  ANTICRETICO: "Anticrético",
}

export function PropertyDetailModal({ property, onClose }: PropertyDetailModalProps) {
  // Cerrar con ESC + bloquear scroll del body
  useEffect(() => {
    if (!property) return
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
    }
    document.addEventListener("keydown", handleEsc)
    const prev = document.body.style.overflow
    document.body.style.overflow = "hidden"
    return () => {
      document.removeEventListener("keydown", handleEsc)
      document.body.style.overflow = prev
    }
  }, [property, onClose])

  if (!property) return null

  const areaPrincipal = property.superficieConstruida ?? property.area ?? 0
  const categoriaLabel = property.categoria ? CATEGORIA_LABEL[property.categoria] ?? property.categoria : "—"
  const operacionLabel = property.operacion ? OPERACION_LABEL[property.operacion] ?? property.operacion : "—"

  // Descripción: usa la real si existe, sino sintetiza una neutral con los datos disponibles
  const descripcion =
    property.descripcion?.trim() ||
    `${categoriaLabel} en ${operacionLabel.toLowerCase()} ubicada en ${property.address || "zona solicitada"}.` +
      (property.bedrooms > 0 ? ` ${property.bedrooms} habitaciones,` : "") +
      (property.bathrooms > 0 ? ` ${property.bathrooms} baños,` : "") +
      (areaPrincipal > 0 ? ` ${areaPrincipal} m².` : "")

  return (
    <div
      className="fixed inset-0 z-[3000] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm sm:p-6"
      onClick={onClose}
    >
      <div
        className="animate-fadeIn relative flex max-h-[88vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl border border-slate-700/50 bg-card shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Botón cerrar */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 z-10 flex h-9 w-9 items-center justify-center rounded-full border border-slate-700/60 bg-slate-800/80 text-slate-300 shadow-lg backdrop-blur transition-colors hover:bg-slate-700 hover:text-white"
          aria-label="Cerrar"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Contenido scrolleable */}
        <div className="overflow-y-auto">
          {/* ===== Galería (placeholders) ===== */}
          <div className="grid grid-cols-1 gap-1.5 p-1.5 sm:grid-cols-[3fr_2fr]">
            <PhotoPlaceholder className="h-44 w-full rounded-xl sm:h-72" />
            <div className="grid grid-cols-2 gap-1.5">
              <PhotoPlaceholder className="h-[86px] w-full rounded-lg sm:h-[137px]" small />
              <PhotoPlaceholder className="h-[86px] w-full rounded-lg sm:h-[137px]" small />
              <PhotoPlaceholder className="h-[86px] w-full rounded-lg sm:h-[137px]" small />
              <PhotoPlaceholder className="h-[86px] w-full rounded-lg sm:h-[137px]" small />
            </div>
          </div>

          {/* ===== Body ===== */}
          <div className="space-y-6 p-5 sm:p-7">
            {/* Encabezado: título + ubicación + precio */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0">
                <span className="inline-block rounded-full border border-slate-700/60 bg-slate-800/60 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-blue-400">
                  {operacionLabel} · {categoriaLabel}
                </span>
                <h2 className="mt-2 text-xl font-bold leading-tight text-white sm:text-2xl">{property.title}</h2>
                <p className="mt-1.5 flex items-start gap-1.5 text-sm text-slate-400">
                  <MapPin className="mt-0.5 h-4 w-4 flex-shrink-0 text-slate-500" strokeWidth={1.8} />
                  <span className="truncate">{property.address || "Sin dirección"}</span>
                </p>
              </div>
              <div className="flex-shrink-0 sm:text-right">
                <div className="text-[11px] font-medium uppercase tracking-wide text-slate-500">Precio</div>
                <div className="bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-2xl font-extrabold text-transparent sm:text-3xl">
                  US$ {property.price.toLocaleString("es-BO")}
                </div>
              </div>
            </div>

            {/* Panel de iconos clave */}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <StatCard icon={Bed} value={property.bedrooms || "—"} label="Habitaciones" />
              <StatCard icon={Bath} value={property.bathrooms || "—"} label="Baños" />
              <StatCard icon={Car} value={property.cocheras ?? "—"} label="Cocheras" />
              <StatCard icon={Maximize} value={areaPrincipal > 0 ? `${areaPrincipal} m²` : "—"} label="Superficie" />
            </div>

            {/* Descripción + características */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-[3fr_2fr]">
              {/* Descripción */}
              <div>
                <h3 className="mb-2 text-sm font-bold uppercase tracking-wide text-slate-400">Descripción</h3>
                <p className="text-sm leading-relaxed text-slate-300">{descripcion}</p>
              </div>

              {/* Características */}
              <div className="rounded-xl border border-slate-700/50 bg-slate-800/30 px-4 py-2">
                <h3 className="mb-1 text-sm font-bold uppercase tracking-wide text-slate-400">Características</h3>
                <FeatureRow icon={Tag} label="Operación" value={operacionLabel} />
                <FeatureRow icon={Building2} label="Categoría" value={categoriaLabel} />
                <FeatureRow
                  icon={Calendar}
                  label="Año construcción"
                  value={property.anoConstruccion ? String(property.anoConstruccion) : "—"}
                />
                <FeatureRow
                  icon={MapPin}
                  label="Coordenadas"
                  value={`${property.lat.toFixed(5)}, ${property.lng.toFixed(5)}`}
                />
                {property.codigoInmueble && (
                  <FeatureRow icon={Hash} label="Código" value={property.codigoInmueble} />
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
