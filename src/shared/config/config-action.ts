/**
 * Config Actions
 * Server Actions para lectura/escritura de la configuración de avalúos
 * (valores de reposición + parámetros).
 *
 * - Lectura: cualquier usuario autenticado.
 * - Escritura: solo ADMIN.
 */

"use server"

import { auth } from "@/shared/auth/nextauth"
import { prisma } from "@/shared/database/prisma"
import { invalidateConfigCache } from "@/shared/config/config-loader"
import { toNum } from "@/shared/database/decimal"

function isAdmin(role: string | null | undefined): boolean {
  return role === "ADMIN"
}

// ==================== VALORES DE REPOSICIÓN ====================

/**
 * Obtiene todos los valores de reposición desde la DB.
 * Accesible a cualquier usuario autenticado.
 */
export async function getValoresReposicionAction() {
  try {
    const session = await auth()
    if (!session?.user) {
      return { success: false as const, error: "No autenticado" }
    }

    const filas = await prisma.valorReposicion.findMany({
      orderBy: [{ categoria: "asc" }, { estado: "asc" }],
    })

    // Convertir Decimal → number para que sean serializables al cliente
    const data = filas.map((f) => ({
      id: f.id,
      categoria: f.categoria,
      estado: f.estado,
      min: toNum(f.min),
      max: toNum(f.max),
      costo: toNum(f.costo),
      updatedAt: f.updatedAt,
    }))

    return { success: true as const, data }
  } catch (error) {
    console.error("Error obteniendo valores de reposición:", error)
    return { success: false as const, error: "Error al obtener los valores" }
  }
}

/**
 * Actualiza un valor de reposición (solo ADMIN).
 */
export async function updateValorReposicionAction(
  id: string,
  data: { min?: number | null; max?: number | null; costo?: number | null },
) {
  try {
    const session = await auth()
    if (!session?.user) {
      return { success: false as const, error: "No autenticado" }
    }
    if (!isAdmin(session.user.role)) {
      return { success: false as const, error: "No autorizado. Solo administradores pueden editar los valores." }
    }

    const actualizado = await prisma.valorReposicion.update({
      where: { id },
      data: {
        ...(data.min !== undefined ? { min: data.min } : {}),
        ...(data.max !== undefined ? { max: data.max } : {}),
        ...(data.costo !== undefined ? { costo: data.costo } : {}),
      },
    })

    invalidateConfigCache()

    return {
      success: true as const,
      data: {
        id: actualizado.id,
        categoria: actualizado.categoria,
        estado: actualizado.estado,
        min: toNum(actualizado.min),
        max: toNum(actualizado.max),
        costo: toNum(actualizado.costo),
      },
    }
  } catch (error) {
    console.error("Error actualizando valor de reposición:", error)
    return { success: false as const, error: "Error al actualizar el valor" }
  }
}

// ==================== PARÁMETROS DE AVALÚO ====================

/**
 * Obtiene todos los parámetros de avalúo desde la DB.
 * Accesible a cualquier usuario autenticado.
 */
export async function getParametrosAction() {
  try {
    const session = await auth()
    if (!session?.user) {
      return { success: false as const, error: "No autenticado" }
    }

    const params = await prisma.parametroAvaluo.findMany({
      orderBy: [{ grupo: "asc" }, { etiqueta: "asc" }],
    })

    return { success: true as const, data: params }
  } catch (error) {
    console.error("Error obteniendo parámetros:", error)
    return { success: false as const, error: "Error al obtener los parámetros" }
  }
}

/**
 * Actualiza un parámetro de avalúo (solo ADMIN).
 */
export async function updateParametroAction(id: string, valor: string) {
  try {
    const session = await auth()
    if (!session?.user) {
      return { success: false as const, error: "No autenticado" }
    }
    if (!isAdmin(session.user.role)) {
      return { success: false as const, error: "No autorizado. Solo administradores pueden editar los parámetros." }
    }

    if (!valor.trim()) {
      return { success: false as const, error: "El valor no puede estar vacío" }
    }

    const num = parseFloat(valor)
    if (Number.isNaN(num)) {
      return { success: false as const, error: "El valor debe ser numérico" }
    }

    const actualizado = await prisma.parametroAvaluo.update({
      where: { id },
      data: { valor: valor.trim() },
    })

    invalidateConfigCache()

    return { success: true as const, data: actualizado }
  } catch (error) {
    console.error("Error actualizando parámetro:", error)
    return { success: false as const, error: "Error al actualizar el parámetro" }
  }
}

/** Re-export para uso en UI */
export { toNum }
