/**
 * Documento Actions
 * Server Actions para subir, listar y eliminar documentos de un avalúo
 */

"use server"

import { auth } from '@/shared/auth/nextauth'
import { auditService, AuditAction } from '@/shared/security/audit-service'
import { documentoService } from '../services/documento-service'
import { unlink } from 'fs/promises'
import path from 'path'
import type { TipoDocumento } from '@prisma/client'

/** Subir un documento a un avalúo (FormData: file + tipo + descripcion) */
export async function subirDocumentoAction(formData: FormData) {
  try {
    const session = await auth()
    if (!session?.user) {
      return { success: false as const, error: 'No autenticado' }
    }

    const avaluoId = String(formData.get('avaluoId') || '')
    const tipo = String(formData.get('tipo') || 'OTRO') as TipoDocumento
    const descripcion = (formData.get('descripcion') as string) || undefined
    const file = formData.get('file') as File | null

    if (!avaluoId) return { success: false as const, error: 'Falta el ID del avalúo' }
    if (!file || file.size === 0) return { success: false as const, error: 'Debe seleccionar un archivo' }

    const doc = await documentoService.subirArchivo(avaluoId, tipo, file, descripcion)
    await auditService.log({
      userId: session.user.id!,
      action: AuditAction.DOCUMENTO_UPLOADED,
      tableName: 'Documento',
      recordId: (doc as { id?: string }).id ?? undefined,
      newValue: { avaluoId, tipo, nombre: file.name, size: file.size },
    })
    return { success: true as const, data: doc }
  } catch (error: any) {
    console.error('Error subiendo documento:', error)
    return { success: false as const, error: error.message || 'Error al subir el documento' }
  }
}

/** Listar documentos de un avalúo */
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
    return { success: false as const, error: error.message || 'Error al listar documentos' }
  }
}

/** Eliminar un documento (registro + archivo físico en public/uploads) */
export async function eliminarDocumentoAction(id: string) {
  try {
    const session = await auth()
    if (!session?.user) {
      return { success: false as const, error: 'No autenticado' }
    }
    const url = await documentoService.eliminar(id)
    if (url) {
      // Borrar el archivo físico; se ignora el error si ya no existe
      try {
        await unlink(path.join(process.cwd(), 'public', url))
      } catch (e) {
        console.error('Archivo físico no encontrado al eliminar documento:', e)
      }
    }
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
