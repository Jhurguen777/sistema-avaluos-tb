/**
 * Configuración de Documentos
 * Define tipos de documentos y validaciones
 */

export const DOCUMENTO_CONFIG = {
  /**
   * Tipos de documentos soportados
   */
  tipos: {
    FOLIO_REAL: {
      nombre: 'Folio Real',
      extensiones: ['.pdf'],
      maxSizeMB: 10,
      requerido: true,
      descripcion: 'Documento de propiedad legal'
    },
    CATASTRO: {
      nombre: 'Catastro',
      extensiones: ['.pdf'],
      maxSizeMB: 10,
      requerido: true,
      descripcion: 'Certificado catastral'
    },
    IMPUESTOS: {
      nombre: 'Impuestos',
      extensiones: ['.pdf'],
      maxSizeMB: 5,
      requerido: false,
      descripcion: 'Comprobantes de impuestos'
    },
    PLANO: {
      nombre: 'Plano',
      extensiones: ['.pdf', '.dwg', '.dxf'],
      maxSizeMB: 20,
      requerido: false,
      descripcion: 'Planos arquitectónicos'
    },
    FOTOGRAFIA: {
      nombre: 'Fotografía',
      extensiones: ['.jpg', '.jpeg', '.png'],
      maxSizeMB: 5,
      requerido: true,
      descripcion: 'Fotografías del inmueble'
    },
    AVALUO_PDF: {
      nombre: 'Avalúo PDF',
      extensiones: ['.pdf'],
      maxSizeMB: 50,
      requerido: false,
      descripcion: 'Reporte final de avalúo'
    },
    OTRO: {
      nombre: 'Otro',
      extensiones: ['.pdf', '.doc', '.docx'],
      maxSizeMB: 10,
      requerido: false,
      descripcion: 'Documento adicional'
    }
  } as const,

  /**
   * Configuración de almacenamiento
   */
  almacenamiento: {
    /**
     * Estructura de directorios en MinIO
     */
    directorios: {
      DOCUMENTOS: 'documentos',
      FOTOGRAFIAS: 'fotografias',
      PLANOS: 'planos',
      AVALUOS: 'avaluos',
      TEMP: 'temp'
    } as const,

    /**
     * Nombres de buckets
     */
    bucket: 'geopricer-avaluos'
  } as const,

  /**
   * Validaciones
   */
  validaciones: {
    maxFileSize: (sizeBytes: number, maxSizeMB: number) => {
      return sizeBytes <= maxSizeMB * 1024 * 1024
    },

    allowedExtension: (filename: string, allowedExtensions: string[]) => {
      const ext = filename.toLowerCase().substring(filename.lastIndexOf('.'))
      return allowedExtensions.includes(ext)
    }
  }
} as const

export type TipoDocumento = keyof typeof DOCUMENTO_CONFIG.tipos
