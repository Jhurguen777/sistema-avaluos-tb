/**
 * Config Loader
 *
 * Carga la configuración de avalúos (valores de reposición + parámetros)
 * desde la base de datos. Usa caché en memoria con invalidación manual.
 *
 * Si la DB está vacía (primera ejecución), cae a los defaults hardcodeados
 * de valores-reposicion.ts y avaluo.ts.
 */

import { prisma } from "@/shared/database/prisma"
import { toNum } from "@/shared/database/decimal"
import { VALORES_REPOSICION } from "@/config/valores-reposicion"
import { AVALUO_CONFIG } from "@/config/avaluo"
import { HOMOLOGACION_CONFIG } from "@/config/homologacion"

/** Mapa de valores de reposición cargado desde DB */
export type ValoresReposicionMap = typeof VALORES_REPOSICION

/** Configuración completa de avalúo (valores + parámetros) */
export interface ConfigAvaluo {
  valoresReposicion: ValoresReposicionMap
  descuentoVentaRapida: number
  descuentoCapitalComercial: number
  alquilerMensual: number
  alquilerAnual: number
  factorMaximo: number
}

/** Devuelve la configuración por defecto (hardcodeada) */
export function getDefaultConfig(): ConfigAvaluo {
  return {
    valoresReposicion: VALORES_REPOSICION,
    descuentoVentaRapida: AVALUO_CONFIG.descuentos.VENTA_RAPIDA,
    descuentoCapitalComercial: AVALUO_CONFIG.descuentos.CAPITAL_COMERCIAL,
    alquilerMensual: AVALUO_CONFIG.alquiler.MULTIPLICADOR_MENSUAL,
    alquilerAnual: AVALUO_CONFIG.alquiler.MULTIPLICADOR_ANUAL,
    factorMaximo: HOMOLOGACION_CONFIG.FACTOR_MAXIMO,
  }
}

// === Caché en memoria ===
let cachedConfig: ConfigAvaluo | null = null
let cacheTimestamp = 0
const CACHE_TTL = 60_000 // 60 segundos

/**
 * Invalida el caché de configuración. Llamar cuando el admin actualiza
 * valores de reposición o parámetros.
 */
export function invalidateConfigCache(): void {
  cachedConfig = null
  cacheTimestamp = 0
}

/**
 * Carga la configuración completa desde la DB.
 * - Si la tabla valores_reposicion tiene registros, los usa; si no, usa defaults.
 * - Si la tabla parametros_avaluo tiene registros, los usa; si no, usa defaults.
 */
export async function loadConfigAvaluo(): Promise<ConfigAvaluo> {
  // Verificar caché
  if (cachedConfig && Date.now() - cacheTimestamp < CACHE_TTL) {
    return cachedConfig
  }

  const defaults = getDefaultConfig()

  try {
    // Cargar valores de reposición desde DB
    const filasVR = await prisma.valorReposicion.findMany()

    // Construir el mapa de valores desde la DB, o usar defaults si está vacío
    let valoresMap: ValoresReposicionMap = defaults.valoresReposicion

    if (filasVR.length > 0) {
      // Fusionar: empezar desde defaults y sobrescribir solo las celdas presentes en DB
      const mapa = JSON.parse(JSON.stringify(defaults.valoresReposicion)) as Record<
        string,
        Record<string, { min: number; max: number } | { costo: number }>
      >
      for (const f of filasVR) {
        if (!mapa[f.categoria]) mapa[f.categoria] = {}
        if (f.estado === "DEMOLICION") {
          mapa[f.categoria][f.estado] = { costo: toNum(f.costo) ?? 0 }
        } else {
          mapa[f.categoria][f.estado] = {
            min: toNum(f.min) ?? 0,
            max: toNum(f.max) ?? 0,
          }
        }
      }
      valoresMap = mapa as unknown as ValoresReposicionMap
    }

    // Cargar parámetros desde DB
    const filasParam = await prisma.parametroAvaluo.findMany()
    let config: ConfigAvaluo = {
      ...defaults,
      valoresReposicion: valoresMap,
    }

    if (filasParam.length > 0) {
      const paramMap = new Map(filasParam.map((p) => [p.clave, p.valor]))

      const getNum = (clave: string, fallback: number): number => {
        const v = paramMap.get(clave)
        if (v === undefined) return fallback
        const n = parseFloat(v)
        return Number.isNaN(n) ? fallback : n
      }

      config = {
        ...config,
        descuentoVentaRapida: getNum("descuento.venta_rapida", defaults.descuentoVentaRapida),
        descuentoCapitalComercial: getNum("descuento.capital_comercial", defaults.descuentoCapitalComercial),
        alquilerMensual: getNum("alquiler.multiplicador_mensual", defaults.alquilerMensual),
        alquilerAnual: getNum("alquiler.multiplicador_anual", defaults.alquilerAnual),
        factorMaximo: getNum("homologacion.factor_maximo", defaults.factorMaximo),
      }
    }

    cachedConfig = config
    cacheTimestamp = Date.now()
    return config
  } catch (error) {
    console.error("Error cargando configuración de avalúo, usando defaults:", error)
    return defaults
  }
}
