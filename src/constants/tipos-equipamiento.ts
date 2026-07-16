/**
 * Constantes de Tipos de Equipamiento
 * Enumeración de tipos de equipamientos para análisis de entorno
 */

import { z } from 'zod'

export const TIPOS_EQUIPAMIENTO = {
  HOSPITAL: 'HOSPITAL',
  CLINICA: 'CLINICA',
  UNIVERSIDAD: 'UNIVERSIDAD',
  COLEGIO: 'COLEGIO',
  MERCADO: 'MERCADO',
  PARQUE: 'PARQUE',
  BANCO: 'BANCO',
  IGLESIA: 'IGLESIA',
  TRANSPORTE: 'TRANSPORTE',
  CENTRO_COMERCIAL: 'CENTRO_COMERCIAL',
  ENTIDAD_PUBLICA: 'ENTIDAD_PUBLICA'
} as const

export const TIPO_EQUIPAMIENTO_LABELS: Record<keyof typeof TIPOS_EQUIPAMIENTO, string> = {
  HOSPITAL: 'Hospital',
  CLINICA: 'Clínica',
  UNIVERSIDAD: 'Universidad',
  COLEGIO: 'Colegio',
  MERCADO: 'Mercado',
  PARQUE: 'Parque',
  BANCO: 'Banco',
  IGLESIA: 'Iglesia',
  TRANSPORTE: 'Transporte Público',
  CENTRO_COMERCIAL: 'Centro Comercial',
  ENTIDAD_PUBLICA: 'Entidad Pública'
}

export const TipoEquipamiento = z.enum(Object.values(TIPOS_EQUIPAMIENTO) as [string, ...string[]])

export type TipoEquipamiento = z.infer<typeof TipoEquipamiento>
