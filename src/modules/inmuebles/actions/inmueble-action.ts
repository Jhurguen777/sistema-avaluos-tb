/**
 * Inmueble Actions
 * Server Actions para CRUD de inmuebles (entry points desde la UI)
 */

"use server"

import { auth } from '@/shared/auth/nextauth'
import { ROLES_CONFIG } from '@/config/roles'
import { auditService, AuditAction } from '@/shared/security/audit-service'
import { inmuebleService } from '../services/inmueble-service'
import {
  createInmuebleValidator,
  updateInmuebleValidator,
  listInmueblesValidator,
} from '../validators/inmueble-validator'
import type { ListInmueblesInput, CreateInmuebleInput, UpdateInmuebleInput } from '../validators/inmueble-validator'

/** Listar inmuebles (accesible a cualquier usuario autenticado) */
export async function listInmueblesAction(filters?: ListInmueblesInput) {
  try {
    const session = await auth()
    if (!session?.user) {
      return { success: false as const, error: 'No autenticado' }
    }

    const validated = listInmueblesValidator.safeParse(filters || {})
    if (!validated.success) {
      return { success: false as const, error: validated.error.issues[0].message }
    }

    const result = await inmuebleService.list(validated.data)
    return { success: true as const, data: result }
  } catch (error: any) {
    console.error('Error listando inmuebles:', error)
    return { success: false as const, error: error.message || 'Error al listar inmuebles' }
  }
}

/**
 * Listar inmuebles para el mapa público (sin autenticación).
 * Devuelve solo inmuebles geolocalizados (lat/lng presentes) con campos
 * públicos seguros (sin datos sensibles del propietario).
 */
export async function listInmueblesPublicAction(page = 1, limit = 250) {
  try {
    // Saneamiento de parámetros (endpoint sin sesión): page entero >= 1,
    // limit acotado a 500 para evitar DoS o errores de Prisma con skip inválido
    const pagina = Math.max(1, Math.floor(Number(page) || 1))
    const limite = Math.min(500, Math.max(1, Math.floor(Number(limit) || 250)))
    const result = await inmuebleService.list({ page: pagina, limit: limite, geolocalizado: true })
    return {
      success: true as const,
      data: result.inmuebles,
      total: result.pagination.total,
    }
  } catch (error: any) {
    console.error('Error listando inmuebles públicos:', error)
    return { success: false as const, error: error.message || 'Error al listar inmuebles públicos' }
  }
}

/** Obtener inmueble por ID */
export async function getInmuebleAction(id: string) {
  try {
    const session = await auth()
    if (!session?.user) {
      return { success: false as const, error: 'No autenticado' }
    }

    const inmueble = await inmuebleService.getById(id)
    return { success: true as const, data: inmueble }
  } catch (error: any) {
    console.error('Error obteniendo inmueble:', error)
    return { success: false as const, error: error.message || 'Error al obtener el inmueble' }
  }
}

/** Crear inmueble */
export async function createInmuebleAction(input: CreateInmuebleInput) {
  try {
    const session = await auth()
    if (!session?.user) {
      return { success: false as const, error: 'No autenticado' }
    }

    if (!ROLES_CONFIG.tienePermiso(session.user.role ?? '', 'inmuebles.create')) {
      return { success: false as const, error: 'No autorizado para crear inmuebles' }
    }

    const validated = createInmuebleValidator.safeParse(input)
    if (!validated.success) {
      return { success: false as const, error: validated.error.issues[0].message }
    }

    const inmueble = await inmuebleService.create(validated.data, session.user.id!)
    await auditService.log({
      userId: session.user.id!,
      action: AuditAction.INMUEBLE_CREATED,
      tableName: 'Product',
      recordId: (inmueble as { id?: string }).id ?? undefined,
      newValue: inmueble as unknown as Record<string, unknown>,
    })
    return { success: true as const, data: inmueble }
  } catch (error: any) {
    console.error('Error creando inmueble:', error)
    return { success: false as const, error: error.message || 'Error al crear el inmueble' }
  }
}

/** Actualizar inmueble */
export async function updateInmuebleAction(id: string, input: UpdateInmuebleInput) {
  try {
    const session = await auth()
    if (!session?.user) {
      return { success: false as const, error: 'No autenticado' }
    }

    if (!ROLES_CONFIG.tienePermiso(session.user.role ?? '', 'inmuebles.update')) {
      return { success: false as const, error: 'No autorizado para actualizar inmuebles' }
    }

    const validated = updateInmuebleValidator.safeParse(input)
    if (!validated.success) {
      return { success: false as const, error: validated.error.issues[0].message }
    }

    const inmueble = await inmuebleService.update(id, validated.data, session.user.id!)
    await auditService.log({
      userId: session.user.id!,
      action: AuditAction.INMUEBLE_UPDATED,
      tableName: 'Product',
      recordId: id,
      newValue: inmueble as unknown as Record<string, unknown>,
    })
    return { success: true as const, data: inmueble }
  } catch (error: any) {
    console.error('Error actualizando inmueble:', error)
    return { success: false as const, error: error.message || 'Error al actualizar el inmueble' }
  }
}

/** Eliminar inmueble */
export async function deleteInmuebleAction(id: string) {
  try {
    const session = await auth()
    if (!session?.user) {
      return { success: false as const, error: 'No autenticado' }
    }

    // Matriz RBAC: inmuebles.delete es exclusivo de ADMIN
    if (!ROLES_CONFIG.tienePermiso(session.user.role ?? '', 'inmuebles.delete')) {
      return { success: false as const, error: 'No autorizado. Solo administradores pueden eliminar inmuebles' }
    }

    await inmuebleService.delete(id)
    await auditService.log({
      userId: session.user.id!,
      action: AuditAction.INMUEBLE_DELETED,
      tableName: 'Product',
      recordId: id,
    })
    return { success: true as const, data: { id } }
  } catch (error: any) {
    console.error('Error eliminando inmueble:', error)
    return { success: false as const, error: error.message || 'Error al eliminar el inmueble' }
  }
}
