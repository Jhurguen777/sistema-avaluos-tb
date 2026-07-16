/**
 * Login Attempt Repository
 *
 * Repositorio para registrar y consultar intentos de login
 * Proporciona datos para auditoría y detección de ataques
 */

import { prisma } from "@/shared/database/prisma"

export interface LoginAttemptInput {
  email: string
  success: boolean
  ipAddress?: string
  userAgent?: string
}

export const loginAttemptRepository = {
  /**
   * Registra un intento de login
   */
  async create(data: LoginAttemptInput) {
    return await prisma.loginAttempt.create({
      data: {
        email: data.email,
        success: data.success,
        ipAddress: data.ipAddress,
        userAgent: data.userAgent,
      },
    })
  },

  /**
   * Cuenta intentos fallidos consecutivos para un email
   * en un periodo de tiempo
   */
  async countFailedAttemptsForEmail(
    email: string,
    minutes: number = 15
  ): Promise<number> {
    const since = new Date(Date.now() - minutes * 60 * 1000)

    const count = await prisma.loginAttempt.count({
      where: {
        email,
        success: false,
        createdAt: { gte: since },
      },
    })

    return count
  },

  /**
   * Cuenta intentos fallidos consecutivos para una IP
   * en un periodo de tiempo
   */
  async countFailedAttemptsForIP(
    ipAddress: string,
    minutes: number = 15
  ): Promise<number> {
    const since = new Date(Date.now() - minutes * 60 * 1000)

    const count = await prisma.loginAttempt.count({
      where: {
        ipAddress,
        success: false,
        createdAt: { gte: since },
      },
    })

    return count
  },

  /**
   * Obtiene los últimos N intentos fallidos para un email
   */
  async getRecentFailedAttemptsForEmail(
    email: string,
    limit: number = 10
  ): Promise<any[]> {
    return await prisma.loginAttempt.findMany({
      where: {
        email,
        success: false,
      },
      orderBy: { createdAt: "desc" },
      take: limit,
      select: {
        id: true,
        ipAddress: true,
        userAgent: true,
        createdAt: true,
      },
    })
  },

  /**
   * Obtiene los últimos N intentos fallidos para una IP
   */
  async getRecentFailedAttemptsForIP(
    ipAddress: string,
    limit: number = 10
  ): Promise<any[]> {
    return await prisma.loginAttempt.findMany({
      where: {
        ipAddress,
        success: false,
      },
      orderBy: { createdAt: "desc" },
      take: limit,
      select: {
        id: true,
        email: true,
        userAgent: true,
        createdAt: true,
      },
    })
  },

  /**
   * Obtiene intentos de login recientes con paginación
   * útil para dashboard de seguridad
   */
  async getRecentAttempts(params: {
    skip?: number
    take?: number
    email?: string
    ipAddress?: string
    success?: boolean
    since?: Date
  }) {
    const { skip = 0, take = 50, email, ipAddress, success, since } = params

    const where: any = {}

    if (email) {
      where.email = email
    }

    if (ipAddress) {
      where.ipAddress = ipAddress
    }

    if (success !== undefined) {
      where.success = success
    }

    if (since) {
      where.createdAt = { gte: since }
    }

    const [attempts, total] = await Promise.all([
      prisma.loginAttempt.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          email: true,
          success: true,
          ipAddress: true,
          userAgent: true,
          createdAt: true,
        },
      }),
      prisma.loginAttempt.count({ where }),
    ])

    return { attempts, total }
  },

  /**
   * Obtiene estadísticas de intentos de login
   */
  async getStats(since?: Date) {
    const where = since ? { createdAt: { gte: since } } : {}

    const [
      totalAttempts,
      successfulAttempts,
      failedAttempts,
      uniqueEmails,
      uniqueIPs,
    ] = await Promise.all([
      prisma.loginAttempt.count({ where }),
      prisma.loginAttempt.count({ where: { ...where, success: true } }),
      prisma.loginAttempt.count({ where: { ...where, success: false } }),
      prisma.loginAttempt.groupBy({
        by: ["email"],
        where,
        _count: { email: true },
      }).then((groups) => groups.length),
      prisma.loginAttempt.groupBy({
        by: ["ipAddress"],
        where: { ...where, ipAddress: { not: null } },
        _count: { ipAddress: true },
      }).then((groups) => groups.length),
    ])

    return {
      totalAttempts,
      successfulAttempts,
      failedAttempts,
      uniqueEmails,
      uniqueIPs,
      successRate:
        totalAttempts > 0
          ? (successfulAttempts / totalAttempts) * 100
          : 0,
    }
  },

  /**
   * Limpia intentos antiguos (mantenimiento)
   * Útil para limpiar la base de datos periódicamente
   */
  async deleteOldAttempts(daysToKeep: number = 90): Promise<number> {
    const cutoffDate = new Date(
      Date.now() - daysToKeep * 24 * 60 * 60 * 1000
    )

    const result = await prisma.loginAttempt.deleteMany({
      where: {
        createdAt: { lt: cutoffDate },
      },
    })

    return result.count
  },
}
