/**
 * Obtener Categorías Action
 *
 * Server Action que devuelve las categorías de producto activas registradas
 * en la DB (tabla `product_categories`). Se usa para poblar los selects de
 * la UI de importación, de modo que la lista refleje siempre lo que existe
 * en la base de datos (en lugar de un listado hardcodeado).
 */

"use server"

import { auth } from "@/shared/auth/nextauth"
import { prisma } from "@/shared/database/prisma"
import type { ProductCategoryEnum } from "@prisma/client"

/**
 * Devuelve las categorías activas ordenadas por nombre.
 * Requiere sesión de ADMIN (mismo permiso que el resto del módulo de importación).
 */
export async function obtenerCategoriasAction(): Promise<{
  success: boolean
  data?: ProductCategoryEnum[]
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

    const filas = await prisma.productCategory.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
      select: { name: true },
    })

    return {
      success: true,
      data: filas.map(f => f.name),
    }
  } catch (error: any) {
    console.error("Error obteniendo categorías:", error)
    return {
      success: false,
      error: error?.message || "No se pudieron cargar las categorías.",
    }
  }
}
