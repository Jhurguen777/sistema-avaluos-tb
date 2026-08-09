/**
 * Inmueble Repository
 * Acceso a datos para CRUD de inmuebles (Product) y resolución de categorías
 */

import { prisma } from '@/shared/database/prisma'
import { toNum } from '@/shared/database/decimal'
import type { ProductCategoryEnum } from '@prisma/client'
import type { InmuebleDTO } from '../types/inmueble.types'

/** Mapea un Product (con categoría) a InmuebleDTO plano */
function toDTO(product: any): InmuebleDTO {
  return {
    id: product.id,
    codigoInmueble: product.codigoInmueble,
    nombre: product.nombre,
    categoryId: product.categoryId,
    categoria: product.category?.name ?? 'OTROS',
    operacion: product.operacion,
    precioUsd: toNum(product.precioUsd),
    precioBob: toNum(product.precioBob),
    superficieUtil: product.superficieUtil ?? null,
    superficieConstruida: product.superficieConstruida ?? null,
    ambientes: product.ambientes ?? null,
    habitaciones: product.habitaciones ?? null,
    banos: product.banos ?? null,
    cocheras: product.cocheras ?? null,
    anoConstruccion: product.anoConstruccion ?? null,
    descripcion: product.descripcion ?? null,
    direccion: product.direccion ?? null,
    lat: product.lat ?? null,
    lng: product.lng ?? null,
    createdAt: product.createdAt,
    updatedAt: product.updatedAt,
    imagenesCount: product.images?.length ?? 0,
  }
}

const selectWithCategory = {
  id: true,
  codigoInmueble: true,
  nombre: true,
  categoryId: true,
  category: { select: { id: true, name: true } },
  operacion: true,
  precioUsd: true,
  precioBob: true,
  superficieUtil: true,
  superficieConstruida: true,
  ambientes: true,
  habitaciones: true,
  banos: true,
  cocheras: true,
  anoConstruccion: true,
  descripcion: true,
  direccion: true,
  lat: true,
  lng: true,
  createdAt: true,
  updatedAt: true,
  images: { select: { id: true } },
} as const

export const inmuebleRepository = {
  /**
   * Resuelve el id de ProductCategory a partir del enum name.
   * Crea la categoría si no existe (para soportar todas las del enum).
   */
  async resolveCategoryId(name: ProductCategoryEnum): Promise<string> {
    const existente = await prisma.productCategory.findFirst({ where: { name } })
    if (existente) return existente.id
    const creada = await prisma.productCategory.create({
      data: { name, description: String(name), isActive: true },
    })
    return creada.id
  },

  /** Crear inmueble */
  async create(data: any): Promise<InmuebleDTO> {
    const product = await prisma.product.create({
      data,
      include: { category: { select: { id: true, name: true } }, images: { select: { id: true } } },
    })
    return toDTO(product)
  },

  /** Buscar por ID */
  async findById(id: string): Promise<InmuebleDTO | null> {
    const product = await prisma.product.findUnique({
      where: { id },
      select: selectWithCategory,
    })
    return product ? toDTO(product) : null
  },

  /** Buscar por código de inmueble */
  async findByCodigo(codigoInmueble: string): Promise<InmuebleDTO | null> {
    const product = await prisma.product.findUnique({
      where: { codigoInmueble },
      select: selectWithCategory,
    })
    return product ? toDTO(product) : null
  },

  /** Actualizar inmueble */
  async update(id: string, data: any): Promise<InmuebleDTO> {
    const product = await prisma.product.update({
      where: { id },
      data,
      include: { category: { select: { id: true, name: true } }, images: { select: { id: true } } },
    })
    return toDTO(product)
  },

  /** Eliminar inmueble. Falla si tiene avalúos (relación requerida sin cascade). */
  async delete(id: string): Promise<void> {
    await prisma.product.delete({ where: { id } })
  },

  /** Listar inmuebles con filtros y paginación */
  async list(params: { skip?: number; take?: number; where?: any }) {
    const { skip = 0, take = 20, where } = params
    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        skip,
        take,
        orderBy: [{ createdAt: 'desc' }, { id: 'asc' }],
        select: selectWithCategory,
      }),
      prisma.product.count({ where }),
    ])
    return { inmuebles: products.map(toDTO), total }
  },
}
