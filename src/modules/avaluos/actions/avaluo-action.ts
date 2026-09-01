/**
 * Avalúo Actions
 * Server Actions para crear, listar, ver y cambiar estado de avalúos
 */

"use server"

import { auth } from '@/shared/auth/nextauth'
import { ROLES_CONFIG } from '@/config/roles'
import { auditService, AuditAction } from '@/shared/security/audit-service'
import { avaluoService } from '../services/avaluo-service'
import {
  crearAvaluoValidator,
  listAvaluosValidator,
  cambiarEstadoValidator,
  actualizarAvaluoValidator,
  comparableValidator,
  buscarComparablesValidator,
} from '../validators/avaluo-validator'
import type { ListAvaluosInput, CambiarEstadoInput, ComparableInput } from '../validators/avaluo-validator'
import { prisma } from '@/shared/database/prisma'
import { haversineDistance } from '@/shared/database/postgis'
import type { ComparableCercanoDTO } from '../types/avaluo.types'

/** Crear avalúo completo (desde el wizard) */
export async function crearAvaluoAction(input: unknown) {
  try {
    const session = await auth()
    if (!session?.user) {
      return { success: false as const, error: 'No autenticado' }
    }

    if (!ROLES_CONFIG.tienePermiso(session.user.role ?? '', 'avaluos.create')) {
      return { success: false as const, error: 'No autorizado para crear avalúos' }
    }

    const validated = crearAvaluoValidator.safeParse(input)
    if (!validated.success) {
      return { success: false as const, error: validated.error.issues[0].message }
    }

    const id = await avaluoService.createCompleto(validated.data, session.user.id!)
    const detalle = await avaluoService.getById(id)
    await auditService.logAvaluoCreated(session.user.id!, id, {
      codigo: detalle.codigo,
      tipo: detalle.tipo,
    })
    return { success: true as const, data: detalle }
  } catch (error: any) {
    console.error('Error creando avalúo:', error)
    return { success: false as const, error: error.message || 'Error al crear el avalúo' }
  }
}

/** Listar avalúos */
export async function listAvaluosAction(filters?: ListAvaluosInput) {
  try {
    const session = await auth()
    if (!session?.user) {
      return { success: false as const, error: 'No autenticado' }
    }

    const validated = listAvaluosValidator.safeParse(filters || {})
    if (!validated.success) {
      return { success: false as const, error: validated.error.issues[0].message }
    }

    const result = await avaluoService.list(validated.data)
    return { success: true as const, data: result }
  } catch (error: any) {
    console.error('Error listando avalúos:', error)
    return { success: false as const, error: error.message || 'Error al listar avalúos' }
  }
}

/** Mis avalúos (filtrado por createdBy) */
export async function misAvaluosAction(filters?: Omit<ListAvaluosInput, 'createdBy'>) {
  try {
    const session = await auth()
    if (!session?.user) {
      return { success: false as const, error: 'No autenticado' }
    }

    const validated = listAvaluosValidator.safeParse({ ...(filters || {}), createdBy: session.user.id })
    if (!validated.success) {
      return { success: false as const, error: validated.error.issues[0].message }
    }

    const result = await avaluoService.list(validated.data)
    return { success: true as const, data: result }
  } catch (error: any) {
    console.error('Error listando mis avalúos:', error)
    return { success: false as const, error: error.message || 'Error al listar mis avalúos' }
  }
}

/** Obtener avalúo por ID (detalle completo) */
export async function getAvaluoAction(id: string) {
  try {
    const session = await auth()
    if (!session?.user) {
      return { success: false as const, error: 'No autenticado' }
    }

    const detalle = await avaluoService.getById(id)
    return { success: true as const, data: detalle }
  } catch (error: any) {
    console.error('Error obteniendo avalúo:', error)
    return { success: false as const, error: error.message || 'Error al obtener el avalúo' }
  }
}

/** Cambiar estado del avalúo (workflow) */
export async function cambiarEstadoAvaluoAction(id: string, input: CambiarEstadoInput) {
  try {
    const session = await auth()
    if (!session?.user) {
      return { success: false as const, error: 'No autenticado' }
    }

    const validated = cambiarEstadoValidator.safeParse(input)
    if (!validated.success) {
      return { success: false as const, error: validated.error.issues[0].message }
    }

    // APROBADO/RECHAZADO requieren permiso de aprobación (matriz RBAC: solo ADMIN)
    const destino = validated.data.estado
    if (
      (destino === 'APROBADO' || destino === 'RECHAZADO') &&
      !ROLES_CONFIG.tienePermiso(session.user.role ?? '', 'avaluos.approve')
    ) {
      return {
        success: false as const,
        error: 'No autorizado. Solo administradores pueden aprobar o rechazar avalúos',
      }
    }

    const actualizado = await avaluoService.cambiarEstado(id, validated.data, session.user.id!)

    if (validated.data.estado === 'APROBADO') {
      await auditService.logAvaluoApproved(session.user.id!, id, actualizado.codigo)
    } else if (validated.data.estado === 'RECHAZADO') {
      await auditService.logAvaluoRejected(session.user.id!, id, actualizado.codigo)
    }

    return { success: true as const, data: actualizado }
  } catch (error: any) {
    console.error('Error cambiando estado del avalúo:', error)
    return { success: false as const, error: error.message || 'Error al cambiar el estado' }
  }
}

/** Actualizar avalúo (editar terreno, construcciones, factores, datos generales + recalcular) */
export async function actualizarAvaluoAction(id: string, input: unknown) {
  try {
    const session = await auth()
    if (!session?.user) {
      return { success: false as const, error: 'No autenticado' }
    }

    if (!ROLES_CONFIG.tienePermiso(session.user.role ?? '', 'avaluos.update')) {
      return { success: false as const, error: 'No autorizado para actualizar avalúos' }
    }

    const validated = actualizarAvaluoValidator.safeParse(input)
    if (!validated.success) {
      return { success: false as const, error: validated.error.issues[0].message }
    }

    await avaluoService.actualizar(id, validated.data)
    const detalle = await avaluoService.getById(id)
    await auditService.log({
      userId: session.user.id!,
      action: AuditAction.AVALUO_UPDATED,
      tableName: 'avaluos',
      recordId: id,
      newValue: { codigo: detalle.codigo, estado: detalle.estado },
    })
    return { success: true as const, data: detalle }
  } catch (error: any) {
    console.error('Error actualizando avalúo:', error)
    return { success: false as const, error: error.message || 'Error al actualizar el avalúo' }
  }
}

/** Agregar comparable de mercado a un avalúo existente */
export async function agregarComparableAction(avaluoId: string, input: unknown) {
  try {
    const session = await auth()
    if (!session?.user) {
      return { success: false as const, error: 'No autenticado' }
    }

    if (!ROLES_CONFIG.tienePermiso(session.user.role ?? '', 'avaluos.update')) {
      return { success: false as const, error: 'No autorizado para modificar este avalúo' }
    }

    const validated = comparableValidator.safeParse(input)
    if (!validated.success) {
      return { success: false as const, error: validated.error.issues[0].message }
    }

    await avaluoService.agregarComparable(avaluoId, validated.data)
    const detalle = await avaluoService.getById(avaluoId)
    await auditService.log({
      userId: session.user.id!,
      action: AuditAction.COMPARABLE_CREATED,
      tableName: 'comparables',
      recordId: avaluoId,
      newValue: { tipo: validated.data.tipo },
    })
    return { success: true as const, data: detalle }
  } catch (error: any) {
    console.error('Error agregando comparable:', error)
    return { success: false as const, error: error.message || 'Error al agregar el comparable' }
  }
}

/** Actualizar un comparable existente */
export async function actualizarComparableAction(
  avaluoId: string,
  comparableId: string,
  input: unknown,
) {
  try {
    const session = await auth()
    if (!session?.user) {
      return { success: false as const, error: 'No autenticado' }
    }

    if (!ROLES_CONFIG.tienePermiso(session.user.role ?? '', 'avaluos.update')) {
      return { success: false as const, error: 'No autorizado para modificar este avalúo' }
    }

    const validated = comparableValidator.safeParse(input)
    if (!validated.success) {
      return { success: false as const, error: validated.error.issues[0].message }
    }

    await avaluoService.actualizarComparable(avaluoId, comparableId, validated.data)
    const detalle = await avaluoService.getById(avaluoId)
    await auditService.log({
      userId: session.user.id!,
      action: AuditAction.COMPARABLE_UPDATED,
      tableName: 'comparables',
      recordId: comparableId,
    })
    return { success: true as const, data: detalle }
  } catch (error: any) {
    console.error('Error actualizando comparable:', error)
    return { success: false as const, error: error.message || 'Error al actualizar el comparable' }
  }
}

/** Eliminar un comparable existente */
export async function eliminarComparableAction(
  avaluoId: string,
  comparableId: string,
  tipo: ComparableInput['tipo'],
) {
  try {
    const session = await auth()
    if (!session?.user) {
      return { success: false as const, error: 'No autenticado' }
    }

    if (!ROLES_CONFIG.tienePermiso(session.user.role ?? '', 'avaluos.update')) {
      return { success: false as const, error: 'No autorizado para modificar este avalúo' }
    }

    await avaluoService.eliminarComparable(avaluoId, comparableId, tipo ?? 'VENTA')
    const detalle = await avaluoService.getById(avaluoId)
    await auditService.log({
      userId: session.user.id!,
      action: AuditAction.COMPARABLE_DELETED,
      tableName: 'comparables',
      recordId: comparableId,
      oldValue: { tipo: tipo ?? 'VENTA' },
    })
    return { success: true as const, data: detalle }
  } catch (error: any) {
    console.error('Error eliminando comparable:', error)
    return { success: false as const, error: error.message || 'Error al eliminar el comparable' }
  }
}

/** Eliminar un avalúo (no se permiten eliminar avalúos aprobados) */
export async function eliminarAvaluoAction(id: string) {
  try {
    const session = await auth()
    if (!session?.user) {
      return { success: false as const, error: 'No autenticado' }
    }

    // Matriz RBAC: avaluos.delete es exclusivo de ADMIN
    if (!ROLES_CONFIG.tienePermiso(session.user.role ?? '', 'avaluos.delete')) {
      return { success: false as const, error: 'No autorizado. Solo administradores pueden eliminar avalúos' }
    }

    await avaluoService.eliminar(id)
    await auditService.log({
      userId: session.user.id!,
      action: AuditAction.AVALUO_DELETED,
      tableName: 'avaluos',
      recordId: id,
    })
    return { success: true as const, data: { id } }
  } catch (error: any) {
    console.error('Error eliminando avalúo:', error)
    return { success: false as const, error: error.message || 'Error al eliminar el avalúo' }
  }
}

/**
 * Buscar comparables cercanos (paso 9 del wizard).
 *
 * Consulta la tabla `products` (que el scraper externo puebla) y devuelve los
 * inmuebles dentro del radio especificado, ordenados por distancia.
 *
 * Cada inmueble se transforma a ComparableCercanoDTO con su precio/m² y distancia.
 */
export async function buscarComparablesCercanosAction(input: unknown) {
  try {
    const session = await auth()
    if (!session?.user) {
      return { success: false as const, error: 'No autenticado' }
    }

    const validated = buscarComparablesValidator.safeParse(input)
    if (!validated.success) {
      return { success: false as const, error: validated.error.issues[0].message }
    }

    const { lat, lng, radioMetros } = validated.data

    // Búsqueda bruta: traemos todos los productos con coordenadas (PostGIS no está siempre disponible)
    // y filtramos por Haversine en memoria. Para datasets grandes se puede migrar a consulta PostGIS.
    const candidatos = await prisma.product.findMany({
      where: {
        lat: { not: null },
        lng: { not: null },
        precioUsd: { not: null },
      },
      select: {
        id: true,
        codigoInmueble: true,
        nombre: true,
        direccion: true,
        precioUsd: true,
        superficieUtil: true,
        superficieConstruida: true,
        lat: true,
        lng: true,
      },
    })

    const resultados: ComparableCercanoDTO[] = candidatos
      .map((p) => {
        const distancia = haversineDistance(lat, lng, p.lat as number, p.lng as number)
        const superficie = (p.superficieUtil ?? p.superficieConstruida) ?? 0
        const precio = Number(p.precioUsd ?? 0)
        const precioM2 = superficie > 0 ? precio / superficie : null
        return {
          id: p.id,
          codigoInmueble: p.codigoInmueble,
          nombre: p.nombre,
          direccion: p.direccion,
          precioUsd: precio,
          superficieUtil: p.superficieUtil,
          superficieConstruida: p.superficieConstruida,
          lat: p.lat as number,
          lng: p.lng as number,
          distanciaMetros: Math.round(distancia),
          precioM2,
        }
      })
      // Solo comparables con precio/m² calculable y positivo: un comparable sin
      // superficie (precioM2 null) o con precio 0 contamina el promedio que
      // determina el valor unitario del terreno
      .filter((r) => r.precioM2 != null && r.precioM2 > 0 && r.distanciaMetros <= radioMetros)
      .sort((a, b) => a.distanciaMetros - b.distanciaMetros)

    return { success: true as const, data: resultados }
  } catch (error: any) {
    console.error('Error buscando comparables cercanos:', error)
    return { success: false as const, error: error.message || 'Error al buscar comparables' }
  }
}
