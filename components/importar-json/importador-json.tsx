"use client"

import { useState, useMemo, useRef, useEffect } from "react"
import { analizarJsonAction, importarJsonAction, obtenerCategoriasAction, obtenerTasaCambioAction } from "@/modules/importacion/actions"
import { OPERACIONES_DISPONIBLES } from "@/modules/importacion/types/importacion.types"
import type {
  RegistroAnalizado,
  ResumenAnalisis,
  EstadoRegistro,
  ImportarJsonResult,
} from "@/modules/importacion/types/importacion.types"
import type { OperationType, ProductCategoryEnum } from "@prisma/client"
import { PRODUCT_CATEGORY_LABELS } from "@/constants/tipos-inmueble"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { toast } from "@/components/ui/use-toast"
import { PanelArchivosScraper } from "@/components/importar-json/panel-archivos-scraper"
import {
  Upload,
  FileJson,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Database,
  RefreshCw,
  FolderOpen,
  DollarSign,
} from "lucide-react"

type FiltroActivo =
  | "TODOS"
  | "CONFLICTO_OP"
  | "DUPLICADOS"
  | `CAT:${ProductCategoryEnum}`
  | `OP:${OperationType}`
  | EstadoRegistro

const PAGE_SIZE = 100

const OPERACION_LABELS: Record<OperationType, string> = {
  VENTA: "Venta",
  ALQUILER: "Alquiler",
  ANTICRETICO: "Anticrético",
}

interface OverrideFila {
  categoria?: ProductCategoryEnum
  operacion?: OperationType
}

export function ImportadorJson() {
  const [file, setFile] = useState<File | null>(null)
  const [archivoServidor, setArchivoServidor] = useState<{ nombre: string; total: number; datos: unknown } | null>(null)
  const [panelAbierto, setPanelAbierto] = useState(false)
  const [analizando, setAnalizando] = useState(false)
  const [importando, setImportando] = useState(false)
  const [registros, setRegistros] = useState<RegistroAnalizado[] | null>(null)
  const [resumen, setResumen] = useState<ResumenAnalisis | null>(null)
  const [resultado, setResultado] = useState<ImportarJsonResult | null>(null)
  const [seleccionados, setSeleccionados] = useState<Set<number>>(new Set())
  const [overrides, setOverrides] = useState<Record<number, OverrideFila>>({})
  const [filtro, setFiltro] = useState<FiltroActivo>("TODOS")
  const [categorias, setCategorias] = useState<ProductCategoryEnum[]>([])
  const [pagina, setPagina] = useState(1)
  // Tasa de cambio del día (BCB) — obligatoria antes de analizar
  const [tasaCambio, setTasaCambio] = useState<number | null>(null)
  const [tasaObtenidaEn, setTasaObtenidaEn] = useState<string | null>(null)
  const [obteniendoTasa, setObteniendoTasa] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)
  const tablaRef = useRef<HTMLDivElement>(null)

  // Cargar categorías activas desde la DB al montar.
  useEffect(() => {
    obtenerCategoriasAction().then(r => {
      if (r.success && r.data) {
        setCategorias(r.data)
      } else {
        console.error("No se pudieron cargar categorías:", r.error)
      }
    })
  }, [])

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (f) {
      if (!f.name.toLowerCase().endsWith(".json")) {
        toast.error("Archivo inválido", "Debe ser un archivo .json")
        return
      }
      setFile(f)
      setArchivoServidor(null)
      // Reset estado previo
      setRegistros(null)
      setResumen(null)
      setResultado(null)
      setSeleccionados(new Set())
      setOverrides({})
      setPagina(1)
    }
  }

  /** Obtiene el dólar del día desde el BCB (scraper) — obligatorio antes de analizar. */
  const obtenerTasa = async () => {
    setObteniendoTasa(true)
    try {
      const r = await obtenerTasaCambioAction()
      if (r.success && r.data) {
        setTasaCambio(r.data.tasa)
        setTasaObtenidaEn(r.data.obtenidoEn)
        toast.success(
          "Dólar del día obtenido",
          `1 USD = Bs ${r.data.tasa.toFixed(2)} (fuente: ${r.data.fuente})`,
        )
      } else {
        toast.error("No se pudo obtener el dólar", r.error || "Inténtalo de nuevo.")
      }
    } catch (err) {
      console.error("Error obteniendo tasa:", err)
      toast.error("Error inesperado", "No se pudo obtener el dólar del día.")
    } finally {
      setObteniendoTasa(false)
    }
  }

  /** Recibe un JSON ya parseado (desde el PC o del scraper) y lo analiza. */
  const analizarDatos = async (parsed: unknown, origen: string) => {
    if (tasaCambio == null) {
      toast.error(
        "Falta el dólar del día",
        "Primero presiona «Obtener dólar del día» para poder convertir los precios.",
      )
      return
    }
    setAnalizando(true)
    setResultado(null)
    try {
      const r = await analizarJsonAction(parsed, tasaCambio)
      if (r.success && r.data) {
        setRegistros(r.data.registros)
        setResumen(r.data.resumen)
        setPagina(1)
        // Por defecto: seleccionar solo los VALIDO (excluyendo duplicados de lote)
        const sel = new Set<number>()
        r.data.registros.forEach(reg => {
          if (reg.estado === "VALIDO" && !reg.duplicadoEnLote) sel.add(reg.indice)
        })
        setSeleccionados(sel)
        toast.success(
          "Análisis completado",
          `${r.data.resumen.total} registros · ${r.data.resumen.validos} válidos · ${r.data.resumen.conflictosOperacion} conflictos · ${r.data.resumen.duplicadosLote} cód. duplicados (${origen})`,
        )
      } else {
        toast.error("Error al analizar", r.error || "No se pudo analizar el JSON")
      }
    } catch (err) {
      console.error("Error analizando:", err)
      toast.error("Error inesperado", "No se pudo leer el archivo.")
    } finally {
      setAnalizando(false)
    }
  }

  const analizar = async () => {
    if (!file && !archivoServidor) {
      toast.error("Selecciona un origen", "Sube un JSON o elige uno del scraper.")
      return
    }
    if (file) {
      const texto = await file.text()
      let parsed: unknown
      try {
        parsed = JSON.parse(texto)
      } catch {
        toast.error("JSON inválido", "El archivo no es un JSON válido.")
        return
      }
      await analizarDatos(parsed, file.name)
    } else if (archivoServidor) {
      await analizarDatos(archivoServidor.datos, archivoServidor.nombre)
    }
  }

  /** Callback del panel lateral: selecciona un JSON generado por el scraper. */
  const onSeleccionarScraper = (seleccion: { nombre: string; total: number; datos: unknown }) => {
    setArchivoServidor(seleccion)
    setFile(null)
    if (fileRef.current) fileRef.current.value = ""
    // Reset estado previo
    setRegistros(null)
    setResumen(null)
    setResultado(null)
    setSeleccionados(new Set())
    setOverrides({})
    setPagina(1)
    // Analizar automáticamente al seleccionar
    void analizarDatos(seleccion.datos, seleccion.nombre)
  }

  const toggleSeleccion = (indice: number) => {
    setSeleccionados(prev => {
      const next = new Set(prev)
      if (next.has(indice)) next.delete(indice)
      else next.add(indice)
      return next
    })
  }

  const seleccionarGrupo = (estado: FiltroActivo, valor: boolean) => {
    setSeleccionados(prev => {
      const next = new Set(prev)
      if (!registros) return next
      const esCat = estado.startsWith("CAT:")
      const catFiltro = esCat ? (estado.slice(4) as ProductCategoryEnum) : null
      const esOp = estado.startsWith("OP:")
      const opFiltro = esOp ? (estado.slice(3) as OperationType) : null
      registros.forEach(reg => {
        const coincide =
          estado === "TODOS"
            ? true
            : estado === "CONFLICTO_OP"
              ? reg.conflictoOperacion
              : esCat
                ? (overrides[reg.indice]?.categoria ?? reg.categoriaDetectada) === catFiltro
                : esOp
                  ? (overrides[reg.indice]?.operacion ?? reg.operacionDetectada) === opFiltro
                  : reg.estado === estado
        if (coincide && (!valor || !reg.duplicadoEnLote)) {
          if (valor) next.add(reg.indice)
          else next.delete(reg.indice)
        }
      })
      return next
    })
  }

  const setOverride = (indice: number, ov: OverrideFila) => {
    setOverrides(prev => ({ ...prev, [indice]: { ...prev[indice], ...ov } }))
  }

  const reset = () => {
    setFile(null)
    setArchivoServidor(null)
    setRegistros(null)
    setResumen(null)
    setResultado(null)
    setSeleccionados(new Set())
    setOverrides({})
    setFiltro("TODOS")
    setPagina(1)
    if (fileRef.current) fileRef.current.value = ""
  }

  const importar = async () => {
    if (!registros) return
    if (seleccionados.size === 0) {
      toast.error("Sin selección", "Marca al menos un registro para importar.")
      return
    }
    setImportando(true)
    try {
      const payload = registros
        .filter(reg => seleccionados.has(reg.indice))
        .map(reg => {
          const ov = overrides[reg.indice] || {}
          return {
            codigo: reg.codigo,
            titulo: reg.titulo || "(sin título)",
            categoria: ov.categoria ?? reg.categoriaDetectada,
            operacion: ov.operacion ?? reg.operacionDetectada,
            precioUsd: reg.precioUsd,
            precioBob: reg.precioBob,
            superficieUtil: reg.superficieUtil,
            superficieConstruida: reg.superficieConstruida,
            habitaciones: reg.habitaciones,
            banos: reg.banos,
            cocheras: reg.cocheras,
            direccion: reg.direccion,
            departamento: reg.departamento,
            municipio: reg.municipio,
            pais: reg.pais,
            lat: reg.lat,
            lng: reg.lng,
          }
        })

      const r = await importarJsonAction({ registros: payload })
      if (r.success && r.data) {
        setResultado(r.data)
        toast.success(
          "Importación completada",
          `${r.data.insertados} insertados · ${r.data.omitidos} omitidos`,
        )
      } else {
        toast.error("Error al importar", r.error || "No se pudo completar la importación.")
      }
    } catch (err) {
      console.error("Error importando:", err)
      toast.error("Error inesperado", "No se pudo completar la importación.")
    } finally {
      setImportando(false)
    }
  }

  const registrosFiltrados = useMemo(() => {
    if (!registros) return []
    if (filtro === "TODOS") return registros
    if (filtro === "CONFLICTO_OP") return registros.filter(r => r.conflictoOperacion)
    if (filtro === "DUPLICADOS") return registros.filter(r => r.duplicadoEnLote)
    if (filtro.startsWith("CAT:")) {
      const cat = filtro.slice(4) as ProductCategoryEnum
      return registros.filter(
        r => (overrides[r.indice]?.categoria ?? r.categoriaDetectada) === cat,
      )
    }
    if (filtro.startsWith("OP:")) {
      const op = filtro.slice(3) as OperationType
      return registros.filter(
        r => (overrides[r.indice]?.operacion ?? r.operacionDetectada) === op,
      )
    }
    return registros.filter(r => r.estado === filtro)
  }, [registros, filtro, overrides])

  /** Cambia el filtro y reinicia la paginación para no quedar en una página vacía. */
  const cambiarFiltro = (f: FiltroActivo) => {
    setFiltro(f)
    setPagina(1)
  }

  /** Paginación: slice de la lista filtrada para la página actual. */
  const totalPaginas = Math.max(1, Math.ceil(registrosFiltrados.length / PAGE_SIZE))
  const paginaSegura = Math.min(pagina, totalPaginas)
  const indiceInicio = (paginaSegura - 1) * PAGE_SIZE
  const indiceFin = Math.min(indiceInicio + PAGE_SIZE, registrosFiltrados.length)
  const registrosPagina = registrosFiltrados.slice(indiceInicio, indiceFin)

  /** Cambia de página y hace scroll al inicio de la tabla. */
  const irAPagina = (n: number) => {
    const objetivo = Math.max(1, Math.min(n, totalPaginas))
    setPagina(objetivo)
    tablaRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })
  }

  /** Conteo por categoría (respetando overrides) para los botones de filtro. */
  const conteoPorCategoria = useMemo(() => {
    if (!registros) return [] as Array<{ cat: ProductCategoryEnum; count: number }>
    const map = new Map<ProductCategoryEnum, number>()
    registros.forEach(r => {
      const cat = overrides[r.indice]?.categoria ?? r.categoriaDetectada
      map.set(cat, (map.get(cat) || 0) + 1)
    })
    return Array.from(map.entries())
      .map(([cat, count]) => ({ cat, count }))
      .sort((a, b) => b.count - a.count)
  }, [registros, overrides])

  /** Conteo por operación (respetando overrides) para los botones de filtro. */
  const conteoPorOperacion = useMemo(() => {
    if (!registros) return [] as Array<{ op: OperationType; count: number }>
    const map = new Map<OperationType, number>()
    registros.forEach(r => {
      const op = overrides[r.indice]?.operacion ?? r.operacionDetectada
      map.set(op, (map.get(op) || 0) + 1)
    })
    return Array.from(map.entries())
      .map(([op, count]) => ({ op, count }))
      .sort((a, b) => b.count - a.count)
  }, [registros, overrides])

  const hayAnalisis = registros !== null && resumen !== null

  return (
    <div className="space-y-6">
      {/* === PANEL 1: UPLOAD === */}
      <Card className="bg-card border-slate-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <FileJson className="w-5 h-5 text-[#FAB90E]" />
            1. Subir archivo JSON
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3 sm:items-end">
            <div className="flex-1 space-y-1.5">
              <label className="text-xs text-slate-400">Archivo .json (desde tu PC)</label>
              <input
                ref={fileRef}
                type="file"
                accept=".json,application/json"
                onChange={onFileChange}
                className="h-10 file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-[#233C7A] file:text-white hover:file:bg-[#1e3566] text-slate-300 text-sm w-full border-2 border-slate-700 rounded-md"
              />
            </div>
            <Button
              type="button"
              variant="outline"
              onClick={obtenerTasa}
              disabled={obteniendoTasa}
              className="h-10 border-emerald-700 text-emerald-300 hover:bg-emerald-950/40"
            >
              {obteniendoTasa ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Consultando BCB...
                </>
              ) : (
                <>
                  <DollarSign className="w-4 h-4 mr-2" />
                  Obtener dólar del día
                </>
              )}
            </Button>
            <Button
              type="button"
              onClick={analizar}
              disabled={(!file && !archivoServidor) || tasaCambio == null || analizando}
              title={tasaCambio == null ? "Primero obtén el dólar del día" : undefined}
              className="h-10 bg-[#233C7A] hover:bg-[#1e3566] text-white"
            >
              {analizando ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Analizando...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4 mr-2" />
                  Analizar
                </>
              )}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => setPanelAbierto(true)}
              className="h-10 border-slate-700 text-slate-200 hover:bg-slate-800/60"
            >
              <FolderOpen className="w-4 h-4 mr-2 text-[#FAB90E]" />
              Ver archivos del scraper
            </Button>
            {hayAnalisis && (
              <Button
                type="button"
                variant="outline"
                onClick={reset}
                disabled={analizando || importando}
                className="h-10 border-slate-700"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Reiniciar
              </Button>
            )}
          </div>

          {/* Recuadro con la tasa del día (BCB) */}
          {tasaCambio != null ? (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-emerald-950/40 border border-emerald-800 w-fit">
              <DollarSign className="w-4 h-4 text-emerald-400 shrink-0" />
              <p className="text-xs text-emerald-100">
                1 USD = <strong className="text-white">Bs {tasaCambio.toFixed(2)}</strong>
                {tasaObtenidaEn && (
                  <span className="text-emerald-400">
                    {" "}
                    · obtenido{" "}
                    {new Date(tasaObtenidaEn).toLocaleTimeString("es-BO", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                )}
              </p>
            </div>
          ) : (
            <p className="text-xs text-[#FAB90E] flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
              Obligatorio: obtén el dólar del día (BCB) antes de analizar — se usa para convertir
              precios USD ⇄ Bs en ambas direcciones.
            </p>
          )}

          {/* Indicador de JSON seleccionado desde el scraper */}
          {archivoServidor && !file && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-[#233C7A]/10 border border-[#233C7A]/40">
              <FileJson className="w-4 h-4 text-[#FAB90E] shrink-0" />
              <p className="text-xs text-slate-200">
                Seleccionado del scraper: <strong className="text-white">{archivoServidor.nombre}</strong>
                {archivoServidor.total > 0 && (
                  <span className="text-slate-400"> · {archivoServidor.total} registros</span>
                )}
              </p>
              <button
                type="button"
                onClick={() => setArchivoServidor(null)}
                className="ml-auto text-slate-400 hover:text-white"
                aria-label="Quitar selección"
              >
                <XCircle className="w-4 h-4" />
              </button>
            </div>
          )}

          <p className="text-xs text-muted-foreground">
            El JSON debe ser un array de listings. Los nombres de campo son flexibles (se detectan
            por alias). La categoría y operación se infieren del título; revisa conflictos antes de
            importar. También puedes importar directamente los JSON generados por el módulo Scraper.
          </p>
        </CardContent>
      </Card>

      {/* === PANEL 2: RESUMEN + TABLA === */}
      {hayAnalisis && resumen && (
        <>
          <Card className="bg-card border-slate-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <Database className="w-5 h-5 text-[#FAB90E]" />
                2. Revisar y seleccionar ({resumen.total} registros)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* KPIs */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3">
                <Kpi label="Total" value={resumen.total} color="text-white" />
                <Kpi label="Válidos" value={resumen.validos} color="text-emerald-400" />
                <Kpi label="Sin precio" value={resumen.sinPrecio} color="text-[#FAB90E]" />
                <Kpi label="Sin coords" value={resumen.sinCoords} color="text-[#FAB90E]" />
                <Kpi label="Sin título" value={resumen.sinTitulo} color="text-red-400" />
                <Kpi
                  label="Conflictos op."
                  value={resumen.conflictosOperacion}
                  color="text-orange-400"
                />
                <Kpi
                  label="Cód. duplicados"
                  value={resumen.duplicadosLote}
                  color="text-fuchsia-400"
                />
              </div>

              {/* Filtros por grupo */}
              <div className="flex flex-wrap gap-2">
                <FiltroBtn
                  activo={filtro === "TODOS"}
                  onClick={() => cambiarFiltro("TODOS")}
                  label={`Todos (${resumen.total})`}
                />
                <FiltroBtn
                  activo={filtro === "VALIDO"}
                  onClick={() => cambiarFiltro("VALIDO")}
                  label={`Válidos (${resumen.validos})`}
                  variant="ok"
                />
                <FiltroBtn
                  activo={filtro === "SIN_PRECIO"}
                  onClick={() => cambiarFiltro("SIN_PRECIO")}
                  label={`Sin precio (${resumen.sinPrecio})`}
                  variant="warn"
                />
                <FiltroBtn
                  activo={filtro === "SIN_COORDS"}
                  onClick={() => cambiarFiltro("SIN_COORDS")}
                  label={`Sin coords (${resumen.sinCoords})`}
                  variant="warn"
                />
                <FiltroBtn
                  activo={filtro === "SIN_TITULO"}
                  onClick={() => cambiarFiltro("SIN_TITULO")}
                  label={`Sin título (${resumen.sinTitulo})`}
                  variant="err"
                />
                <FiltroBtn
                  activo={filtro === "CONFLICTO_OP"}
                  onClick={() => cambiarFiltro("CONFLICTO_OP")}
                  label={`Conflictos op. (${resumen.conflictosOperacion})`}
                  variant="conflict"
                />
                <FiltroBtn
                  activo={filtro === "DUPLICADOS"}
                  onClick={() => cambiarFiltro("DUPLICADOS")}
                  label={`Códigos duplicados (${resumen.duplicadosLote})`}
                  variant="dup"
                />
              </div>

              {/* Filtros por categoría detectada */}
              {conteoPorCategoria.length > 0 && (
                <div className="flex flex-wrap gap-2 items-center">
                  <span className="text-[11px] uppercase tracking-wide text-slate-500 mr-1">
                    Por categoría:
                  </span>
                  {conteoPorCategoria.map(({ cat, count }) => (
                    <FiltroBtn
                      key={cat}
                      activo={filtro === `CAT:${cat}`}
                      onClick={() => cambiarFiltro(`CAT:${cat}`)}
                      label={`${PRODUCT_CATEGORY_LABELS[cat] ?? cat} (${count})`}
                    />
                  ))}
                </div>
              )}

              {/* Filtros por operación detectada */}
              {conteoPorOperacion.length > 0 && (
                <div className="flex flex-wrap gap-2 items-center">
                  <span className="text-[11px] uppercase tracking-wide text-slate-500 mr-1">
                    Por operación:
                  </span>
                  {conteoPorOperacion.map(({ op, count }) => (
                    <FiltroBtn
                      key={op}
                      activo={filtro === `OP:${op}`}
                      onClick={() => cambiarFiltro(`OP:${op}`)}
                      label={`${OPERACION_LABELS[op] ?? op} (${count})`}
                    />
                  ))}
                </div>
              )}

              {/* Acciones masivas del grupo visible */}
              <div className="flex gap-2 text-xs">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => seleccionarGrupo(filtro, true)}
                  className="h-7 text-xs border-slate-700"
                >
                  Marcar grupo visible
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => seleccionarGrupo(filtro, false)}
                  className="h-7 text-xs border-slate-700"
                >
                  Desmarcar grupo visible
                </Button>
                <span className="ml-auto self-center text-slate-400">
                  Seleccionados: <strong className="text-white">{seleccionados.size}</strong>
                </span>
              </div>

              {/* Tabla CSS Grid */}
              <div ref={tablaRef} className="scroll-mt-4">
                <TablaRegistros
                  registros={registrosPagina}
                  seleccionados={seleccionados}
                  overrides={overrides}
                  categorias={categorias}
                  onToggle={toggleSeleccion}
                  onOverride={setOverride}
                />
              </div>

              {/* Paginación */}
              {registrosFiltrados.length > PAGE_SIZE && (
                <Paginacion
                  paginaActual={paginaSegura}
                  totalPaginas={totalPaginas}
                  totalRegistros={registrosFiltrados.length}
                  indiceInicio={indiceInicio}
                  indiceFin={indiceFin}
                  onIr={irAPagina}
                />
              )}

              {/* Reporte campos no mapeados */}
              {resumen.camposNoMapeados.length > 0 && (
                <div className="mt-4 p-3 rounded-lg border border-slate-700 bg-slate-900/50">
                  <p className="text-xs font-semibold text-slate-300 mb-2">
                    Campos no detectados en algunos registros:
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {resumen.camposNoMapeados.map(c => (
                      <Badge
                        key={c.campo}
                        variant="outline"
                        className="border-slate-600 text-slate-300"
                      >
                        {c.campo}: {c.count}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* === PANEL 3: IMPORTAR === */}
          <Card className="bg-card border-slate-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <Database className="w-5 h-5 text-[#FAB90E]" />
                3. Importar a la base de datos
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {resultado ? (
                <div className="space-y-3">
                  <div className="flex items-start gap-3 p-4 rounded-lg bg-emerald-950/40 border border-emerald-800">
                    <CheckCircle2 className="w-5 h-5 text-emerald-400 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-emerald-100">
                        Importación finalizada
                      </p>
                      <p className="text-xs text-emerald-300 mt-1">
                        {resultado.insertados} insertados · {resultado.omitidos} omitidos
                        (duplicados por código).
                      </p>
                      {resultado.duplicadosEnLote.length > 0 && (
                        <p className="text-xs text-fuchsia-300 mt-1">
                          {resultado.duplicadosEnLote.length} duplicados dentro del lote (se
                          conservó la primera aparición):{" "}
                          <span className="font-mono">
                            {resultado.duplicadosEnLote.slice(0, 5).join(", ")}
                            {resultado.duplicadosEnLote.length > 5 ? ", …" : ""}
                          </span>
                        </p>
                      )}
                    </div>
                  </div>
                  <Button onClick={reset} variant="outline" className="border-slate-700">
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Importar otro archivo
                  </Button>
                </div>
              ) : (
                <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
                  <Button
                    onClick={importar}
                    disabled={seleccionados.size === 0 || importando}
                    className="h-11 bg-[#233C7A] hover:bg-[#1e3566] text-white"
                  >
                    {importando ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Importando...
                      </>
                    ) : (
                      <>
                        <Database className="w-4 h-4 mr-2" />
                        Importar {seleccionados.size} registro{seleccionados.size === 1 ? "" : "s"}
                      </>
                    )}
                  </Button>
                  <p className="text-xs text-muted-foreground">
                    Se insertarán con <code className="text-slate-300">skipDuplicates</code> (si el
                    código ya existe, se omite). Operación atómica en transacción.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}

      {/* Panel lateral de archivos generados por el scraper */}
      <PanelArchivosScraper
        abierto={panelAbierto}
        onCerrar={() => setPanelAbierto(false)}
        onSeleccionar={onSeleccionarScraper}
      />
    </div>
  )
}

// ---------------------------------------------------------------------------
// SUBCOMPONENTES
// ---------------------------------------------------------------------------

/** Calcula qué botones numéricos mostrar (con elipsis) para no saturar la UI. */
function getPaginasVisibles(actual: number, total: number): (number | "...")[] {
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1)
  }
  const res: (number | "...")[] = [1]
  const inicio = Math.max(2, actual - 1)
  const fin = Math.min(total - 1, actual + 1)
  if (inicio > 2) res.push("...")
  for (let i = inicio; i <= fin; i++) res.push(i)
  if (fin < total - 1) res.push("...")
  res.push(total)
  return res
}

function Paginacion({
  paginaActual,
  totalPaginas,
  totalRegistros,
  indiceInicio,
  indiceFin,
  onIr,
}: {
  paginaActual: number
  totalPaginas: number
  totalRegistros: number
  indiceInicio: number
  indiceFin: number
  onIr: (n: number) => void
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
      <span className="text-xs text-slate-400">
        Mostrando <strong className="text-slate-200">{indiceInicio + 1}–{indiceFin}</strong> de{" "}
        <strong className="text-slate-200">{totalRegistros}</strong>
      </span>
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => onIr(paginaActual - 1)}
          disabled={paginaActual <= 1}
          className="px-2.5 py-1 rounded-md border border-slate-700 text-xs text-slate-300 hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          ‹ Anterior
        </button>
        {getPaginasVisibles(paginaActual, totalPaginas).map((p, i) =>
          p === "..." ? (
            <span key={`el-${i}`} className="px-1.5 text-slate-500 text-xs">
              …
            </span>
          ) : (
            <button
              key={p}
              type="button"
              onClick={() => onIr(p)}
              className={`min-w-[28px] px-2 py-1 rounded-md border text-xs font-medium transition-colors ${
                p === paginaActual
                  ? "bg-[#233C7A] text-white border-[#233C7A]"
                  : "border-slate-700 text-slate-300 hover:bg-slate-800"
              }`}
            >
              {p}
            </button>
          ),
        )}
        <button
          type="button"
          onClick={() => onIr(paginaActual + 1)}
          disabled={paginaActual >= totalPaginas}
          className="px-2.5 py-1 rounded-md border border-slate-700 text-xs text-slate-300 hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Siguiente ›
        </button>
      </div>
    </div>
  )
}

function Kpi({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="p-3 rounded-lg bg-slate-900/50 border border-slate-800">
      <p className="text-xs text-slate-400">{label}</p>
      <p className={`text-xl font-bold ${color}`}>{value}</p>
    </div>
  )
}

function FiltroBtn({
  activo,
  onClick,
  label,
  variant = "default",
}: {
  activo: boolean
  onClick: () => void
  label: string
  variant?: "default" | "ok" | "warn" | "err" | "conflict" | "dup"
}) {
  const colorMap = {
    default: activo ? "bg-[#233C7A] text-white border-[#233C7A]" : "border-slate-700 text-slate-300",
    ok: activo ? "bg-emerald-700 text-white border-emerald-700" : "border-slate-700 text-slate-300",
    warn: activo ? "bg-[#FAB90E] text-black border-[#FAB90E]" : "border-slate-700 text-slate-300",
    err: activo ? "bg-red-700 text-white border-red-700" : "border-slate-700 text-slate-300",
    conflict: activo ? "bg-orange-600 text-white border-orange-600" : "border-slate-700 text-slate-300",
    dup: activo ? "bg-fuchsia-700 text-white border-fuchsia-700" : "border-slate-700 text-slate-300",
  }
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-3 py-1.5 rounded-md border text-xs font-medium transition-colors ${colorMap[variant]}`}
    >
      {label}
    </button>
  )
}

function TablaRegistros({
  registros,
  seleccionados,
  overrides,
  categorias,
  onToggle,
  onOverride,
}: {
  registros: RegistroAnalizado[]
  seleccionados: Set<number>
  overrides: Record<number, OverrideFila>
  categorias: ProductCategoryEnum[]
  onToggle: (indice: number) => void
  onOverride: (indice: number, ov: OverrideFila) => void
}) {
  if (registros.length === 0) {
    return (
      <div className="p-6 text-center text-sm text-muted-foreground border border-dashed border-slate-700 rounded-lg">
        No hay registros en este grupo.
      </div>
    )
  }

  return (
    <div className="border border-slate-800 rounded-lg overflow-x-auto">
      {/* Header */}
      <div className="grid grid-cols-[40px_minmax(0,2fr)_minmax(0,1.2fr)_minmax(0,1.2fr)_110px_110px_minmax(0,1.5fr)] gap-2 p-3 bg-slate-900/60 text-xs font-semibold text-slate-300 border-b border-slate-800">
        <div></div>
        <div>Título / Código</div>
        <div>Categoría</div>
        <div>Operación</div>
        <div className="text-right">Precio USD</div>
        <div>Ubicación</div>
        <div>Estado</div>
      </div>

      {/* Rows */}
      <div className="divide-y divide-slate-800/60">
        {registros.map(reg => {
          const ov = overrides[reg.indice] || {}
          const catFinal = ov.categoria ?? reg.categoriaDetectada
          const opFinal = ov.operacion ?? reg.operacionDetectada
          const sel = seleccionados.has(reg.indice)
          const bordeEstado =
            reg.estado === "VALIDO"
              ? "border-l-emerald-500"
              : reg.estado === "SIN_TITULO"
                ? "border-l-red-500"
                : "border-l-[#FAB90E]"
          return (
            <div
              key={reg.indice}
              className={`grid grid-cols-[40px_minmax(0,2fr)_minmax(0,1.2fr)_minmax(0,1.2fr)_110px_110px_minmax(0,1.5fr)] gap-2 p-3 items-center text-xs border-l-4 ${bordeEstado} ${sel ? "bg-slate-900/40" : ""}`}
            >
              {/* Checkbox */}
              <input
                type="checkbox"
                checked={sel}
                onChange={() => onToggle(reg.indice)}
                className="w-4 h-4 accent-[#233C7A] cursor-pointer"
              />

              {/* Título / código */}
              <div className="min-w-0">
                <p className="text-white truncate" title={reg.titulo || "(sin título)"}>
                  {reg.titulo || <span className="italic text-slate-500">(sin título)</span>}
                </p>
                <p className="text-slate-500 truncate font-mono text-[10px]">{reg.codigo}</p>
              </div>

              {/* Categoría editable */}
              <select
                value={catFinal}
                onChange={e =>
                  onOverride(reg.indice, {
                    categoria: e.target.value as ProductCategoryEnum,
                  })
                }
                className="h-8 px-2 bg-slate-800 border border-slate-700 rounded text-slate-100 text-xs w-full"
              >
                {(
                  categorias.includes(catFinal)
                    ? categorias
                    : Array.from(new Set([...categorias, catFinal]))
                ).map(c => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>

              {/* Operación editable */}
              <div className="flex flex-col gap-1">
                <select
                  value={opFinal}
                  onChange={e =>
                    onOverride(reg.indice, {
                      operacion: e.target.value as OperationType,
                    })
                  }
                  className={`h-8 px-2 border rounded text-xs w-full ${
                    reg.conflictoOperacion
                      ? "bg-orange-950 border-orange-700 text-orange-200"
                      : "bg-slate-800 border-slate-700 text-slate-100"
                  }`}
                >
                  {OPERACIONES_DISPONIBLES.map(o => (
                    <option key={o} value={o}>
                      {o}
                    </option>
                  ))}
                </select>
                {reg.conflictoOperacion && (
                  <span className="text-[10px] text-orange-400 flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" />
                    Título: {reg.operacionDetectada} ≠ Campo: {reg.operacionDeclarada}
                  </span>
                )}
              </div>

              {/* Precio (USD + BOB, con nota si el original era Bs) */}
              <div className="text-right text-slate-200">
                {reg.precioUsd != null ? (
                  <>
                    <span>${reg.precioUsd.toLocaleString("en-US")}</span>
                    {reg.precioBob != null && (
                      <span className="block text-[10px] text-slate-500">
                        Bs {reg.precioBob.toLocaleString("en-US")}
                      </span>
                    )}
                    {reg.monedaOriginal === "BOB" && (
                      <span className="block text-[10px] text-[#FAB90E]">Bs→$ convertido</span>
                    )}
                  </>
                ) : (
                  <span className="text-slate-500 italic">—</span>
                )}
              </div>

              {/* Ubicación */}
              <div className="text-slate-400 text-[11px]">
                {reg.departamento || "—"}
                {reg.lat != null && reg.lng != null ? (
                  <span className="block text-emerald-500 text-[10px]">✓ coords</span>
                ) : (
                  <span className="block text-[#FAB90E] text-[10px]">sin coords</span>
                )}
              </div>

              {/* Estado */}
              <div className="flex flex-col gap-1">
                <EstadoBadge reg={reg} />
                {reg.duplicadoEnLote && (
                  <Badge className="bg-fuchsia-900/60 text-fuchsia-300 border border-fuchsia-800 text-[10px] gap-1">
                    <AlertTriangle className="w-3 h-3" /> Duplicado en lote
                  </Badge>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function EstadoBadge({ reg }: { reg: RegistroAnalizado }) {
  if (reg.estado === "VALIDO")
    return (
      <Badge className="bg-emerald-900/60 text-emerald-300 border border-emerald-800 text-[10px] gap-1">
        <CheckCircle2 className="w-3 h-3" /> Válido
      </Badge>
    )
  if (reg.estado === "SIN_TITULO")
    return (
      <Badge className="bg-red-900/60 text-red-300 border border-red-800 text-[10px] gap-1">
        <XCircle className="w-3 h-3" /> {reg.motivoEstado}
      </Badge>
    )
  return (
    <Badge className="bg-[#FAB90E]/10 text-[#FAB90E] border border-[#FAB90E]/40 text-[10px] gap-1">
      <AlertTriangle className="w-3 h-3" /> {reg.motivoEstado}
    </Badge>
  )
}
