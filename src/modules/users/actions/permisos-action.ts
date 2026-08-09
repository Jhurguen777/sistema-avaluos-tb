/**
 * Server Action: Permisos de Usuario
 * Lectura: cualquier ADMIN autenticado.
 * Escritura: solo ADMIN.
 */

"use server"

import { auth } from "@/shared/auth/nextauth"
import { ROLES_CONFIG } from "@/config/roles"
import { prisma } from "@/shared/database/prisma"
import {
  type PermisosUsuario,
  getPermisosEfectivos,
  MODULOS_PERMISOS,
} from "@/config/modulos-permisos"

/**
 * Obtiene los permisos efectivos de un usuario.
 * Devuelve los individualizados si existen, sino los defaults del rol.
 */
export async function getPermisosUsuarioAction(userId: string) {
  try {
    const session = await auth()
    if (!session?.user) {
      return { success: false as const, error: "No autenticado" }
    }
    if (!ROLES_CONFIG.tienePermiso(session.user.role ?? "", "usuarios.read")) {
      return { success: false as const, error: "No autorizado" }
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { permisos: true, role: true },
    })

    if (!user) {
      return { success: false as const, error: "Usuario no encontrado" }
    }

    const efectivos = getPermisosEfectivos(
      user.permisos as PermisosUsuario | null,
      user.role,
    )

    return { success: true as const, data: efectivos }
  } catch (error) {
    console.error("Error obteniendo permisos:", error)
    return { success: false as const, error: "Error al obtener los permisos" }
  }
}

/**
 * Actualiza los permisos individuales de un usuario.
 * Solo ADMIN. Valida que todos los módulos estén presentes.
 */
export async function updatePermisosUsuarioAction(
  userId: string,
  permisos: PermisosUsuario,
) {
  try {
    const session = await auth()
    if (!session?.user) {
      return { success: false as const, error: "No autenticado" }
    }
    if (!ROLES_CONFIG.tienePermiso(session.user.role ?? "", "usuarios.update")) {
      return { success: false as const, error: "No autorizado. Solo administradores." }
    }

    // Validar que no se modifiquen sus propios permisos (para evitar auto-bloqueo)
    if (userId === session.user.id) {
      return { success: false as const, error: "No puedes modificar tus propios permisos" }
    }

    // Validar estructura: todos los módulos deben estar presentes
    for (const mod of MODULOS_PERMISOS) {
      if (!permisos[mod.key]) {
        return { success: false as const, error: `Falta el módulo: ${mod.label}` }
      }
    }

    await prisma.user.update({
      where: { id: userId },
      data: { permisos: permisos as any },
    })

    return { success: true as const }
  } catch (error) {
    console.error("Error actualizando permisos:", error)
    return { success: false as const, error: "Error al guardar los permisos" }
  }
}
