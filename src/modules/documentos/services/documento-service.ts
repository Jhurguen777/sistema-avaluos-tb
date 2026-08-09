/**
 * Documento Service
 * Lógica de negocio: guardado físico de archivos en public/uploads y registro en BD
 */

import { documentoRepository, type CreateDocumentoInput } from '../repositories/documento-repository'
import { writeFile, mkdir } from 'fs/promises'
import { existsSync } from 'fs'
import path from 'path'
import { randomUUID } from 'crypto'

const UPLOADS_DIR = path.join(process.cwd(), 'public', 'uploads')
const UPLOADS_URL = '/uploads'

export const documentoService = {
  /**
   * Guarda un archivo en disco (public/uploads) y registra el Documento en la BD.
   * @param avaluoId  ID del avalúo al que se asocia
   * @param tipo      Tipo de documento
   * @param file      Archivo (File/Blob con name, type, size)
   */
  async subirArchivo(
    avaluoId: string,
    tipo: CreateDocumentoInput['tipo'],
    file: File,
    descripcion?: string,
  ) {
    if (!existsSync(UPLOADS_DIR)) {
      await mkdir(UPLOADS_DIR, { recursive: true })
    }

    const ext = path.extname(file.name) || ''
    const fileName = `${randomUUID()}${ext}`
    const filePath = path.join(UPLOADS_DIR, fileName)

    const bytes = await file.arrayBuffer()
    await writeFile(filePath, Buffer.from(bytes))

    return documentoRepository.create({
      avaluoId,
      tipo,
      fileName,
      originalName: file.name,
      mimeType: file.type || 'application/octet-stream',
      size: file.size,
      url: `${UPLOADS_URL}/${fileName}`,
      descripcion: descripcion ?? null,
    })
  },

  async listarPorAvaluo(avaluoId: string) {
    return documentoRepository.listByAvaluo(avaluoId)
  },

  async eliminar(id: string): Promise<string | null> {
    const doc = await documentoRepository.findById(id)
    if (!doc) return null
    await documentoRepository.delete(id)
    return doc.url
  },
}
