/**
 * Create User Action
 * Server Action para crear usuarios
 */

"use server"

import { auth } from "@/shared/auth/nextauth"
import { ROLES_CONFIG } from "@/config/roles"
import { userService } from "../services/user-service"
import { createUserValidator } from "../validators/user-validator"
import type { CreateUserInput } from "../validators/user-validator"
import { auditService } from "@/shared/security/audit-service"

export async function createUserAction(data: CreateUserInput) {
  try {
    // 1. Verificar sesión y permisos
    const session = await auth()
    if (!session?.user) {
      return { success: false, error: "No autenticado" }
    }

    if (!ROLES_CONFIG.tienePermiso(session.user.role ?? "", "usuarios.create")) {
      return { success: false, error: "No autorizado. Solo administradores pueden crear usuarios" }
    }

    // 2. Validar datos
    const validated = createUserValidator.safeParse(data)
    if (!validated.success) {
      return { success: false, error: validated.error.issues[0].message }
    }

    // 3. Generar password temporal si no se proporciona
    const tempPassword = validated.data.password || userService.generateTempPassword()
    const createData: any = { ...validated.data, password: tempPassword }

    // 4. Crear usuario
    const user = await userService.create(createData, session.user.id)

    // 5. Registrar en audit log
    await auditService.logUserCreated(
      session.user.id,
      user.id,
      {
        email: user.email,
        name: user.name,
        role: user.role,
      }
    )

    return {
      success: true,
      data: {
        user,
        tempPassword // Retornar para mostrar al admin
      }
    }
  } catch (error: any) {
    console.error("Error creating user:", error)
    return { success: false, error: error.message || "Error al crear usuario" }
  }
}
