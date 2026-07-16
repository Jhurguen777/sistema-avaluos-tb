/**
 * Constantes de Tipos de Operación
 * Enumeración de tipos de operaciones inmobiliarias
 */

import { z } from 'zod'

export const OPERATION_TYPES = {
  VENTA: 'VENTA',
  ALQUILER: 'ALQUILER',
  ANTICRETICO: 'ANTICRETICO'
} as const

export const OPERATION_TYPE_LABELS: Record<keyof typeof OPERATION_TYPES, string> = {
  VENTA: 'Venta',
  ALQUILER: 'Alquiler',
  ANTICRETICO: 'Anticrético'
}

export const OperationType = z.enum(Object.values(OPERATION_TYPES) as [string, ...string[]])

export type OperationType = z.infer<typeof OperationType>
