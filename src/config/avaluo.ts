/**
 * Configuración del dominio de Avalúos
 * Define workflow, estados, tipos y cálculos del negocio de avalúos
 */

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
  } as const
} as const

export type AvaluoEstado = typeof AVALUO_CONFIG.workflow.estados[keyof typeof AVALUO_CONFIG.workflow.estados]
export type AvaluoTipo = typeof AVALUO_CONFIG.tipos[keyof typeof AVALUO_CONFIG.tipos]
