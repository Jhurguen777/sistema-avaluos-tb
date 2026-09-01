/**
 * Tipos del módulo Scraper
 * Ejecución de scrapers de Python (C21 / RE/MAX) como jobs en memoria,
 * individuales o por lote secuencial (catálogo de URLs).
 */

/** Fuentes de scraping soportadas */
export type ScraperFuente = "C21" | "REMAX"

/** Estado del job de scraping */
export type ScraperJobEstado = "EJECUTANDO" | "COMPLETADO" | "ERROR" | "CANCELADO"

/** Estado de un item (URL) dentro del lote */
export type ScraperItemEstado = "PENDIENTE" | "EJECUTANDO" | "COMPLETADO" | "ERROR" | "CANCELADO"

/** Una línea de log del proceso Python */
export interface ScraperLogLine {
  /** Número secuencial de la línea (para polling incremental) */
  seq: number
  /** Origen de la línea */
  stream: "stdout" | "stderr" | "info"
  /** Marca de tiempo ISO */
  ts: string
  /** Contenido de la línea */
  texto: string
}

/** Resultado de una URL dentro del lote */
export interface ScraperItemResultado {
  /** Etiqueta legible (ej. "C21 · Casas en venta") */
  etiqueta: string
  /** URL scrapeada */
  url: string
  estado: ScraperItemEstado
  /** Propiedades extraídas (si se detectó) */
  totalPropiedades?: number
  /** Ruta relativa del JSON generado (dentro de scraper-output/) */
  archivoSalida?: string
  /** Mensaje de error si falló */
  error?: string
  /** ISO de inicio de ejecución del item (para progreso/ETA en vivo) */
  iniciadoEn?: string
  /** ISO de finalización del item (para duración por URL) */
  finalizadoEn?: string
  /** Página que scrapea el script ahora (progreso en vivo por páginas) */
  paginaActual?: number
  /** Total de páginas: exacto (RE/MAX last_page) o estimado (C21) */
  paginasTotales?: number
  /** True si paginasTotales es estimación (C21 no expone total de páginas) */
  paginasEstimadas?: boolean
  /** Propiedades acumuladas hasta el momento (contador en vivo) */
  propsAcumuladas?: number
}

/** Información visible de un job de scraping (serializable) */
export interface ScraperJobInfo {
  /** Identificador único del job */
  id: string
  /** Estado actual del job completo */
  estado: ScraperJobEstado
  /** Logs acumulados de todos los items */
  logs: ScraperLogLine[]
  /** ISO de inicio */
  iniciadoEn: string
  /** ISO de finalización (si terminó) */
  finalizadoEn?: string
  /** Duración total en ms (si terminó) */
  duracionMs?: number
  /** Resultados por URL (1 item = jobs individuales o de catálogo) */
  items: ScraperItemResultado[]
  /** Índice del item en ejecución (informativo) */
  itemActual?: number
}

/** Entrada para iniciar un scraping (un item = una URL con etiqueta) */
export interface ScraperPeticionItem {
  etiqueta: string
  url: string
}
