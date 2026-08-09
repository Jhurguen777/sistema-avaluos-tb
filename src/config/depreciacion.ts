/**
 * Configuración y cálculo de Depreciación de Construcción
 *
 * Método A (basado en la tabla de valores de reposición):
 *  - valorUnitario proviene de VALORES_REPOSICION[categoría][estado] (promedio del rango).
 *  - El estado ya refleja la depreciación (EXCELENTE = más alto, MALO = más bajo),
 *    por lo que valorNeto = valorReposicion (sin aplicar depreciación adicional).
 *  - depreciación total (solo para reporte) = (valorNuevo − valorActual) × superficie,
 *    donde valorNuevo es el valor del estado EXCELENTE de la misma categoría.
 *  - En DEMOLICIÓN la construcción vale 0 y el costo de demolición se resta al avalúo.
 *
 * Esto evita la doble depreciación del método lineal anterior.
 */

import {
  VIDA_UTIL_ANIOS,
  valorSugerido,
  valorUnitarioNuevo,
  costoDemolicion,
  esDemolicion,
  type ValoresReposicionData,
} from '@/config/valores-reposicion'
import type { CategoriaConstructiva } from '@/constants/categorias-constructivas'
import type { EstadoConservacion } from '@/constants/estados-conservacion'

export const DEPRECIACION_CONFIG = {
  VIDA_UTIL_ANIOS,
  METODO: 'TABLA_REPOSICION' as const,
} as const

/** Resultado del cálculo de una construcción */
export interface ResultadoConstruccion {
  superficieM2: number
  valorUnitario: number
  valorReposicion: number
  valorUnitarioNuevo: number
  depreciacionTotal: number
  depreciacionAnual: number
  anosTranscurridos: number
  valorNeto: number
  esDemolicion: boolean
  costoDemolicion: number
}

/**
 * Calcula todos los valores de una construcción según la tabla de reposición.
 *
 * @param categoria    Categoría constructiva (LUJO, PRIMERA, ESTANDAR, ECONOMICA)
 * @param estado       Estado de conservación (EXCELENTE..DEMOLICION)
 * @param superficieM2 Superficie construida en m²
 * @param anoConstruccion Año de construcción (para antigüedad); si no aplica, usar null
 * @param valorUnitarioOverride Valor unitario editable del valuador (opcional, se valida rango)
 */
export function calcularConstruccion(
  categoria: CategoriaConstructiva,
  estado: EstadoConservacion,
  superficieM2: number,
  anoConstruccion: number | null,
  valorUnitarioOverride?: number,
  valoresMap?: ValoresReposicionData,
): ResultadoConstruccion {
  const demolicion = esDemolicion(estado)
  const anosTranscurridos = anoConstruccion
    ? Math.max(0, new Date().getFullYear() - anoConstruccion)
    : 0

  // Valor unitario: override validado, o sugerido (promedio del rango)
  const valorUnitario = demolicion ? 0 : (valorUnitarioOverride ?? valorSugerido(categoria, estado, valoresMap))

  // Valor como nuevo (estado EXCELENTE) de la misma categoría
  const valorUnitarioComoNuevo = valorUnitarioNuevo(categoria, valoresMap)

  const valorReposicion = valorUnitario * superficieM2

  // Depreciación de reporte (diferencia entre valor nuevo y valor actual del estado)
  // En demolición, la pérdida es el valor completo de reposición nueva.
  const depreciacionTotal = demolicion
    ? valorUnitarioComoNuevo * superficieM2
    : Math.max(0, (valorUnitarioComoNuevo - valorUnitario) * superficieM2)

  const depreciacionAnual = anosTranscurridos > 0 ? depreciacionTotal / anosTranscurridos : 0

  const valorNeto = demolicion ? 0 : valorReposicion

  return {
    superficieM2,
    valorUnitario,
    valorReposicion,
    valorUnitarioNuevo: valorUnitarioComoNuevo,
    depreciacionTotal,
    depreciacionAnual,
    anosTranscurridos,
    valorNeto,
    esDemolicion: demolicion,
    costoDemolicion: demolicion ? costoDemolicion(categoria, estado, valoresMap) * superficieM2 : 0,
  }
}

// Re-export de tipos para compatibilidad con imports existentes
export type { CategoriaConstructiva, EstadoConservacion }
