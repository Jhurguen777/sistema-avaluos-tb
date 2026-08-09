/**
 * Servicio de Cálculo de Avalúos
 *
 * Funciones puras que materializan los valores de un avalúo:
 *  - Valor de TERRENO: cálculo dual (promedio simple + homogéneo Excel)
 *  - Valor de CONSTRUCCIÓN: por tabla de reposición × estado (ver valores-reposicion.ts)
 *  - Resultado total del AVALÚO: terreno + construcción − demolición, con
 *    descuentos por tipo (venta rápida, capital comercial) y alquiler.
 */

import type { AvaluoTipo } from '@/config/avaluo'
import { calcularConstruccion, type ResultadoConstruccion } from '@/config/depreciacion'
import { HOMOLOGACION_CONFIG } from '@/config/homologacion'
import type { CategoriaConstructiva } from '@/constants/categorias-constructivas'
import type { EstadoConservacion } from '@/constants/estados-conservacion'
import type { ConfigAvaluo } from '@/shared/config/config-loader'
import { getDefaultConfig } from '@/shared/config/config-loader'

export { calcularConstruccion }
export type { ResultadoConstruccion }

/** Entrada de comparable para los cálculos del terreno */
export interface EntradaComparable {
  precioUnitario: number
  /** Factores del comparable (opcional: cuando vienen de web scraping están vacíos) */
  factores?: {
    factorUbicacion?: number | null
    factorVia?: number | null
    factorFrente?: number | null
    factorEsquina?: number | null
    factorMorfologico?: number | null
    factorServicios?: number | null
  } | null
}

/**
 * Indica si un comparable tiene los 6 factores completos (para usar en homogeneización).
 */
export function tieneFactoresCompletos(factores: EntradaComparable['factores']): boolean {
  if (!factores) return false
  return (
    factores.factorUbicacion != null &&
    factores.factorVia != null &&
    factores.factorFrente != null &&
    factores.factorEsquina != null &&
    factores.factorMorfologico != null &&
    factores.factorServicios != null
  )
}

/**
 * PROMEDIO SIMPLE: promedio de P.U. de todos los comparables sin aplicar factores.
 * Es lo que se usa cuando los comparables vienen de web scraping (sin factores).
 */
export function calcularPromedioSimple(comparables: EntradaComparable[]): number {
  if (comparables.length === 0) return 0
  const suma = comparables.reduce((acc, c) => acc + c.precioUnitario, 0)
  return suma / comparables.length
}

/**
 * PROMEDIO HOMOGÉNEO (Excel): solo con comparables que tengan los 6 factores completos.
 * Para cada uno: P.U. Homogéneo = P.U. / (producto de factores).
 * Si ningún comparable tiene factores completos, devuelve null.
 */
export function calcularPromedioHomogeneo(comparables: EntradaComparable[]): number | null {
  const conFactores = comparables.filter((c) => tieneFactoresCompletos(c.factores))
  if (conFactores.length === 0) return null
  const { valorHomologadoComparable } = HOMOLOGACION_CONFIG.formula
  const suma = conFactores.reduce(
    (acc, c) => acc + valorHomologadoComparable(c.precioUnitario, c.factores as Record<string, number>),
    0,
  )
  return suma / conFactores.length
}

/**
 * Calcula el valor unitario del terreno del sujeto aplicando el factor del sujeto.
 *
 *   Valor Unit = P.U. base × (producto de factores del sujeto)
 */
export function aplicarFactorSujeto(
  puPromedio: number,
  factoresSujeto: Record<string, number>,
): number {
  return HOMOLOGACION_CONFIG.formula.valorUnitarioSujeto(puPromedio, factoresSujeto)
}

/**
 * Resultado del cálculo dual del terreno.
 * El caller decide cuál valor usar (simple, homogéneo, o manual).
 */
export interface ResultadoTerrenoDual {
  /** Promedio simple de TODOS los comparables */
  promedioSimple: number
  /** Promedio homogéneo (solo comparables con factores completos) — null si ninguno aplica */
  promedioHomogeneo: number | null
  /** Valor unitario aplicando factor del sujeto sobre el promedio simple */
  valorUnitarioSimple: number
  /** Valor unitario aplicando factor del sujeto sobre el promedio homogéneo — null si no aplica */
  valorUnitarioHomogeneo: number | null
}

/**
 * Calcula ambos valores del terreno (dual) según el método del Excel + promedio simple.
 *
 * @param comparables   Lista de comparables con sus factores opcionales
 * @param factoresSujeto  Factores del terreno a valuar
 */
export function calcularTerrenoDual(
  comparables: EntradaComparable[],
  factoresSujeto: Record<string, number>,
): ResultadoTerrenoDual {
  const promedioSimple = calcularPromedioSimple(comparables)
  const promedioHomogeneo = calcularPromedioHomogeneo(comparables)
  return {
    promedioSimple,
    promedioHomogeneo,
    valorUnitarioSimple: aplicarFactorSujeto(promedioSimple, factoresSujeto),
    valorUnitarioHomogeneo:
      promedioHomogeneo != null ? aplicarFactorSujeto(promedioHomogeneo, factoresSujeto) : null,
  }
}

/** Entrada de construcción para el cálculo del avalúo */
export interface EntradaConstruccion {
  categoria: CategoriaConstructiva
  estado: EstadoConservacion
  superficieM2: number
  anoConstruccion?: number | null
  valorUnitarioOverride?: number
}

/** Resultado total del avalúo (mapea al modelo ResultadoAvaluo) */
export interface ResultadoAvaluoCalculado {
  valorTerreno: number
  valorReposicion: number
  depreciacion: number
  valorConstruccion: number
  valorComercial: number
  valorVentaRapida: number | null
  valorAlquiler: number | null
  valorCapitalComercial: number | null
  costoDemolicionTotal: number
}

/**
 * Calcula el resultado total de un avalúo combinando terreno + construcciones.
 *
 * Invariantes:
 *   valorReposicion = Σ (valor como nuevo de cada construcción)
 *   valorConstruccion = valorReposicion − depreciación − costoDemolición
 *   valorComercial = valorTerreno + valorConstruccion
 */
export function calcularResultadoAvaluo(
  valorTerreno: number,
  construcciones: EntradaConstruccion[],
  tipo: AvaluoTipo = 'COMERCIAL',
  config: ConfigAvaluo = getDefaultConfig(),
): ResultadoAvaluoCalculado {
  const calculos: ResultadoConstruccion[] = construcciones.map((c) =>
    calcularConstruccion(c.categoria, c.estado, c.superficieM2, c.anoConstruccion ?? null, c.valorUnitarioOverride, config.valoresReposicion),
  )

  // Reposición a nuevo total (suma del valor como nuevo × superficie de cada construcción)
  const reposicionNuevo = calculos.reduce(
    (acc, c) => acc + c.valorUnitarioNuevo * c.superficieM2,
    0,
  )

  const depreciacion = calculos.reduce((acc, c) => acc + c.depreciacionTotal, 0)
  const costoDemolicionTotal = calculos.reduce((acc, c) => acc + c.costoDemolicion, 0)

  // Valor neto de construcción (suma de valorNeto de cada construcción, ya descontando estado)
  const construccionNeta = calculos.reduce((acc, c) => acc + c.valorNeto, 0)
  const valorConstruccion = construccionNeta - costoDemolicionTotal

  const valorComercial = valorTerreno + valorConstruccion

  // Descuentos según tipo de avalúo (usando parámetros de configuración)
  const valorVentaRapida = Math.max(0, valorComercial * (1 - config.descuentoVentaRapida))
  const valorCapitalComercial = Math.max(0, valorComercial * (1 - config.descuentoCapitalComercial))
  const valorAlquiler = Math.max(0, valorComercial * config.alquilerMensual)

  return {
    valorTerreno,
    valorReposicion: reposicionNuevo,
    depreciacion,
    valorConstruccion,
    valorComercial,
    // Se llenan según tipo; se devuelven todos para que la UI persista lo que aplique
    valorVentaRapida: tipo === 'VENTA_RAPIDA' ? valorVentaRapida : null,
    valorAlquiler: tipo === 'ALQUILER' ? valorAlquiler : null,
    valorCapitalComercial: tipo === 'CAPITAL_COMERCIAL' ? valorCapitalComercial : null,
    costoDemolicionTotal,
  }
}
