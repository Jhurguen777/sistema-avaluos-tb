/**
 * Constantes de Roles
 * Enumeración de roles del sistema
 */

import { z } from 'zod'

export const ROLES = {
  ADMIN: 'ADMIN',
  ARQUITECTO: 'ARQUITECTO',
  INGENIERO_CIVIL: 'INGENIERO_CIVIL',
  VALUADOR: 'VALUADOR'
} as const

export const ROLE_LABELS: Record<keyof typeof ROLES, string> = {
  ADMIN: 'Administrador',
  ARQUITECTO: 'Arquitecto',
  INGENIERO_CIVIL: 'Ingeniero Civil',
  VALUADOR: 'Valuador'
}

export const Role = z.enum(Object.values(ROLES) as [string, ...string[]])

export type Role = z.infer<typeof Role>
