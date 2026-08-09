/**
 * Generador del PDF de Informe de Avalúo Inmobiliario.
 *
 * A4 horizontal, layout de 2 columnas, identidad visual azul institucional.
 * Pensado para ser consumido por `app/dashboard/avaluos/[id]/page.tsx` con
 * datos ya materializados (fotos dataURL, mapas dataURL, equipamientos con
 * coords reales).
 *
 * No hace consultas a la BD: recibe todo lo que necesita en `DatosAvaluo`.
 */

import jsPDF from "jspdf"
import { EQUIPAMIENTO_LABELS } from "@/config/avaluo"
import { COLOR_TIPO_EQUIPAMIENTO } from "@/components/avaluos/mapas-pdf-config"

/** Alias tipado como Record<string,string> para indexar por tipo arbitrario */
const EQUIP_LABEL: Record<string, string> = EQUIPAMIENTO_LABELS as Record<string, string>

// ============================================================
// TIPOS DE ENTRADA
// ============================================================

export interface ConstruccionPDF {
  tipo: string
  categoria: string
  estado: string
  anioConstruccion: number
  vidaUtil: number
  superficieM2: number
  valorUnitario: number
  valorReposicion: number
  depreciacionTotal: number
  valorNeto: number
}

export interface EquipamientoPDF {
  tipo: string
  nombre: string
  direccion: string | null
  distancia: number
}

export interface FotoPDF {
  dataUrl: string
  descripcion?: string | null
}

export interface DatosAvaluo {
  // Cabecera / admin
  codigo: string
  empresa: string
  subtitulo: string
  logoIzquierdo?: string // dataURL
  logoDerecho?: string // dataURL
  fechaElaboracion: string
  solicitante: string | null
  valuadorNombre: string | null
  valuadorRegistro: string | null
  estado: string

  // Inmueble
  codigoInmueble: string
  nombreInmueble: string
  tipoInmueble: string
  operacion: string
  direccion: string | null
  zona: string | null
  municipio: string | null
  provincia: string | null
  departamento: string | null
  callePrincipal: string | null
  numero: string | null
  entreCalles: string | null
  codigoCatastral: string | null
  folioReal: string | null
  manzano: string | null
  superficieTerreno: number | null
  superficieConstruida: number | null
  anoConstruccion: number | null
  servicios: string[]
  habitaciones: number | null
  banos: number | null
  cocheras: number | null

  // Coordenadas
  latitud: number | null
  longitud: number | null

  // Imágenes (dataURLs ya procesados)
  mapaUbicacion?: string
  mapaRadar?: string
  mapaEquipamientos?: string
  fotos: FotoPDF[]

  // Terreno
  terrenoFrente: number | null
  terrenoFondo: number | null
  terrenoForma: string | null
  terrenoTipoVia: string | null
  terrenoEsEsquina: boolean
  terrenoValorUnitario: number
  terrenoValorTotal: number

  // Construcciones
  construcciones: ConstruccionPDF[]

  // Factores
  factores:
    | {
        factorUbicacion: number
        factorVia: number
        factorFrente: number
        factorEsquina: number
        factorMorfologico: number
        factorServicios: number
      }
    | null

  // Valores
  valorTerreno: number
  valorReposicionTotal: number
  depreciacionTotal: number
  valorNetoConstruccion: number
  valorComercial: number
  valorVentaRapida: number | null
  valorAlquiler: number | null
  valorCapitalComercial: number | null

  // Depreciación
  vidaUtilTotal: number
  anosTranscurridos: number
  vidaUtilRestante: number
  porcentajeDepreciacion: number

  // Radar / entorno
  radioAnalisis: number
  equipamientos: EquipamientoPDF[]
  analisisEntorno: string
}

// ============================================================
// CONSTANTES DE LAYOUT
// ============================================================

const COLOR = {
  primary: [15, 30, 71] as [number, number, number], // azul institucional
  primaryLight: [37, 99, 235] as [number, number, number], // azul medio
  gold: [250, 185, 14] as [number, number, number], // dorado de acento
  bg: [243, 244, 246] as [number, number, number], // gris muy claro
  bgAlt: [229, 231, 235] as [number, number, number],
  border: [209, 213, 219] as [number, number, number],
  text: [30, 41, 59] as [number, number, number],
  textMuted: [107, 114, 128] as [number, number, number],
  green: [22, 163, 74] as [number, number, number],
  red: [220, 38, 38] as [number, number, number],
  white: [255, 255, 255] as [number, number, number],
}

const PAGE_W = 297
const PAGE_H = 210
const MARGIN = 8
const COL_GAP = 5
const COL_W = (PAGE_W - MARGIN * 2 - COL_GAP) / 2 // ≈ 138
const COL_L_X = MARGIN
const COL_R_X = MARGIN + COL_W + COL_GAP
const HEADER_BOTTOM = 32

// ============================================================
// HELPERS DE DIBUJO
// ============================================================

function money(n: number | null | undefined): string {
  if (n == null) return "—"
  return `$${n.toLocaleString("es-BO", { maximumFractionDigits: 0 })}`
}

function textOrDefault(v: string | null | undefined): string {
  if (v == null || v === "") return "—"
  return v
}

/** Barra institucional + título de sección numerado */
function sectionTitle(
  doc: jsPDF,
  x: number,
  y: number,
  w: number,
  num: string,
  title: string,
): number {
  const barH = 7.5
  doc.setFillColor(...COLOR.primary)
  doc.rect(x, y, w, barH, "F")
  // Cuadro dorado con el número
  doc.setFillColor(...COLOR.gold)
  doc.rect(x, y, barH, barH, "F")
  doc.setTextColor(...COLOR.primary)
  doc.setFont("helvetica", "bold")
  doc.setFontSize(10)
  doc.text(num, x + barH / 2, y + barH - 2.2, { align: "center" })
  // Título
  doc.setTextColor(...COLOR.white)
  doc.setFont("helvetica", "bold")
  doc.setFontSize(11)
  doc.text(title.toUpperCase(), x + barH + 2.5, y + barH - 2.2)
  return y + barH + 2.5
}

/** Tabla ficha de 2 columnas (campo | valor), hasta 2 subcolumnas */
function fichaTabla(
  doc: jsPDF,
  x: number,
  y: number,
  w: number,
  rows: Array<[string, string | null | undefined]>,
  options: { lineHeight?: number; fontSize?: number; valueColor?: [number, number, number] } = {},
): number {
  const { lineHeight = 5, fontSize = 8, valueColor = COLOR.text } = options
  const labelW = w * 0.45
  const valueX = x + labelW + 1

  rows.forEach(([label, value], i) => {
    const ry = y + i * lineHeight
    // Fila alterna
    if (i % 2 === 0) {
      doc.setFillColor(...COLOR.bg)
      doc.rect(x, ry - 4, w, lineHeight, "F")
    }
    doc.setFont("helvetica", "normal")
    doc.setFontSize(fontSize)
    doc.setTextColor(...COLOR.textMuted)
    doc.text(label, x + 2, ry)
    doc.setFont("helvetica", "bold")
    doc.setFontSize(fontSize + 0.5)
    doc.setTextColor(...valueColor)
    const txt = doc.splitTextToSize(textOrDefault(value), w - labelW - 4)
    doc.text(txt, valueX, ry)
  })

  // Borde
  doc.setDrawColor(...COLOR.border)
  doc.setLineWidth(0.2)
  doc.rect(x, y - 4, w, rows.length * lineHeight, "S")
  return y + rows.length * lineHeight
}

/** Donut chart de depreciación usando pie slices */
function donutDepreciacion(
  doc: jsPDF,
  cx: number,
  cy: number,
  rOuter: number,
  rInner: number,
  pct: number,
): void {
  // Fondo azul (complemento)
  pieSlice(doc, cx, cy, rOuter, 0, Math.PI * 2, COLOR.primaryLight)
  // Porción roja (depreciación) empezando arriba (-90°)
  const startA = -Math.PI / 2
  const endA = startA + (pct / 100) * Math.PI * 2
  pieSlice(doc, cx, cy, rOuter, startA, endA, COLOR.red)
  // Agujero blanco
  doc.setFillColor(...COLOR.white)
  doc.circle(cx, cy, rInner, "F")
  // Borde exterior fino
  doc.setDrawColor(...COLOR.border)
  doc.setLineWidth(0.3)
  doc.circle(cx, cy, rOuter, "S")
  // Texto central
  doc.setTextColor(...COLOR.primary)
  doc.setFont("helvetica", "bold")
  doc.setFontSize(12)
  doc.text(`${pct.toFixed(2)}%`, cx, cy - 0.5, { align: "center" })
  doc.setFont("helvetica", "normal")
  doc.setFontSize(5.5)
  doc.setTextColor(...COLOR.textMuted)
  doc.text("DEPRECIACIÓN", cx, cy + 3.5, { align: "center" })
  doc.text("ACUMULADA", cx, cy + 7, { align: "center" })
}

/** Dibuja una porción de tarta (pie slice) aproximando con segmentos rectos */
function pieSlice(
  doc: jsPDF,
  cx: number,
  cy: number,
  r: number,
  startAngle: number,
  endAngle: number,
  fill: [number, number, number],
): void {
  const total = endAngle - startAngle
  if (total <= 0) return
  const steps = Math.max(8, Math.ceil((total / (Math.PI * 2)) * 64))
  const linesArr: number[][] = []
  // Mover del centro al primer punto del arco (delta)
  const x0 = r * Math.cos(startAngle)
  const y0 = r * Math.sin(startAngle)
  linesArr.push([x0, y0])
  // Recorrer el arco con deltas
  let prevX = x0
  let prevY = y0
  for (let i = 1; i <= steps; i++) {
    const a = startAngle + total * (i / steps)
    const px = r * Math.cos(a)
    const py = r * Math.sin(a)
    linesArr.push([px - prevX, py - prevY])
    prevX = px
    prevY = py
  }
  doc.setFillColor(...fill)
  doc.lines(linesArr, cx, cy, [1, 1], "f", true)
}

// ============================================================
// GENERADOR PRINCIPAL
// ============================================================

export function generarPDFAvaluo(datos: DatosAvaluo): jsPDF {
  const doc = new jsPDF({
    orientation: "landscape",
    unit: "mm",
    format: "a4",
    compress: true,
  })

  // =========================================================
  // PÁGINA 1 — Identidad + Datos del inmueble + Radar
  // =========================================================

  drawHeader(doc, datos)

  let yL = HEADER_BOTTOM
  let yR = HEADER_BOTTOM

  // ---------- COLUMNA IZQUIERDA (P1) ----------
  // 1. DATOS GENERALES
  yL = sectionTitle(doc, COL_L_X, yL, COL_W, "1", "Datos Generales del Inmueble")
  const datosGenerales: Array<[string, string | null]> = [
    ["Código Interno", datos.codigoInmueble],
    ["Tipo de Inmueble", datos.tipoInmueble],
    ["Operación", datos.operacion],
    ["Dirección", datos.direccion ?? null],
    ["Zona / Barrio", datos.zona],
    ["Municipio", datos.municipio],
    ["Provincia", datos.provincia],
    ["Departamento", datos.departamento],
    ["Código Catastral", datos.codigoCatastral],
    ["N° de Folio Real", datos.folioReal],
    ["Manzano", datos.manzano],
    ["Superficie de Terreno", datos.superficieTerreno != null ? `${datos.superficieTerreno} m²` : null],
    ["Superficie Construida", datos.superficieConstruida != null ? `${datos.superficieConstruida} m²` : null],
    ["Año de Construcción", datos.anoConstruccion != null ? String(datos.anoConstruccion) : null],
    ["Servicios Existentes", datos.servicios.length > 0 ? datos.servicios.join(", ") : null],
  ]
  yL = fichaTabla(doc, COL_L_X, yL, COL_W, datosGenerales, { lineHeight: 5.2, fontSize: 8.5 })
  yL += 4

  // 1.1 UBICACIÓN
  yL = sectionTitle(doc, COL_L_X, yL, COL_W, "1.1", "Ubicación del Inmueble")
  if (datos.mapaUbicacion) {
    const mapH = 36
    try {
      doc.addImage(datos.mapaUbicacion, "PNG", COL_L_X, yL, COL_W, mapH, undefined, "FAST")
    } catch {
      doc.setFillColor(...COLOR.bgAlt)
      doc.rect(COL_L_X, yL, COL_W, mapH, "F")
      doc.setTextColor(...COLOR.textMuted)
      doc.setFontSize(9)
      doc.text("Mapa no disponible", COL_L_X + 2, yL + mapH / 2)
    }
    doc.setDrawColor(...COLOR.border)
    doc.setLineWidth(0.3)
    doc.rect(COL_L_X, yL, COL_W, mapH, "S")
    yL += mapH + 2
  }
  const coordRows: Array<[string, string | null]> = [
    ["Latitud", datos.latitud != null ? datos.latitud.toFixed(6) : null],
    ["Longitud", datos.longitud != null ? datos.longitud.toFixed(6) : null],
  ]
  yL = fichaTabla(doc, COL_L_X, yL, COL_W, coordRows, { lineHeight: 5.2, fontSize: 8.5 })

  // ---------- COLUMNA DERECHA (P1) ----------
  // 5. RADAR DE EQUIPAMIENTOS
  yR = sectionTitle(doc, COL_R_X, yR, COL_W, "5", "Radar de Equipamientos y Servicios")
  yR = drawRadar(doc, COL_R_X, yR, COL_W, datos)
  yR += 3

  // 4. VIDA ÚTIL Y DEPRECIACIÓN (movida aquí para equilibrar la página 2)
  yR = sectionTitle(doc, COL_R_X, yR, COL_W, "4", "Vida Útil y Depreciación")
  yR = drawVidaUtil(doc, COL_R_X, yR, COL_W, datos)

  // Footer de la página 1
  drawPageFooter(doc, datos)

  // =========================================================
  // PÁGINA 2 — Fotografías + Valores + Listado + Mapa
  // =========================================================
  doc.addPage()
  drawMiniHeader(doc, datos)

  yL = HEADER_BOTTOM
  yR = HEADER_BOTTOM

  // ---------- COLUMNA IZQUIERDA (P2) ----------
  // 2. FOTOGRAFÍAS
  yL = sectionTitle(doc, COL_L_X, yL, COL_W, "2", "Fotografías del Inmueble")
  yL = drawFotos(doc, datos.fotos, COL_L_X, yL, COL_W)
  yL += 4

  // 3. RESUMEN DE VALORES
  yL = sectionTitle(doc, COL_L_X, yL, COL_W, "3", "Resumen de Valores")
  yL = drawResumenValores(doc, COL_L_X, yL, COL_W, datos)

  // ---------- COLUMNA DERECHA (P2) ----------
  // 6. LISTADO DE EQUIPAMIENTOS
  yR = sectionTitle(doc, COL_R_X, yR, COL_W, "6", "Listado de Equipamientos Cercanos")
  yR = drawListadoEquipamientos(doc, COL_R_X, yR, COL_W, datos)
  yR += 4

  // 7. MAPA DE EQUIPAMIENTOS + ANÁLISIS
  yR = sectionTitle(doc, COL_R_X, yR, COL_W, "7", "Mapa de Equipamientos")
  drawMapaEquipamientos(doc, COL_R_X, yR, COL_W, datos)

  // ---------- PIE DE P2: NOTA + FIRMA ----------
  drawNotaYFirma(doc, datos)

  // Footer de la página 2
  drawPageFooter(doc, datos)


  return doc
}

// ============================================================
// COMPONENTES DE DIBUJO
// ============================================================

function drawHeader(doc: jsPDF, datos: DatosAvaluo): void {
  // Banda superior fina dorada
  doc.setFillColor(...COLOR.gold)
  doc.rect(0, 0, PAGE_W, 1.2, "F")
  // Banda principal azul
  doc.setFillColor(...COLOR.primary)
  doc.rect(0, 1.2, PAGE_W, 22, "F")

  // Logo izquierdo
  let cursorX = MARGIN
  if (datos.logoIzquierdo) {
    try {
      doc.addImage(datos.logoIzquierdo, "PNG", cursorX, 4, 22, 16, undefined, "FAST")
      cursorX += 24
    } catch {
      /* noop */
    }
  }
  // Nombre empresa
  doc.setTextColor(...COLOR.white)
  doc.setFont("helvetica", "bold")
  doc.setFontSize(15)
  doc.text(datos.empresa, cursorX, 11)
  doc.setFont("helvetica", "normal")
  doc.setFontSize(8)
  doc.setTextColor(...COLOR.gold)
  doc.text(datos.subtitulo.toUpperCase(), cursorX, 16)

  // Logo derecho
  if (datos.logoDerecho) {
    try {
      doc.addImage(datos.logoDerecho, "PNG", PAGE_W - MARGIN - 22, 4, 22, 16, undefined, "FAST")
    } catch {
      /* noop */
    }
  }

  // N° de avalúo a la derecha (antes del logo derecho o debajo)
  doc.setTextColor(...COLOR.white)
  doc.setFont("helvetica", "bold")
  doc.setFontSize(9)
  doc.text(`N° ${datos.codigo}`, PAGE_W - MARGIN - 24, 21, { align: "right" })

  // ----- BARRA ADMINISTRATIVA -----
  const adminY = 27
  const adminRowH = 4.5
  const adminW = COL_W * 2 + COL_GAP
  doc.setFillColor(...COLOR.bg)
  doc.rect(MARGIN, 25, adminW, adminRowH, "F")
  doc.setDrawColor(...COLOR.border)
  doc.setLineWidth(0.2)
  doc.rect(MARGIN, 25, adminW, adminRowH, "S")

  const cols = [
    ["Fecha del Avalúo", datos.fechaElaboracion],
    ["Solicitante", textOrDefault(datos.solicitante)],
    ["Valuador", textOrDefault(datos.valuadorNombre)],
    ["Registro N°", textOrDefault(datos.valuadorRegistro ?? datos.codigo)],
  ]
  const colWidth = adminW / cols.length
  cols.forEach(([label, value], i) => {
    const cx = MARGIN + i * colWidth
    doc.setFont("helvetica", "normal")
    doc.setFontSize(6.5)
    doc.setTextColor(...COLOR.textMuted)
    doc.text(label.toUpperCase(), cx + 1.5, adminY - 1.5)
    doc.setFont("helvetica", "bold")
    doc.setFontSize(8)
    doc.setTextColor(...COLOR.text)
    const txt = doc.splitTextToSize(value, colWidth - 3)
    doc.text(txt[0] ?? "", cx + 1.5, adminY + 1.5)
    // Separador vertical
    if (i > 0) {
      doc.setDrawColor(...COLOR.border)
      doc.line(cx, 25.5, cx, 25 + adminRowH - 0.5)
    }
  })
}

/** Encabezado compacto para la página 2 (banda fina + identificación) */
function drawMiniHeader(doc: jsPDF, datos: DatosAvaluo): void {
  // Banda azul fina
  doc.setFillColor(...COLOR.primary)
  doc.rect(0, 0, PAGE_W, 18, "F")
  // Banda dorada superior
  doc.setFillColor(...COLOR.gold)
  doc.rect(0, 18, PAGE_W, 1, "F")

  // Logo izquierdo pequeño
  let cursorX = MARGIN
  if (datos.logoIzquierdo) {
    try {
      doc.addImage(datos.logoIzquierdo, "PNG", cursorX, 2, 16, 12, undefined, "FAST")
      cursorX += 18
    } catch {
      /* noop */
    }
  }
  doc.setTextColor(...COLOR.white)
  doc.setFont("helvetica", "bold")
  doc.setFontSize(11)
  doc.text(datos.empresa, cursorX, 8)
  doc.setFont("helvetica", "normal")
  doc.setFontSize(7.5)
  doc.setTextColor(...COLOR.gold)
  doc.text("Informe de Avalúo — Continuación", cursorX, 13)

  // Logo derecho pequeño
  if (datos.logoDerecho) {
    try {
      doc.addImage(datos.logoDerecho, "PNG", PAGE_W - MARGIN - 16, 2, 16, 12, undefined, "FAST")
    } catch {
      /* noop */
    }
  }
  // N° de avalúo
  doc.setTextColor(...COLOR.white)
  doc.setFont("helvetica", "bold")
  doc.setFontSize(9)
  doc.text(`N° ${datos.codigo}`, PAGE_W - MARGIN - 18, 15, { align: "right" })
}

function drawFotos(doc: jsPDF, fotos: FotoPDF[], x: number, y: number, w: number): number {
  if (fotos.length === 0) {
    const ph = 28
    doc.setFillColor(...COLOR.bgAlt)
    doc.rect(x, y, w, ph, "F")
    doc.setTextColor(...COLOR.textMuted)
    doc.setFontSize(9)
    doc.setFont("helvetica", "italic")
    doc.text("Sin fotografías registradas", x + w / 2, y + ph / 2, { align: "center" })
    return y + ph
  }

  // Grilla dinámica: hasta 4 por fila, hasta 2 filas (máximo 8 fotos).
  const maxPorFila = 4
  const maxFilas = 2
  const maxFotos = maxPorFila * maxFilas
  const aMostrar = Math.min(fotos.length, maxFotos)
  const nFilas = Math.ceil(aMostrar / maxPorFila)
  const porFila = nFilas === 1 ? aMostrar : maxPorFila

  const gap = 1.5
  const fw = (w - gap * (porFila - 1)) / porFila
  const fh = 26 // altura fija de cada thumb

  fotos.slice(0, aMostrar).forEach((f, i) => {
    const fila = Math.floor(i / porFila)
    const col = i % porFila
    const fx = x + col * (fw + gap)
    const fy = y + fila * (fh + gap)
    try {
      doc.addImage(f.dataUrl, "JPEG", fx, fy, fw, fh, undefined, "FAST")
    } catch {
      doc.setFillColor(...COLOR.bgAlt)
      doc.rect(fx, fy, fw, fh, "F")
    }
    // Borde discreto
    doc.setDrawColor(...COLOR.border)
    doc.setLineWidth(0.3)
    doc.rect(fx, fy, fw, fh, "S")
    // Etiqueta "PRAL." en la primera foto si hay varias
    if (i === 0 && aMostrar > 1) {
      doc.setFillColor(...COLOR.gold)
      doc.rect(fx, fy, 7, 3.5, "F")
      doc.setTextColor(...COLOR.primary)
      doc.setFont("helvetica", "bold")
      doc.setFontSize(5.5)
      doc.text("PRAL.", fx + 3.5, fy + 2.5, { align: "center" })
    }
  })

  const totalH = nFilas * fh + (nFilas - 1) * gap

  // Nota si hay más fotos de las mostradas
  if (fotos.length > maxFotos) {
    doc.setTextColor(...COLOR.textMuted)
    doc.setFont("helvetica", "italic")
    doc.setFontSize(7.5)
    doc.text(`+ ${fotos.length - maxFotos} fotografía(s) adicional(es) no mostradas`, x, y + totalH + 3.5)
    return y + totalH + 4
  }
  return y + totalH
}

function drawResumenValores(doc: jsPDF, x: number, y: number, w: number, d: DatosAvaluo): number {
  type Row = { concepto: string; valor: number | null; destacado?: boolean; positivo?: boolean; negativo?: boolean; subt?: string }
  const rows: Row[] = [
    { concepto: "Valor del Terreno", valor: d.valorTerreno, positivo: true },
    { concepto: "Construcción (Reposición)", valor: d.valorReposicionTotal },
    { concepto: "Depreciación", valor: d.depreciacionTotal, negativo: true },
    { concepto: "Valor Neto de Construcción", valor: d.valorNetoConstruccion },
    { concepto: "VALOR COMERCIAL TOTAL", valor: d.valorComercial, destacado: true },
  ]
  if (d.valorVentaRapida != null) rows.push({ concepto: "Valor de Venta Rápida", valor: d.valorVentaRapida, subt: "USD" })
  if (d.valorAlquiler != null) rows.push({ concepto: "Valor de Alquiler Mensual", valor: d.valorAlquiler, subt: "USD/mes" })
  if (d.valorCapitalComercial != null) rows.push({ concepto: "Valor de Capital Comercial", valor: d.valorCapitalComercial })

  const lh = 6

  rows.forEach((r, i) => {
    const ry = y + i * lh
    if (r.destacado) {
      doc.setFillColor(...COLOR.primary)
      doc.rect(x, ry - 4.5, w, lh + 0.5, "F")
      doc.setTextColor(...COLOR.gold)
      doc.setFont("helvetica", "bold")
      doc.setFontSize(9)
      doc.text(r.concepto, x + 2, ry)
      doc.setFontSize(12)
      doc.setTextColor(...COLOR.white)
      doc.text(money(r.valor), x + w - 2, ry, { align: "right" })
    } else {
      if (i % 2 === 0) {
        doc.setFillColor(...COLOR.bg)
        doc.rect(x, ry - 4.5, w, lh, "F")
      }
      doc.setFont("helvetica", "normal")
      doc.setFontSize(8.5)
      doc.setTextColor(...COLOR.textMuted)
      doc.text(r.concepto + (r.subt ? ` (${r.subt})` : ""), x + 2, ry)
      doc.setFont("helvetica", "bold")
      doc.setFontSize(9.5)
      if (r.positivo) doc.setTextColor(...COLOR.green)
      else if (r.negativo) doc.setTextColor(...COLOR.red)
      else doc.setTextColor(...COLOR.text)
      doc.text(money(r.valor), x + w - 2, ry, { align: "right" })
    }
  })

  // Borde
  doc.setDrawColor(...COLOR.border)
  doc.setLineWidth(0.3)
  doc.rect(x, y - 4.5, w, rows.length * lh, "S")
  return y + rows.length * lh
}

function drawVidaUtil(doc: jsPDF, x: number, y: number, w: number, d: DatosAvaluo): number {
  // Lado izquierdo: datos; lado derecho: donut
  const dataW = w * 0.62
  const donutCx = x + dataW + (w - dataW) / 2
  const donutCy = y + 13
  const donutR = 12

  // Donut
  donutDepreciacion(doc, donutCx, donutCy, donutR, donutR * 0.55, d.porcentajeDepreciacion)

  // Datos (izquierda)
  const vidaRows: Array<[string, string | null]> = [
    ["Vida Útil Total", `${d.vidaUtilTotal} años`],
    ["Año de Construcción", d.anoConstruccion != null ? String(d.anoConstruccion) : "—"],
    ["Años Transcurridos", `${d.anosTranscurridos} años`],
    ["Vida Útil Restante", `${d.vidaUtilRestante} años`],
  ]
  let yy = fichaTabla(doc, x, y, dataW, vidaRows, { lineHeight: 5, fontSize: 8 })
  // Fila extra de % con color
  yy += 1
  doc.setFont("helvetica", "bold")
  doc.setFontSize(8)
  doc.setTextColor(...COLOR.textMuted)
  doc.text("% Depreciación", x + 2, yy)
  doc.setTextColor(...COLOR.red)
  doc.setFontSize(9.5)
  doc.text(`${d.porcentajeDepreciacion.toFixed(2)}%`, x + dataW - 2, yy, { align: "right" })

  return Math.max(yy + 2, donutCy + donutR + 2)
}

function drawRadar(doc: jsPDF, x: number, y: number, w: number, d: DatosAvaluo): number {
  // Mapa radar (75mm — deja espacio para la leyenda y la sección de Vida Útil debajo)
  const mapH = 75
  if (d.mapaRadar) {
    try {
      doc.addImage(d.mapaRadar, "PNG", x, y, w, mapH, undefined, "FAST")
    } catch {
      doc.setFillColor(...COLOR.bgAlt)
      doc.rect(x, y, w, mapH, "F")
    }
  } else {
    doc.setFillColor(...COLOR.bgAlt)
    doc.rect(x, y, w, mapH, "F")
    doc.setTextColor(...COLOR.textMuted)
    doc.setFontSize(10)
    doc.setFont("helvetica", "italic")
    doc.text("Radar no disponible (coordenadas o equipamientos faltantes)", x + w / 2, y + mapH / 2, {
      align: "center",
    })
  }
  // Borde
  doc.setDrawColor(...COLOR.border)
  doc.setLineWidth(0.3)
  doc.rect(x, y, w, mapH, "S")

  // Leyenda compacta en 3 columnas debajo del radar
  let ly = y + mapH + 3
  doc.setFillColor(...COLOR.primary)
  doc.rect(x, ly - 3.5, w, 5, "F")
  doc.setFont("helvetica", "bold")
  doc.setFontSize(8)
  doc.setTextColor(...COLOR.white)
  doc.text("LEYENDA", x + 2, ly)
  doc.text(`RADIO: ${d.radioAnalisis} m`, x + w - 2, ly, { align: "right" })
  ly += 4

  const tipos = Object.keys(EQUIP_LABEL)
  const nCols = 3
  const rowsPerCol = Math.ceil(tipos.length / nCols) // 4 filas
  const subColW = w / nCols
  doc.setFontSize(7)
  tipos.slice(0, 12).forEach((t, i) => {
    const col = Math.floor(i / rowsPerCol)
    const row = i % rowsPerCol
    const lx = x + col * subColW
    const lyy = ly + row * 4
    const colorHex = COLOR_TIPO_EQUIPAMIENTO[t] ?? "#475569"
    const rgb = hexToRgb(colorHex)
    // Pin pequeño blanco con borde de color (mismo estilo que en el mapa)
    doc.setFillColor(...COLOR.white)
    doc.circle(lx + 1.5, lyy - 1, 1.3, "F")
    doc.setDrawColor(rgb[0], rgb[1], rgb[2])
    doc.setLineWidth(0.5)
    doc.circle(lx + 1.5, lyy - 1, 1.3, "S")
    doc.setFont("helvetica", "normal")
    doc.setTextColor(...COLOR.text)
    doc.text(EQUIP_LABEL[t], lx + 3.5, lyy)
  })
  ly += rowsPerCol * 4 + 1

  // Inmueble
  doc.setFillColor(...COLOR.gold)
  doc.circle(x + 1.5, ly - 1, 1.5, "F")
  doc.setDrawColor(...COLOR.white)
  doc.setLineWidth(0.4)
  doc.circle(x + 1.5, ly - 1, 1.5, "S")
  doc.setTextColor(...COLOR.text)
  doc.setFont("helvetica", "bold")
  doc.setFontSize(7.5)
  doc.text("INMUEBLE", x + 3.5, ly)

  return ly + 2
}

function drawListadoEquipamientos(
  doc: jsPDF,
  x: number,
  y: number,
  w: number,
  d: DatosAvaluo,
): number {
  const items = d.equipamientos.slice(0, 10)
  if (items.length === 0) {
    doc.setFillColor(...COLOR.bgAlt)
    doc.rect(x, y - 3, w, 8, "F")
    doc.setTextColor(...COLOR.textMuted)
    doc.setFontSize(7.5)
    doc.setFont("helvetica", "italic")
    doc.text("No se registran equipamientos cercanos", x + w / 2, y + 1, { align: "center" })
    return y + 5
  }

  // Encabezado de tabla
  const colNumW = w * 0.07
  const colTipoW = w * 0.20
  const colNombreW = w * 0.36
  const colDirW = w * 0.27
  const headerH = 5
  doc.setFillColor(...COLOR.primary)
  doc.rect(x, y - 4, w, headerH, "F")
  doc.setTextColor(...COLOR.white)
  doc.setFont("helvetica", "bold")
  doc.setFontSize(8)
  doc.text("#", x + colNumW / 2, y - 0.8, { align: "center" })
  doc.text("TIPO", x + colNumW + 1, y - 0.8)
  doc.text("NOMBRE", x + colNumW + colTipoW + 1, y - 0.8)
  doc.text("DIRECCIÓN", x + colNumW + colTipoW + colNombreW + 1, y - 0.8)
  doc.text("DIST.", x + w - 1, y - 0.8, { align: "right" })

  const lh = 5.5
  let yy = y + headerH - 4 + lh
  items.forEach((e, i) => {
    const numero = i + 1
    if (i % 2 === 0) {
      doc.setFillColor(...COLOR.bg)
      doc.rect(x, yy - 4, w, lh, "F")
    }
    // Pin numerado (mismo estilo que en el mapa)
    const colorHex = COLOR_TIPO_EQUIPAMIENTO[e.tipo] ?? "#475569"
    const rgb = hexToRgb(colorHex)
    doc.setFillColor(...COLOR.white)
    doc.circle(x + colNumW / 2, yy - 1.5, 1.8, "F")
    doc.setDrawColor(rgb[0], rgb[1], rgb[2])
    doc.setLineWidth(0.5)
    doc.circle(x + colNumW / 2, yy - 1.5, 1.8, "S")
    doc.setTextColor(rgb[0], rgb[1], rgb[2])
    doc.setFont("helvetica", "bold")
    doc.setFontSize(7)
    doc.text(String(numero), x + colNumW / 2, yy - 0.3, { align: "center" })

    doc.setFont("helvetica", "normal")
    doc.setFontSize(7.5)
    doc.setTextColor(...COLOR.textMuted)
    doc.text(EQUIP_LABEL[e.tipo] ?? e.tipo, x + colNumW + 1, yy, { maxWidth: colTipoW - 2 })
    doc.setTextColor(...COLOR.text)
    doc.setFont("helvetica", "bold")
    doc.text(e.nombre, x + colNumW + colTipoW + 1, yy, { maxWidth: colNombreW - 2 })
    doc.setFont("helvetica", "normal")
    doc.setTextColor(...COLOR.textMuted)
    doc.text(textOrDefault(e.direccion), x + colNumW + colTipoW + colNombreW + 1, yy, {
      maxWidth: colDirW - 2,
    })
    doc.setFont("helvetica", "bold")
    doc.setTextColor(...COLOR.primaryLight)
    doc.text(`${e.distancia} m`, x + w - 1, yy, { align: "right" })
    yy += lh
  })

  // Borde
  doc.setDrawColor(...COLOR.border)
  doc.setLineWidth(0.3)
  doc.rect(x, y - 4, w, yy - y + 4 - lh + 4, "S")
  return yy
}

function drawMapaEquipamientos(doc: jsPDF, x: number, y: number, w: number, d: DatosAvaluo): number {
  // Mapa a la izquierda (62%), análisis a la derecha (38%)
  const mapW = w * 0.62
  const analisisX = x + mapW + 2
  const analisisW = w - mapW - 2
  const mapH = 48

  if (d.mapaEquipamientos) {
    try {
      doc.addImage(d.mapaEquipamientos, "PNG", x, y, mapW, mapH, undefined, "FAST")
    } catch {
      doc.setFillColor(...COLOR.bgAlt)
      doc.rect(x, y, mapW, mapH, "F")
    }
  } else {
    doc.setFillColor(...COLOR.bgAlt)
    doc.rect(x, y, mapW, mapH, "F")
    doc.setTextColor(...COLOR.textMuted)
    doc.setFontSize(9)
    doc.setFont("helvetica", "italic")
    doc.text("Captura no disponible", x + mapW / 2, y + mapH / 2, { align: "center" })
  }
  doc.setDrawColor(...COLOR.border)
  doc.setLineWidth(0.3)
  doc.rect(x, y, mapW, mapH, "S")

  // Caja de análisis del entorno
  doc.setFillColor(...COLOR.bg)
  doc.rect(analisisX, y, analisisW, mapH, "F")
  doc.setDrawColor(...COLOR.border)
  doc.rect(analisisX, y, analisisW, mapH, "S")
  // Título
  doc.setFillColor(...COLOR.primary)
  doc.rect(analisisX, y, analisisW, 5.5, "F")
  doc.setTextColor(...COLOR.white)
  doc.setFont("helvetica", "bold")
  doc.setFontSize(8)
  doc.text("ANÁLISIS DE ENTORNO", analisisX + analisisW / 2, y + 3.7, { align: "center" })
  // Texto del análisis
  doc.setTextColor(...COLOR.text)
  doc.setFont("helvetica", "normal")
  doc.setFontSize(7.5)
  const txt = doc.splitTextToSize(d.analisisEntorno, analisisW - 3)
  doc.text(txt, analisisX + 1.5, y + 9, { lineHeightFactor: 1.2 })

  return y + mapH
}

// ============================================================
// COMPONENTES DE DIBUJO — PIE, FIRMA Y SELLOS
// ============================================================

function drawNotaYFirma(doc: jsPDF, datos: DatosAvaluo): void {
  const y = PAGE_H - 30
  const w = COL_W * 2 + COL_GAP
  doc.setDrawColor(...COLOR.border)
  doc.setLineWidth(0.3)
  doc.line(MARGIN, y, MARGIN + w, y)

  // NOTA (izquierda, 60%)
  const notaW = w * 0.6
  doc.setTextColor(...COLOR.primary)
  doc.setFont("helvetica", "bold")
  doc.setFontSize(7.5)
  doc.text("NOTA IMPORTANTE", MARGIN, y + 4)
  doc.setTextColor(...COLOR.textMuted)
  doc.setFont("helvetica", "italic")
  doc.setFontSize(5.8)
  const nota =
    "El presente avalúo ha sido elaborado por " +
    datos.empresa +
    " con fines informativos y técnicos. No constituye una tasación oficial para " +
    "entidades financieras. Este documento es válido únicamente con la firma y sello del valuador."
  const notaLines = doc.splitTextToSize(nota, notaW)
  doc.text(notaLines, MARGIN, y + 7.5, { lineHeightFactor: 1.15 })

  // FIRMA (derecha, 40%)
  const firmaX = MARGIN + notaW + 4
  const firmaW = w - notaW - 4
  doc.setDrawColor(...COLOR.text)
  doc.setLineWidth(0.4)
  doc.line(firmaX + 10, y + 14, firmaX + firmaW - 5, y + 14)
  doc.setTextColor(...COLOR.text)
  doc.setFont("helvetica", "bold")
  doc.setFontSize(8)
  doc.text(textOrDefault(datos.valuadorNombre), firmaX + firmaW / 2, y + 18, { align: "center" })
  doc.setFont("helvetica", "normal")
  doc.setFontSize(6)
  doc.setTextColor(...COLOR.textMuted)
  doc.text("VALUADOR", firmaX + firmaW / 2, y + 21.5, { align: "center" })
  doc.text(
    `REG. ${textOrDefault(datos.valuadorRegistro ?? datos.codigo)}`,
    firmaX + firmaW / 2,
    y + 24.5,
    { align: "center" },
  )

  // Sello de estado (esquina superior derecha del bloque firma)
  drawSelloEstado(doc, firmaX + firmaW - 8, y + 8, datos.estado)
}

function drawSelloEstado(doc: jsPDF, cx: number, cy: number, estado: string): void {
  const config: Record<string, { color: [number, number, number]; texto: string; rot: number }> = {
    APROBADO: { color: COLOR.green, texto: "APROBADO", rot: 12 },
    BORRADOR: { color: COLOR.red, texto: "BORRADOR", rot: -10 },
    EN_REVISION: { color: COLOR.gold, texto: "EN REVISIÓN", rot: 8 },
    RECHAZADO: { color: COLOR.red, texto: "RECHAZADO", rot: -12 },
  }
  const cfg = config[estado]
  if (!cfg) return
  // Sello circular semitransparente (aprox: solo borde + texto)
  doc.setDrawColor(...cfg.color)
  doc.setLineWidth(0.6)
  doc.circle(cx, cy, 7, "S")
  doc.setLineWidth(0.3)
  doc.circle(cx, cy, 5.5, "S")
  doc.setTextColor(cfg.color[0], cfg.color[1], cfg.color[2])
  doc.setFont("helvetica", "bold")
  doc.setFontSize(5)
  doc.text(cfg.texto, cx, cy + 1, { align: "center", angle: cfg.rot })
}

function drawPageFooter(doc: jsPDF, datos: DatosAvaluo): void {
  const totalPages = doc.getNumberOfPages()
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i)
    doc.setDrawColor(...COLOR.border)
    doc.setLineWidth(0.2)
    doc.line(MARGIN, PAGE_H - 4, PAGE_W - MARGIN, PAGE_H - 4)
    doc.setFont("helvetica", "normal")
    doc.setFontSize(6)
    doc.setTextColor(...COLOR.textMuted)
    doc.text(
      `${datos.empresa} · ${datos.subtitulo} · Generado con GeoPricer Avalúos Pro`,
      MARGIN,
      PAGE_H - 1.5,
    )
    doc.text(`Página ${i} de ${totalPages}`, PAGE_W - MARGIN, PAGE_H - 1.5, { align: "right" })
  }
}

// ============================================================
// UTILIDADES
// ============================================================

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace("#", "")
  return [
    parseInt(h.substring(0, 2), 16),
    parseInt(h.substring(2, 4), 16),
    parseInt(h.substring(4, 6), 16),
  ]
}

export function descargarPDF(doc: jsPDF, filename: string): void {
  doc.save(filename)
}
