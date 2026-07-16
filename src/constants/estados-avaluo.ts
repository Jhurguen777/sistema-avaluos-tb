/**
 * Constantes de Estados de Avalúo
 * Enumeración de estados del workflow de avalúos
 */

import { z } from 'zod'

export const AVALUO_ESTADOS = {
  BORRADOR: 'BORRADOR',
  EN_REVISION: 'EN_REVISION',
  APROBADO: 'APROBADO',
  RECHAZADO: 'RECHAZADO'
} as const

export const AVALUO_ESTADO_LABELS: Record<keyof typeof AVALUO_ESTADOS, string> = {
  BORRADOR: 'Borrador',
  EN_REVISION: 'En Revisión',
  APROBADO: 'Aprobado',
  RECHAZADO: 'Rechazado'
}

export const AVALUO_ESTADO_COLORS: Record<keyof typeof AVALUO_ESTADOS, string> = {
  BORRADOR: 'gray',
  EN_REVISION: 'blue',
  APROBADO: 'green',
  RECHAZADO: 'red'
}

export const AvaluoEstado = z.enum(Object.values(AVALUO_ESTADOS) as [string, ...string[]])

export type AvaluoEstado = z.infer<typeof AvaluoEstado>
