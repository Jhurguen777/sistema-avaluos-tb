/**
 * Tabla de Valores de Reposición (USD/m²)
 *
 * Matriz [categoría constructiva][estado de conservación] tomada de la planilla
 * del sistema. Los rangos (min-max) definen el valor unitario de reposición
 * de construcción en USD por metro cuadrado.
 *
 * Reglas de negocio (confirmadas con el usuario):
 *  - El sistema sugiere el PROMEDIO del rango por defecto; el valuador puede
 *    editarlo siempre que quede dentro del rango.
 *  - Para el estado DEMOLICIÓN el valor de construcción es 0 y la tabla define
 *    un COSTO DE DEMOLICIÓN (negativo en la planilla original) que se RESTA
 *    al total del avalúo.
 *
 * Tabla original:
 *  CONSERVACIÓN | LUJO      | PRIMERA   | ESTÁNDAR  | ECONÓMICA | REF. AÑOS
 *  EXCELENTE    | 500-550   | 450-500   | 400-450   | 350-400   | 1-10
 *  BUENO        | 450-500   | 400-450   | 350-400   | 250-350   | 10-20
 *  REGULAR      | 350-400   | 300-350   | 250-300   | 200-250   | 20-30
 *  MALO         | 300-350   | 250-300   | 200-250   | 150-200   | 30-40
 *  DEMOLICIÓN   | costo 100 | costo 100 | costo 80  | costo 0   | inhabitable
 */

import type { CategoriaConstructiva } from '@/constants/categorias-constructivas'
import type { EstadoConservacion } from '@/constants/estados-conservacion'

/** Rango de valor unitario (USD/m²) para estados habituales */
interface RangoValor {
  min: number
  max: number
}

/** Costo de demolición (USD/m²) que se resta al avalúo; 0 si no aplica */
interface CostoDemolicion {
  costo: number
}

/** Vida útil estándar en años (depreciación) */
export const VIDA_UTIL_ANIOS = 50

/**
 * Tabla principal de valores de reposición por categoría × estado.
 * Los estados habituales (EXCELENTE..MALO) definen rangos {min,max}.
 * DEMOLICIÓN define un {costo} de demolición.
 */
export const VALORES_REPOSICION: Record<
  CategoriaConstructiva,
  Record<EstadoConservacion, RangoValor | CostoDemolicion>
> = {
  LUJO: {
    EXCELENTE: { min: 500, max: 550 },
    BUENO: { min: 450, max: 500 },
    REGULAR: { min: 350, max: 400 },
    MALO: { min: 300, max: 350 },
    DEMOLICION: { costo: 100 },
  },
  PRIMERA: {
    EXCELENTE: { min: 450, max: 500 },
    BUENO: { min: 400, max: 450 },
    REGULAR: { min: 300, max: 350 },
    MALO: { min: 250, max: 300 },
    DEMOLICION: { costo: 100 },
  },
  ESTANDAR: {
    EXCELENTE: { min: 400, max: 450 },
    BUENO: { min: 350, max: 400 },
    REGULAR: { min: 250, max: 300 },
    MALO: { min: 200, max: 250 },
    DEMOLICION: { costo: 80 },
  },
  ECONOMICA: {
    EXCELENTE: { min: 350, max: 400 },
    BUENO: { min: 250, max: 350 },
    REGULAR: { min: 200, max: 250 },
    MALO: { min: 150, max: 200 },
    DEMOLICION: { costo: 0 },
  },
}

/**
 * Rangos de antigüedad (años) asociados a cada estado de conservación.
 * Sirven como referencia/sugerencia, no invalidan la selección del valuador.
 */
export const ANTIGUEDAD_POR_ESTADO: Record<EstadoConservacion, { min: number; max: number } | 'inhabitable'> = {
  EXCELENTE: { min: 1, max: 10 },
  BUENO: { min: 10, max: 20 },
  REGULAR: { min: 20, max: 30 },
  MALO: { min: 30, max: 40 },
  DEMOLICION: 'inhabitable',
}

/** Tipo del mapa de valores de reposición */
export type ValoresReposicionData = typeof VALORES_REPOSICION

/** ¿La celda corresponde a un rango de valor (estado habitable)? */
function esRango(celda: RangoValor | CostoDemolicion): celda is RangoValor {
  return (celda as RangoValor).min !== undefined
}

/** ¿El estado es demolición? */
export function esDemolicion(estado: EstadoConservacion): boolean {
  return estado === 'DEMOLICION'
}

/**
 * Valor unitario sugerido (USD/m²): promedio del rango para estados habituales.
 * Para DEMOLICIÓN devuelve 0 (la construcción no tiene valor de reposición).
 */
export function valorSugerido(
  categoria: CategoriaConstructiva,
  estado: EstadoConservacion,
  valoresMap: ValoresReposicionData = VALORES_REPOSICION,
): number {
  if (esDemolicion(estado)) return 0
  const celda = valoresMap[categoria]?.[estado]
  if (!celda || !esRango(celda)) return 0
  return (celda.min + celda.max) / 2
}

/**
 * Rango permitido (min,max) para un estado habitable.
 * Devuelve null para DEMOLICIÓN (no hay rango, solo costo).
 */
export function rangoValor(
  categoria: CategoriaConstructiva,
  estado: EstadoConservacion,
  valoresMap: ValoresReposicionData = VALORES_REPOSICION,
): { min: number; max: number } | null {
  if (esDemolicion(estado)) return null
  const celda = valoresMap[categoria]?.[estado]
  if (!celda || !esRango(celda)) return null
  return { min: celda.min, max: celda.max }
}

/**
 * Valida que un valor unitario esté dentro del rango permitido.
 * Para DEMOLICIÓN solo acepta 0.
 */
export function validarRango(
  categoria: CategoriaConstructiva,
  estado: EstadoConservacion,
  valor: number,
  valoresMap: ValoresReposicionData = VALORES_REPOSICION,
): boolean {
  if (esDemolicion(estado)) return valor === 0
  const rango = rangoValor(categoria, estado, valoresMap)
  if (!rango) return false
  return valor >= rango.min && valor <= rango.max
}

/**
 * Costo de demolición (USD/m²) para una categoría cuando el estado es DEMOLICIÓN.
 * Devuelve 0 si el estado no es demolición.
 */
export function costoDemolicion(
  categoria: CategoriaConstructiva,
  estado: EstadoConservacion,
  valoresMap: ValoresReposicionData = VALORES_REPOSICION,
): number {
  if (!esDemolicion(estado)) return 0
  const celda = valoresMap[categoria]?.[estado]
  if (!celda || esRango(celda)) return 0
  return celda.costo
}

/**
 * Valor unitario "como nuevo" (estado EXCELENTE) de una categoría.
 * Se usa para calcular la depreciación total de reporte:
 *   depreciación = (valorNuevo - valorActual) × superficie
 */
export function valorUnitarioNuevo(
  categoria: CategoriaConstructiva,
  valoresMap: ValoresReposicionData = VALORES_REPOSICION,
): number {
  return valorSugerido(categoria, 'EXCELENTE', valoresMap)
}
