/**
 * Configuración de Inmuebles
 * Define tipos de inmueble y operaciones
 */

export const INMUEBLE_CONFIG = {
  /**
   * Tipos de inmueble soportados
   */
  tipos: {
    CASA: 'Casa',
    DEPARTAMENTO: 'Departamento',
    PENTHOUSE: 'Penthouse',
    TERRENO: 'Terreno',
    LOCAL_COMERCIAL: 'Local Comercial',
    OFICINA: 'Oficina',
    GALPON: 'Galpón',
    QUINTA: 'Quinta',
    MONOAMBIENTE: 'Monoambiente',
    DUPLEX: 'Dúplex',
    CONDOMINIO: 'Condominio',
    EDIFICIO: 'Edificio',
    COCHERA: 'Cochera',
    HABITACION: 'Habitación',
    OTROS: 'Otros'
  } as const,

  /**
   * Tipos de operación sobre inmuebles
   */
  operaciones: {
    VENTA: 'VENTA',
    ALQUILER: 'ALQUILER',
    ANTICRETICO: 'ANTICRETICO'
  } as const,

  /**
   * Campos requeridos por tipo de inmueble
   */
  camposRequeridos: {
    TERRENO: ['superficieM2', 'frente', 'fondo'],
    CASA: ['superficieConstruida', 'ambientes', 'banos'],
    DEPARTAMENTO: ['superficieConstruida', 'ambientes', 'banos', 'piso'],
    LOCAL_COMERCIAL: ['superficieConstruida', 'frente'],
    OFICINA: ['superficieConstruida', 'ambientes'],
    GALPON: ['superficieConstruida', 'altura'],
    PENTHOUSE: ['superficieConstruida', 'ambientes', 'banos']
  } as const
} as const

export type TipoInmueble = keyof typeof INMUEBLE_CONFIG.tipos
export type TipoOperacion = keyof typeof INMUEBLE_CONFIG.operaciones
