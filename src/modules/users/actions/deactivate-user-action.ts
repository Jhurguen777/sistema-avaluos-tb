/**
 * Deactivate User Action
 * Server Action para desactivar usuarios
 */

"use server"

import { auth } from "@/shared/auth/nextauth"
import { userService } from "../services/user-service"
import { auditService } from "@/shared/security/audit-service"

export async function deactivateUserAction(id: string) {
  try {
    // 1. Verificar sesión y permisos
    const session = await auth()
    if (!session?.user) {
      return { success: false, error: "No autenticado" }
    }

    if (session.user.role !== "ADMIN") {
      return { success: false, error: "No autorizado. Solo administradores pueden desactivar usuarios" }
    }

    // 2. Desactivar usuario
    const user = await userService.deactivate(id, session.user.id)

    // 3. Registrar en audit log
    await auditService.logUserDeactivated(
      session.user.id,
      user.id,
      {
        email: user.email,
        name: user.name,
      }
    )

    return { success: true, data: user }
  } catch (error: any) {
    console.error("Error deactivating user:", error)
    return { success: false, error: error.message || "Error al desactivar usuario" }
  }
}
