/**
 * Reset Password Action
 * Server Action para resetear password de usuarios
 */

"use server"

import { auth } from "@/shared/auth/nextauth"
import { ROLES_CONFIG } from "@/config/roles"
import { userService } from "../services/user-service"
import { userRepository } from "../repositories/user-repository"
import { resetPasswordValidator } from "../validators/user-validator"
import type { ResetPasswordInput } from "../validators/user-validator"
import { auditService } from "@/shared/security/audit-service"

export async function resetPasswordAction(id: string, data: ResetPasswordInput) {
  try {
    // 1. Verificar sesión y permisos
    const session = await auth()
    if (!session?.user) {
      return { success: false, error: "No autenticado" }
    }

    if (!ROLES_CONFIG.tienePermiso(session.user.role ?? "", "usuarios.reset_password")) {
      return { success: false, error: "No autorizado. Solo administradores pueden resetear passwords" }
    }

    // 2. Validar datos
    const validated = resetPasswordValidator.safeParse(data)
    if (!validated.success) {
      return { success: false, error: validated.error.issues[0].message }
    }

    // Obtener datos del usuario para el log
    const targetUser = await userRepository.findById(id)

    // 3. Resetear password
    await userService.resetPassword(id, validated.data.newPassword)

    // 4. Registrar en audit log
    if (targetUser) {
      await auditService.logPasswordReset(
        session.user.id,
        id,
        targetUser.email
      )
    }

    return {
      success: true,
      message: "Password reseteado exitosamente",
      data: { tempPassword: validated.data.newPassword }
    }
  } catch (error: any) {
    console.error("Error resetting password:", error)
    return { success: false, error: error.message || "Error al resetear password" }
  }
}
