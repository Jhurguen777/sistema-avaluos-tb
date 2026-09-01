/**
 * Importación de JSON - Tipos y DTOs
 *
 * Tipos compartidos por el módulo de importación masiva de listings
 * inmobiliarios (JSON → tablas `products` + `product_locations`).
 */

import type { OperationType, ProductCategoryEnum } from "@prisma/client"

/** Estado de un registro individual tras el análisis (dry-run). */
export type EstadoRegistro = "VALIDO" | "SIN_PRECIO" | "SIN_COORDS" | "SIN_TITULO"

/** Registro normalizado extraído del JSON, listo para mostrar en la UI de revisión. */
export interface RegistroAnalizado {
  /** Índice original dentro del array JSON (0-based). */
  indice: number
  /** Código determinístico del listing (si existe), si no se genera uno. */
  codigo: string
  titulo: string | null
  /** Categoría detectada desde el título (puede ser corregida por el admin). */
  categoriaDetectada: ProductCategoryEnum
  /** Operación detectada desde el título. */
  operacionDetectada: OperationType
  /** Operación declarada en el campo `tipo_operacion` del JSON (si existe). */
  operacionDeclarada: OperationType | null
  /** True si la operación detectada del título difiere de la declarada → conflicto. */
  conflictoOperacion: boolean
  /** True si otra aparición anterior del lote ya usó el mismo código (la 1ª queda limpia). */
  duplicadoEnLote: boolean
  precioUsd: number | null
  /** Precio en bolivianos (original si venía en BOB, convertido si venía en USD). */
  precioBob: number | null
  /** Moneda declarada en el campo precio del JSON original. */
  monedaOriginal: "USD" | "BOB" | null
  superficieUtil: number | null
  superficieConstruida: number | null
  habitaciones: number | null
  banos: number | null
  cocheras: number | null
  direccion: string | null
  departamento: string | null
  municipio: string | null
  pais: string
  lat: number | null
  lng: number | null
  /** Estado derivado del análisis (define el grupo de la UI). */
  estado: EstadoRegistro
  /** Motivo humano del estado (para tooltip/badge). */
  motivoEstado: string
  /** Mapeo de campos: keys del registro original que se usaron para cada campo destino. */
  camposMapeados: Record<string, string>
  /** True si falta algún campo crítico en el registro original (para reporte de completitud). */
  camposFaltantes: string[]
}

/** Resumen estadístico del dry-run. */
export interface ResumenAnalisis {
  total: number
  validos: number
  sinPrecio: number
  sinCoords: number
  sinTitulo: number
  conflictosOperacion: number
  /** Registros con código repetido dentro del mismo lote (2ª aparición en adelante). */
  duplicadosLote: number
  /** Nombres de campo destino que no pudieron mapearse en N registros. */
  camposNoMapeados: Array<{ campo: string; count: number }>
}

/** Salida del action `analizarJsonAction`. */
export interface AnalizarJsonResult {
  registros: RegistroAnalizado[]
  resumen: ResumenAnalisis
}

/** Input de un registro seleccionado para importar (viene de la UI tras revisión). */
export interface RegistroAImportar {
  codigo: string
  titulo: string
  categoria: ProductCategoryEnum
  operacion: OperationType
  precioUsd: number | null
  precioBob: number | null
  superficieUtil: number | null
  superficieConstruida: number | null
  habitaciones: number | null
  banos: number | null
  cocheras: number | null
  direccion: string | null
  departamento: string | null
  municipio: string | null
  pais: string
  lat: number | null
  lng: number | null
}

/** Resultado del action `importarJsonAction`. */
export interface ImportarJsonResult {
  insertados: number
  omitidos: number
  /** Códigos que ya existían (skipDuplicates). */
  duplicados: string[]
  /** Códigos repetidos dentro del mismo lote (se conservó la primera aparición). */
  duplicadosEnLote: string[]
  /** Registros con error de validación final (no se intentaron). */
  errores: Array<{ codigo: string; error: string }>
}

/** Lista de operaciones para los selects de la UI. */
export const OPERACIONES_DISPONIBLES: OperationType[] = ["VENTA", "ALQUILER", "ANTICRETICO"]
