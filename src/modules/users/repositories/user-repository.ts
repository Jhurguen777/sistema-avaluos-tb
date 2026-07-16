/**
 * User Repository (Users Module)
 * Acceso a datos para CRUD de usuarios
 */

import { prisma } from "@/shared/database/prisma"
import { User, Role } from "@prisma/client"

export interface CreateUserInput {
  email: string
  name: string
  password: string
  role: Role
  isActive?: boolean
}

export interface UpdateUserInput {
  email?: string
  name?: string
  password?: string
  role?: Role
  isActive?: boolean
}

export const userRepository = {
  /**
   * Crear usuario
   */
  async create(data: CreateUserInput): Promise<any> {
    return await prisma.user.create({
      data,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        createdAt: true,
        lastLoginAt: true
      }
    })
  },

  /**
   * Buscar por ID
   */
  async findById(id: string): Promise<any> {
    return await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        createdAt: true,
        lastLoginAt: true,
        updatedAt: true
      }
    })
  },

  /**
   * Buscar por email
   */
  async findByEmail(email: string): Promise<any> {
    return await prisma.user.findUnique({
      where: { email }
    })
  },

  /**
   * Actualizar usuario
   */
  async update(id: string, data: UpdateUserInput): Promise<any> {
    return await prisma.user.update({
      where: { id },
      data,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        createdAt: true,
        lastLoginAt: true,
        updatedAt: true
      }
    })
  },

  /**
   * Desactivar usuario (soft delete)
   */
  async deactivate(id: string): Promise<any> {
    return await prisma.user.update({
      where: { id },
      data: { isActive: false }
    })
  },

  /**
   * Reactivar usuario
   */
  async reactivate(id: string): Promise<any> {
    return await prisma.user.update({
      where: { id },
      data: { isActive: true }
    })
  },

  /**
   * Eliminar usuario (hard delete - solo admin)
   */
  async delete(id: string): Promise<any> {
    return await prisma.user.delete({
      where: { id }
    })
  },

  /**
   * Listar usuarios con filtros
   */
  async list(params: {
    skip?: number
    take?: number
    where?: any
  }) {
    const { skip = 0, take = 20, where } = params

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          isActive: true,
          createdAt: true,
          lastLoginAt: true
        }
      }),
      prisma.user.count({ where })
    ])

    return { users, total }
  },

  /**
   * Contar usuarios por rol
   */
  async countByRole(): Promise<Record<Role, number>> {
    const counts = await prisma.user.groupBy({
      by: ['role'],
      _count: { role: true }
    })

    return counts.reduce((acc, item) => {
      acc[item.role] = item._count.role
      return acc
    }, {} as Record<Role, number>)
  }
}
