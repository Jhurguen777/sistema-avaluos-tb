/**
 * Inmueble Service
 * Lógica de negocio para CRUD de inmuebles
 */

import { inmuebleRepository } from '../repositories/inmueble-repository'
import { prisma } from '@/shared/database/prisma'
import { unlink } from 'fs/promises'
import path from 'path'
import type { CreateInmuebleInput, UpdateInmuebleInput } from '../validators/inmueble-validator'
import type { ProductCategoryEnum } from '@prisma/client'

export const inmuebleService = {
  /** Crear inmueble */
  async create(data: CreateInmuebleInput, _createdBy: string) {
    // Verificar código único
    const existente = await inmuebleRepository.findByCodigo(data.codigoInmueble)
    if (existente) {
      throw new Error('Ya existe un inmueble con ese código')
    }

    // Resolver categoría a categoryId
    const categoryId = await inmuebleRepository.resolveCategoryId(
      data.categoria as ProductCategoryEnum,
    )

    const { categoria, ...resto } = data
    return inmuebleRepository.create({ ...resto, categoryId })
  },

  /** Actualizar inmueble */
  async update(id: string, data: UpdateInmuebleInput, _updatedBy: string) {
    // Si cambia el código, verificar unicidad
    if (data.codigoInmueble) {
      const existente = await inmuebleRepository.findByCodigo(data.codigoInmueble)
      if (existente && existente.id !== id) {
        throw new Error('Ya existe un inmueble con ese código')
      }
    }

    // Resolver categoría si viene
    const { categoria, ...resto } = data
    const payload: any = { ...resto }
    if (categoria) {
      payload.categoryId = await inmuebleRepository.resolveCategoryId(
        categoria as ProductCategoryEnum,
      )
    }

    return inmuebleRepository.update(id, payload)
  },

  /** Eliminar inmueble (no se permite si tiene avalúos asociados) */
  async delete(id: string) {
    const nAvaluos = await prisma.avaluo.count({ where: { productId: id } })
    if (nAvaluos > 0) {
      throw new Error(
        `No se puede eliminar el inmueble porque tiene ${nAvaluos} avalúo(s) asociado(s). Elimine o reasigne los avalúos primero.`,
      )
    }

    // Recopilar URLs de imágenes antes del borrado (cascade elimina los registros)
    const imagenes = await prisma.productImage.findMany({
      where: { productId: id },
      select: { url: true },
    })

    await inmuebleRepository.delete(id)

    // Borrar archivos físicos de public/uploads; se ignora el error si no existen
    for (const img of imagenes) {
      try {
        await unlink(path.join(process.cwd(), 'public', img.url))
      } catch (e) {
        console.error('Archivo físico de imagen no encontrado al eliminar inmueble:', e)
      }
    }
  },

  /** Obtener por ID */
  async getById(id: string) {
    const inmueble = await inmuebleRepository.findById(id)
    if (!inmueble) {
      throw new Error('Inmueble no encontrado')
    }
    return inmueble
  },

  /** Listar inmuebles con filtros */
  async list(params: {
    page?: number
    limit?: number
    categoria?: string
    operacion?: string
    search?: string
    geolocalizado?: boolean
  }) {
    const { page = 1, limit = 20, categoria, operacion, search, geolocalizado } = params
    const skip = (page - 1) * limit

    const where: any = {}

    if (geolocalizado) {
      where.AND = [{ lat: { not: null } }, { lng: { not: null } }]
    }

    if (categoria) {
      where.category = { name: categoria }
    }
    if (operacion) {
      where.operacion = operacion
    }
    if (search) {
      where.OR = [
        { nombre: { contains: search, mode: 'insensitive' } },
        { codigoInmueble: { contains: search, mode: 'insensitive' } },
        { direccion: { contains: search, mode: 'insensitive' } },
      ]
    }

    const { inmuebles, total } = await inmuebleRepository.list({ skip, take: limit, where })

    return {
      inmuebles,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    }
  },
}
