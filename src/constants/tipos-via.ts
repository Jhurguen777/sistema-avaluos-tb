/**
 * Constantes de Tipos de Vía
 * Enumeración de tipos de vías para terrenos
 */

import { z } from 'zod'

export const TIPOS_VIA = {
  AVENIDA: 'AVENIDA',
  CALLE: 'CALLE',
  PASAJE: 'PASAJE',
  CARRETERA: 'CARRETERA',
  CAMINO: 'CAMINO',
  SIN_VIA: 'SIN_VIA'
} as const

export const TIPO_VIA_LABELS: Record<keyof typeof TIPOS_VIA, string> = {
  AVENIDA: 'Avenida',
  CALLE: 'Calle',
  PASAJE: 'Pasaje',
  CARRETERA: 'Carretera',
  CAMINO: 'Camino',
  SIN_VIA: 'Sin Vía'
}

export const TipoVia = z.enum(Object.values(TIPOS_VIA) as [string, ...string[]])

export type TipoVia = z.infer<typeof TipoVia>
