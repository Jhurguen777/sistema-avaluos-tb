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
  GALPON: 'GALPON',
  QUINTA: 'QUINTA',
  MONOAMBIENTE: 'MONOAMBIENTE',
  DUPLEX: 'DUPLEX',
  CONDOMINIO: 'CONDOMINIO',
  EDIFICIO: 'EDIFICIO',
  COCHERA: 'COCHERA',
  HABITACION: 'HABITACION',
  OTROS: 'OTROS'
} as const

export const PRODUCT_CATEGORY_LABELS: Record<keyof typeof PRODUCT_CATEGORIES, string> = {
  CASA: 'Casa',
  DEPARTAMENTO: 'Departamento',
  PENTHOUSE: 'Penthouse',
  TERRENO: 'Terreno',
  LOCAL_COMERCIAL: 'Local Comercial',
  OFICINA: 'Oficina',
  GALPON: 'Galpón',
  QUINTA: 'Quinta',
  MONOAMBIENTE: 'Monoambiente',
  DUPLEX: 'Dúplex',
  CONDOMINIO: 'Condominio',
  EDIFICIO: 'Edificio',
  COCHERA: 'Cochera',
  HABITACION: 'Habitación',
  OTROS: 'Otros'
}

export const ProductCategoryEnum = z.enum(Object.values(PRODUCT_CATEGORIES) as [string, ...string[]])

export type ProductCategoryEnum = z.infer<typeof ProductCategoryEnum>
