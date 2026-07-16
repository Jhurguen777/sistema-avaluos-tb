/**
 * Auth Service
 * Lógica de negocio de autenticación
 */

import { userRepository } from "../repositories/user-repository"
import bcrypt from "bcryptjs"
import { z } from "zod"

/**
 * Schema de login
 */
export const loginSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(6, "Password debe tener al menos 6 caracteres")
})

export type LoginInput = z.infer<typeof loginSchema>

/**
 * Servicio de autenticación
 */
export const authService = {
  /**
   * Verifica credenciales de usuario
   */
  async verifyCredentials(email: string, password: string) {
    const user = await userRepository.findByEmail(email)

    if (!user) {
      return { success: false, error: "Usuario no encontrado" }
    }

    if (!user.isActive) {
      return { success: false, error: "Usuario inactivo" }
    }

    const passwordsMatch = await bcrypt.compare(password, user.password)

    if (!passwordsMatch) {
      return { success: false, error: "Credenciales inválidas" }
    }

    // Actualizar último login
    await userRepository.updateLastLogin(user.id)

    return {
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role
      }
    }
  },

  /**
   * Hashea password
   */
  async hashPassword(password: string): Promise<string> {
    return await bcrypt.hash(password, 10)
  },

  /**
   * Verifica password
   */
  async verifyPassword(password: string, hash: string): Promise<boolean> {
    return await bcrypt.compare(password, hash)
  }
}
