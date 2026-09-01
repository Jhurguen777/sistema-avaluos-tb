/**
 * Constantes de Tipos de Inmueble
 * Enumeración de tipos de propiedades inmobiliarias
 */

import { z } from 'zod'

export const PRODUCT_CATEGORIES = {
  CASA: 'CASA',
  DEPARTAMENTO: 'DEPARTAMENTO',
  PENTHOUSE: 'PENTHOUSE',
  TERRENO: 'TERRENO',
  LOCAL_COMERCIAL: 'LOCAL_COMERCIAL',
  OFICINA: 'OFICINA',
  QUINTA: 'QUINTA',
  OTROS: 'OTROS'
} as const

export const PRODUCT_CATEGORY_LABELS: Record<keyof typeof PRODUCT_CATEGORIES, string> = {
  CASA: 'Casa',
  DEPARTAMENTO: 'Departamento',
  PENTHOUSE: 'Penthouse',
  TERRENO: 'Terreno',
  LOCAL_COMERCIAL: 'Local Comercial',
  OFICINA: 'Oficina',
  QUINTA: 'Quinta',
  OTROS: 'Otros'
}

export const ProductCategoryEnum = z.enum(Object.values(PRODUCT_CATEGORIES) as [string, ...string[]])

export type ProductCategoryEnum = z.infer<typeof ProductCategoryEnum>
