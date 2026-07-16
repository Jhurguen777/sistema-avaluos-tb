/**
 * Constantes de Tipos de Avalúo
 * Enumeración de tipos de avalúos
 */

import { z } from 'zod'

export const AVALUO_TIPOS = {
  COMERCIAL: 'COMERCIAL',
  ALQUILER: 'ALQUILER',
  VENTA_RAPIDA: 'VENTA_RAPIDA',
  CAPITAL_COMERCIAL: 'CAPITAL_COMERCIAL'
} as const

export const AVALUO_TIPO_LABELS: Record<keyof typeof AVALUO_TIPOS, string> = {
  COMERCIAL: 'Valor Comercial',
  ALQUILER: 'Valor de Alquiler',
  VENTA_RAPIDA: 'Venta Rápida',
  CAPITAL_COMERCIAL: 'Capital Comercial'
}

export const AvaluoTipo = z.enum(Object.values(AVALUO_TIPOS) as [string, ...string[]])

export type AvaluoTipo = z.infer<typeof AvaluoTipo>
