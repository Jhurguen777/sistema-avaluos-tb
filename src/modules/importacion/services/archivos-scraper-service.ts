/**
 * Archivos Scraper Service (módulo importación)
 * Lista y lee los JSONs generados por el módulo scraper en scraper-output/.
 * Toda ruta se valida dentro de ese directorio (protección path traversal).
 */

import fs from "fs/promises"
import path from "path"

/** Raíz de salida de los scrapers */
const RAIZ_SALIDA = path.join(process.cwd(), "scraper-output")

/** Un archivo JSON generado por un scraper */
export interface ArchivoScraper {
  /** Nombre del archivo (ej. casas_venta.json) */
  nombre: string
  /** Ruta relativa a scraper-output/ con barras normales */
  rutaRelativa: string
  /** Tamaño en bytes */
  tamanoBytes: number
  /** Fecha de modificación ISO */
  modificado: string
}

/** Una carpeta de resultados (ej. C21-casasventa(2026-08-14)) */
export interface CarpetaScraper {
  /** Nombre de la carpeta */
  nombre: string
  /** Fuente detectada desde el prefijo del nombre (C21- / REM-) */
  fuente: "C21" | "REMAX" | "OTRO"
  /** JSONs dentro de la carpeta */
  archivos: ArchivoScraper[]
}

/** Carpeta madre por fuente (scraper-output/C21, scraper-output/REMAX) */
export interface GrupoScraper {
  fuente: "C21" | "REMAX" | "OTRO"
  /** Carpetas de resultados dentro de la carpeta madre (más recientes primero) */
  carpetas: CarpetaScraper[]
}

/** Contenido leído de un JSON del scraper */
export interface JsonScraperLeido {
  nombre: string
  rutaRelativa: string
  /** Número de registros (si es array) */
  total: number
  /** Contenido parseado */
  datos: unknown
}

/** Nombres de las carpetas madre en la raíz de scraper-output/ */
const CARPETAS_MADRE: Record<"C21" | "REMAX", string> = { C21: "C21", REMAX: "REMAX" }

/** Detecta la fuente desde el prefijo del nombre de una carpeta de resultados */
function fuenteDeNombre(nombre: string): CarpetaScraper["fuente"] {
  return nombre.startsWith("C21-") ? "C21" : nombre.startsWith("REM-") ? "REMAX" : "OTRO"
}

/** Lee los JSONs de una carpeta de resultados; null si no tiene ninguno */
async function leerArchivosDeCarpeta(
  rutaAbsoluta: string,
  rutaRelativa: string,
): Promise<ArchivoScraper[] | null> {
  const archivos: ArchivoScraper[] = []
  for (const archivo of await fs.readdir(rutaAbsoluta)) {
    if (!archivo.toLowerCase().endsWith(".json")) continue
    try {
      const statArchivo = await fs.stat(path.join(rutaAbsoluta, archivo))
      archivos.push({
        nombre: archivo,
        rutaRelativa: `${rutaRelativa}/${archivo}`,
        tamanoBytes: statArchivo.size,
        modificado: statArchivo.mtime.toISOString(),
      })
    } catch {
      continue
    }
  }
  if (archivos.length === 0) return null
  archivos.sort((a, b) => Date.parse(b.modificado) - Date.parse(a.modificado))
  return archivos
}

/**
 * Lista los grupos (carpetas madre C21/ REMAX/) con sus carpetas de resultados
 * y JSONs, más recientes primero. Las carpetas legadas que queden en la raíz
 * (de scrapes previos a la estructura por fuente) se agrupan por su prefijo.
 */
export async function listarArchivosScraper(): Promise<GrupoScraper[]> {
  let entradas: string[]
  try {
    entradas = await fs.readdir(RAIZ_SALIDA)
  } catch {
    // El directorio aún no existe (nunca se ejecutó un scraper)
    return []
  }

  const grupos = new Map<CarpetaScraper["fuente"], CarpetaScraper[]>()
  const agregar = (carpeta: CarpetaScraper) => {
    const lista = grupos.get(carpeta.fuente) ?? []
    lista.push(carpeta)
    grupos.set(carpeta.fuente, lista)
  }

  for (const nombre of entradas) {
    const ruta = path.join(RAIZ_SALIDA, nombre)
    let stat
    try {
      stat = await fs.stat(ruta)
    } catch {
      continue
    }
    if (!stat.isDirectory()) continue

    if (nombre === CARPETAS_MADRE.C21 || nombre === CARPETAS_MADRE.REMAX) {
      // Carpeta madre: listar los scrapes que contiene (un nivel hacia abajo)
      const fuente = nombre === CARPETAS_MADRE.C21 ? "C21" : "REMAX"
      for (const sub of await fs.readdir(ruta)) {
        const rutaSub = path.join(ruta, sub)
        let statSub
        try {
          statSub = await fs.stat(rutaSub)
        } catch {
          continue
        }
        if (!statSub.isDirectory()) continue
        const archivos = await leerArchivosDeCarpeta(rutaSub, `${nombre}/${sub}`)
        if (archivos) agregar({ nombre: sub, fuente, archivos })
      }
    } else {
      // Carpeta legada en la raíz (creada antes de la estructura por fuente)
      const archivos = await leerArchivosDeCarpeta(ruta, nombre)
      if (archivos) agregar({ nombre, fuente: fuenteDeNombre(nombre), archivos })
    }
  }

  const ordenFuente: CarpetaScraper["fuente"][] = ["C21", "REMAX", "OTRO"]
  return ordenFuente
    .filter((f) => grupos.has(f))
    .map((f) => {
      const carpetas = grupos
        .get(f)!
        .sort((a, b) => Date.parse(b.archivos[0].modificado) - Date.parse(a.archivos[0].modificado))
      return { fuente: f, carpetas }
    })
}

/**
 * Lee y parsea un JSON de scraper-output/ por su ruta relativa.
 * Lanza Error si la ruta escapa del directorio o el archivo no es válido.
 */
export async function leerJsonScraper(rutaRelativa: string): Promise<JsonScraperLeido> {
  const normalizada = path.normalize(rutaRelativa).replace(/\\/g, "/")
  if (path.isAbsolute(normalizada) || normalizada.startsWith("..")) {
    throw new Error("Ruta inválida")
  }
  const rutaAbsoluta = path.join(RAIZ_SALIDA, normalizada)
  if (!rutaAbsoluta.startsWith(RAIZ_SALIDA + path.sep)) {
    throw new Error("Ruta fuera del directorio de salida del scraper")
  }

  let contenido: string
  try {
    contenido = await fs.readFile(rutaAbsoluta, "utf-8")
  } catch {
    throw new Error("No se pudo leer el archivo. Puede que haya sido eliminado.")
  }

  let datos: unknown
  try {
    datos = JSON.parse(contenido)
  } catch {
    throw new Error("El archivo no contiene un JSON válido")
  }

  const total = Array.isArray(datos) ? datos.length : 0
  const nombre = normalizada.split("/").pop() || normalizada
  return { nombre, rutaRelativa: normalizada, total, datos }
}
