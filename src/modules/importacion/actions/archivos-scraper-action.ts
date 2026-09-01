/**
 * Archivos Scraper Action (módulo importación)
 * Server Actions para listar y leer los JSONs generados por el módulo scraper
 * (directorio scraper-output/), de modo que puedan importarse sin subir archivo.
 */

"use server"

import { auth } from "@/shared/auth/nextauth"
import { ROLES_CONFIG } from "@/config/roles"
import {
  listarArchivosScraper,
  leerJsonScraper,
  type GrupoScraper,
  type JsonScraperLeido,
} from "../services/archivos-scraper-service"

/** Lista los grupos (C21/ REMAX/) con sus carpetas y JSONs (más recientes primero). */
export async function listarArchivosScraperAction(): Promise<{
  success: boolean
  data?: GrupoScraper[]
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

    const carpetas = await listarArchivosScraper()
    return { success: true, data: carpetas }
  } catch (error) {
    console.error("Error listando archivos del scraper:", error)
    return { success: false, error: "No se pudieron listar los archivos del scraper" }
  }
}

/** Lee un JSON de scraper-output/ por ruta relativa y lo devuelve parseado. */
export async function leerJsonScraperAction(rutaRelativa: string): Promise<{
  success: boolean
  data?: JsonScraperLeido
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
    if (typeof rutaRelativa !== "string" || rutaRelativa.length === 0) {
      return { success: false, error: "Ruta inválida" }
    }

    const leido = await leerJsonScraper(rutaRelativa)
    return { success: true, data: leido }
  } catch (error) {
    console.error("Error leyendo JSON del scraper:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "No se pudo leer el archivo",
    }
  }
}
