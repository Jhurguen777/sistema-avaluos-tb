import jsPDF from "jspdf"

interface DatosAvaluo {
  codigo: string
  tipo: string
  fechaElaboracion: string
  solicitante?: string
  propietario?: string
  direccion: string
  zona: string
  categoria: string
  operacion: string

  // Terreno
  superficieTerreno: number
  frente: number
  fondo: number
  formaLote: string
  valorTerreno: number

  // Construcción
  anioConstruccion: number
  estadoConservacion: string
  categoriaConstruccion: string
  niveles: number
  valorReposicion: number
  depreciacion: number
  valorConstruccion: number

  // Resultado
  valorTotal: number

  // Mapa (base64)
  imagenMapa?: string
}

export function generarPDFAvaluo(datos: DatosAvaluo) {
  const doc = new jsPDF("p", "mm", "a4")
  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  const margin = 15
  let y = margin

  // Colores
  const primaryColor = [59, 130, 246] as const // blue
  const textColor = [30, 41, 59] as const // slate

  // ==================== HEADER ====================
  // Logo y título
  if (datos.imagenMapa) {
    try {
      doc.addImage(datos.imagenMapa, "PNG", margin, y, 30, 30)
    } catch (e) {
      // Si no hay logo, dibujar un placeholder
      doc.setFillColor(...primaryColor)
      doc.circle(margin + 15, y + 15, 10, "F")
      doc.setTextColor(255, 255, 255)
      doc.setFontSize(8)
      doc.text("GP", margin + 15, y + 15, { align: "center" })
    }
  }

  // Título
  doc.setTextColor(...primaryColor)
  doc.setFont("helvetica", "bold")
  doc.setFontSize(18)
  doc.text("GEOPRICER AVALÚOS PRO", pageWidth - margin, y + 10, { align: "right" })

  doc.setTextColor(...textColor)
  doc.setFont("helvetica", "normal")
  doc.setFontSize(10)
  doc.text("Sistema Profesional de Avalúos Inmobiliarios", pageWidth - margin, y + 16, { align: "right" })

  y += 40

  // Línea separadora
  doc.setDrawColor(...primaryColor)
  doc.setLineWidth(0.5)
  doc.line(margin, y, pageWidth - margin, y)
  y += 10

  // ==================== INFORMACIÓN DEL AVALÚO ====================
  doc.setTextColor(...primaryColor)
  doc.setFont("helvetica", "bold")
  doc.setFontSize(14)
  doc.text("INFORME DE AVALÚO", margin, y)
  y += 8

  doc.setTextColor(...textColor)
  doc.setFont("helvetica", "normal")
  doc.setFontSize(10)

  const infoAvaluo = [
    ["Código:", datos.codigo],
    ["Fecha:", datos.fechaElaboracion],
    ["Tipo:", datos.tipo],
    ["Operación:", datos.operacion],
    ["Categoría:", datos.categoria]
  ]

  infoAvaluo.forEach(([label, value]) => {
    doc.setFont("helvetica", "bold")
    doc.text(label, margin, y)
    doc.setFont("helvetica", "normal")
    doc.text(value, margin + 25, y)
    y += 6
  })

  y += 5

  // Solicitante y Propietario
  if (datos.solicitante || datos.propietario) {
    doc.setDrawColor(200, 200, 200)
    doc.line(margin, y, pageWidth - margin, y)
    y += 8

    if (datos.solicitante) {
      doc.setFont("helvetica", "bold")
      doc.text("Solicitante:", margin, y)
      doc.setFont("helvetica", "normal")
      doc.text(datos.solicitante, margin + 25, y)
      y += 6
    }

    if (datos.propietario) {
      doc.setFont("helvetica", "bold")
      doc.text("Propietario:", margin, y)
      doc.setFont("helvetica", "normal")
      doc.text(datos.propietario, margin + 25, y)
      y += 6
    }

    y += 5
  }

  // ==================== UBICACIÓN ====================
  doc.setDrawColor(...primaryColor)
  doc.line(margin, y, pageWidth - margin, y)
  y += 8

  doc.setTextColor(...primaryColor)
  doc.setFont("helvetica", "bold")
  doc.setFontSize(12)
  doc.text("UBICACIÓN DEL INMUEBLE", margin, y)
  y += 8

  doc.setTextColor(...textColor)
  doc.setFont("helvetica", "normal")
  doc.setFontSize(10)

  doc.text(`Dirección: ${datos.direccion}`, margin, y)
  y += 6
  doc.text(`Zona: ${datos.zona}`, margin, y)
  y += 10

  // Mapa
  if (datos.imagenMapa) {
    try {
      doc.addImage(datos.imagenMapa, "PNG", margin, y, pageWidth - margin * 2, 80)
      y += 85
    } catch (e) {
      doc.text("(Mapa no disponible)", margin, y)
      y += 10
    }
  }

  // Nueva página para detalles
  doc.addPage()
  y = margin

  // ==================== DATOS DEL TERRENO ====================
  doc.setTextColor(...primaryColor)
  doc.setFont("helvetica", "bold")
  doc.setFontSize(12)
  doc.text("DATOS DEL TERRENO", margin, y)
  y += 8

  doc.setTextColor(...textColor)
  doc.setFont("helvetica", "normal")
  doc.setFontSize(10)

  const datosTerreno = [
    ["Superficie:", `${datos.superficieTerreno} m²`],
    ["Frente:", `${datos.frente} m`],
    ["Fondo:", `${datos.fondo} m`],
    ["Forma del Lote:", datos.formaLote],
    ["Valor Unitario:", `$${datos.valorTerreno / datos.superficieTerreno} / m²`],
    ["Valor del Terreno:", `$${datos.valorTerreno.toLocaleString()}`]
  ]

  datosTerreno.forEach(([label, value]) => {
    doc.setFont("helvetica", "bold")
    doc.text(label, margin, y)
    doc.setFont("helvetica", "normal")
    doc.text(value, margin + 30, y)
    y += 6
  })

  y += 10

  // ==================== DATOS DE LA CONSTRUCCIÓN ====================
  doc.setDrawColor(...primaryColor)
  doc.line(margin, y, pageWidth - margin, y)
  y += 8

  doc.setTextColor(...primaryColor)
  doc.setFont("helvetica", "bold")
  doc.setFontSize(12)
  doc.text("DATOS DE LA CONSTRUCCIÓN", margin, y)
  y += 8

  doc.setTextColor(...textColor)
  doc.setFont("helvetica", "normal")
  doc.setFontSize(10)

  const datosConstruccion = [
    ["Año de Construcción:", datos.anioConstruccion.toString()],
    ["Estado de Conservación:", datos.estadoConservacion],
    ["Categoría:", datos.categoriaConstruccion],
    ["Número de Niveles:", datos.niveles.toString()],
    ["Valor de Reposición:", `$${datos.valorReposicion.toLocaleString()}`],
    ["Depreciación:", `${datos.depreciacion.toFixed(2)}%`],
    ["Valor Neto Construcción:", `$${datos.valorConstruccion.toLocaleString()}`]
  ]

  datosConstruccion.forEach(([label, value]) => {
    doc.setFont("helvetica", "bold")
    doc.text(label, margin, y)
    doc.setFont("helvetica", "normal")
    doc.text(value, margin + 40, y)
    y += 6
  })

  y += 10

  // ==================== RESULTADO DEL AVALÚO ====================
  doc.setDrawColor(...primaryColor)
  doc.setLineWidth(1)
  doc.line(margin, y, pageWidth - margin, y)
  y += 10

  doc.setTextColor(...primaryColor)
  doc.setFont("helvetica", "bold")
  doc.setFontSize(14)
  doc.text("RESULTADO DEL AVALÚO", margin, y)
  y += 10

  // Box de resumen
  const boxY = y
  const boxHeight = 40

  doc.setDrawColor(...primaryColor)
  doc.setFillColor(...primaryColor)
  doc.roundedRect(margin, boxY, pageWidth - margin * 2, boxHeight, 3, 3, "S")

  // Valor Terreno
  doc.setTextColor(255, 255, 255)
  doc.setFont("helvetica", "bold")
  doc.setFontSize(10)
  doc.text("VALOR DEL TERRENO", margin + 5, boxY + 8)
  doc.setFontSize(16)
  doc.text(`$${datos.valorTerreno.toLocaleString()}`, margin + 5, boxY + 18)

  // Valor Construcción
  doc.setFontSize(10)
  doc.text("VALOR DE CONSTRUCCIÓN", pageWidth / 2, boxY + 8)
  doc.setFontSize(16)
  doc.text(`$${datos.valorConstruccion.toLocaleString()}`, pageWidth / 2, boxY + 18)

  // Valor Total
  doc.setFontSize(11)
  doc.text("VALOR TOTAL DEL AVALÚO", margin + 5, boxY + 30)
  doc.setFontSize(20)
  doc.text(`$${datos.valorTotal.toLocaleString()}`, margin + 5, boxY + 38)

  y = boxY + boxHeight + 15

  // ==================== FIRMA Y FECHA ====================
  doc.setDrawColor(200, 200, 200)
  doc.line(margin, y, pageWidth - margin, y)
  y += 15

  doc.setTextColor(...textColor)
  doc.setFont("helvetica", "normal")
  doc.setFontSize(10)
  doc.text(`Fecha de Emisión: ${datos.fechaElaboracion}`, margin, y)

  doc.text("Firma del Valuador:", pageWidth - margin - 40, y)
  y += 20
  doc.setDrawColor(...textColor)
  doc.line(pageWidth - margin - 40, y, pageWidth - margin, y)
  doc.setFontSize(8)
  doc.text("(Firma)", pageWidth - margin - 20, y + 3, { align: "center" })

  // ==================== FOOTER ====================
  doc.setFontSize(8)
  doc.setTextColor(150, 150, 150)
  doc.text(
    "Este avalúo ha sido generado mediante GeoPricer Avalúos Pro - Sistema Profesional de Avalúos Inmobiliarios",
    pageWidth / 2,
    pageHeight - 10,
    { align: "center" }
  )
  doc.text(
    `Página 1 de 1`,
    pageWidth / 2,
    pageHeight - 6,
    { align: "center" }
  )

  return doc
}

export function descargarPDF(doc: jsPDF, filename: string) {
  doc.save(filename)
}
