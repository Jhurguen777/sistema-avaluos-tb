/**
 * User Repository
 * Acceso a datos de usuarios
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
  name?: string
  password?: string
  role?: Role
  isActive?: boolean
}

export const userRepository = {
  /**
   * Buscar usuario por email
   */
  async findByEmail(email: string): Promise<User | null> {
    return await prisma.user.findUnique({
      where: { email }
    })
  },

  /**
   * Buscar usuario por ID
   */
  async findById(id: string): Promise<User | null> {
    return await prisma.user.findUnique({
      where: { id }
    })
  },

  /**
   * Crear usuario
   */
  async create(data: CreateUserInput): Promise<User> {
    return await prisma.user.create({
      data
    })
  },

  /**
   * Actualizar usuario
   */
  async update(id: string, data: UpdateUserInput): Promise<User> {
    return await prisma.user.update({
      where: { id },
      data
    })
  },

  /**
   * Actualizar último login
   */
  async updateLastLogin(id: string): Promise<void> {
    await prisma.user.update({
      where: { id },
      data: { lastLoginAt: new Date() }
    })
  },

  /**
   * Desactivar usuario (soft delete)
   */
  async deactivate(id: string): Promise<User> {
    return await prisma.user.update({
      where: { id },
      data: { isActive: false }
    })
  },

  /**
   * Reactivar usuario
   */
  async reactivate(id: string): Promise<User> {
    return await prisma.user.update({
      where: { id },
      data: { isActive: true }
    })
  },

  /**
   * Listar todos los usuarios
   */
  async findAll(params?: {
    skip?: number
    take?: number
    where?: { isActive?: boolean; role?: Role }
  }) {
    const { skip = 0, take = 50, where } = params || {}

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
   * Verificar si email existe
   */
  async emailExists(email: string, excludeId?: string): Promise<boolean> {
    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true }
    })

    if (!user) return false
    if (excludeId && user.id === excludeId) return false
    return true
  }
}
