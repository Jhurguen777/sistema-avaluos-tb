/**
 * Audit Service
 *
 * Servicio para registrar acciones sensibles en el sistema
 * Proporciona trazabilidad para compliance y seguridad
 */

import { prisma } from "@/shared/database/prisma"
import { headers } from "next/headers"

/**
 * Tipos de acciones de auditoría
 */
export enum AuditAction {
  // Usuarios
  USER_CREATED = "USER_CREATED",
  USER_UPDATED = "USER_UPDATED",
  USER_DELETED = "USER_DELETED",
  USER_DEACTIVATED = "USER_DEACTIVATED",
  USER_REACTIVATED = "USER_REACTIVATED",
  USER_PASSWORD_CHANGED = "USER_PASSWORD_CHANGED",
  USER_PASSWORD_RESET = "USER_PASSWORD_RESET",
  USER_ROLE_CHANGED = "USER_ROLE_CHANGED",

  // Avalúos
  AVALUO_CREATED = "AVALUO_CREATED",
  AVALUO_UPDATED = "AVALUO_UPDATED",
  AVALUO_DELETED = "AVALUO_DELETED",
  AVALUO_APPROVED = "AVALUO_APPROVED",
  AVALUO_REJECTED = "AVALUO_REJECTED",
  AVALUO_SUBMITTED = "AVALUO_SUBMITTED",

  // Inmuebles
  INMUEBLE_CREATED = "INMUEBLE_CREATED",
  INMUEBLE_UPDATED = "INMUEBLE_UPDATED",
  INMUEBLE_DELETED = "INMUEBLE_DELETED",

  // Comparables de mercado
  COMPARABLE_CREATED = "COMPARABLE_CREATED",
  COMPARABLE_UPDATED = "COMPARABLE_UPDATED",
  COMPARABLE_DELETED = "COMPARABLE_DELETED",

  // Documentos
  DOCUMENTO_UPLOADED = "DOCUMENTO_UPLOADED",
  DOCUMENTO_DELETED = "DOCUMENTO_DELETED",

  // Radar / entorno
  RADAR_GENERATED = "RADAR_GENERATED",
  EQUIPAMIENTO_DELETED = "EQUIPAMIENTO_DELETED",

  // Sistema
  LOGIN_SUCCESS = "LOGIN_SUCCESS",
  LOGIN_FAILED = "LOGIN_FAILED",
  LOGOUT = "LOGOUT",
  PASSWORD_CHANGE_REQUEST = "PASSWORD_CHANGE_REQUEST",
}

export interface AuditLogInput {
  userId?: string
  action: AuditAction | string
  tableName?: string
  recordId?: string
  oldValue?: any
  newValue?: any
  ipAddress?: string
  userAgent?: string
}

/**
 * Obtiene la IP address del request actual
 */
async function getClientIP(): Promise<string> {
  const headersList = await headers()

  const forwardedFor = headersList.get("x-forwarded-for")
  const realIP = headersList.get("x-real-ip")
  const cfConnectingIP = headersList.get("cf-connecting-ip")

  if (forwardedFor) {
    return forwardedFor.split(",")[0].trim()
  }

  if (realIP) {
    return realIP
  }

  if (cfConnectingIP) {
    return cfConnectingIP
  }

  return "unknown"
}

/**
 * Obtiene el userAgent del request actual
 */
async function getUserAgent(): Promise<string> {
  const headersList = await headers()
  return headersList.get("user-agent") || "unknown"
}

/**
 * Servicio de auditoría
 */
export const auditService = {
  /**
   * Registra una acción en el log de auditoría
   */
  async log(input: AuditLogInput): Promise<void> {
    try {
      await prisma.auditLog.create({
        data: {
          userId: input.userId,
          action: input.action,
          tableName: input.tableName,
          recordId: input.recordId,
          oldValue: input.oldValue ? JSON.parse(JSON.stringify(input.oldValue)) : null,
          newValue: input.newValue ? JSON.parse(JSON.stringify(input.newValue)) : null,
          ipAddress: input.ipAddress || await getClientIP(),
          userAgent: input.userAgent || await getUserAgent(),
        },
      })
    } catch (error) {
      // No fallar la acción principal si falla el log
      console.error("Error creating audit log:", error)
    }
  },

  /**
   * Registra creación de usuario
   */
  async logUserCreated(
    createdByUserId: string,
    newUserId: string,
    newUserData: any
  ): Promise<void> {
    await this.log({
      userId: createdByUserId,
      action: AuditAction.USER_CREATED,
      tableName: "users",
      recordId: newUserId,
      newValue: {
        email: newUserData.email,
        name: newUserData.name,
        role: newUserData.role,
      },
    })
  },

  /**
   * Registra actualización de usuario
   */
  async logUserUpdated(
    updatedByUserId: string,
    targetUserId: string,
    oldValue: any,
    newValue: any
  ): Promise<void> {
    await this.log({
      userId: updatedByUserId,
      action: AuditAction.USER_UPDATED,
      tableName: "users",
      recordId: targetUserId,
      oldValue,
      newValue,
    })
  },

  /**
   * Registra eliminación de usuario
   */
  async logUserDeleted(
    deletedByUserId: string,
    targetUserId: string,
    deletedUserData: any
  ): Promise<void> {
    await this.log({
      userId: deletedByUserId,
      action: AuditAction.USER_DELETED,
      tableName: "users",
      recordId: targetUserId,
      oldValue: {
        email: deletedUserData.email,
        name: deletedUserData.name,
        role: deletedUserData.role,
      },
    })
  },

  /**
   * Registra desactivación de usuario
   */
  async logUserDeactivated(
    deactivatedByUserId: string,
    targetUserId: string,
    userData: any
  ): Promise<void> {
    await this.log({
      userId: deactivatedByUserId,
      action: AuditAction.USER_DEACTIVATED,
      tableName: "users",
      recordId: targetUserId,
      oldValue: {
        email: userData.email,
        name: userData.name,
      },
      newValue: {
        isActive: false,
      },
    })
  },

  /**
   * Registra reactivación de usuario
   */
  async logUserReactivated(
    reactivatedByUserId: string,
    targetUserId: string,
    userData: any
  ): Promise<void> {
    await this.log({
      userId: reactivatedByUserId,
      action: AuditAction.USER_REACTIVATED,
      tableName: "users",
      recordId: targetUserId,
      newValue: {
        email: userData.email,
        name: userData.name,
        isActive: true,
      },
    })
  },

  /**
   * Registra cambio de password
   */
  async logPasswordChanged(
    userId: string,
    targetUserId: string
  ): Promise<void> {
    await this.log({
      userId,
      action: AuditAction.USER_PASSWORD_CHANGED,
      tableName: "users",
      recordId: targetUserId,
    })
  },

  /**
   * Registra reset de password por admin
   */
  async logPasswordReset(
    adminUserId: string,
    targetUserId: string,
    targetUserEmail: string
  ): Promise<void> {
    await this.log({
      userId: adminUserId,
      action: AuditAction.USER_PASSWORD_RESET,
      tableName: "users",
      recordId: targetUserId,
      newValue: {
        email: targetUserEmail,
      },
    })
  },

  /**
   * Registra cambio de rol
   */
  async logRoleChanged(
    changedByUserId: string,
    targetUserId: string,
    oldRole: string,
    newRole: string
  ): Promise<void> {
    await this.log({
      userId: changedByUserId,
      action: AuditAction.USER_ROLE_CHANGED,
      tableName: "users",
      recordId: targetUserId,
      oldValue: { role: oldRole },
      newValue: { role: newRole },
    })
  },

  /**
   * Registra creación de avalúo
   */
  async logAvaluoCreated(
    createdByUserId: string,
    avaluoId: string,
    avaluoData: any
  ): Promise<void> {
    await this.log({
      userId: createdByUserId,
      action: AuditAction.AVALUO_CREATED,
      tableName: "avaluos",
      recordId: avaluoId,
      newValue: {
        codigo: avaluoData.codigo,
        tipo: avaluoData.tipo,
      },
    })
  },

  /**
   * Registra aprobación de avalúo
   */
  async logAvaluoApproved(
    approvedByUserId: string,
    avaluoId: string,
    avaluoCode: string
  ): Promise<void> {
    await this.log({
      userId: approvedByUserId,
      action: AuditAction.AVALUO_APPROVED,
      tableName: "avaluos",
      recordId: avaluoId,
      newValue: {
        codigo: avaluoCode,
        estado: "APROBADO",
      },
    })
  },

  /**
   * Registra rechazo de avalúo
   */
  async logAvaluoRejected(
    rejectedByUserId: string,
    avaluoId: string,
    avaluoCode: string
  ): Promise<void> {
    await this.log({
      userId: rejectedByUserId,
      action: AuditAction.AVALUO_REJECTED,
      tableName: "avaluos",
      recordId: avaluoId,
      newValue: {
        codigo: avaluoCode,
        estado: "RECHAZADO",
      },
    })
  },

  /**
   * Obtiene logs de auditoría con filtros
   */
  async getLogs(params: {
    skip?: number
    take?: number
    userId?: string
    action?: string
    tableName?: string
    recordId?: string
    since?: Date
    until?: Date
    search?: string
  }) {
    const { skip = 0, take = 50, userId, action, tableName, recordId, since, until, search } = params

    const where: any = {}

    if (userId) {
      where.userId = userId
    }

    if (action) {
      where.action = action
    }

    if (tableName) {
      where.tableName = tableName
    }

    if (recordId) {
      where.recordId = recordId
    }

    if (since || until) {
      where.createdAt = {}
      if (since) {
        where.createdAt.gte = since
      }
      if (until) {
        where.createdAt.lte = until
      }
    }

    if (search) {
      where.user = {
        OR: [
          { name: { contains: search, mode: "insensitive" } },
          { email: { contains: search, mode: "insensitive" } },
        ],
      }
    }

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: "desc" },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              name: true,
            },
          },
        },
      }),
      prisma.auditLog.count({ where }),
    ])

    return { logs, total }
  },

  /**
   * Obtiene logs de auditoría para un usuario específico
   */
  async getUserActivityLogs(userId: string, limit: number = 100) {
    const logs = await prisma.auditLog.findMany({
      where: {
        OR: [{ userId }, { recordId: userId }],
      },
      orderBy: { createdAt: "desc" },
      take: limit,
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
      },
    })

    return logs
  },

  /**
   * Limpia logs antiguos (mantenimiento)
   */
  async deleteOldLogs(daysToKeep: number = 365): Promise<number> {
    const cutoffDate = new Date(
      Date.now() - daysToKeep * 24 * 60 * 60 * 1000
    )

    const result = await prisma.auditLog.deleteMany({
      where: {
        createdAt: { lt: cutoffDate },
      },
    })

    return result.count
  },
}
