/**
 * Constantes de Categorías Constructivas
 * Enumeración de categorías para construcción (basado en tabla de valores de reposición)
 */

import { z } from 'zod'

export const CATEGORIAS_CONSTRUCTIVAS = {
  LUJO: 'LUJO',
  PRIMERA: 'PRIMERA',
  ESTANDAR: 'ESTANDAR',
  ECONOMICA: 'ECONOMICA',
} as const

export const CATEGORIA_CONSTRUCTIVA_LABELS: Record<keyof typeof CATEGORIAS_CONSTRUCTIVAS, string> = {
  LUJO: 'Lujo',
  PRIMERA: 'Primera',
  ESTANDAR: 'Estándar',
  ECONOMICA: 'Económica',
}

export const CategoriaConstructiva = z.enum(Object.values(CATEGORIAS_CONSTRUCTIVAS) as [string, ...string[]])

export type CategoriaConstructiva = z.infer<typeof CategoriaConstructiva>
