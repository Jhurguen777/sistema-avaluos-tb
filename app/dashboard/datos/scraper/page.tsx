"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import Link from "next/link"
import {
  iniciarScrapingAction,
  obtenerEstadoScrapingAction,
  detenerScrapingAction,
} from "@/modules/scraper/actions"
import type {
  ScraperFuente,
  ScraperJobInfo,
  ScraperItemResultado,
} from "@/modules/scraper/types/scraper.types"
import {
  catalogoPorFuente,
  CATEGORIA_CATALOGO_LABELS,
} from "@/modules/scraper/config/urls-catalogo"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { toast } from "@/components/ui/use-toast"
import {
  Globe,
  Play,
  Square,
  Loader2,
  CheckCircle2,
  XCircle,
  Ban,
  Terminal,
  FolderOpen,
  LayoutGrid,
  Link2,
} from "lucide-react"
import { cn } from "@/lib/utils"

/** Intervalo de polling del estado del job (ms) */
const INTERVALO_POLLING = 1500

const FUENTES: Array<{ id: ScraperFuente; label: string }> = [
  { id: "C21", label: "Century 21" },
  { id: "REMAX", label: "RE/MAX" },
]

/** Badge de estado del job */
function EstadoBadge({ estado }: { estado: ScraperJobInfo["estado"] }) {
  const config = {
    EJECUTANDO: { label: "Ejecutando", clase: "bg-blue-900/60 text-blue-300 border-blue-800", icon: Loader2, girar: true },
    COMPLETADO: { label: "Completado", clase: "bg-emerald-900/60 text-emerald-300 border-emerald-800", icon: CheckCircle2, girar: false },
    ERROR: { label: "Con errores", clase: "bg-red-900/60 text-red-300 border-red-800", icon: XCircle, girar: false },
    CANCELADO: { label: "Cancelado", clase: "bg-slate-800 text-slate-300 border-slate-700", icon: Ban, girar: false },
  }[estado]
  const Icon = config.icon
  return (
    <Badge className={cn("border text-xs gap-1.5", config.clase)}>
      <Icon className={cn("w-3 h-3", config.girar && "animate-spin")} />
      {config.label}
    </Badge>
  )
}

/** Icono de estado por item del lote */
function IconoItem({ estado }: { estado: ScraperItemResultado["estado"] }) {
  if (estado === "EJECUTANDO")
    return <Loader2 className="w-3.5 h-3.5 text-blue-400 animate-spin shrink-0" />
  if (estado === "COMPLETADO")
    return <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
  if (estado === "ERROR")
    return <XCircle className="w-3.5 h-3.5 text-red-400 shrink-0" />
  if (estado === "CANCELADO")
    return <Ban className="w-3.5 h-3.5 text-slate-500 shrink-0" />
  return <div className="w-3.5 h-3.5 rounded-full border-2 border-slate-700 shrink-0" />
}

/** Formatea una duración en ms como m:ss */
function formatearDuracion(ms: number): string {
  const seg = Math.round(ms / 1000)
  return `${Math.floor(seg / 60)}m ${String(seg % 60).padStart(2, "0")}s`
}

/** Barra de progreso determinada (estilo descarga) */
function BarraProgreso({ pct, color = "bg-[#FAB90E]" }: { pct: number; color?: string }) {
  return (
    <div className="h-2.5 rounded-full bg-slate-800 overflow-hidden">
      <div
        className={cn("h-full rounded-full transition-all duration-700 ease-out", color)}
        style={{ width: `${Math.min(100, Math.max(0, pct))}%` }}
      />
    </div>
  )
}

/** Barra de progreso indeterminada (aún no se sabe el total de páginas) */
function BarraIndeterminada() {
  return (
    <div className="h-2.5 rounded-full bg-slate-800 overflow-hidden">
      <div className="h-full w-1/3 rounded-full bg-blue-500/60 animate-pulse" />
    </div>
  )
}

export default function ScraperPage() {
  const [fuente, setFuente] = useState<ScraperFuente>("C21")
  const [modo, setModo] = useState<"catalogo" | "custom">("catalogo")
  const [urlCustom, setUrlCustom] = useState("")
  const [seleccion, setSeleccion] = useState<Set<string>>(new Set())
  const [iniciando, setIniciando] = useState(false)
  const [job, setJob] = useState<ScraperJobInfo | null>(null)
  const [ahora, setAhora] = useState(() => Date.now())
  const consolaRef = useRef<HTMLDivElement>(null)

  const ejecutando = job?.estado === "EJECUTANDO"
  const catalogo = useMemo(() => catalogoPorFuente(fuente), [fuente])

  // Reloj de 1s mientras el job corre (para transcurrido/ETA en vivo)
  useEffect(() => {
    if (!ejecutando) return
    const t = setInterval(() => setAhora(Date.now()), 1000)
    return () => clearInterval(t)
  }, [ejecutando])

  /** Cambiar de fuente limpia la selección (los ids no coinciden entre fuentes) */
  const cambiarFuente = (nueva: ScraperFuente) => {
    setFuente(nueva)
    setSeleccion(new Set())
  }

  const toggleItem = (id: string) => {
    setSeleccion((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const marcarTodos = (valor: boolean) => {
    setSeleccion(valor ? new Set(catalogo.map((i) => i.id)) : new Set())
  }

  // Restaurar el último job al montar (p. ej. si el usuario navegó fuera)
  useEffect(() => {
    obtenerEstadoScrapingAction().then((r) => {
      if (r.success && r.data) setJob(r.data)
    })
  }, [])

  // Polling del estado mientras el job está en ejecución
  useEffect(() => {
    if (!ejecutando) return
    const timer = setInterval(async () => {
      const r = await obtenerEstadoScrapingAction(job?.id)
      if (r.success && r.data) {
        setJob(r.data)
      }
    }, INTERVALO_POLLING)
    return () => clearInterval(timer)
  }, [ejecutando, job?.id])

  // Autoscroll de la consola al llegar líneas nuevas
  useEffect(() => {
    const el = consolaRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [job?.logs.length])

  const iniciar = useCallback(async () => {
    setIniciando(true)
    try {
      const input =
        modo === "catalogo"
          ? { catalogo: Array.from(seleccion) }
          : { items: [{ etiqueta: `${fuente} · URL personalizada`, url: urlCustom.trim() }] }
      const r = await iniciarScrapingAction(input)
      if (r.success && r.data) {
        setJob(r.data)
        toast.success(
          "Scraping iniciado",
          r.data.items.length === 1
            ? "Ejecutando 1 URL..."
            : `Ejecutando lote de ${r.data.items.length} URLs en secuencia...`,
        )
      } else {
        toast.error("No se pudo iniciar", r.error || "Error desconocido")
      }
    } catch (err) {
      console.error("Error iniciando scraping:", err)
      toast.error("Error inesperado", "No se pudo iniciar el scraping.")
    } finally {
      setIniciando(false)
    }
  }, [modo, seleccion, fuente, urlCustom])

  const detener = useCallback(async () => {
    if (!job) return
    const r = await detenerScrapingAction(job.id)
    if (!r.success) {
      toast.error("No se pudo detener", r.error || "Error desconocido")
    }
  }, [job])

  const puedeIniciar =
    modo === "catalogo" ? seleccion.size > 0 : urlCustom.trim().length > 10
  const totalSeleccionadas = modo === "catalogo" ? seleccion.size : 1

  // === Progreso estilo descarga (lote + URL actual) ===
  const terminados = job
    ? job.items.filter((i) => i.estado !== "PENDIENTE" && i.estado !== "EJECUTANDO").length
    : 0
  const pctLote = job && job.items.length > 0 ? Math.round((terminados / job.items.length) * 100) : 0
  const itemActual = job?.items.find((i) => i.estado === "EJECUTANDO") ?? null
  const pctItem =
    itemActual?.paginasTotales && itemActual.paginaActual
      ? Math.min(100, Math.round((itemActual.paginaActual / itemActual.paginasTotales) * 100))
      : null
  const propsEnVivo = job
    ? job.items.reduce((acc, i) => acc + (i.totalPropiedades ?? i.propsAcumuladas ?? 0), 0)
    : 0
  const transcurridoMs = job
    ? ejecutando
      ? ahora - Date.parse(job.iniciadoEn)
      : job.duracionMs ?? 0
    : 0

  /** ETA aproximado: ritmo por páginas de la URL actual + promedio de items completados × pendientes */
  const etaMs = useMemo(() => {
    if (!job || !ejecutando) return null
    const conDur = job.items.filter(
      (i) =>
        i.iniciadoEn && i.finalizadoEn && i.estado !== "PENDIENTE" && i.estado !== "EJECUTANDO",
    )
    const promedioItem =
      conDur.length > 0
        ? conDur.reduce(
            (a, i) => a + (Date.parse(i.finalizadoEn!) - Date.parse(i.iniciadoEn!)),
            0,
          ) / conDur.length
        : null
    const pendientes = job.items.filter((i) => i.estado === "PENDIENTE").length
    let ms = 0
    let puede = false
    if (itemActual?.iniciadoEn) {
      const elapsedItem = ahora - Date.parse(itemActual.iniciadoEn)
      if (itemActual.paginasTotales && itemActual.paginaActual && itemActual.paginaActual > 0) {
        const ritmo = elapsedItem / itemActual.paginaActual
        ms += ritmo * Math.max(0, itemActual.paginasTotales - itemActual.paginaActual)
        puede = true
      } else if (promedioItem != null) {
        ms += Math.max(0, promedioItem - elapsedItem)
        puede = true
      }
    }
    if (promedioItem != null && pendientes > 0) {
      ms += promedioItem * pendientes
      puede = true
    }
    return puede ? ms : null
  }, [job, ejecutando, itemActual, ahora])

  return (
    <div className="space-y-6">
      {/* === PANEL 1: CONFIGURACIÓN === */}
      <Card className="bg-card border-slate-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <Globe className="w-5 h-5 text-[#FAB90E]" />
            1. Configurar y ejecutar
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Selector de fuente */}
          <div className="space-y-1.5">
            <label className="text-xs text-slate-400">Inmobiliaria</label>
            <div className="flex gap-2">
              {FUENTES.map((f) => (
                <button
                  key={f.id}
                  type="button"
                  disabled={ejecutando || iniciando}
                  onClick={() => cambiarFuente(f.id)}
                  className={cn(
                    "px-4 py-2 rounded-lg border text-sm font-medium transition-all",
                    fuente === f.id
                      ? "bg-[#233C7A] text-white border-[#233C7A]"
                      : "border-slate-700 text-slate-300 hover:bg-slate-800/60",
                    (ejecutando || iniciando) && "opacity-60 cursor-not-allowed",
                  )}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {/* Selector de modo */}
          <div className="space-y-1.5">
            <label className="text-xs text-slate-400">Modo</label>
            <div className="flex gap-2 p-1 rounded-lg bg-slate-900/60 border border-slate-800 w-fit">
              <button
                type="button"
                disabled={ejecutando || iniciando}
                onClick={() => setModo("catalogo")}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all",
                  modo === "catalogo"
                    ? "bg-[#233C7A] text-white"
                    : "text-slate-400 hover:text-slate-200",
                  (ejecutando || iniciando) && "opacity-60 cursor-not-allowed",
                )}
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                Catálogo de URLs
              </button>
              <button
                type="button"
                disabled={ejecutando || iniciando}
                onClick={() => setModo("custom")}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all",
                  modo === "custom"
                    ? "bg-[#233C7A] text-white"
                    : "text-slate-400 hover:text-slate-200",
                  (ejecutando || iniciando) && "opacity-60 cursor-not-allowed",
                )}
              >
                <Link2 className="w-3.5 h-3.5" />
                URL personalizada
              </button>
            </div>
          </div>

          {modo === "catalogo" ? (
            <div className="space-y-3">
              {/* Acciones rápidas */}
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs text-slate-400 mr-1">Selección:</span>
                <Button size="sm" variant="outline" className="h-7 text-xs border-slate-700" onClick={() => marcarTodos(true)} disabled={ejecutando || iniciando}>
                  Marcar todos
                </Button>
                <Button size="sm" variant="outline" className="h-7 text-xs border-slate-700" onClick={() => marcarTodos(false)} disabled={ejecutando || iniciando}>
                  Desmarcar todos
                </Button>
                <span className="ml-auto text-xs text-slate-400">
                  <strong className="text-white">{seleccion.size}</strong> de {catalogo.length} URL
                  {catalogo.length === 1 ? "" : "s"} seleccionada{seleccion.size === 1 ? "" : "s"}
                </span>
              </div>

              {/* Lista de categorías del catálogo */}
              <div className="border border-slate-800 rounded-lg divide-y divide-slate-800/60">
                {catalogo.map((item) => {
                  const marcado = seleccion.has(item.id)
                  return (
                    <label
                      key={item.id}
                      className={cn(
                        "flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors",
                        marcado ? "bg-slate-900/60" : "hover:bg-slate-800/40",
                        (ejecutando || iniciando) && "cursor-not-allowed opacity-60",
                      )}
                    >
                      <input
                        type="checkbox"
                        checked={marcado}
                        onChange={() => toggleItem(item.id)}
                        disabled={ejecutando || iniciando}
                        className="w-4 h-4 accent-[#FAB90E] cursor-pointer shrink-0"
                        aria-label={item.etiqueta}
                      />
                      <span className="flex-1 min-w-0">
                        <span className="block text-sm text-slate-100">
                          {CATEGORIA_CATALOGO_LABELS[item.categoria]}
                        </span>
                        <span className="block text-[11px] text-slate-500 truncate" title={item.url}>
                          {item.descripcion}
                        </span>
                      </span>
                      <span className="text-[10px] font-mono text-slate-600 shrink-0 hidden sm:block">
                        {fuente === "C21" ? "c21.com.bo" : "remax.bo"}
                      </span>
                    </label>
                  )
                })}
              </div>
              <p className="text-[11px] text-muted-foreground">
                {fuente === "C21"
                  ? "URLs reales de C21 Bolivia (venta, coordenadas por categoría). Se ejecutan en secuencia."
                  : "URLs reales de RE/MAX Bolivia (venta, cobertura multi-ciudad). Se ejecutan en secuencia."}
              </p>
            </div>
          ) : (
            <div className="space-y-1.5">
              <label className="text-xs text-slate-400">
                URL de búsqueda de {fuente === "C21" ? "Century 21" : "RE/MAX"}
              </label>
              <input
                type="url"
                value={urlCustom}
                onChange={(e) => setUrlCustom(e.target.value)}
                placeholder={
                  fuente === "C21"
                    ? "https://c21.com.bo/v/resultados/tipo_casa/operacion_venta/layout_mapa/coordenadas_..."
                    : "https://remax.bo/search/casa/santa-cruz"
                }
                disabled={ejecutando || iniciando}
                className="h-10 w-full px-3 bg-slate-900/60 border border-slate-700 rounded-md text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-[#233C7A] disabled:opacity-60"
              />
              <p className="text-[11px] text-muted-foreground">
                Pega la URL de la búsqueda con los filtros que quieras (tipo, operación, zona).
                La paginación es automática.
              </p>
            </div>
          )}

          {/* Acciones */}
          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              type="button"
              onClick={iniciar}
              disabled={!puedeIniciar || ejecutando || iniciando}
              className="h-10 bg-[#233C7A] hover:bg-[#1e3566] text-white"
            >
              {iniciando ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Iniciando...
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 mr-2" />
                  {modo === "catalogo"
                    ? `Ejecutar ${totalSeleccionadas} URL${totalSeleccionadas === 1 ? "" : "s"}`
                    : "Ejecutar scraper"}
                </>
              )}
            </Button>
            {ejecutando && (
              <Button type="button" variant="destructive" onClick={detener} className="h-10">
                <Square className="w-4 h-4 mr-2" />
                Detener lote
              </Button>
            )}
          </div>

          <p className="text-[11px] text-muted-foreground">
            Requiere Python con el paquete <code className="text-slate-300">requests</code> en el
            servidor. Según la cantidad de propiedades puede tardar de segundos a varios minutos por URL.
          </p>
        </CardContent>
      </Card>

      {/* === PANEL 2: PROGRESO Y CONSOLA EN VIVO === */}
      {job && (
        <Card className="bg-card border-slate-800">
          <CardHeader>
            <CardTitle className="flex flex-wrap items-center gap-3 text-white">
              <Terminal className="w-5 h-5 text-[#FAB90E]" />
              2. Salida del proceso
              <EstadoBadge estado={job.estado} />
              {job.duracionMs != null && (
                <span className="text-xs text-slate-500 font-normal">
                  {formatearDuracion(job.duracionMs)}
                </span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Progreso estilo descarga (lote + URL actual) */}
            <div className="space-y-3 p-4 rounded-lg border border-slate-800 bg-slate-900/40">
              <div className="flex items-center justify-between gap-3 text-xs">
                <span className="text-slate-300 font-medium truncate">
                  {ejecutando
                    ? `URL ${Math.min((job.itemActual ?? 0) + 1, job.items.length)} de ${job.items.length}`
                    : job.items.some((i) => i.estado === "EJECUTANDO")
                      ? "Cancelando..."
                      : "Lote terminado"}
                </span>
                <span className="text-white font-bold text-sm shrink-0">{pctLote}%</span>
              </div>
              <BarraProgreso pct={pctLote} color="bg-[#FAB90E]" />

              {itemActual && (
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between gap-3 text-[11px]">
                    <span className="text-slate-400 truncate">
                      {itemActual.etiqueta}
                      {itemActual.paginaActual != null && itemActual.paginasTotales != null
                        ? ` · pág. ${itemActual.paginaActual} ${itemActual.paginasEstimadas ? "de ≈" : "de "}${itemActual.paginasTotales}`
                        : ""}
                      {itemActual.propsAcumuladas != null
                        ? ` · ${itemActual.propsAcumuladas} props`
                        : ""}
                    </span>
                    {pctItem != null && (
                      <span className="text-blue-300 shrink-0">
                        {itemActual.paginasEstimadas ? "≈" : ""}
                        {pctItem}%
                      </span>
                    )}
                  </div>
                  {pctItem != null ? (
                    <BarraProgreso pct={pctItem} color="bg-blue-500" />
                  ) : (
                    <BarraIndeterminada />
                  )}
                </div>
              )}

              <div className="flex items-center justify-between text-[11px] text-slate-500">
                <span>⏱ {formatearDuracion(transcurridoMs)} transcurridos · {propsEnVivo} props</span>
                {ejecutando && etaMs != null && (
                  <span>≈ {formatearDuracion(etaMs)} restantes</span>
                )}
              </div>
            </div>

            {/* Lista de items del lote */}
            <div className="space-y-1.5">
              {job.items.map((item, i) => (
                <div
                  key={`${item.url}-${i}`}
                  className="flex items-center gap-2 text-xs border border-slate-800 rounded-md px-3 py-2 bg-slate-900/40"
                >
                  <IconoItem estado={item.estado} />
                  <span className="text-slate-200 truncate flex-1 min-w-0" title={item.url}>
                    {item.etiqueta}
                  </span>
                  {item.estado === "EJECUTANDO" && item.paginaActual != null && (
                    <span className="text-[10px] font-mono text-blue-300 shrink-0">
                      pág. {item.paginaActual}
                      {item.paginasTotales != null
                        ? `/${item.paginasEstimadas ? "≈" : ""}${item.paginasTotales}`
                        : ""}
                    </span>
                  )}
                  {item.totalPropiedades != null && (
                    <span className="text-slate-400 shrink-0">{item.totalPropiedades} props</span>
                  )}
                  {item.archivoSalida && (
                    <span className="text-[10px] text-slate-500 font-mono shrink-0 max-w-[180px] truncate" title={item.archivoSalida}>
                      {item.archivoSalida}
                    </span>
                  )}
                </div>
              ))}
            </div>

            {/* Consola estilo terminal */}
            <div
              ref={consolaRef}
              className="h-72 overflow-y-auto rounded-lg bg-black/80 border border-slate-800 p-3 font-mono text-xs leading-relaxed"
            >
              {job.logs.map((linea) => (
                <p
                  key={linea.seq}
                  className={cn(
                    "whitespace-pre-wrap break-all",
                    linea.stream === "stderr"
                      ? "text-red-400"
                      : linea.stream === "info"
                        ? "text-[#FAB90E]"
                        : "text-emerald-300/90",
                  )}
                >
                  {linea.texto}
                </p>
              ))}
              {ejecutando && (
                <p className="text-slate-500 animate-pulse">
                  ▌ esperando salida del scraper...
                </p>
              )}
            </div>

            {/* Resumen final */}
            {job.estado !== "EJECUTANDO" && (
              <div
                className={cn(
                  "flex flex-col sm:flex-row sm:items-start gap-3 p-4 rounded-lg border",
                  job.estado === "COMPLETADO"
                    ? "bg-emerald-950/40 border-emerald-800"
                    : job.estado === "CANCELADO"
                      ? "bg-slate-900/60 border-slate-700"
                      : "bg-red-950/40 border-red-800",
                )}
              >
                <div className="flex-1 space-y-1">
                  <p className="text-sm font-semibold text-white">
                    {job.estado === "COMPLETADO"
                      ? "Lote finalizado"
                      : job.estado === "CANCELADO"
                        ? "Lote cancelado"
                        : "El lote terminó con errores"}
                  </p>
                  <p className="text-xs text-slate-300">
                    {job.items.filter((i) => i.estado === "COMPLETADO").length} completados ·{" "}
                    {job.items.filter((i) => i.estado === "ERROR").length} con error ·{" "}
                    {job.items.filter((i) => i.estado === "CANCELADO").length} cancelados ·{" "}
                    {job.items.reduce((acc, i) => acc + (i.totalPropiedades ?? 0), 0)} propiedades en total
                  </p>
                  {job.items.some((i) => i.estado === "COMPLETADO") && (
                    <p className="text-xs text-slate-400 mt-2">
                      Ya puedes importarlos desde la pestaña de Importación → «Ver archivos del scraper».
                    </p>
                  )}
                </div>
                {job.items.some((i) => i.estado === "COMPLETADO") && (
                  <Link href="/dashboard/datos/importar" className="shrink-0">
                    <Button className="h-9 bg-[#233C7A] hover:bg-[#1e3566] text-white">
                      <FolderOpen className="w-4 h-4 mr-2" />
                      Ir a Importación
                    </Button>
                  </Link>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
