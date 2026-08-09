/**
 * Avalúo Types
 * Tipos para el módulo de avalúos: creación completa, DTO y respuestas
 */

import type {
  AvaluoEstado,
  AvaluoTipo,
  ProductCategoryEnum,
  OperationType,
  TipoVia,
  CategoriaConstructiva,
  EstadoConservacion,
} from '@prisma/client'

/** DTO de avalúo para listados */
export interface AvaluoDTO {
  id: string
  codigo: string
  tipo: AvaluoTipo
  estado: AvaluoEstado
  fechaElaboracion: Date
  fechaAprobacion: Date | null
  solicitante: string | null
  propietario: string | null
  observaciones: string | null
  createdBy: string | null
  creadoPorNombre: string | null
  approvedBy: string | null
  createdAt: Date
  updatedAt: Date
  /** Datos del inmueble asociado */
  productId: string
  codigoInmueble: string
  nombreInmueble: string
  categoria: ProductCategoryEnum
  operacion: OperationType
  direccion: string | null
  zona: string | null
  /** Resultado resumido (si existe) */
  valorComercial: number | null
  valorTerreno: number | null
  valorConstruccion: number | null
}

/** Detalle completo de avalúo (incluye terreno, construcciones, factores, resultado) */
export interface AvaluoDetalleDTO extends AvaluoDTO {
  terreno: any | null
  construcciones: any[]
  factores: any | null
  resultado: any | null
  product: any
}

/** Input de terreno para crear avalúo */
export interface TerrenoInput {
  superficieM2: number                 // superficie útil (terreno total)
  superficieUtil?: number | null       // alias explícito
  superficieConstruida?: number | null // superficie edificada
  valorUnitario: number
  frente?: number | null
  fondo?: number | null
  formaLote?: string | null
  esEsquina?: boolean
  tipoVia?: TipoVia
  morfologia?: string | null
}

/** Input de construcción para crear avalúo */
export interface ConstruccionInput {
  categoria: CategoriaConstructiva
  estado: EstadoConservacion
  anoConstruccion: number
  superficieM2: number
  valorUnitarioOverride?: number | null
  tipo?: string
  descripcion?: string | null
}

/** Input de factores (6 factores de homologación) */
export interface FactoresInput {
  factorUbicacion?: number
  factorVia?: number
  factorFrente?: number
  factorEsquina?: number
  factorMorfologico?: number
  factorServicios?: number
}

/** Amenities y servicios (informativo, no afecta valor) */
export interface AmenitiesInput {
  habitaciones?: number | null
  banos?: number | null
  cocheras?: number | null
  ambientes?: number | null
}

export interface ServiciosInput {
  luz?: boolean
  agua?: boolean
  alcantarillado?: boolean
  gas?: boolean
  otros?: string | null
}

/** Métodos de cálculo del valor del terreno */
export type MetodoCalculoTerreno = 'SIMPLE' | 'HOMOLOGEO' | 'MANUAL'

/** Input completo para crear un avalúo (mapea los pasos del wizard) */
export interface CreateAvaluoCompletoInput {
  // Paso 1 - Categoría
  categoria: ProductCategoryEnum

  // Paso 2 - Operación + tipo
  operacion: OperationType
  tipo?: AvaluoTipo

  // Paso 3 - Ubicación
  direccion?: string | null
  zona?: string | null
  lat?: number | null
  lng?: number | null

  // Paso 4 - Terreno
  terreno: TerrenoInput

  // Paso 5 - Amenities + servicios (informativo)
  amenities?: AmenitiesInput
  servicios?: ServiciosInput

  // Paso 7 - Construcciones (opcional: si es terreno puro, va vacío)
  construcciones?: ConstruccionInput[]

  // Paso 8 - Factores del sujeto
  factores?: FactoresInput

  // Paso 9 - Comparables
  comparables?: ComparableInput[]
  metodoCalculoTerreno?: MetodoCalculoTerreno

  // Datos generales del avalúo
  solicitante?: string | null
  propietario?: string | null
  observaciones?: string | null
}

/** Input de comparable de mercado con factores opcionales */
export interface ComparableInput {
  direccion: string
  precioOferta: number
  precioM2: number
  superficie: number
  anoConstruccion?: number | null
  tipo?: 'VENTA' | 'ALQUILER'
  lat?: number | null
  lng?: number | null
  distancia?: number | null
  /** Factores opcionales (default 1.0 cuando el comparable viene de web scraping) */
  factorUbicacion?: number | null
  factorVia?: number | null
  factorFrente?: number | null
  factorEsquina?: number | null
  factorMorfologico?: number | null
  factorServicios?: number | null
}

/** Respuesta paginada de avalúos */
export interface AvaluosListResponse {
  avaluos: AvaluoDTO[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

/** Comparable cercano resultado de búsqueda por radio */
export interface ComparableCercanoDTO {
  id: string
  codigoInmueble: string
  nombre: string
  direccion: string | null
  precioUsd: number | null
  superficieUtil: number | null
  superficieConstruida: number | null
  lat: number
  lng: number
  distanciaMetros: number
  precioM2: number | null
}
