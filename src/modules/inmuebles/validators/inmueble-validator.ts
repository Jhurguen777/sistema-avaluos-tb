/**
 * Inmueble Validators
 * Schemas de validación Zod para CRUD de inmuebles
 */

import { z } from 'zod'

/** Valores de enum permitidos (alineados con Prisma) */
const CATEGORIAS = [
  'CASA', 'DEPARTAMENTO', 'PENTHOUSE', 'TERRENO', 'LOCAL_COMERCIAL',
  'OFICINA', 'GALPON', 'QUINTA', 'MONOAMBIENTE', 'DUPLEX',
  'CONDOMINIO', 'EDIFICIO', 'COCHERA', 'HABITACION', 'OTROS',
] as const

const OPERACIONES = ['VENTA', 'ALQUILER', 'ANTICRETICO'] as const

/** Número opcional: acepta string vacío/nulo/undefined → null; si no, número */
const numOpt = z
  .union([z.number(), z.string()])
  .nullish()
  .transform((v) => {
    if (v === undefined || v === null || v === '') return null
    const n = typeof v === 'number' ? v : parseFloat(v)
    return Number.isNaN(n) ? null : n
  })
  .nullish()

/** Texto opcional (acepta vacío → null); clave opcional */
const txtOpt = z
  .string()
  .nullish()
  .transform((v) => (v && v.trim() !== '' ? v.trim() : null))
  .nullish()

/** Schema para crear inmueble */
export const createInmuebleValidator = z.object({
  codigoInmueble: z.string().min(1, 'El código del inmueble es obligatorio').max(50),
  nombre: z.string().min(2, 'El nombre debe tener al menos 2 caracteres').max(200),
  categoria: z.enum(CATEGORIAS, { message: 'Categoría inválida' }),
  operacion: z.enum(OPERACIONES, { message: 'Tipo de operación inválido' }),
  precioUsd: numOpt,
  precioBob: numOpt,
  superficieUtil: numOpt,
  superficieConstruida: numOpt,
  ambientes: numOpt,
  habitaciones: numOpt,
  banos: numOpt,
  cocheras: numOpt,
  anoConstruccion: numOpt,
  descripcion: txtOpt,
  direccion: txtOpt,
  lat: numOpt,
  lng: numOpt,
})

/** Schema para actualizar inmueble */
export const updateInmuebleValidator = createInmuebleValidator.partial()

/** Schema para listar inmuebles */
export const listInmueblesValidator = z.object({
  page: z.number().int().positive().optional().default(1),
  limit: z.number().int().positive().max(5000).optional().default(20),
  categoria: z.enum(CATEGORIAS).optional(),
  operacion: z.enum(OPERACIONES).optional(),
  search: z.string().optional(),
})

export type CreateInmuebleInput = z.infer<typeof createInmuebleValidator>
export type UpdateInmuebleInput = z.infer<typeof updateInmuebleValidator>
export type ListInmueblesInput = z.infer<typeof listInmueblesValidator>
