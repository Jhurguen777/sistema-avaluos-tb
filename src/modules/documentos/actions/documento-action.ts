/**
 * Documento Actions
 * Server Actions para subir (individual o por tandas), listar y eliminar
 * documentos y fotos de un avalúo.
 *
 * Toda mutación verifica: sesión + permiso (propietario del avalúo o
 * 'avaluos.update') + avalúo no aprobado.
 */

"use server"

import { auth } from '@/shared/auth/nextauth'
import { ROLES_CONFIG } from '@/config/roles'
import { auditService, AuditAction } from '@/shared/security/audit-service'
import { documentoService } from '../services/documento-service'
import { prisma } from '@/shared/database/prisma'
import type { TipoDocumento } from '@prisma/client'

/** Tipos válidos del enum TipoDocumento (validación server-side del FormData) */
const TIPOS_VALIDOS: TipoDocumento[] = [
  'FOLIO_REAL',
  'CATASTRO',
  'IMPUESTOS',
  'PLANO',
  'FOTOGRAFIA',
  'OTRO',
]

/** Verifica permiso sobre el avalúo: propietario o permiso avaluos.update */
function puedeModificar(
  role: string | undefined,
  createdBy: string | null | undefined,
  userId: string | undefined,
): boolean {
  if (ROLES_CONFIG.tienePermiso(role ?? '', 'avaluos.update')) return true
  return Boolean(createdBy && userId && createdBy === userId)
}

/**
 * Subir documentos/fotos a un avalúo (FormData).
 * Campos: avaluoId + por cada archivo: file, tipo y descripcion (índices alineados
 * via getAll, permite subir un lote completo con tipos distintos en una llamada).
 */
export async function subirDocumentoAction(formData: FormData) {
  try {
    const session = await auth()
    if (!session?.user) {
      return { success: false as const, error: 'No autenticado' }
    }

    const avaluoId = String(formData.get('avaluoId') || '')
    const files = formData
      .getAll('file')
      .filter((f): f is File => f instanceof File && f.size > 0)
    const tipos = formData.getAll('tipo').map((t) => String(t))
    const descripciones = formData.getAll('descripcion').map((d) => String(d || ''))

    if (!avaluoId) return { success: false as const, error: 'Falta el ID del avalúo' }
    if (files.length === 0) {
      return { success: false as const, error: 'Debe seleccionar al menos un archivo' }
    }

    // Guard: el avalúo existe, el usuario puede modificarlo y no está aprobado
    const avaluo = await prisma.avaluo.findUnique({
      where: { id: avaluoId },
      select: { estado: true, createdBy: true },
    })
    if (!avaluo) return { success: false as const, error: 'Avalúo no encontrado' }
    if (!puedeModificar(session.user.role, avaluo.createdBy, session.user.id)) {
      return {
        success: false as const,
        error: 'No autorizado para modificar los archivos de este avalúo',
      }
    }
    if (avaluo.estado === 'APROBADO') {
      return {
        success: false as const,
        error: 'No se puede modificar un avalúo aprobado',
      }
    }

    // Subida por tandas: cada archivo con su tipo; un fallo no aborta los demás
    const subidos: unknown[] = []
    const fallidos: { nombre: string; error: string }[] = []

    for (let i = 0; i < files.length; i++) {
      const tipo = (tipos[i] || 'OTRO') as TipoDocumento
      const file = files[i]
      try {
        if (!TIPOS_VALIDOS.includes(tipo)) {
          throw new Error('Tipo de documento inválido')
        }
        const doc = await documentoService.subirArchivo(
          avaluoId,
          tipo,
          file,
          descripciones[i] || undefined,
        )
        subidos.push(doc)
        await auditService.log({
          userId: session.user.id!,
          action: AuditAction.DOCUMENTO_UPLOADED,
          tableName: doc.esFoto ? 'ProductImage' : 'Documento',
          recordId: doc.id,
          newValue: { avaluoId, tipo, nombre: file.name, size: file.size },
        })
      } catch (err) {
        const mensaje = (err as Error)?.message || 'Error al subir el archivo'
        console.error(`Error subiendo archivo "${file.name}":`, err)
        fallidos.push({ nombre: file.name, error: mensaje })
      }
    }

    return { success: true as const, data: { subidos, fallidos } }
  } catch (error: any) {
    console.error('Error subiendo documento:', error)
    return { success: false as const, error: error.message || 'Error al subir el documento' }
  }
}

/** Listar documentos + fotos de un avalúo (lista combinada) */
export async function listarDocumentosAction(avaluoId: string) {
  try {
    const session = await auth()
    if (!session?.user) {
      return { success: false as const, error: 'No autenticado' }
    }
    const docs = await documentoService.listarPorAvaluo(avaluoId)
    return { success: true as const, data: docs }
  } catch (error: any) {
    console.error('Error listando documentos:', error)
    return { success: false as const, error: error.message || 'Error al listar los documentos' }
  }
}

/**
 * Eliminar un documento o foto (registro + bytes en BD, sin archivos físicos).
 * Verifica permiso sobre el avalúo dueño y que no esté aprobado.
 */
export async function eliminarDocumentoAction(id: string) {
  try {
    const session = await auth()
    if (!session?.user) {
      return { success: false as const, error: 'No autenticado' }
    }

    // Localizar el archivo y su avalúo dueño (documento directo; foto vía producto)
    let estado: string | null = null
    let esPropietario = false

    const doc = await prisma.documento.findUnique({
      where: { id },
      select: { avaluo: { select: { estado: true, createdBy: true } } },
    })
    if (doc) {
      estado = doc.avaluo.estado
      esPropietario = puedeModificar(session.user.role, doc.avaluo.createdBy, session.user.id)
    } else {
      const img = await prisma.productImage.findUnique({
        where: { id },
        select: {
          product: {
            select: { avaluos: { select: { estado: true, createdBy: true } } },
          },
        },
      })
      if (img) {
        // Foto: propietario si posee algún avalúo del inmueble; bloqueada si
        // algún avalúo del inmueble está aprobado (protege PDFs ya emitidos)
        esPropietario = img.product.avaluos.some((a) =>
          puedeModificar(session.user.role, a.createdBy, session.user.id),
        )
        estado = img.product.avaluos.some((a) => a.estado === 'APROBADO')
          ? 'APROBADO'
          : img.product.avaluos[0]?.estado ?? null
      }
    }

    if (estado === null) {
      return { success: false as const, error: 'Archivo no encontrado' }
    }
    if (!esPropietario) {
      return {
        success: false as const,
        error: 'No autorizado para eliminar archivos de este avalúo',
      }
    }
    if (estado === 'APROBADO') {
      return { success: false as const, error: 'No se puede modificar un avalúo aprobado' }
    }

    await documentoService.eliminar(id)
    await auditService.log({
      userId: session.user.id!,
      action: AuditAction.DOCUMENTO_DELETED,
      tableName: 'Documento',
      recordId: id,
    })
    return { success: true as const, data: { id } }
  } catch (error: any) {
    console.error('Error eliminando documento:', error)
    return { success: false as const, error: error.message || 'Error al eliminar el documento' }
  }
}
