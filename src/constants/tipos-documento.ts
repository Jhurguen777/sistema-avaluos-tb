/**
 * Constantes de Tipos de Documento
 * Enumeración de tipos de documentos del sistema
 */

import { z } from 'zod'

export const TIPOS_DOCUMENTO = {
  FOLIO_REAL: 'FOLIO_REAL',
  CATASTRO: 'CATASTRO',
  IMPUESTOS: 'IMPUESTOS',
  PLANO: 'PLANO',
  FOTOGRAFIA: 'FOTOGRAFIA',
  AVALUO_PDF: 'AVALUO_PDF',
  OTRO: 'OTRO'
} as const

export const TIPO_DOCUMENTO_LABELS: Record<keyof typeof TIPOS_DOCUMENTO, string> = {
  FOLIO_REAL: 'Folio Real',
  CATASTRO: 'Catastro',
  IMPUESTOS: 'Impuestos',
  PLANO: 'Plano',
  FOTOGRAFIA: 'Fotografía',
  AVALUO_PDF: 'Avalúo PDF',
  OTRO: 'Otro'
}

export const TipoDocumento = z.enum(Object.values(TIPOS_DOCUMENTO) as [string, ...string[]])

export type TipoDocumento = z.infer<typeof TipoDocumento>
