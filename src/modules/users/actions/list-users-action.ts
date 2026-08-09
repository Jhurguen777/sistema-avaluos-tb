/**
 * List Users Action
 * Server Action para listar usuarios
 */

"use server"

import { auth } from "@/shared/auth/nextauth"
import { ROLES_CONFIG } from "@/config/roles"
import { userService } from "../services/user-service"
import { listUsersValidator } from "../validators/user-validator"
import type { ListUsersInput } from "../validators/user-validator"

export async function listUsersAction(filters?: ListUsersInput) {
  try {
    // 1. Verificar sesión y permisos
    const session = await auth()
    if (!session?.user) {
      return { success: false, error: "No autenticado" }
    }

    if (!ROLES_CONFIG.tienePermiso(session.user.role ?? "", "usuarios.read")) {
      return { success: false, error: "No autorizado. Solo administradores pueden ver usuarios" }
    }

    // 2. Validar filtros
    const validated = listUsersValidator.safeParse(filters || {})
    if (!validated.success) {
      return { success: false, error: validated.error.issues[0].message }
    }

    // 3. Listar usuarios
    const result = await userService.list(validated.data)

    return { success: true, data: result }
  } catch (error: any) {
    console.error("Error listing users:", error)
    return { success: false, error: error.message || "Error al listar usuarios" }
  }
}
