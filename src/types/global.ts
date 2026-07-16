/**
 * Global Type Definitions
 * Types compartidos para toda la aplicación
 */

import { Role } from '@prisma/client'

/**
 * Usuario autenticado en sesión
 */
export interface SessionUser {
  id: string
  email: string
  name: string
  role: Role
}

/**
 * Respuesta estándar de API
 */
export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

/**
 * Paginación
 */
export interface Pagination {
  page: number
  limit: number
  total: number
  totalPages: number
}

/**
 * Filtros de búsqueda
 */
export interface SearchFilters {
  q?: string
  page?: number
  limit?: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

/**
 * Opciones de tabla
 */
export interface TableOptions extends SearchFilters {
  columns?: string[]
}

/**
 * Item de auditoría
 */
export interface AuditItem {
  action: string
  tableName?: string
  recordId?: string
  oldValue?: any
  newValue?: any
  ipAddress?: string
  userAgent?: string
}

/**
 * Coordenadas geográficas
 */
export interface Coordinates {
  lat: number
  lng: number
}

/**
 * Ubicación completa
 */
export interface Location extends Coordinates {
  address?: string
  city?: string
  department?: string
  country?: string
  altitude?: number
}
