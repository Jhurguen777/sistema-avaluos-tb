/**
 * Configuración de Depreciación
 * Define vida útil y factores de cálculo de depreciación
 */

export const DEPRECIACION_CONFIG = {
  /**
   * Vida útil estándar en años
   * Usada para calcular depreciación lineal
   */
  VIDA_UTIL_ANIOS: 50,

  /**
   * Método de cálculo de depreciación
   */
  METODO: 'LINEAL' as const,

  /**
   * Factores por categoría constructiva
   * Multiplicador sobre el valor unitario base
   */
  CATEGORIAS_FACTORES: {
    LUJO: 1.0,
    SEMILUJO: 0.95,
    MEDIA: 0.85,
    ECONOMICA: 0.75,
    POPULAR: 0.65
  } as const,

  /**
   * Factores por estado de conservación
   * Afectan la depreciación anual calculada
   */
  ESTADOS_CONSERVACION: {
    EXCELENTE: 0.5, // 50% de depreciación estándar
    MUY_BUENO: 0.8, // 80% de depreciación estándar
    BUENO: 1.0, // 100% de depreciación estándar
    REGULAR: 1.2, // 120% de depreciación estándar
    MALO: 1.5 // 150% de depreciación estándar
  } as const,

  /**
   * Fórmula de cálculo:
   * Depreciación Anual = (Valor Reposición / Vida Útil) * Factor Estado
   * Depreciación Total = Depreciación Anual * Años Transcurridos
   * Valor Neto = Valor Reposición - Depreciación Total
   */
  formula: {
    depreciacionAnual: (valorReposicion: number, factorEstado: number) => {
      return (valorReposicion / DEPRECIACION_CONFIG.VIDA_UTIL_ANIOS) * factorEstado
    },

    depreciacionTotal: (depreciacionAnual: number, anosTranscurridos: number) => {
      return depreciacionAnual * anosTranscurridos
    },

    valorNeto: (valorReposicion: number, depreciacionTotal: number) => {
      return valorReposicion - depreciacionTotal
    }
  }
} as const

export type CategoriaConstructiva = keyof typeof DEPRECIACION_CONFIG.CATEGORIAS_FACTORES
export type EstadoConservacion = keyof typeof DEPRECIACION_CONFIG.ESTADOS_CONSERVACION
