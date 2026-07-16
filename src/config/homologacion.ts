/**
 * Configuración de Homologación
 * Define factores de ajuste para comparables de mercado
 */

export const HOMOLOGACION_CONFIG = {
  /**
   * Factor máximo permitido para cualquier factor individual
   * Ningún factor puede superar este valor
   */
  FACTOR_MAXIMO: 1.50,

  /**
   * Factores de homologación configurables
   * Cada factor tiene: mínimo, máximo, y valor por defecto
   */
  factores: {
    UBICACION: {
      nombre: 'Factor Ubicación',
      min: 0.8,
      max: 1.5,
      default: 1.0,
      descripcion: 'Ajuste por calidad y ubicación dentro de la zona'
    },
    VIA: {
      nombre: 'Factor Vía',
      min: 0.9,
      max: 1.5,
      default: 1.0,
      descripcion: 'Ajuste por tipo de vía (avenida, calle, pasaje)'
    },
    FRENTE: {
      nombre: 'Factor Frente',
      min: 0.9,
      max: 1.3,
      default: 1.0,
      descripcion: 'Ajuste por metros de frente del lote'
    },
    ESQUINA: {
      nombre: 'Factor Esquina',
      min: 1.0,
      max: 1.5,
      default: 1.0,
      descripcion: 'Ajuste por propiedad en esquina'
    },
    MORFOLOGICO: {
      nombre: 'Factor Morfológico',
      min: 0.9,
      max: 1.3,
      default: 1.0,
      descripcion: 'Ajuste por forma y morfología del lote'
    },
    SERVICIOS: {
      nombre: 'Factor Servicios',
      min: 0.9,
      max: 1.4,
      default: 1.0,
      descripcion: 'Ajuste por disponibilidad de servicios básicos'
    },
    EQUIPAMIENTO: {
      nombre: 'Factor Equipamiento',
      min: 0.9,
      max: 1.5,
      default: 1.0,
      descripcion: 'Ajuste por cercanía a equipamientos urbanos'
    }
  } as const,

  /**
   * Fórmula de cálculo:
   * Factor Total = Factor1 × Factor2 × Factor3 × ... × Factor7
   * Valor Homologado = Valor Comparable × Factor Total
   */
  formula: {
    calcularFactorTotal: (factores: Record<string, number>) => {
      return Object.values(factores).reduce((total, factor) => total * factor, 1.0)
    },

    validarFactorMaximo: (factor: number) => {
      return factor <= HOMOLOGACION_CONFIG.FACTOR_MAXIMO
    }
  }
} as const

export type HomologacionFactor = keyof typeof HOMOLOGACION_CONFIG.factores
