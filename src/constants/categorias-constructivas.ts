/**
 * Constantes de Categorías Constructivas
 * Enumeración de categorías para construcción
 */

import { z } from 'zod'

export const CATEGORIAS_CONSTRUCTIVAS = {
  LUJO: 'LUJO',
  SEMILUJO: 'SEMILUJO',
  MEDIA: 'MEDIA',
  ECONOMICA: 'ECONOMICA',
  POPULAR: 'POPULAR'
} as const

export const CATEGORIA_CONSTRUCTIVA_LABELS: Record<keyof typeof CATEGORIAS_CONSTRUCTIVAS, string> = {
  LUJO: 'Lujo',
  SEMILUJO: 'Semilujo',
  MEDIA: 'Media',
  ECONOMICA: 'Económica',
  POPULAR: 'Popular'
}

export const CategoriaConstructiva = z.enum(Object.values(CATEGORIAS_CONSTRUCTIVAS) as [string, ...string[]])

export type CategoriaConstructiva = z.infer<typeof CategoriaConstructiva>
