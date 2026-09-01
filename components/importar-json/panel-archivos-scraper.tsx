"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import {
  listarArchivosScraperAction,
  leerJsonScraperAction,
} from "@/modules/importacion/actions"
import type { GrupoScraper } from "@/modules/importacion/services/archivos-scraper-service"
import { Button } from "@/components/ui/button"
import { toast } from "@/components/ui/use-toast"
import { cn } from "@/lib/utils"
import {
  X,
  FolderOpen,
  RefreshCw,
  Loader2,
  FileJson,
  Inbox,
  Building2,
  ChevronLeft,
  Folder,
} from "lucide-react"

/** Metadatos visuales por grupo (fuente) */
const GRUPO_META: Record<
  GrupoScraper["fuente"],
  { label: string; icono: string; borde: string }
> = {
  C21: { label: "Century 21", icono: "text-[#FAB90E]", borde: "hover:border-[#FAB90E]/50" },
  REMAX: { label: "RE/MAX", icono: "text-red-400", borde: "hover:border-red-400/50" },
  OTRO: { label: "Otros", icono: "text-slate-500", borde: "hover:border-slate-600" },
}

/** Resultado de seleccionar un JSON del panel */
export interface SeleccionJsonScraper {
  nombre: string
  total: number
  datos: unknown
}

interface PanelArchivosScraperProps {
  abierto: boolean
  onCerrar: () => void
  onSeleccionar: (seleccion: SeleccionJsonScraper) => void
}

/** Formatea bytes a una unidad legible */
function formatearTamano(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

/**
 * Panel lateral (drawer derecho) que lista las carpetas y JSONs generados
 * por el módulo scraper en scraper-output/, para importarlos directamente
 * sin subir un archivo desde el PC.
 */
export function PanelArchivosScraper({
  abierto,
  onCerrar,
  onSeleccionar,
}: PanelArchivosScraperProps) {
  const [cargando, setCargando] = useState(false)
  const [leyendo, setLeyendo] = useState<string | null>(null)
  const [grupos, setGrupos] = useState<GrupoScraper[] | null>(null)
  const [grupoActivo, setGrupoActivo] = useState<GrupoScraper["fuente"] | null>(null)

  /** Grupo actualmente abierto (null si se closed/limpió la lista) */
  const grupoVisible = useMemo(
    () => grupos?.find((g) => g.fuente === grupoActivo) ?? null,
    [grupos, grupoActivo],
  )

  const cargar = useCallback(async () => {
    setCargando(true)
    try {
      const r = await listarArchivosScraperAction()
      if (r.success && r.data) {
        setGrupos(r.data)
      } else {
        toast.error("Error al listar", r.error || "No se pudieron listar los archivos")
      }
    } finally {
      setCargando(false)
    }
  }, [])

  // Cargar la lista al abrir el panel (setState solo dentro de callbacks async)
  useEffect(() => {
    if (!abierto) return
    let cancelado = false
    listarArchivosScraperAction()
      .then((r) => {
        if (cancelado) return
        if (r.success && r.data) {
          setGrupos(r.data)
          setGrupoActivo(null) // abrir siempre en la vista de carpetas madre
        } else {
          toast.error("Error al listar", r.error || "No se pudieron listar los archivos")
        }
      })
      .catch((err) => {
        console.error("Error listando archivos del scraper:", err)
      })
    return () => {
      cancelado = true
    }
  }, [abierto])

  const seleccionar = useCallback(
    async (rutaRelativa: string) => {
      setLeyendo(rutaRelativa)
      try {
        const r = await leerJsonScraperAction(rutaRelativa)
        if (r.success && r.data) {
          onSeleccionar({ nombre: r.data.nombre, total: r.data.total, datos: r.data.datos })
          onCerrar()
        } else {
          toast.error("Error al leer", r.error || "No se pudo leer el archivo")
        }
      } catch (err) {
        console.error("Error leyendo JSON del scraper:", err)
        toast.error("Error inesperado", "No se pudo leer el archivo.")
      } finally {
        setLeyendo(null)
      }
    },
    [onCerrar, onSeleccionar],
  )

  return (
    <>
      {/* Backdrop */}
      {abierto && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 transition-opacity"
          onClick={onCerrar}
          aria-hidden="true"
        />
      )}

      {/* Drawer derecho */}
      <aside
        className={cn(
          "fixed inset-y-0 right-0 z-50 w-full sm:w-[420px] bg-card border-l border-slate-800",
          "shadow-2xl transition-transform duration-300 ease-in-out flex flex-col",
          abierto ? "translate-x-0" : "translate-x-full",
        )}
        aria-hidden={!abierto}
      >
        {/* Header del panel */}
        <div className="flex items-center justify-between p-4 border-b border-slate-800">
          <div className="flex items-center gap-2 min-w-0">
            {grupoVisible ? (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 shrink-0 text-slate-400 hover:text-white"
                onClick={() => setGrupoActivo(null)}
                aria-label="Volver a las carpetas madre"
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
            ) : (
              <FolderOpen className="w-5 h-5 text-[#FAB90E] shrink-0" />
            )}
            <h2 className="text-sm font-semibold text-white truncate">
              {grupoVisible ? GRUPO_META[grupoVisible.fuente].label : "Archivos del scraper"}
            </h2>
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-slate-400 hover:text-white"
              onClick={cargar}
              disabled={cargando}
              aria-label="Refrescar"
            >
              <RefreshCw className={cn("w-4 h-4", cargando && "animate-spin")} />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-slate-400 hover:text-white"
              onClick={onCerrar}
              aria-label="Cerrar"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Contenido scrolleable */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {abierto && grupos === null ? (
            <div className="flex items-center justify-center gap-2 py-16 text-slate-400 text-sm">
              <Loader2 className="w-4 h-4 animate-spin" />
              Cargando archivos...
            </div>
          ) : (grupos?.length ?? 0) === 0 ? (
            <div className="flex flex-col items-center gap-3 py-16 text-center">
              <Inbox className="w-10 h-10 text-slate-600" />
              <p className="text-sm text-slate-400">Aún no hay scrapes generados</p>
              <p className="text-xs text-slate-500 max-w-[260px]">
                Ejecuta el scraper en la pestaña «Scraper» y los JSONs aparecerán aquí.
              </p>
            </div>
          ) : grupoVisible ? (
            // === Vista 2: scrapes dentro de la carpeta madre ===
            grupoVisible.carpetas.map((carpeta) => (
              <div key={carpeta.nombre} className="rounded-lg border border-slate-800 overflow-hidden">
                {/* Cabecera de carpeta */}
                <div className="flex items-center gap-2 px-3 py-2.5 bg-slate-900/70 border-b border-slate-800">
                  <Building2
                    className={cn(
                      "w-4 h-4 shrink-0",
                      carpeta.fuente === "C21"
                        ? "text-[#FAB90E]"
                        : carpeta.fuente === "REMAX"
                          ? "text-red-400"
                          : "text-slate-500",
                    )}
                  />
                  <span className="text-xs font-semibold text-slate-200 truncate">
                    {carpeta.nombre}
                  </span>
                </div>
                {/* Archivos */}
                <div className="divide-y divide-slate-800/60">
                  {carpeta.archivos.map((archivo) => {
                    const leyendoEste = leyendo === archivo.rutaRelativa
                    return (
                      <button
                        key={archivo.rutaRelativa}
                        type="button"
                        disabled={leyendo !== null}
                        onClick={() => seleccionar(archivo.rutaRelativa)}
                        className={cn(
                          "w-full flex items-center gap-3 px-3 py-3 text-left transition-colors",
                          leyendoEste ? "bg-slate-800/60" : "hover:bg-slate-800/40",
                        )}
                      >
                        {leyendoEste ? (
                          <Loader2 className="w-4 h-4 text-[#FAB90E] animate-spin shrink-0" />
                        ) : (
                          <FileJson className="w-4 h-4 text-slate-500 shrink-0" />
                        )}
                        <span className="flex-1 min-w-0">
                          <span className="block text-xs text-slate-200 truncate">
                            {archivo.nombre}
                          </span>
                          <span className="block text-[10px] text-slate-500">
                            {formatearTamano(archivo.tamanoBytes)} ·{" "}
                            {new Date(archivo.modificado).toLocaleString("es-BO", {
                              day: "2-digit",
                              month: "2-digit",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </span>
                      </button>
                    )
                  })}
                </div>
              </div>
            ))
          ) : (
            // === Vista 1: carpetas madre (C21 / REMAX) ===
            grupos!.map((grupo) => {
              const meta = GRUPO_META[grupo.fuente]
              const totalArchivos = grupo.carpetas.reduce((acc, c) => acc + c.archivos.length, 0)
              const ultimo = grupo.carpetas[0]?.archivos[0]?.modificado
              return (
                <button
                  key={grupo.fuente}
                  type="button"
                  onClick={() => setGrupoActivo(grupo.fuente)}
                  className={cn(
                    "w-full flex items-center gap-3 p-4 rounded-lg border border-slate-800 bg-slate-900/40 text-left transition-colors hover:bg-slate-800/40",
                    meta.borde,
                  )}
                >
                  <Folder className={cn("w-8 h-8 shrink-0", meta.icono)} />
                  <span className="flex-1 min-w-0">
                    <span className="block text-sm font-semibold text-slate-100">
                      {meta.label}
                    </span>
                    <span className="block text-[11px] text-slate-500">
                      {grupo.carpetas.length} scrapes · {totalArchivos} JSONs
                      {ultimo
                        ? ` · último ${new Date(ultimo).toLocaleString("es-BO", {
                            day: "2-digit",
                            month: "2-digit",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}`
                        : ""}
                    </span>
                  </span>
                  <ChevronLeft className="w-4 h-4 text-slate-600 rotate-180 shrink-0" />
                </button>
              )
            })
          )}
        </div>

        {/* Footer informativo */}
        <div className="p-4 border-t border-slate-800">
          <p className="text-[11px] text-muted-foreground">
            Al seleccionar un archivo se analizará con el mismo flujo que una subida
            desde tu PC (revisión, selección e importación a la base de datos).
          </p>
        </div>
      </aside>
    </>
  )
}
