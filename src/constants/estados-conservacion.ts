/**
 * Constantes de Estados de Conservación
 * Enumeración de estados de conservación de construcciones
 */

import { z } from 'zod'

export const ESTADOS_CONSERVACION = {
  EXCELENTE: 'EXCELENTE',
  MUY_BUENO: 'MUY_BUENO',
  BUENO: 'BUENO',
  REGULAR: 'REGULAR',
  MALO: 'MALO'
} as const

export const ESTADO_CONSERVACION_LABELS: Record<keyof typeof ESTADOS_CONSERVACION, string> = {
  EXCELENTE: 'Excelente',
  MUY_BUENO: 'Muy Bueno',
  BUENO: 'Bueno',
  REGULAR: 'Regular',
  MALO: 'Malo'
}

export const ESTADO_CONSERVACION_COLORES: Record<keyof typeof ESTADOS_CONSERVACION, string> = {
  EXCELENTE: 'green',
  MUY_BUENO: 'blue',
  BUENO: 'cyan',
  REGULAR: 'yellow',
  MALO: 'red'
}

export const EstadoConservacion = z.enum(Object.values(ESTADOS_CONSERVACION) as [string, ...string[]])

export type EstadoConservacion = z.infer<typeof EstadoConservacion>
