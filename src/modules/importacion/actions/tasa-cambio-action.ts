/**
 * Tasa de Cambio Action (módulo importación)
 *
 * Ejecuta python/bcb_scraper.py contra la portada del BCB, obtiene el tipo
 * de cambio oficial Bs/USD del día y lo persiste en `parametros_avaluo`
 * (clave `tipo_cambio.bob_usd`) para que otros módulos (radar, comparables)
 * puedan leerlo sin re-scrapear.
 */

"use server"

import { spawn } from "child_process"
import path from "path"
import { auth } from "@/shared/auth/nextauth"
import { prisma } from "@/shared/database/prisma"
import { ROLES_CONFIG } from "@/config/roles"
import { auditService } from "@/shared/security/audit-service"

/** Clave del parámetro de tasa en la tabla parametros_avaluo */
const TASA_CLAVE = "tipo_cambio.bob_usd"

/** Resultado de obtener la tasa del día */
export interface TasaCambioResult {
  /** Tipo de cambio oficial Bs/USD */
  tasa: number
  /** ISO del momento en que se obtuvo */
  obtenidoEn: string
  /** Fuente legible */
  fuente: string
}

/** Ejecutable de Python: igual criterio que el módulo scraper */
function binPython(): string {
  return process.env.PYTHON_BIN || (process.platform === "win32" ? "python" : "python3")
}

/** Ejecuta el scraper del BCB y parsea "TASA:<número>" de su stdout */
function ejecutarScraperBcb(): Promise<number> {
  return new Promise((resolve, reject) => {
    const script = path.join(process.cwd(), "python", "bcb_scraper.py")
    const proc = spawn(binPython(), [script], {
      stdio: ["ignore", "pipe", "pipe"],
      env: {
        ...process.env,
        PYTHONUTF8: "1",
        PYTHONIOENCODING: "utf-8",
      },
    })
    let salida = ""
    let err = ""
    proc.stdout?.on("data", (c: Buffer) => (salida += c.toString("utf-8")))
    proc.stderr?.on("data", (c: Buffer) => (err += c.toString("utf-8")))
    proc.on("error", (e) => reject(new Error(`No se pudo ejecutar Python: ${e.message}`)))
    proc.on("close", (code) => {
      const m = salida.match(/TASA:(\d+(?:\.\d+)?)/)
      if (code === 0 && m) {
        resolve(parseFloat(m[1]))
      } else {
        reject(new Error(err.trim() || `El scraper del BCB terminó con código ${code}`))
      }
    })
  })
}

/** Obtiene el dólar del día desde el BCB y lo guarda en parametros_avaluo. */
export async function obtenerTasaCambioAction(): Promise<{
  success: boolean
  data?: TasaCambioResult
  error?: string
}> {
  try {
    const session = await auth()
    if (!session?.user) {
      return { success: false, error: "No autenticado" }
    }
    if (!ROLES_CONFIG.tienePermiso(session.user.role, "configuracion.manage")) {
      return { success: false, error: "No autorizado. Solo administradores pueden importar JSON." }
    }

    const tasa = await ejecutarScraperBcb()

    // Persistir/actualizar el parámetro (fuente única para radar/comparables)
    await prisma.parametroAvaluo.upsert({
      where: { clave: TASA_CLAVE },
      create: {
        clave: TASA_CLAVE,
        valor: tasa.toFixed(2),
        etiqueta: "Tipo de cambio Bs/USD (BCB)",
        descripcion:
          "Tasa oficial del Banco Central de Bolivia. Se actualiza al presionar «Obtener dólar del día» en Importación.",
        grupo: "Conversión",
      },
      update: { valor: tasa.toFixed(2) },
    })

    const obtenidoEn = new Date().toISOString()
    await auditService.log({
      userId: session.user.id,
      action: "TASA_CAMBIO_BCB",
      tableName: "parametros_avaluo",
      newValue: { clave: TASA_CLAVE, tasa, obtenidoEn },
    })

    return { success: true, data: { tasa, obtenidoEn, fuente: "bcb.gob.bo" } }
  } catch (error: unknown) {
    console.error("Error obteniendo tasa del BCB:", error)
    return {
      success: false,
      error:
        error instanceof Error
          ? `No se pudo obtener el dólar del BCB: ${error.message}`
          : "No se pudo obtener el dólar del BCB.",
    }
  }
}

/** Lee la última tasa guardada en parametros_avaluo (null si nunca se obtuvo). */
export async function obtenerTasaGuardadaAction(): Promise<{
  success: boolean
  data?: { tasa: number; updatedAt: string }
  error?: string
}> {
  try {
    const session = await auth()
    if (!session?.user) {
      return { success: false, error: "No autenticado" }
    }
    const param = await prisma.parametroAvaluo.findUnique({ where: { clave: TASA_CLAVE } })
    if (!param) return { success: true, data: undefined }
    return {
      success: true,
      data: { tasa: parseFloat(param.valor), updatedAt: param.updatedAt.toISOString() },
    }
  } catch (error: unknown) {
    console.error("Error leyendo tasa guardada:", error)
    return { success: false, error: "No se pudo leer la tasa guardada" }
  }
}
