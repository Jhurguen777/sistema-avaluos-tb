/**
 * Configuración del dominio de Avalúos
 * Define workflow, estados, tipos y cálculos del negocio de avalúos
 */

import { TIPO_EQUIPAMIENTO_LABELS } from '@/constants/tipos-equipamiento'

export const AVALUO_CONFIG = {
  /**
   * Workflow de estados del avalúo
   * Define los estados posibles y las transiciones permitidas
   */
  workflow: {
    estados: {
      BORRADOR: 'BORRADOR',
      EN_REVISION: 'EN_REVISION',
      APROBADO: 'APROBADO',
      RECHAZADO: 'RECHAZADO'
    } as const,
    /**
     * Transiciones permitidas entre estados
     * clave: estado actual → valor: estados posibles siguientes
     */
    transiciones: {
      BORRADOR: ['EN_REVISION', 'RECHAZADO'],
      EN_REVISION: ['APROBADO', 'RECHAZADO', 'BORRADOR'],
      APROBADO: [], // Estado final
      RECHAZADO: ['BORRADOR'] // Puede re-editarse
    }
  },

  /**
   * Tipos de avalúo soportados
   */
  tipos: {
    COMERCIAL: 'COMERCIAL',
    ALQUILER: 'ALQUILER',
    VENTA_RAPIDA: 'VENTA_RAPIDA',
    CAPITAL_COMERCIAL: 'CAPITAL_COMERCIAL'
  } as const,

  /**
   * Descuentos aplicables según tipo de avalúo
   * VENTA_RAPIDA: 15% de descuento sobre valor comercial
   * CAPITAL_COMERCIAL: 10% de descuento
   */
  descuentos: {
    VENTA_RAPIDA: 0.15, // 15%
    CAPITAL_COMERCIAL: 0.10 // 10%
  } as const,

  /**
   * Multiplicadores para cálculo de alquiler
   */
  alquiler: {
    MULTIPLICADOR_MENSUAL: 0.008, // 0.8% mensual del valor comercial
    MULTIPLICADOR_ANUAL: 0.10 // 10% anual del valor comercial
  } as const,

  /**
   * Configuración del informe PDF de avalúo
   */
  pdf: {
    /** Radio de análisis por defecto para el radar (m) */
    RADIO_RADAR_DEFAULT: 1000,
    /** Vida útil estándar de una construcción (años) */
    VIDA_UTIL_DEFAULT: 50,
    /** Empresa que aparece en el encabezado del PDF */
    EMPRESA: 'ALFA INMOBILIARIA',
    /** Subtítulo del encabezado */
    SUBTITULO: 'Informe de Avalúo Inmobiliario'
  } as const
} as const

export type AvaluoEstado = typeof AVALUO_CONFIG.workflow.estados[keyof typeof AVALUO_CONFIG.workflow.estados]
export type AvaluoTipo = typeof AVALUO_CONFIG.tipos[keyof typeof AVALUO_CONFIG.tipos]

/**
 * Etiquetas legibles en español para los tipos de equipamiento del radar.
 * Re-exporta el canónico definido en constants/tipos-equipamiento.ts para que
 * todo el sistema (PDF, radar, análisis) use una única fuente de etiquetas.
 */
export { TIPO_EQUIPAMIENTO_LABELS as EQUIPAMIENTO_LABELS } from '@/constants/tipos-equipamiento'

/**
 * Genera un análisis de entorno en español a partir del conteo real de
 * equipamientos por tipo y la densidad dentro del radio de análisis.
 * Devuelve un párrafo de 2-4 frases apto para el PDF.
 */
export function generarAnalisisEntorno(
  equipamientos: Array<{ tipo: string; nombre: string; distancia: number }>,
  radio: number,
): string {
  if (equipamientos.length === 0) {
    return `El inmueble no registra equipamientos cercanos dentro del radio de análisis de ${radio} metros. Se recomienda complementar este avalúo con una inspección field para verificar la disponibilidad de servicios básicos en el entorno.`
  }

  const porTipo: Record<string, number> = {}
  for (const e of equipamientos) {
    porTipo[e.tipo] = (porTipo[e.tipo] ?? 0) + 1
  }

  const tiposOrdenados = Object.entries(porTipo).sort((a, b) => b[1] - a[1])
  const total = equipamientos.length

  // Densidad: equipamientos por km² (asumiendo área = π × r² en km²)
  const areaKm2 = Math.PI * Math.pow(radio / 1000, 2)
  const densidad = total / areaKm2
  const nivelDensidad = densidad >= 15 ? 'ALTA' : densidad >= 6 ? 'MEDIA' : 'BAJA'

  // Distancia promedio al equipamiento más cercano de cada tipo principal
  const masCercano = [...equipamientos].sort((a, b) => a.distancia - b.distancia)[0]

  // Top 3 tipos para mencionar
  const top3 = tiposOrdenados.slice(0, 3).map(([tipo, count]) => {
    const label = (TIPO_EQUIPAMIENTO_LABELS as Record<string, string>)[tipo] ?? tipo
    return count > 1 ? `${count} ${label.toLowerCase()}s` : `1 ${label.toLowerCase()}`
  })
  const enumeracion = top3.length > 1
    ? `${top3.slice(0, -1).join(', ')} y ${top3[top3.length - 1]}`
    : top3[0] ?? ''

  const conclusion =
    nivelDensidad === 'ALTA'
      ? 'lo que incrementa significativamente su valor de ubicación y factor de homologación'
      : nivelDensidad === 'MEDIA'
        ? 'lo que respalda de manera razonable el valor comercial del inmueble'
        : 'lo que sugiere un entorno predominantemente residencial con oportunidad de apreciación futura'

  return (
    `El inmueble se encuentra en una zona con disponibilidad ${nivelDensidad.toLowerCase()} de ` +
    `equipamientos y servicios, con un total de ${total} facilidades detectadas ` +
    `dentro de un radio de ${radio} metros (densidad aproximada: ${densidad.toFixed(1)} servicios/km²). ` +
    `Entre los más relevantes destacan ${enumeracion}. ` +
    `El equipamiento más cercano (${masCercano.nombre}) se ubica a ${masCercano.distancia} metros, ` +
    `${conclusion}.`
  )
}

