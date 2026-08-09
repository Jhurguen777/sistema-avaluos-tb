/**
 * Reactivate User Action
 * Server Action para reactivar usuarios
 */

"use server"

import { auth } from "@/shared/auth/nextauth"
import { ROLES_CONFIG } from "@/config/roles"
import { userService } from "../services/user-service"
import { auditService } from "@/shared/security/audit-service"

export async function reactivateUserAction(id: string) {
  try {
    // 1. Verificar sesión y permisos
    const session = await auth()
    if (!session?.user) {
      return { success: false, error: "No autenticado" }
    }

    if (!ROLES_CONFIG.tienePermiso(session.user.role ?? "", "usuarios.update")) {
      return { success: false, error: "No autorizado. Solo administradores pueden reactivar usuarios" }
    }

    // 2. Reactivar usuario
    const user = await userService.reactivate(id)

    // 3. Registrar en audit log
    await auditService.logUserReactivated(
      session.user.id,
      user.id,
      {
        email: user.email,
        name: user.name,
      }
    )

    return { success: true, data: user }
  } catch (error: any) {
    console.error("Error reactivating user:", error)
    return { success: false, error: error.message || "Error al reactivar usuario" }
  }
}
