/**
 * Avalúo Validators
 * Schemas Zod para creación completa y listado de avalúos
 */

import { z } from 'zod'

const CATEGORIAS_INMUEBLE = [
  'CASA', 'DEPARTAMENTO', 'PENTHOUSE', 'TERRENO', 'LOCAL_COMERCIAL',
  'OFICINA', 'GALPON', 'QUINTA', 'MONOAMBIENTE', 'DUPLEX',
  'CONDOMINIO', 'EDIFICIO', 'COCHERA', 'HABITACION', 'OTROS',
] as const

const OPERACIONES = ['VENTA', 'ALQUILER', 'ANTICRETICO'] as const

const CATEGORIAS_CONSTR = ['LUJO', 'PRIMERA', 'ESTANDAR', 'ECONOMICA'] as const
const ESTADOS_CONSERV = ['EXCELENTE', 'BUENO', 'REGULAR', 'MALO', 'DEMOLICION'] as const
const TIPOS_VIA = ['AVENIDA', 'CALLE', 'PASAJE', 'CARRETERA', 'CAMINO', 'SIN_VIA'] as const
const TIPOS_AVALUO = ['COMERCIAL', 'ALQUILER', 'VENTA_RAPIDA', 'CAPITAL_COMERCIAL'] as const
const METODOS_CALCULO = ['SIMPLE', 'HOMOLOGEO', 'MANUAL'] as const

/** Número positivo (requerido) */
const numReq = z.union([z.number(), z.string()]).transform((v) => {
  const n = typeof v === 'number' ? v : parseFloat(v)
  if (Number.isNaN(n)) throw new Error('Número inválido')
  return n
}).refine((n) => n > 0, 'El valor debe ser mayor a 0')

/** Número opcional → null si vacío */
const numOpt = z
  .union([z.number(), z.string()])
  .nullish()
  .transform((v) => {
    if (v === undefined || v === null || v === '') return null
    const n = typeof v === 'number' ? v : parseFloat(v)
    return Number.isNaN(n) ? null : n
  })
  .nullish()

/** Número no negativo (>= 0) opcional */
const numOptNonNeg = z
  .union([z.number(), z.string()])
  .nullish()
  .transform((v) => {
    if (v === undefined || v === null || v === '') return null
    const n = typeof v === 'number' ? v : parseFloat(v)
    return Number.isNaN(n) ? null : Math.max(0, n)
  })
  .nullish()

const txtOpt = z
  .string()
  .nullish()
  .transform((v) => (v && v.trim() !== '' ? v.trim() : null))
  .nullish()

/** Factor de homologación: entre 0.5 y 1.5 (default 1.0) */
const factorOpt = z
  .union([z.number(), z.string()])
  .nullish()
  .transform((v) => {
    if (v === undefined || v === null || v === '') return null
    const n = typeof v === 'number' ? v : parseFloat(v)
    if (Number.isNaN(n)) return null
    return Math.min(1.5, Math.max(0.5, n))
  })
  .nullish()

export const crearAvaluoValidator = z.object({
  // Paso 1 - Categoría
  categoria: z.enum(CATEGORIAS_INMUEBLE),

  // Paso 2 - Operación + tipo
  operacion: z.enum(OPERACIONES),
  tipo: z.enum(TIPOS_AVALUO).optional().default('COMERCIAL'),

  // Paso 3 - Ubicación
  direccion: txtOpt,
  zona: txtOpt,
  lat: numOpt,
  lng: numOpt,

  // Paso 4 - Terreno
  terreno: z.object({
    superficieM2: numReq,
    superficieUtil: numOpt,
    superficieConstruida: numOpt,
    valorUnitario: numReq,
    frente: numOpt,
    fondo: numOpt,
    formaLote: txtOpt,
    esEsquina: z.boolean().optional().default(false),
    tipoVia: z.enum(TIPOS_VIA).optional().default('CALLE'),
    morfologia: txtOpt,
  }),

  // Paso 5 - Amenities + servicios (informativo, opcional)
  amenities: z
    .object({
      habitaciones: numOptNonNeg,
      banos: numOptNonNeg,
      cocheras: numOptNonNeg,
      ambientes: numOptNonNeg,
    })
    .optional(),

  servicios: z
    .object({
      luz: z.boolean().optional().default(false),
      agua: z.boolean().optional().default(false),
      alcantarillado: z.boolean().optional().default(false),
      gas: z.boolean().optional().default(false),
      otros: txtOpt,
    })
    .optional(),

  // Paso 7 - Construcciones (ahora OPCIONAL: permite avalúos de terreno puro)
  construcciones: z
    .array(
      z.object({
        categoria: z.enum(CATEGORIAS_CONSTR),
        estado: z.enum(ESTADOS_CONSERV),
        anoConstruccion: numReq,
        superficieM2: numReq,
        valorUnitarioOverride: numOpt,
        tipo: z.string().optional().default('Principal'),
        descripcion: txtOpt,
      }),
    )
    .optional()

    .default([]),

  // Paso 8 - Factores del sujeto
  factores: z
    .object({
      factorUbicacion: z.number().optional().default(1.0),
      factorVia: z.number().optional().default(1.0),
      factorFrente: z.number().optional().default(1.0),
      factorEsquina: z.number().optional().default(1.0),
      factorMorfologico: z.number().optional().default(1.0),
      factorServicios: z.number().optional().default(1.0),
    })
    .optional(),

  // Paso 9 - Comparables
  comparables: z
    .array(
      z.object({
        direccion: z.string().min(1, 'La dirección del comparable es obligatoria'),
        precioOferta: numReq,
        precioM2: numReq,
        superficie: numReq,
        anoConstruccion: numOpt,
        tipo: z.enum(['VENTA', 'ALQUILER']).optional().default('VENTA'),
        lat: numOpt,
        lng: numOpt,
        distancia: numOpt,
        factorUbicacion: factorOpt,
        factorVia: factorOpt,
        factorFrente: factorOpt,
        factorEsquina: factorOpt,
        factorMorfologico: factorOpt,
        factorServicios: factorOpt,
      }),
    )
    .optional(),

  metodoCalculoTerreno: z.enum(METODOS_CALCULO).optional().default('SIMPLE'),

  // Datos generales
  solicitante: txtOpt,
  propietario: txtOpt,
  observaciones: txtOpt,
})

export const listAvaluosValidator = z.object({
  page: z.number().int().positive().optional().default(1),
  limit: z.number().int().positive().max(100).optional().default(20),
  estado: z.enum(['BORRADOR', 'EN_REVISION', 'APROBADO', 'RECHAZADO']).optional(),
  tipo: z.enum(TIPOS_AVALUO).optional(),
  search: z.string().optional(),
  createdBy: z.string().optional(),
})

export const cambiarEstadoValidator = z.object({
  estado: z.enum(['BORRADOR', 'EN_REVISION', 'APROBADO', 'RECHAZADO']),
  observaciones: z.string().optional(),
})

/** Validator para actualizar un avalúo existente (todos los campos editables opcionales) */
export const actualizarAvaluoValidator = z.object({
  tipo: z.enum(TIPOS_AVALUO).optional(),
  solicitante: txtOpt,
  propietario: txtOpt,
  observaciones: txtOpt,

  terreno: z
    .object({
      superficieM2: numReq,
      superficieUtil: numOpt,
      superficieConstruida: numOpt,
      valorUnitario: numReq,
      frente: numOpt,
      fondo: numOpt,
      formaLote: txtOpt,
      esEsquina: z.boolean().optional(),
      tipoVia: z.enum(TIPOS_VIA).optional(),
      morfologia: txtOpt,
    })
    .optional(),

  construcciones: z
    .array(
      z.object({
        categoria: z.enum(CATEGORIAS_CONSTR),
        estado: z.enum(ESTADOS_CONSERV),
        anoConstruccion: numReq,
        superficieM2: numReq,
        valorUnitarioOverride: numOpt,
        tipo: z.string().optional().default('Principal'),
        descripcion: txtOpt,
      }),
    )
    .optional(),

  factores: z
    .object({
      factorUbicacion: z.number().optional(),
      factorVia: z.number().optional(),
      factorFrente: z.number().optional(),
      factorEsquina: z.number().optional(),
      factorMorfologico: z.number().optional(),
      factorServicios: z.number().optional(),
    })
    .optional(),
})

/** Validator para crear/actualizar un comparable de mercado */
export const comparableValidator = z.object({
  direccion: z.string().min(1, 'La dirección del comparable es obligatoria'),
  precioOferta: numReq,
  precioM2: numReq,
  superficie: numReq,
  anoConstruccion: numOpt,
  tipo: z.enum(['VENTA', 'ALQUILER']).optional().default('VENTA'),
  lat: numOpt,
  lng: numOpt,
  distancia: numOpt,
  factorUbicacion: factorOpt,
  factorVia: factorOpt,
  factorFrente: factorOpt,
  factorEsquina: factorOpt,
  factorMorfologico: factorOpt,
  factorServicios: factorOpt,
})

/** Validator para la búsqueda de comparables cercanos */
export const buscarComparablesValidator = z.object({
  lat: z.number(),
  lng: z.number(),
  radioMetros: z.number().int().positive().max(10000).default(1000),
})

export type CrearAvaluoInput = z.infer<typeof crearAvaluoValidator>
export type ListAvaluosInput = z.infer<typeof listAvaluosValidator>
export type CambiarEstadoInput = z.infer<typeof cambiarEstadoValidator>
export type ActualizarAvaluoInput = z.infer<typeof actualizarAvaluoValidator>
export type ComparableInput = z.infer<typeof comparableValidator>
export type BuscarComparablesInput = z.infer<typeof buscarComparablesValidator>
