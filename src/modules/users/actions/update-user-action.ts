/**
 * Update User Action
 * Server Action para actualizar usuarios
 */

"use server"

import { auth } from "@/shared/auth/nextauth"
import { ROLES_CONFIG } from "@/config/roles"
import { userService } from "../services/user-service"
import { userRepository } from "../repositories/user-repository"
import { updateUserValidator } from "../validators/user-validator"
import type { UpdateUserInput } from "../validators/user-validator"
import { auditService } from "@/shared/security/audit-service"

export async function updateUserAction(id: string, data: UpdateUserInput) {
  try {
    // 1. Verificar sesión y permisos
    const session = await auth()
    if (!session?.user) {
      return { success: false, error: "No autenticado" }
    }

    if (!ROLES_CONFIG.tienePermiso(session.user.role ?? "", "usuarios.update")) {
      return { success: false, error: "No autorizado. Solo administradores pueden actualizar usuarios" }
    }

    // 2. Validar datos
    const validated = updateUserValidator.safeParse(data)
    if (!validated.success) {
      return { success: false, error: validated.error.issues[0].message }
    }

    // Obtener usuario antes de actualizar para el log
    const oldUser = await userRepository.findById(id)

    // 3. Actualizar usuario
    const user = await userService.update(id, validated.data as any, session.user.id)

    // 4. Registrar en audit log
    if (oldUser) {
      // Detectar qué campos cambiaron
      const changes: any = {}
      if (validated.data.name && validated.data.name !== oldUser.name) {
        changes.name = { old: oldUser.name, new: validated.data.name }
      }
      if (validated.data.role && validated.data.role !== oldUser.role) {
        changes.role = { old: oldUser.role, new: validated.data.role }
      }
      if (validated.data.isActive !== undefined && validated.data.isActive !== oldUser.isActive) {
        changes.isActive = { old: oldUser.isActive, new: validated.data.isActive }
      }

      if (Object.keys(changes).length > 0) {
        await auditService.logUserUpdated(
          session.user.id,
          id,
          changes,
          { email: user.email, ...changes }
        )
      }
    }

    return { success: true, data: user }
  } catch (error: any) {
    console.error("Error updating user:", error)
    return { success: false, error: error.message || "Error al actualizar usuario" }
  }
}
