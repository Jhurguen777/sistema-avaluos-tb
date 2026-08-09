/**
 * Radar Actions
 * Server Actions para generar y consultar el radar de equipamientos
 */

"use server"

import { auth } from '@/shared/auth/nextauth'
import { auditService, AuditAction } from '@/shared/security/audit-service'
import { radarService } from '../services/radar-service'

/** Genera el radar de equipamientos para un avalúo (consulta OSM Overpass) */
export async function generarRadarAction(avaluoId: string, radio: number = 500) {
  try {
    const session = await auth()
    if (!session?.user) {
      return { success: false as const, error: 'No autenticado' }
    }

    const entorno = await radarService.generar(avaluoId, radio)
    await auditService.log({
      userId: session.user.id!,
      action: AuditAction.RADAR_GENERATED,
      tableName: 'AvaluoEntorno',
      recordId: avaluoId,
      newValue: { radio },
    })
    return { success: true as const, data: entorno }
  } catch (error: any) {
    console.error('Error generando radar:', error)
    return { success: false as const, error: error.message || 'Error al generar el radar' }
  }
}

/** Obtiene el radar almacenado de un avalúo */
export async function obtenerRadarAction(avaluoId: string) {
  try {
    const session = await auth()
    if (!session?.user) {
      return { success: false as const, error: 'No autenticado' }
    }

    const entorno = await radarService.obtener(avaluoId)
    return { success: true as const, data: entorno }
  } catch (error: any) {
    console.error('Error obteniendo radar:', error)
    return { success: false as const, error: error.message || 'Error al obtener el radar' }
  }
}

/**
 * Elimina un equipamiento concreto de la BD (borrado permanente).
 * Usado por el botón de eliminación en la lista del radar.
 */
export async function eliminarEquipamientoAction(equipamientoId: string) {
  try {
    const session = await auth()
    if (!session?.user) {
      return { success: false as const, error: 'No autenticado' }
    }

    await radarService.eliminarEquipamiento(equipamientoId)
    await auditService.log({
      userId: session.user.id!,
      action: AuditAction.EQUIPAMIENTO_DELETED,
      tableName: 'Equipamiento',
      recordId: equipamientoId,
      oldValue: { eliminado: true },
    })
    return { success: true as const, data: { id: equipamientoId } }
  } catch (error) {
    console.error('Error eliminando equipamiento:', error)
    const msg = error instanceof Error ? error.message : 'Error al eliminar el equipamiento'
    return { success: false as const, error: msg }
  }
}
