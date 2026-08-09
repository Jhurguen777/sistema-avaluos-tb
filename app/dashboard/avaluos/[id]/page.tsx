"use client"

import { useState, useEffect } from "react"
import dynamic from "next/dynamic"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { toPng } from "html-to-image"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  ArrowLeft,
  Loader2,
  Building2,
  Ruler,
  Layers,
  Calculator,
  CheckCircle,
  Clock,
  XCircle,
  Send,
  Download,
  Trash2,
  Map as MapIcon,
} from "lucide-react"
import { toast } from "@/components/ui/use-toast"
import { getAvaluoAction, cambiarEstadoAvaluoAction, eliminarAvaluoAction, obtenerDatosPdfAction } from "@/modules/avaluos/actions"
import type { DatosPdfAvaluo } from "@/modules/avaluos/actions"
import { obtenerRadarAction, generarRadarAction, eliminarEquipamientoAction } from "@/modules/radar/actions"
import type { AvaluoDetalleDTO } from "@/modules/avaluos/types/avaluo.types"
import { generarPDFAvaluo, descargarPDF, type DatosAvaluo } from "@/lib/generar-pdf"
import { AVALUO_CONFIG, generarAnalisisEntorno } from "@/config/avaluo"
import { PRODUCT_CATEGORY_LABELS } from "@/constants/tipos-inmueble"
import { DocumentosAvaluo } from "@/components/avaluos/documentos-avaluo"
import { RadarAvaluo } from "@/components/avaluos/radar-avaluo"
import { ComparablesAvaluo } from "@/components/avaluos/comparables-avaluo"
import { EditarAvaluoDialog } from "@/components/avaluos/editar-avaluo-dialog"

const MapaAvaluoCaptura = dynamic(
  () => import("@/components/avaluos/mapa-avaluo-captura").then((m) => m.MapaAvaluoCaptura),
  { ssr: false },
)
const RadarCapturaPdf = dynamic(
  () => import("@/components/avaluos/radar-captura-pdf").then((m) => m.RadarCapturaPdf),
  { ssr: false },
)
const MapaUbicacionCaptura = dynamic(
  () => import("@/components/avaluos/mapa-ubicacion-captura").then((m) => m.MapaUbicacionCaptura),
  { ssr: false },
)
const MapaEquipamientosCaptura = dynamic(
  () => import("@/components/avaluos/mapa-equipamientos-captura").then((m) => m.MapaEquipamientosCaptura),
  { ssr: false },
)

const ESTADO_LABEL: Record<string, string> = {
  BORRADOR: "Borrador",
  EN_REVISION: "En Revisión",
  APROBADO: "Aprobado",
  RECHAZADO: "Rechazado",
}
const ESTADO_COLOR: Record<string, string> = {
  BORRADOR: "text-slate-400 bg-slate-400/10 border-slate-400/30",
  EN_REVISION: "text-yellow-400 bg-yellow-400/10 border-yellow-400/30",
  APROBADO: "text-green-400 bg-green-400/10 border-green-400/30",
  RECHAZADO: "text-red-400 bg-red-400/10 border-red-400/30",
}
const CAT_LABEL: Record<string, string> = {
  LUJO: "Lujo",
  PRIMERA: "Primera",
  ESTANDAR: "Estándar",
  ECONOMICA: "Económica",
}
const ESTADO_CONS_LABEL: Record<string, string> = {
  EXCELENTE: "Excelente",
  BUENO: "Bueno",
  REGULAR: "Regular",
  MALO: "Malo",
  DEMOLICION: "Demolición",
}

function money(n: number | null | undefined): string {
  if (n == null) return "—"
  return `$${n.toLocaleString("es-BO", { maximumFractionDigits: 2 })}`
}

export default function AvaluoDetallePage() {
  const params = useParams()
  const router = useRouter()
  const id = String(params.id)

  const [detalle, setDetalle] = useState<AvaluoDetalleDTO | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [cambiando, setCambiando] = useState(false)
  const [generandoPdf, setGenerandoPdf] = useState(false)
  const [pdfDatos, setPdfDatos] = useState<DatosPdfAvaluo | null>(null)
  // Estado del radar (levantado aquí para que PDF y mapas compartan la selección)
  const [radarEntorno, setRadarEntorno] = useState<{
    radio: number
    equipamientos: Array<{ id: string; tipo: string; nombre: string; distancia: number; lat: number; lng: number }>
  } | null>(null)
  const [radarLoading, setRadarLoading] = useState(true)
  const [radarGenerando, setRadarGenerando] = useState(false)
  const [radioRadar, setRadioRadar] = useState(1000)
  const [excluidosEquipamientos, setExcluidosEquipamientos] = useState<Set<string>>(new Set())

  // Equipamientos visibles = todos los del radar menos los excluidos
  const equipamientosVisibles =
    (radarEntorno?.equipamientos ?? []).filter((e) => !excluidosEquipamientos.has(e.id))

  /** Carga el radar desde la BD */
  const cargarRadar = async () => {
    setRadarLoading(true)
    try {
      const res = await obtenerRadarAction(id)
      if (res.success && res.data) {
        setRadarEntorno({
          radio: res.data.radio ?? 1000,
          equipamientos: res.data.equipamientos ?? [],
        })
        setRadioRadar(res.data.radio ?? 1000)
      } else {
        setRadarEntorno(null)
      }
    } catch (error) {
      console.error("Error cargando radar:", error)
    } finally {
      setRadarLoading(false)
    }
  }

  /** Genera/regenera el radar (consulta Overpass) */
  const generarRadar = async (radio: number) => {
    setRadarGenerando(true)
    try {
      const res = await generarRadarAction(id, radio)
      if (res.success && res.data) {
        setRadarEntorno({
          radio: res.data.radio ?? radio,
          equipamientos: res.data.equipamientos ?? [],
        })
        setExcluidosEquipamientos(new Set())
        toast.success(`Radar generado: ${res.data.equipamientos?.length ?? 0} equipamientos encontrados`)
      } else if (!res.success) {
        toast.error("Error al generar radar", res.error)
      }
    } catch (error) {
      console.error("Error generando radar:", error)
      toast.error("Error al generar el radar", error instanceof Error ? error.message : "Error desconocido")
    } finally {
      setRadarGenerando(false)
    }
  }

  /** Elimina un equipamiento de la BD permanentemente */
  const eliminarEquipamiento = async (equipamientoId: string) => {
    if (!window.confirm("¿Eliminar este equipamiento permanentemente del radar?")) return
    try {
      const res = await eliminarEquipamientoAction(equipamientoId)
      if (res.success) {
        toast.success("Equipamiento eliminado")
        // Quitar de excluidos si estaba y recargar
        setExcluidosEquipamientos((prev) => {
          const next = new Set(prev)
          next.delete(equipamientoId)
          return next
        })
        await cargarRadar()
      } else if (!res.success) {
        toast.error("Error", res.error)
      }
    } catch (error) {
      console.error("Error eliminando equipamiento:", error)
      toast.error("Error al eliminar el equipamiento", error instanceof Error ? error.message : "Error desconocido")
    }
  }

  const toggleExclusion = (equipamientoId: string) => {
    setExcluidosEquipamientos((prev) => {
      const next = new Set(prev)
      if (next.has(equipamientoId)) next.delete(equipamientoId)
      else next.add(equipamientoId)
      return next
    })
  }

  const excluirTodosEquipamientos = () => {
    setExcluidosEquipamientos(new Set((radarEntorno?.equipamientos ?? []).map((e) => e.id)))
  }

  const incluirTodosEquipamientos = () => {
    setExcluidosEquipamientos(new Set())
  }

  /** Excluye un lote de IDs de golpe (para "excluir todos del tipo") */
  const excluirIds = (ids: string[]) => {
    setExcluidosEquipamientos((prev) => {
      const next = new Set(prev)
      ids.forEach((i) => next.add(i))
      return next
    })
  }

  /** Incluye un lote de IDs de golpe (para "incluir todos del tipo") */
  const incluirIds = (ids: string[]) => {
    setExcluidosEquipamientos((prev) => {
      const next = new Set(prev)
      ids.forEach((i) => next.delete(i))
      return next
    })
  }

  useEffect(() => {
    async function load() {
      try {
        const result = await getAvaluoAction(id)
        if (result.success && result.data) {
          setDetalle(result.data as AvaluoDetalleDTO)
          await cargarRadar()
        } else if (!result.success) {
          toast.error("Error al cargar el avalúo", result.error)
        }
      } catch (error) {
        console.error("Error cargando avalúo:", error)
        toast.error("Error al cargar el avalúo")
      } finally {
        setIsLoading(false)
      }
    }
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  const cambiarEstado = async (nuevoEstado: "EN_REVISION" | "APROBADO" | "RECHAZADO" | "BORRADOR") => {
    setCambiando(true)
    try {
      const result = await cambiarEstadoAvaluoAction(id, { estado: nuevoEstado })
      if (result.success && result.data) {
        toast.success("Estado actualizado")
        // Recargar detalle
        const fresh = await getAvaluoAction(id)
        if (fresh.success && fresh.data) setDetalle(fresh.data as AvaluoDetalleDTO)
      } else if (!result.success) {
        toast.error("Error", result.error)
      }
    } catch (error: any) {
      console.error("Error cambiando estado:", error)
      toast.error("Error al cambiar el estado", error.message)
    } finally {
      setCambiando(false)
    }
  }

  /** Recargar el detalle tras una edición (avalúo o comparables) */
  const recargar = async () => {
    const fresh = await getAvaluoAction(id)
    if (fresh.success && fresh.data) setDetalle(fresh.data as AvaluoDetalleDTO)
  }

  const editable = detalle?.estado !== "APROBADO"

  const eliminarAvaluo = async () => {
    if (!detalle) return
    if (!window.confirm(`¿Eliminar el avalúo ${detalle.codigo}? Esta acción no se puede deshacer.`)) return
    setCambiando(true)
    try {
      const result = await eliminarAvaluoAction(detalle.id)
      if (result.success) {
        toast.success("Avalúo eliminado")
        router.push("/dashboard/avaluos")
      } else if (!result.success) {
        toast.error("Error", result.error)
      }
    } catch (error: any) {
      console.error("Error eliminando avalúo:", error)
      toast.error("Error al eliminar el avalúo", error.message)
    } finally {
      setCambiando(false)
    }
  }

  const descargarAvaluoPDF = async () => {
    if (!detalle) return
    setGenerandoPdf(true)
    try {
      // 1) Traer todos los datos del avalúo (inmueble, fotos, entorno, valuador)
      const datosRes = await obtenerDatosPdfAction(id)
      if (!datosRes.success || !datosRes.data) {
        toast.error("Error", "No se pudieron obtener los datos del avalúo")
        return
      }
      const datos = datosRes.data
      // Filtrar equipamientos por la selección del admin (excluidos)
      const equipamientosFiltrados = datos.equipamientos.filter(
        (e) => !excluidosEquipamientos.has(e.id),
      )
      const datosFiltrados: DatosPdfAvaluo = { ...datos, equipamientos: equipamientosFiltrados }
      setPdfDatos(datosFiltrados)

      const lat = datos.lat
      const lng = datos.lng

      // 2) Montar los mapas offscreen y esperar a que carguen tiles
      let mapaUbicacion: string | undefined
      let mapaRadar: string | undefined
      let mapaEquipamientos: string | undefined

      if (lat != null && lng != null) {
        // Esperar un render cycle para que React monte los componentes offscreen
        await new Promise((r) => setTimeout(r, 400))
        // Tiempo para que Leaflet monte + Esri cargue tiles satelitales
        await new Promise((r) => setTimeout(r, 2500))
        const w = window as unknown as Record<string, HTMLElement | undefined>
        try {
          if (w.__mapaUbicacionRef) mapaUbicacion = await toPng(w.__mapaUbicacionRef, { cacheBust: true, pixelRatio: 2 })
        } catch (e) {
          console.error("Error capturando mapa ubicación:", e)
        }
        try {
          if (w.__mapaRadarRef) mapaRadar = await toPng(w.__mapaRadarRef, { cacheBust: true, pixelRatio: 2 })
        } catch (e) {
          console.error("Error capturando radar:", e)
        }
        try {
          if (w.__mapaEquipamientosRef) mapaEquipamientos = await toPng(w.__mapaEquipamientosRef, { cacheBust: true, pixelRatio: 2 })
        } catch (e) {
          console.error("Error capturando mapa equipamientos:", e)
        }
      }

      // 3) Convertir fotos del inmueble a dataURLs cuadrados (cover)
      const fotos = await cargarFotosCuadradas(datos.fotos.slice(0, 8).map((f) => f.url), 320)

      // 4) Cargar logos como dataURL
      const [logoIzquierdo, logoDerecho] = await Promise.all([
        cargarImagenDataUrl("/logoalfa.png").catch(() => undefined),
        cargarImagenDataUrl("/recurso2analityc2.png").catch(() => undefined),
      ])

      // 5) Cálculos de depreciación / vida útil
      const anoConstruccion = datos.anoConstruccion ?? datos.construcciones[0]?.anoConstruccion ?? null
      const vidaUtilTotal = datos.construcciones[0]?.vidaUtil ?? AVALUO_CONFIG.pdf.VIDA_UTIL_DEFAULT
      const anoActual = new Date().getFullYear()
      const anosTranscurridos = anoConstruccion ? Math.max(0, anoActual - anoConstruccion) : 0
      const vidaUtilRestante = Math.max(0, vidaUtilTotal - anosTranscurridos)
      const porcentajeDepreciacion =
        vidaUtilTotal > 0 ? Math.min(100, (anosTranscurridos / vidaUtilTotal) * 100) : 0

      // 6) Servicios como lista legible
      const serviciosLista: string[] = []
      if (datos.servicios && typeof datos.servicios === "object") {
        for (const [k, v] of Object.entries(datos.servicios)) {
          if (v === true) serviciosLista.push(k.charAt(0).toUpperCase() + k.slice(1))
        }
      }

      // 7) Análisis del entorno generado dinámicamente
      const analisisEntorno = generarAnalisisEntorno(
        equipamientosFiltrados.map((e) => ({ tipo: e.tipo, nombre: e.nombre, distancia: e.distancia })),
        datos.radioAnalisis,
      )

      // 8) Mapear factores y construir DTO final
      const r = datos.resultado
      const datosPdf: DatosAvaluo = {
        codigo: datos.codigo,
        empresa: AVALUO_CONFIG.pdf.EMPRESA,
        subtitulo: AVALUO_CONFIG.pdf.SUBTITULO,
        logoIzquierdo,
        logoDerecho,
        fechaElaboracion: new Date(datos.fechaElaboracion).toLocaleDateString("es-BO"),
        solicitante: datos.solicitante,
        valuadorNombre: datos.valuadorNombre,
        valuadorRegistro: datos.codigo,
        estado: datos.estado,

        codigoInmueble: datos.codigoInmueble,
        nombreInmueble: datos.nombreInmueble,
        tipoInmueble: PRODUCT_CATEGORY_LABELS[datos.categoria as keyof typeof PRODUCT_CATEGORY_LABELS] ?? datos.categoria,
        operacion: datos.operacion,
        direccion: datos.direccion,
        zona: datos.zona,
        municipio: datos.municipio,
        provincia: datos.provincia,
        departamento: datos.departamento,
        callePrincipal: datos.callePrincipal,
        numero: datos.numero,
        entreCalles: datos.entreCalles,
        codigoCatastral: null,
        folioReal: null,
        manzano: null,
        superficieTerreno: datos.terreno?.superficieM2 ?? datos.superficieUtil ?? null,
        superficieConstruida: datos.superficieConstruida ?? datos.terreno?.superficieM2 ?? null,
        anoConstruccion,
        servicios: serviciosLista,
        habitaciones: datos.habitaciones,
        banos: datos.banos,
        cocheras: datos.cocheras,

        latitud: lat,
        longitud: lng,

        mapaUbicacion,
        mapaRadar,
        mapaEquipamientos,
        fotos,

        terrenoFrente: datos.terreno?.frente ?? null,
        terrenoFondo: datos.terreno?.fondo ?? null,
        terrenoForma: datos.terreno?.formaLote ?? null,
        terrenoTipoVia: datos.terreno?.tipoVia ?? null,
        terrenoEsEsquina: datos.terreno?.esEsquina ?? false,
        terrenoValorUnitario: datos.terreno?.valorUnitario ?? 0,
        terrenoValorTotal: datos.terreno?.valorTotal ?? 0,

        construcciones: datos.construcciones.map((c) => ({
          tipo: c.tipo,
          categoria: c.categoria,
          estado: c.estado,
          anioConstruccion: c.anoConstruccion,
          vidaUtil: c.vidaUtil,
          superficieM2: c.superficieM2,
          valorUnitario: c.valorUnitario,
          valorReposicion: c.valorReposicion,
          depreciacionTotal: c.depreciacionTotal,
          valorNeto: c.valorNeto,
        })),

        factores: datos.factores,

        valorTerreno: r?.valorTerreno ?? 0,
        valorReposicionTotal: r?.valorReposicion ?? 0,
        depreciacionTotal: r?.depreciacion ?? 0,
        valorNetoConstruccion: r?.valorConstruccion ?? 0,
        valorComercial: r?.valorComercial ?? 0,
        valorVentaRapida: r?.valorVentaRapida ?? null,
        valorAlquiler: r?.valorAlquiler ?? null,
        valorCapitalComercial: r?.valorCapitalComercial ?? null,

        vidaUtilTotal,
        anosTranscurridos,
        vidaUtilRestante,
        porcentajeDepreciacion,

        radioAnalisis: datos.radioAnalisis,
        equipamientos: equipamientosFiltrados.map((e) => ({
          tipo: e.tipo,
          nombre: e.nombre,
          direccion: e.direccion,
          distancia: e.distancia,
        })),
        analisisEntorno,
      }

      const doc = generarPDFAvaluo(datosPdf)
      descargarPDF(doc, `${datos.codigo}.pdf`)
      toast.success("PDF generado")
    } catch (error: any) {
      console.error("Error generando PDF:", error)
      toast.error("Error al generar el PDF", error.message)
    } finally {
      setGenerandoPdf(false)
      setPdfDatos(null)
    }
  }

  if (isLoading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[400px]">
        <Loader2 className="animate-spin h-10 w-10 text-primary" />
      </div>
    )
  }

  if (!detalle) {
    return (
      <div className="p-8 text-center">
        <p className="text-slate-400 mb-4">Avalúo no encontrado</p>
        <Link href="/dashboard/avaluos">
          <Button variant="outline">Volver a Avalúos</Button>
        </Link>
      </div>
    )
  }

  const r = detalle.resultado
  const terreno = detalle.terreno
  const construcciones = detalle.construcciones ?? []
  const factores = detalle.factores
  const comparables = [
    ...((detalle as any).comparablesVenta ?? []).map((c: any) => ({ ...c, tipoComp: "Venta" })),
    ...((detalle as any).comparablesAlquiler ?? []).map((c: any) => ({ ...c, tipoComp: "Alquiler" })),
  ]

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl sm:text-3xl font-bold text-white">{detalle.codigo}</h1>
              <span
                className={`px-2 py-1 text-xs font-medium rounded border ${ESTADO_COLOR[detalle.estado]}`}
              >
                {ESTADO_LABEL[detalle.estado]}
              </span>
            </div>
            <p className="text-sm text-slate-400 mt-1">{detalle.nombreInmueble}</p>
          </div>
        </div>
      </div>

      {/* Acciones de workflow */}
      <Card className="border-2 border-slate-800 bg-slate-900/50">
        <div className="p-4 flex flex-wrap gap-2">
          <Button onClick={descargarAvaluoPDF} disabled={generandoPdf} variant="outline" className="border-slate-700 text-white hover:bg-slate-800">
            {generandoPdf ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Download className="w-4 h-4 mr-2" />}
            {generandoPdf ? "Generando PDF..." : "Descargar PDF"}
          </Button>
          {detalle && (
            <EditarAvaluoDialog avaluoId={detalle.id} detalle={detalle} onActualizado={recargar} />
          )}
          {editable && (
            <Button onClick={eliminarAvaluo} disabled={cambiando} variant="outline" className="border-red-800/50 text-red-400 hover:bg-red-950/40">
              {cambiando ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Trash2 className="w-4 h-4 mr-2" />}
              Eliminar
            </Button>
          )}
          {detalle.estado === "BORRADOR" && (
            <Button onClick={() => cambiarEstado("EN_REVISION")} disabled={cambiando} className="bg-yellow-500 hover:bg-yellow-600">
              {cambiando ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Send className="w-4 h-4 mr-2" />}
              Enviar a Revisión
            </Button>
          )}
          {detalle.estado === "EN_REVISION" && (
            <>
              <Button onClick={() => cambiarEstado("APROBADO")} disabled={cambiando} className="bg-green-500 hover:bg-green-600">
                {cambiando ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <CheckCircle className="w-4 h-4 mr-2" />}
                Aprobar
              </Button>
              <Button onClick={() => cambiarEstado("RECHAZADO")} disabled={cambiando} className="bg-red-500 hover:bg-red-600">
                <XCircle className="w-4 h-4 mr-2" />
                Rechazar
              </Button>
            </>
          )}
          {detalle.estado === "RECHAZADO" && (
            <Button onClick={() => cambiarEstado("BORRADOR")} disabled={cambiando} variant="outline" className="border-slate-700 text-white hover:bg-slate-800">
              Volver a Borrador
            </Button>
          )}
        </div>
      </Card>

      {/* Resultados destacados */}
      {r && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <Card className="border-2 border-slate-800 bg-slate-900/50 p-4">
            <p className="text-xs text-slate-500 mb-1">Valor Terreno</p>
            <p className="text-lg sm:text-xl font-bold text-white">{money(r.valorTerreno)}</p>
          </Card>
          <Card className="border-2 border-slate-800 bg-slate-900/50 p-4">
            <p className="text-xs text-slate-500 mb-1">Valor Construcción</p>
            <p className="text-lg sm:text-xl font-bold text-white">{money(r.valorConstruccion)}</p>
          </Card>
          <Card className="border-2 border-green-500/30 bg-green-500/10 p-4">
            <p className="text-xs text-slate-500 mb-1">Valor Comercial</p>
            <p className="text-lg sm:text-xl font-bold text-green-400">{money(r.valorComercial)}</p>
          </Card>
          <Card className="border-2 border-slate-800 bg-slate-900/50 p-4">
            <p className="text-xs text-slate-500 mb-1">Depreciación</p>
            <p className="text-lg sm:text-xl font-bold text-yellow-400">{money(r.depreciacion)}</p>
          </Card>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Inmueble */}
        <Card className="border-2 border-slate-800 bg-slate-900/50">
          <div className="p-5">
            <div className="flex items-center gap-2 mb-4">
              <Building2 className="w-5 h-5 text-primary" />
              <h3 className="text-lg font-semibold text-white">Inmueble</h3>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <Dato label="Código" valor={detalle.codigoInmueble} />
              <Dato label="Nombre" valor={detalle.nombreInmueble} />
              <Dato label="Categoría" valor={detalle.categoria} />
              <Dato label="Operación" valor={detalle.operacion} />
              <Dato label="Dirección" valor={detalle.direccion ?? "—"} span2 />
              <Dato label="Solicitante" valor={detalle.solicitante ?? "—"} />
              <Dato label="Propietario" valor={detalle.propietario ?? "—"} />
            </div>
          </div>
        </Card>

        {/* Terreno */}
        {terreno && (
          <Card className="border-2 border-slate-800 bg-slate-900/50">
            <div className="p-5">
              <div className="flex items-center gap-2 mb-4">
                <Ruler className="w-5 h-5 text-primary" />
                <h3 className="text-lg font-semibold text-white">Terreno</h3>
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <Dato label="Superficie" valor={`${terreno.superficieM2} m²`} />
                <Dato label="Valor Unitario" valor={money(terreno.valorUnitario)} />
                <Dato label="Valor Total" valor={money(terreno.valorTotal)} />
                <Dato label="Tipo de Vía" valor={terreno.tipoVia ?? "—"} />
                <Dato label="Frente" valor={terreno.frente ? `${terreno.frente} m` : "—"} />
                <Dato label="Fondo" valor={terreno.fondo ? `${terreno.fondo} m` : "—"} />
                <Dato label="Es esquina" valor={terreno.esEsquina ? "Sí" : "No"} />
                <Dato label="Forma del lote" valor={terreno.formaLote ?? "—"} />
              </div>
            </div>
          </Card>
        )}

        {/* Construcciones */}
        <Card className="border-2 border-slate-800 bg-slate-900/50">
          <div className="p-5">
            <div className="flex items-center gap-2 mb-4">
              <Layers className="w-5 h-5 text-primary" />
              <h3 className="text-lg font-semibold text-white">Construcciones ({construcciones.length})</h3>
            </div>
            <div className="space-y-3">
              {construcciones.map((c: any, i: number) => (
                <div key={c.id ?? i} className="bg-slate-800/50 rounded-lg p-3">
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <Dato label="Categoría" valor={CAT_LABEL[c.categoria] ?? c.categoria} />
                    <Dato label="Estado" valor={ESTADO_CONS_LABEL[c.estado] ?? c.estado} />
                    <Dato label="Superficie" valor={`${c.superficieM2} m²`} />
                    <Dato label="Año construcción" valor={String(c.anoConstruccion)} />
                    <Dato label="Valor unitario" valor={money(c.valorUnitario)} />
                    <Dato label="Reposición" valor={money(c.valorReposicion)} />
                    <Dato label="Depreciación total" valor={money(c.depreciacionTotal)} />
                    <Dato label="Valor neto" valor={money(c.valorNeto)} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Card>

        {/* Factores + Resultado */}
        <Card className="border-2 border-slate-800 bg-slate-900/50">
          <div className="p-5">
            <div className="flex items-center gap-2 mb-4">
              <Calculator className="w-5 h-5 text-primary" />
              <h3 className="text-lg font-semibold text-white">Factores y Resultado</h3>
            </div>
            {factores && (
              <div className="grid grid-cols-2 gap-3 text-sm mb-4">
                <Dato label="F. Ubicación" valor={String(factores.factorUbicacion)} />
                <Dato label="F. Vía" valor={String(factores.factorVia)} />
                <Dato label="F. Frente" valor={String(factores.factorFrente)} />
                <Dato label="F. Esquina" valor={String(factores.factorEsquina)} />
                <Dato label="F. Morfológico" valor={String(factores.factorMorfologico)} />
                <Dato label="F. Servicios" valor={String(factores.factorServicios)} />
              </div>
            )}
            {r && (
              <div className="grid grid-cols-2 gap-3 text-sm border-t border-slate-800 pt-4">
                <Dato label="Reposición (nuevo)" valor={money(r.valorReposicion)} />
                <Dato label="Depreciación" valor={money(r.depreciacion)} />
                {r.valorVentaRapida != null && <Dato label="Venta rápida" valor={money(r.valorVentaRapida)} />}
                {r.valorAlquiler != null && <Dato label="Alquiler mensual" valor={money(r.valorAlquiler)} />}
                {r.valorCapitalComercial != null && <Dato label="Capital comercial" valor={money(r.valorCapitalComercial)} />}
              </div>
            )}
          </div>
        </Card>

        {/* Comparables de mercado */}
        <ComparablesAvaluo
          avaluoId={detalle.id}
          comparables={comparables}
          editable={editable}
          onActualizado={recargar}
        />
      </div>

      {detalle.observaciones && (
        <Card className="border-2 border-slate-800 bg-slate-900/50">
          <div className="p-5">
            <h3 className="text-sm font-semibold text-white mb-2">Observaciones</h3>
            <p className="text-sm text-slate-300 whitespace-pre-wrap">{detalle.observaciones}</p>
          </div>
        </Card>
      )}

      {/* Documentos */}
      <DocumentosAvaluo avaluoId={detalle.id} />

      {/* Mapa con ubicación + equipamientos (capturable para PDF) */}
      {(() => {
        const lat = (detalle as any).lat ?? (detalle as any).product?.lat
        const lng = (detalle as any).lng ?? (detalle as any).product?.lng
        if (!lat || !lng) return null
        return (
          <Card className="border-2 border-slate-800 bg-slate-900/50">
            <div className="p-5">
              <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                <MapIcon className="w-5 h-5 text-primary" />
                Ubicación y Entorno
              </h3>
              <MapaAvaluoCaptura
                lat={lat}
                lng={lng}
                radio={radioRadar}
                equipamientos={equipamientosVisibles.map((e) => ({
                  tipo: e.tipo,
                  nombre: e.nombre,
                  distancia: e.distancia,
                  lat: e.lat,
                  lng: e.lng,
                }))}
              />
              {equipamientosVisibles.length > 0 && (
                <p className="text-xs text-slate-500 mt-2">
                  Mostrando {equipamientosVisibles.length} equipamientos en radio de {radioRadar}m
                  {excluidosEquipamientos.size > 0 && ` (${excluidosEquipamientos.size} excluidos del PDF)`}.
                  Este mapa se incluye en el PDF.
                </p>
              )}
            </div>
          </Card>
        )
      })()}

      {/* Radar de Equipamientos (con selección para el PDF) */}
      <RadarAvaluo
        avaluoId={detalle.id}
        entorno={radarEntorno}
        isLoading={radarLoading}
        generando={radarGenerando}
        excluidos={excluidosEquipamientos}
        editable={editable}
        onGenerar={generarRadar}
        onToggleExclusion={toggleExclusion}
        onExcluirTodos={excluirTodosEquipamientos}
        onIncluirTodos={incluirTodosEquipamientos}
        onIncluirIds={incluirIds}
        onExcluirIds={excluirIds}
        onEliminar={eliminarEquipamiento}
        radioActual={radioRadar}
        onCambiarRadio={setRadioRadar}
      />

      {/* Mapas offscreen para captura del PDF (solo durante la generación) */}
      {generandoPdf && pdfDatos && pdfDatos.lat != null && pdfDatos.lng != null && (
        <div
          aria-hidden
          style={{
            position: "fixed",
            left: -10000,
            top: 0,
            opacity: 0,
            pointerEvents: "none",
            zIndex: -1,
          }}
        >
          <MapaUbicacionCaptura
            lat={pdfDatos.lat}
            lng={pdfDatos.lng}
            direccion={pdfDatos.direccion ?? undefined}
          />
          <RadarCapturaPdf
            lat={pdfDatos.lat}
            lng={pdfDatos.lng}
            radioMax={pdfDatos.radioAnalisis}
            equipamientos={pdfDatos.equipamientos.map((e) => ({
              tipo: e.tipo,
              nombre: e.nombre,
              distancia: e.distancia,
              lat: e.lat,
              lng: e.lng,
            }))}
          />
          <MapaEquipamientosCaptura
            lat={pdfDatos.lat}
            lng={pdfDatos.lng}
            radio={pdfDatos.radioAnalisis}
            equipamientos={pdfDatos.equipamientos.map((e) => ({
              tipo: e.tipo,
              nombre: e.nombre,
              distancia: e.distancia,
              lat: e.lat,
              lng: e.lng,
            }))}
          />
        </div>
      )}
    </div>
  )
}

function Dato({ label, valor, span2 }: { label: string; valor: string; span2?: boolean }) {
  return (
    <div className={span2 ? "col-span-2" : ""}>
      <p className="text-xs text-slate-500">{label}</p>
      <p className="text-sm text-white">{valor}</p>
    </div>
  )
}

/**
 * Carga una imagen desde una URL (mismo dominio, sin CORS) y devuelve su
 * dataURL. Usado para incrustar logos del `/public` dentro del PDF.
 */
async function cargarImagenDataUrl(url: string): Promise<string> {
  const res = await fetch(url)
  const blob = await res.blob()
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(blob)
  })
}

/**
 * Carga una lista de URLs de fotos y devuelve dataURLs JPEG recortados a
 * cuadrado (cover) con el tamaño indicado. Así el PDF puede colocarlos en
 * una grilla uniforme sin distorsión de aspecto.
 */
async function cargarFotosCuadradas(
  urls: string[],
  size: number,
): Promise<{ dataUrl: string }[]> {
  const resultado: { dataUrl: string }[] = []
  for (const url of urls) {
    try {
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const img = new window.Image()
        img.crossOrigin = "anonymous"
        img.onload = () => {
          const canvas = document.createElement("canvas")
          canvas.width = size
          canvas.height = size
          const ctx = canvas.getContext("2d")
          if (!ctx) return reject(new Error("Canvas no disponible"))
          // Cover: escalar y centrar recortando lo que sobre
          const escala = Math.max(size / img.width, size / img.height)
          const w = img.width * escala
          const h = img.height * escala
          const dx = (size - w) / 2
          const dy = (size - h) / 2
          ctx.drawImage(img, dx, dy, w, h)
          resolve(canvas.toDataURL("image/jpeg", 0.82))
        }
        img.onerror = () => reject(new Error(`No se pudo cargar ${url}`))
        img.src = url
      })
      resultado.push({ dataUrl })
    } catch (e) {
      console.error("Error cargando foto:", url, e)
    }
  }
  return resultado
}
