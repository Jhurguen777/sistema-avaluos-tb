/**
 * Scraper Actions
 * Server Actions para iniciar, consultar y cancelar jobs de scraping
 * (individuales o por lote secuencial desde el catálogo de URLs)
 */

"use server"

import { auth } from "@/shared/auth/nextauth"
import { ROLES_CONFIG } from "@/config/roles"
import { scraperRunner } from "../services/scraper-runner"
import { iniciarScrapingSchema } from "../validators/scraper-validator"
import { urlCatalogoPorId } from "../config/urls-catalogo"
import type { ScraperJobInfo, ScraperPeticionItem } from "../types/scraper.types"

/**
 * Inicia un job de scraping. Acepta dos formatos de entrada:
 * - { items: [{ etiqueta, url }, ...] }  → URLs explícitas (custom)
 * - { catalogo: ["C21-CASA-venta", ...] } → ids del catálogo predefinido
 * Solo ADMIN (configuracion.manage).
 */
export async function iniciarScrapingAction(input: unknown): Promise<{
  success: boolean
  data?: ScraperJobInfo
  error?: string
}> {
  try {
    const session = await auth()
    if (!session?.user) {
      return { success: false, error: "No autenticado" }
    }
    if (!ROLES_CONFIG.tienePermiso(session.user.role, "configuracion.manage")) {
      return { success: false, error: "No autorizado. Solo administradores pueden ejecutar el scraper." }
    }

    // Convertir ids de catálogo a items con etiqueta y URL
    let items: ScraperPeticionItem[] | null = null
    if (
      input &&
      typeof input === "object" &&
      "catalogo" in input &&
      Array.isArray((input as { catalogo: unknown }).catalogo)
    ) {
      const ids = (input as { catalogo: unknown[] }).catalogo.filter((i): i is string => typeof i === "string")
      items = ids
        .map((id) => urlCatalogoPorId(id))
        .filter((u): u is NonNullable<typeof u> => Boolean(u))
        .map((u) => ({ etiqueta: u.etiqueta, url: u.url }))
      if (items.length === 0) {
        return { success: false, error: "Los ids del catálogo no son válidos" }
      }
    }

    const parsed = iniciarScrapingSchema.safeParse(items ? { items } : input)
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0]?.message || "Datos inválidos" }
    }

    const job = scraperRunner.iniciar(parsed.data.items)
    return { success: true, data: job }
  } catch (error) {
    console.error("Error iniciando scraping:", error)
    return { success: false, error: error instanceof Error ? error.message : "No se pudo iniciar el scraping" }
  }
}

/**
 * Consulta el estado de un job. Sin jobId devuelve el último job creado
 * (permite restaurar la vista si el usuario navegó fuera de la página).
 */
export async function obtenerEstadoScrapingAction(jobId?: string): Promise<{
  success: boolean
  data?: ScraperJobInfo | null
  error?: string
}> {
  try {
    const session = await auth()
    if (!session?.user) {
      return { success: false, error: "No autenticado" }
    }
    if (!ROLES_CONFIG.tienePermiso(session.user.role, "configuracion.manage")) {
      return { success: false, error: "No autorizado" }
    }
    return { success: true, data: scraperRunner.obtener(jobId) }
  } catch (error) {
    console.error("Error consultando estado del scraping:", error)
    return { success: false, error: "No se pudo consultar el estado" }
  }
}

/** Cancela un job en ejecución (mata el script actual y cancela los pendientes). */
export async function detenerScrapingAction(jobId: string): Promise<{
  success: boolean
  error?: string
}> {
  try {
    const session = await auth()
    if (!session?.user) {
      return { success: false, error: "No autenticado" }
    }
    if (!ROLES_CONFIG.tienePermiso(session.user.role, "configuracion.manage")) {
      return { success: false, error: "No autorizado" }
    }
    const ok = scraperRunner.detener(jobId)
    return ok
      ? { success: true }
      : { success: false, error: "El job no está en ejecución" }
  } catch (error) {
    console.error("Error deteniendo scraping:", error)
    return { success: false, error: "No se pudo detener el scraping" }
  }
}
