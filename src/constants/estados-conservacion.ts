/**
 * Constantes de Estados de Conservación
 * Enumeración de estados de conservación de construcciones (basado en tabla de valores de reposición)
 */

import { z } from 'zod'

export const ESTADOS_CONSERVACION = {
  EXCELENTE: 'EXCELENTE',
  BUENO: 'BUENO',
  REGULAR: 'REGULAR',
  MALO: 'MALO',
  DEMOLICION: 'DEMOLICION',
} as const

export const ESTADO_CONSERVACION_LABELS: Record<keyof typeof ESTADOS_CONSERVACION, string> = {
  EXCELENTE: 'Excelente',
  BUENO: 'Bueno',
  REGULAR: 'Regular',
  MALO: 'Malo',
  DEMOLICION: 'Demolición',
}

export const ESTADO_CONSERVACION_COLORES: Record<keyof typeof ESTADOS_CONSERVACION, string> = {
  EXCELENTE: 'green',
  BUENO: 'cyan',
  REGULAR: 'yellow',
  MALO: 'orange',
  DEMOLICION: 'red',
}

export const EstadoConservacion = z.enum(Object.values(ESTADOS_CONSERVACION) as [string, ...string[]])

export type EstadoConservacion = z.infer<typeof EstadoConservacion>
