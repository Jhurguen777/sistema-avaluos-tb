/**
 * Inmueble Types
 * Definiciones de tipos para el módulo de inmuebles (Product)
 */

import type { ProductCategoryEnum, OperationType } from '@prisma/client'

/** Inmueble con datos planos para la UI (incluye categoría resuelta) */
export interface InmuebleDTO {
  id: string
  codigoInmueble: string
  nombre: string
  categoryId: string
  categoria: ProductCategoryEnum
  operacion: OperationType
  precioUsd: number | null
  precioBob: number | null
  superficieUtil: number | null
  superficieConstruida: number | null
  ambientes: number | null
  habitaciones: number | null
  banos: number | null
  cocheras: number | null
  anoConstruccion: number | null
  descripcion: string | null
  direccion: string | null
  lat: number | null
  lng: number | null
  createdAt: Date
  updatedAt: Date
  /** Cantidad de imágenes asociadas */
  imagenesCount: number
}

/** Input para crear inmueble */
export interface CreateInmuebleInput {
  codigoInmueble: string
  nombre: string
  categoria: ProductCategoryEnum
  operacion: OperationType
  precioUsd?: number | null
  superficieUtil?: number | null
  superficieConstruida?: number | null
  ambientes?: number | null
  habitaciones?: number | null
  banos?: number | null
  cocheras?: number | null
  anoConstruccion?: number | null
  descripcion?: string | null
  direccion?: string | null
  lat?: number | null
  lng?: number | null
}

/** Input para actualizar inmueble (todos opcionales excepto ninguno requerido) */
export type UpdateInmuebleInput = Partial<CreateInmuebleInput>

/** Respuesta paginada de inmuebles */
export interface InmueblesListResponse {
  inmuebles: InmuebleDTO[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}
