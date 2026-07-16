/**
 * Auth Types
 * Definiciones de tipos para autenticación
 */

import { Role } from "@prisma/client"

/**
 * Usuario autenticado (sin password)
 */
export interface AuthUser {
  id: string
  email: string
  name: string
  role: Role
}

/**
 * Token JWT payload
 */
export interface JWTPayload {
  id: string
  email: string
  name: string
  role: Role
  iat?: number
  exp?: number
}

/**
 * Session data
 */
export interface SessionData {
  user: AuthUser
  expires: string
}

/**
 * Resultado de login
 */
export interface LoginResult {
  success: boolean
  user?: AuthUser
  error?: string
}
