/**
 * User Types
 * Definiciones de tipos para módulo de usuarios
 */

import { User, Role } from "@prisma/client"

/**
 * Usuario sin password (para respuestas API)
 */
export type UserDTO = Omit<User, 'password'>

/**
 * Input para crear usuario
 */
export interface CreateUserInput {
  email: string
  name: string
  password: string
  role: Role
  isActive?: boolean
}

/**
 * Input para actualizar usuario
 */
export interface UpdateUserInput {
  email?: string
  name?: string
  password?: string
  role?: Role
  isActive?: boolean
}

/**
 * Filtros para listar usuarios
 */
export interface ListUsersFilters {
  page?: number
  limit?: number
  role?: Role
  isActive?: boolean
  search?: string
}

/**
 * Respuesta de lista de usuarios
 */
export interface UsersListResponse {
  users: UserDTO[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}
