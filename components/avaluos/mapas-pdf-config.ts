/**
 * Configuración compartida de capas de mapas para los componentes de captura
 * del PDF. Usa Esri World Imagery (imágenes satelitales gratuitas, sin API key)
 * con una capa de etiquetas para legibilidad.
 */

export const SATELLITE_TILES = {
  url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
  attribution: "&copy; Esri, Maxar, Earthstar Geographics",
  maxZoom: 19,
} as const

export const SATELLITE_LABELS = {
  url: "https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}",
  attribution: "",
  maxZoom: 19,
} as const

/**
 * Capa de transporte (calles, autopistas) sobre el satélite.
 * Da el efecto "híbrido" tipo Google Maps: la foto aérea + nombres de calles.
 */
export const SATELLITE_TRANSPORT = {
  url: "https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Transportation/MapServer/tile/{z}/{y}/{x}",
  attribution: "",
  maxZoom: 19,
} as const

/**
 * Paleta de colores por tipo de equipamiento. Coincide con la leyenda que
 * dibuja el PDF para que marcadores y leyenda sean consistentes.
 */
export const COLOR_TIPO_EQUIPAMIENTO: Record<string, string> = {
  HOSPITAL: "#dc2626", // rojo
  CLINICA: "#ea580c", // naranja oscuro
  UNIVERSIDAD: "#7c3aed", // violeta
  COLEGIO: "#2563eb", // azul
  MERCADO: "#ca8a04", // amarillo-oscuro (legible sobre satélite)
  PARQUE: "#16a34a", // verde
  BANCO: "#0891b2", // cian
  IGLESIA: "#c026d3", // magenta
  TRANSPORTE: "#475569", // gris pizarra
  CENTRO_COMERCIAL: "#db2777", // rosa
  ENTIDAD_PUBLICA: "#0d9488", // teal
}

export function colorPorTipo(tipo: string): string {
  return COLOR_TIPO_EQUIPAMIENTO[tipo] ?? "#475569"
}
