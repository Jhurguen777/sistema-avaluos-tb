/**
 * Analizar JSON Action (dry-run)
 *
 * Server Action que recibe el contenido del JSON ya como objeto/array,
 * lo analiza y devuelve registros normalizados + resumen. NO escribe en DB.
 */

"use server"

import { auth } from "@/shared/auth/nextauth"
import { importacionService } from "../services/importacion-service"
import type { AnalizarJsonResult } from "../types/importacion.types"

/**
 * @param jsonRaw - Contenido del JSON ya parseado (array de registros).
 *                  El cliente lo lee con `FileReader` + `JSON.parse`.
 * @param tasaBobUsd - Tipo de cambio Bs/USD del día (obligatorio, se valida).
 */
export async function analizarJsonAction(
  jsonRaw: unknown,
  tasaBobUsd: unknown,
): Promise<{
  success: boolean
  data?: AnalizarJsonResult
  error?: string
}> {
  try {
    const session = await auth()
    if (!session?.user) {
      return { success: false, error: "No autenticado" }
    }
    if (session.user.role !== "ADMIN") {
      return { success: false, error: "No autorizado. Solo administradores pueden importar JSON." }
    }

    const tasa =
      typeof tasaBobUsd === "number"
        ? tasaBobUsd
        : typeof tasaBobUsd === "string" && tasaBobUsd.trim() !== ""
          ? parseFloat(tasaBobUsd)
          : NaN
    if (isNaN(tasa) || tasa < 0.5 || tasa > 1000) {
      return {
        success: false,
        error: "Primero obten el tipo de cambio del día (botón «Obtener dólar del día»).",
      }
    }

    const { registros, resumen } = importacionService.analizar(jsonRaw, tasa)

    return {
      success: true,
      data: { registros, resumen },
    }
  } catch (error: unknown) {
    console.error("Error analizando JSON:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "No se pudo analizar el JSON. Verifique que sea un array válido.",
    }
  }
}
