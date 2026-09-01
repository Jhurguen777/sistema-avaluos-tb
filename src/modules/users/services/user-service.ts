/**
 * User Service
 * Lógica de negocio para CRUD de usuarios
 */

import { userRepository } from "../repositories/user-repository"
import { authService } from "@/modules/auth/services/auth-service"
import type { CreateUserInput, UpdateUserInput } from "../repositories/user-repository"
import type { User } from "@prisma/client"
import { randomInt } from "crypto"

export const userService = {
  /**
   * Crear usuario
   */
  async create(data: CreateUserInput, createdBy: string): Promise<User> {
    // Verificar email único
    const existingUser = await userRepository.findByEmail(data.email)
    if (existingUser) {
      throw new Error("El email ya está registrado")
    }

    // Hashear password
    const hashedPassword = await authService.hashPassword(data.password)

    // Crear usuario
    const user = await userRepository.create({
      ...data,
      password: hashedPassword
    })

    return user
  },

  /**
   * Actualizar usuario
   */
  async update(id: string, data: UpdateUserInput, updatedBy: string): Promise<User> {
    // Si se actualiza el email, verificar que no exista
    if (data.email) {
      const existingUser = await userRepository.findByEmail(data.email)
      if (existingUser && existingUser.id !== id) {
        throw new Error("El email ya está en uso por otro usuario")
      }
    }

    // Si se actualiza password, hashearlo
    if (data.password) {
      data.password = await authService.hashPassword(data.password)
    }

    // Verificar que no sea el mismo usuario (seguridad)
    if (id === updatedBy && data.role) {
      throw new Error("No puedes cambiar tu propio rol")
    }

    return await userRepository.update(id, data)
  },

  /**
   * Desactivar usuario
   */
  async deactivate(id: string, deactivatedBy: string): Promise<User> {
    // No desactivarse a sí mismo
    if (id === deactivatedBy) {
      throw new Error("No puedes desactivar tu propio usuario")
    }

    return await userRepository.deactivate(id)
  },

  /**
   * Reactivar usuario
   */
  async reactivate(id: string): Promise<User> {
    return await userRepository.reactivate(id)
  },

  /**
   * Reset password
   */
  async resetPassword(id: string, newPassword: string): Promise<void> {
    const hashedPassword = await authService.hashPassword(newPassword)
    await userRepository.update(id, { password: hashedPassword })
  },

  /**
   * Generar password temporal con PRNG criptográfico (crypto.randomInt)
   */
  generateTempPassword(): string {
    const length = 12
    const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%"
    let password = ""
    for (let i = 0; i < length; i++) {
      password += charset.charAt(randomInt(0, charset.length))
    }
    return password
  },

  /**
   * Listar usuarios
   */
  async list(params: {
    page?: number
    limit?: number
    role?: string
    isActive?: boolean
    search?: string
  }) {
    const { page = 1, limit = 20, role, isActive, search } = params

    const skip = (page - 1) * limit

    const where: any = {}

    if (role) {
      where.role = role
    }

    if (isActive !== undefined) {
      where.isActive = isActive
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } }
      ]
    }

    const { users, total } = await userRepository.list({
      skip,
      take: limit,
      where
    })

    return {
      users,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    }
  }
}
