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
    }
  } as const,

  /**
   * Fórmula de cálculo (6 factores: Ubicación, Vía, Frente, Esquina, Morfológico, Servicios):
   * Vh (valor homologado) = P.U. ÷ (Fub × Fvia × Fff × Fi × Fm × Fs)
   * Factor Total = producto de los 6 factores
   */
  formula: {
    calcularFactorTotal: (factores: Record<string, number>) => {
      return Object.values(factores).reduce((total, factor) => total * factor, 1.0)
    },

    /**
     * Valor homologado de un comparable: P.U. ÷ producto de factores
     * (los factores del comparable se DIVIDEN para llevarlo a una base común)
     */
    valorHomologadoComparable: (precioUnitario: number, factores: Record<string, number>) => {
      const factorTotal = HOMOLOGACION_CONFIG.formula.calcularFactorTotal(factores)
      if (factorTotal === 0) return 0
      return precioUnitario / factorTotal
    },

    /**
     * Valor unitario del sujeto: P.U. promedio × producto de factores del sujeto
     * (los factores del sujeto se MULTIPLICAN)
     */
    valorUnitarioSujeto: (puPromedio: number, factores: Record<string, number>) => {
      return puPromedio * HOMOLOGACION_CONFIG.formula.calcularFactorTotal(factores)
    },

    validarFactorMaximo: (factor: number) => {
      return factor <= HOMOLOGACION_CONFIG.FACTOR_MAXIMO
    }
  }
} as const

export type HomologacionFactor = keyof typeof HOMOLOGACION_CONFIG.factores
