/**
 * Audit Action
 * Server Action para consultar el registro de auditoría (solo ADMIN)
 */

"use server"

import { auth } from "@/shared/auth/nextauth"
import { ROLES_CONFIG } from "@/config/roles"
import { auditService } from "./audit-service"

/**
 * Lista los logs de auditoría con filtros opcionales.
 * Requiere rol ADMIN.
 */
export async function listAuditLogsAction(params: {
  skip?: number
  take?: number
  action?: string
  tableName?: string
  since?: Date
  until?: Date
  search?: string
} = {}) {
  try {
    const session = await auth()
    if (!session?.user) {
      return { success: false as const, error: "No autenticado" }
    }

    if (!ROLES_CONFIG.tienePermiso(session.user.role ?? "", "usuarios.read")) {
      return { success: false as const, error: "No autorizado. Solo administradores pueden ver la auditoría" }
    }

    const result = await auditService.getLogs(params)
    return { success: true as const, data: result }
  } catch (error) {
    console.error("Error listando logs de auditoría:", error)
    return { success: false as const, error: "Error al obtener los logs" }
  }
}
