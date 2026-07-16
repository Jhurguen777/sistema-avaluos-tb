/**
 * Configuración de Análisis del Entorno
 * Define radar de equipamientos y radio de análisis
 */

export const ENTORNO_CONFIG = {
  /**
   * Radios de análisis configurables (en metros)
   */
  radios: {
    MINIMO: 250,
    MEDIO: 500,
    MEDIO_ALTO: 750,
    MAXIMO: 1000
  } as const,

  /**
   * Radio por defecto para análisis de entorno
   */
  RADIO_POR_DEFECTO: 500,

  /**
   * Tipos de equipamientos a analizar
   */
  tiposEquipamiento: {
    HOSPITAL: {
      nombre: 'Hospitales',
      peso: 1.0,
      descripcion: 'Centros de salud mayores'
    },
    CLINICA: {
      nombre: 'Clínicas',
      peso: 0.9,
      descripcion: 'Centros de salud privados'
    },
    UNIVERSIDAD: {
      nombre: 'Universidades',
      peso: 1.0,
      descripcion: 'Instituciones de educación superior'
    },
    COLEGIO: {
      nombre: 'Colegios',
      peso: 0.8,
      descripcion: 'Instituciones de educación secundaria'
    },
    MERCADO: {
      nombre: 'Mercados',
      peso: 0.7,
      descripcion: 'Mercados públicos y comerciales'
    },
    PARQUE: {
      nombre: 'Parques',
      peso: 0.6,
      descripcion: 'Áreas verdes y parques públicos'
    },
    BANCO: {
      nombre: 'Bancos',
      peso: 0.7,
      descripcion: 'Entidades financieras'
    },
    IGLESIA: {
      nombre: 'Iglesias',
      peso: 0.5,
      descripcion: 'Centros religiosos'
    },
    TRANSPORTE: {
      nombre: 'Transporte Público',
      peso: 0.8,
      descripcion: 'Paradas de transporte público'
    },
    CENTRO_COMERCIAL: {
      nombre: 'Centros Comerciales',
      peso: 0.9,
      descripcion: 'Malls y centros comerciales'
    },
    ENTIDAD_PUBLICA: {
      nombre: 'Entidades Públicas',
      peso: 0.7,
      descripcion: 'Oficinas gubernamentales'
    }
  } as const,

  /**
   * Puntajes de análisis según distancia
   */
  puntajesDistancia: {
    EXCELENTE: { max: 300, puntaje: 100 },
    MUY_BUENO: { max: 500, puntaje: 80 },
    BUENO: { max: 750, puntaje: 60 },
    REGULAR: { max: 1000, puntaje: 40 },
    MALO: { min: 1000, puntaje: 20 }
  } as const
} as const

export type TipoEquipamiento = keyof typeof ENTORNO_CONFIG.tiposEquipamiento
export type RadioEntorno = keyof typeof ENTORNO_CONFIG.radios
