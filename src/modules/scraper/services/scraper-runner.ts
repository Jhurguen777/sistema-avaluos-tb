/**
 * Scraper Runner Service
 * Administrador de jobs en memoria que ejecuta los scrapers de Python
 * (python/c21_scraper_flexible.py / python/remax_scraper_flexible.py),
 * individualmente o en lotes secuenciales (catálogo de URLs).
 *
 * Nota: el estado vive en el proceso de Node (como el rate-limiter).
 * Si el proceso se reinicia a mitad de un scrape, el job se pierde
 * (los JSONs ya escritos en scraper-output/ sí persisten).
 */

import { spawn, type ChildProcess } from "child_process"
import fs from "fs"
import path from "path"
import type {
  ScraperFuente,
  ScraperJobInfo,
  ScraperLogLine,
  ScraperPeticionItem,
} from "../types/scraper.types"

/** Detecta la fuente desde la URL (para elegir el script) */
function fuenteDeUrl(url: string): ScraperFuente {
  return url.includes("remax.bo") ? "REMAX" : "C21"
}

/** Job interno con estado vivo del proceso */
interface JobInterno {
  info: ScraperJobInfo
  /** Proceso Python del item actual (null entre items) */
  proc: ChildProcess | null
  /** true si el usuario solicitó detener el lote completo */
  detenerSolicitado: boolean
  /** Ejecuta el siguiente item pendiente */
  ejecutarSiguiente: () => void
}

/** Mapa de script por fuente (whitelist fija: nunca rutas arbitrarias) */
const SCRIPTS: Record<ScraperFuente, string> = {
  C21: "c21_scraper_flexible.py",
  REMAX: "remax_scraper_flexible.py",
}

/**
 * Límite duro de ejecución por item (minutos), configurable con SCRAPER_LIMITE_MIN.
 * Si la variable está ausente o contiene un valor no numérico, se usa 30 (nunca
 * queda sin límite por un typo en el .env).
 */
const LIMITE_MIN_POR_ITEM = (() => {
  const v = parseInt(process.env.SCRAPER_LIMITE_MIN || "30", 10)
  return Number.isFinite(v) && v > 0 ? v : 30
})()

/** Límite duro de ejecución por item: LIMITE_MIN_POR_ITEM minutos */
const LIMITE_MS_POR_ITEM = LIMITE_MIN_POR_ITEM * 60 * 1000

/**
 * Mata el proceso Python con plan B: si tras la señal normal sigue vivo
 * (exitCode null), se remata con fuerza (taskkill /F /T en Windows, SIGKILL
 * en Unix). Evita que un proceso zombi deje el job en "EJECUTANDO" para
 * siempre y bloquee nuevos scrapings.
 */
function matarProceso(proc: ChildProcess): void {
  if (proc.pid === undefined) return
  proc.kill()
  setTimeout(() => {
    // exitCode/signalCode null = el proceso aún no terminó
    if (proc.exitCode === null && proc.signalCode === null) {
      try {
        if (process.platform === "win32") {
          // /T también mata los procesos hijos que haya spawneado Python
          spawn("taskkill", ["/F", "/T", "/PID", String(proc.pid)], { stdio: "ignore" })
        } else {
          proc.kill("SIGKILL")
        }
      } catch (e) {
        console.error("No se pudo rematar el proceso del scraper:", e)
      }
    }
  }, 2000)
}

/** Pausa entre items del lote para no saturar la inmobiliaria */
const PAUSA_ENTRE_ITEMS_MS = 3000

/** Directorio raíz de salida de los scrapers (relativo al cwd del proceso) */
export function rutaSalidaScraper(): string {
  return path.join(process.cwd(), "scraper-output")
}

/** Directorio de los scripts Python */
function rutaScripts(): string {
  return path.join(process.cwd(), "python")
}

/** Ejecutable de Python: sobrescribible con PYTHON_BIN; en Windows "python" */
function binPython(): string {
  return process.env.PYTHON_BIN || (process.platform === "win32" ? "python" : "python3")
}

/** Contadores para generar IDs legibles */
let contadorJobs = 0

class ScraperRunner {
  private jobs = new Map<string, JobInterno>()
  /** Último job creado (para restaurar la vista al volver a la página) */
  private ultimoId: string | null = null

  /** Devuelve el job en ejecución, si existe */
  private jobActivo(): JobInterno | null {
    for (const job of this.jobs.values()) {
      if (job.info.estado === "EJECUTANDO") return job
    }
    return null
  }

  /** Copia serializable del job (sin referencias vivas) */
  private obtenerInfo(job: JobInterno): ScraperJobInfo {
    return { ...job.info, logs: [...job.info.logs] }
  }

  /** Inicia un job (individual o lote). Lanza Error si ya hay uno en ejecución. */
  iniciar(items: ScraperPeticionItem[]): ScraperJobInfo {
    const enCurso = this.jobActivo()
    if (enCurso) {
      throw new Error(
        `Ya hay un scraping en ejecución (iniciado ${enCurso.info.iniciadoEn}). Espera a que termine o cancélalo.`,
      )
    }

    // Verificar scripts necesarios antes de empezar
    for (const script of new Set(items.map((i) => SCRIPTS[fuenteDeUrl(i.url)]))) {
      if (!fs.existsSync(path.join(rutaScripts(), script))) {
        throw new Error(`No se encontró el script del scraper: ${script}`)
      }
    }

    // Garantizar directorio de salida
    fs.mkdirSync(rutaSalidaScraper(), { recursive: true })

    contadorJobs += 1
    const id = `scrape-${Date.now()}-${contadorJobs}`

    const job: JobInterno = {
      info: {
        id,
        estado: "EJECUTANDO",
        iniciadoEn: new Date().toISOString(),
        logs: [],
        items: items.map((item) => ({ ...item, estado: "PENDIENTE" })),
      },
      proc: null,
      detenerSolicitado: false,
      ejecutarSiguiente: () => {},
    }
    this.jobs.set(id, job)
    this.ultimoId = id

    let seq = 0
    const log = (texto: string, stream: ScraperLogLine["stream"] = "info") => {
      seq += 1
      job.info.logs.push({ seq, stream, ts: new Date().toISOString(), texto })
      // Limitar memoria: conservar como máximo 4000 líneas por job
      if (job.info.logs.length > 4000) job.info.logs.splice(0, job.info.logs.length - 4000)
    }

    log(`Lote de scraping iniciado: ${items.length} URL${items.length === 1 ? "" : "s"}.`)
    log(`Python: ${binPython()} · Salida: scraper-output/`)

    job.ejecutarSiguiente = () => {
      if (job.detenerSolicitado || job.info.estado !== "EJECUTANDO") {
        this.finalizarJob(job, log)
        return
      }
      const indice = job.info.items.findIndex((i) => i.estado === "PENDIENTE")
      if (indice === -1) {
        this.finalizarJob(job, log)
        return
      }

      const item = job.info.items[indice]
      item.estado = "EJECUTANDO"
      item.iniciadoEn = new Date().toISOString()
      job.info.itemActual = indice
      const fuente = fuenteDeUrl(item.url)

      log("")
      log(`${"=".repeat(60)}`)
      log(`[${indice + 1}/${job.info.items.length}] ${item.etiqueta}`)
      log(`${"=".repeat(60)}`)
      log(`URL: ${item.url}`)

      let timerLimite: NodeJS.Timeout | null = null
      /** true si el item actual fue cancelado por exceder el límite de tiempo */
      let limiteExcedido = false
      // Script por ruta ABSOLUTA: el cwd es scraper-output/ (donde el script escribe),
      // así que un nombre relativo haría que Python lo busque dentro de scraper-output/.
      const proc = spawn(binPython(), [path.join(rutaScripts(), SCRIPTS[fuente]), item.url], {
        cwd: rutaSalidaScraper(),
        stdio: ["ignore", "pipe", "pipe"], // stdin ignorado: nunca llamar input()
        env: {
          ...process.env,
          // Forzar UTF-8 en stdout/stderr (acentos españoles en Windows)
          PYTHONUTF8: "1",
          PYTHONIOENCODING: "utf-8",
        },
      })
      job.proc = proc

      // Buffers para estimar el total de páginas de C21 (no expone last_page)
      let totalHitsItem = 0
      let porPaginaItem = 0

      const manejarSalida = (chunk: Buffer, stream: "stdout" | "stderr") => {
        const texto = chunk.toString("utf-8")
        for (const linea of texto.split(/\r?\n/)) {
          if (linea.trim().length === 0) continue
          log(linea, stream)

          // Progreso en vivo del item (líneas impresas por los scripts Python)
          let m = linea.match(/^PÁGINA (\d+)/)
          if (m) item.paginaActual = parseInt(m[1], 10)
          m = linea.match(/^last_page: (\d+)/)
          if (m) {
            // RE/MAX: total de páginas exacto reportado por su API
            item.paginasTotales = parseInt(m[1], 10)
            item.paginasEstimadas = false
          }
          m = linea.match(/^totalHits: (\d+)/)
          if (m) totalHitsItem = parseInt(m[1], 10)
          m = linea.match(/^Propiedades en esta página: (\d+)/)
          if (m) {
            porPaginaItem = parseInt(m[1], 10)
            // C21: estimar total de páginas = totalHits ÷ propiedades por página
            if (!item.paginasTotales && totalHitsItem > 0 && porPaginaItem > 0) {
              item.paginasTotales = Math.ceil(totalHitsItem / porPaginaItem)
              item.paginasEstimadas = true
            }
          }
          m = linea.match(/^Total acumulado: (\d+)/)
          if (m) item.propsAcumuladas = parseInt(m[1], 10)
        }
      }
      proc.stdout?.setEncoding("utf-8")
      proc.stderr?.setEncoding("utf-8")
      proc.stdout?.on("data", (c: Buffer) => manejarSalida(c, "stdout"))
      proc.stderr?.on("data", (c: Buffer) => manejarSalida(c, "stderr"))

      /** Extrae metadatos del texto de logs generado por el script */
      const extraerMetadatos = () => {
        const texto = job.info.logs.map((l) => l.texto).join("\n")
        const matchTotal = texto.match(/Propiedades únicas extraídas:\s*(\d+)/g)
        if (matchTotal && matchTotal.length > 0) {
          const ultimo = matchTotal[matchTotal.length - 1]
          item.totalPropiedades = parseInt(ultimo.replace(/\D/g, ""), 10)
        }
        // El script imprime la ruta relativa a su cwd (scraper-output/)
        const matchArchivo = texto.match(/\[OK\] Datos guardados en:\s*(.+)/g)
        if (matchArchivo && matchArchivo.length > 0) {
          const ultimo = matchArchivo[matchArchivo.length - 1]
          item.archivoSalida = ultimo.replace(/\[OK\] Datos guardados en:\s*/, "").trim().replace(/\\/g, "/")
        }
      }

      // Límite duro por item: marca SOLO este item como ERROR y el lote
      // continúa con la siguiente URL (antes cancelaba todo el lote).
      timerLimite = setTimeout(() => {
        limiteExcedido = true
        log(
          `Tiempo límite de ${LIMITE_MIN_POR_ITEM} minutos excedido en este item. Se marca como ERROR y se continúa con el lote...`,
          "info",
        )
        item.estado = "ERROR"
        item.error = `Tiempo límite de ${LIMITE_MIN_POR_ITEM} minutos excedido`
        job.proc = null
        matarProceso(proc)
      }, LIMITE_MS_POR_ITEM)

      proc.on("error", (err) => {
        log(`No se pudo ejecutar Python: ${err.message}`, "stderr")
        log(
          `Verifica que Python esté instalado y en PATH (o define PYTHON_BIN). También requiere el paquete "requests".`,
          "info",
        )
        item.estado = "ERROR"
        item.error = `No se pudo ejecutar Python: ${err.message}`
        job.proc = null
        job.detenerSolicitado = true // sin Python no tiene sentido seguir
        this.finalizarJob(job, log)
      })

      proc.on("close", (code) => {
        if (timerLimite) clearTimeout(timerLimite)
        job.proc = null
        item.finalizadoEn = new Date().toISOString()
        if (job.info.estado !== "EJECUTANDO") return

        if (job.detenerSolicitado) {
          item.estado = "CANCELADO"
          this.finalizarJob(job, log)
          return
        }

        // Item cancelado por límite de tiempo: ya quedó marcado ERROR con su
        // motivo; avanzar con la siguiente URL del lote.
        if (limiteExcedido) {
          setTimeout(() => job.ejecutarSiguiente(), PAUSA_ENTRE_ITEMS_MS)
          return
        }

        extraerMetadatos()
        if (code === 0) {
          item.estado = "COMPLETADO"
          log(
            `✓ ${item.etiqueta}: ${item.totalPropiedades ?? 0} propiedades${
              item.archivoSalida ? ` → ${item.archivoSalida}` : ""
            }`,
          )
        } else {
          item.estado = "ERROR"
          item.error = `Código de salida ${code}`
          log(`✗ ${item.etiqueta} terminó con error (código ${code}).`, "stderr")
        }

        // Pausa breve entre items y continuar con el siguiente
        setTimeout(() => job.ejecutarSiguiente(), PAUSA_ENTRE_ITEMS_MS)
      })
    }

    job.ejecutarSiguiente()
    return this.obtenerInfo(job)
  }

  /** Marca los items pendientes como cancelados y cierra el job. */
  private finalizarJob(job: JobInterno, log: (t: string, s?: ScraperLogLine["stream"]) => void) {
    if (job.info.estado !== "EJECUTANDO") return
    for (const item of job.info.items) {
      if (item.estado === "PENDIENTE" || item.estado === "EJECUTANDO") {
        item.estado = "CANCELADO"
      }
    }
    const huboError = job.info.items.some((i) => i.estado === "ERROR")
    const todosCancelados = job.info.items.every((i) => i.estado === "CANCELADO")
    job.info.estado = todosCancelados ? "CANCELADO" : huboError ? "ERROR" : "COMPLETADO"
    job.info.finalizadoEn = new Date().toISOString()
    job.info.duracionMs = Date.now() - Date.parse(job.info.iniciadoEn)
    job.proc = null

    const completados = job.info.items.filter((i) => i.estado === "COMPLETADO").length
    const errores = job.info.items.filter((i) => i.estado === "ERROR").length
    const cancelados = job.info.items.filter((i) => i.estado === "CANCELADO").length
    log("")
    log(`${"=".repeat(60)}`)
    log(
      `LOTE FINALIZADO · ${completados} completados · ${errores} con error · ${cancelados} cancelados`,
    )
    job.ejecutarSiguiente = () => {}
    // Liberar memoria de jobs terminados antiguos (conserva los últimos 10)
    this.limpiarAntiguos()
  }

  /** Consulta un job por id; sin id devuelve el último creado */
  obtener(id?: string): ScraperJobInfo | null {
    if (id) {
      const job = this.jobs.get(id)
      return job ? this.obtenerInfo(job) : null
    }
    return this.ultimoId ? this.obtener(this.ultimoId) : null
  }

  /** Cancela un job en ejecución (mata el proceso actual y cancela los pendientes). */
  detener(id: string): boolean {
    const job = this.jobs.get(id)
    if (!job || job.info.estado !== "EJECUTANDO") return false
    job.detenerSolicitado = true
    if (job.proc) matarProceso(job.proc)
    // Si no hay proceso vivo (entre items), cerrar directamente
    if (!job.proc) this.finalizarJob(job, () => {})
    return true
  }

  /** Limpieza de jobs terminados antiguos (conserva los últimos 10) */
  limpiarAntiguos(): void {
    const terminados = Array.from(this.jobs.values())
      .filter((j) => j.info.estado !== "EJECUTANDO")
      .sort((a, b) => Date.parse(b.info.iniciadoEn) - Date.parse(a.info.iniciadoEn))
    for (const job of terminados.slice(10)) {
      this.jobs.delete(job.info.id)
    }
  }
}

/** Singleton por proceso */
export const scraperRunner = new ScraperRunner()
