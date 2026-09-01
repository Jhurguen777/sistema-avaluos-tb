/**
 * Documento Service
 * Lógica de negocio para archivos adjuntos de avalúos.
 *
 * Enrutamiento por naturaleza del archivo:
 *  - FOTOGRAFIA → tabla product_images (pertenece al inmueble; sobrevive entre
 *    avalúos del mismo inmueble y alimenta la galería del PDF)
 *  - FOLIO_REAL / CATASTRO / IMPUESTOS / PLANO / OTRO → tabla documentos
 *    (expediente administrativo del avalúo)
 *
 * Los bytes viven en la BD (columna `data`) y se sirven de forma privada vía
 * /api/archivos/[id] con verificación de sesión. Al eliminar avalúo o inmueble,
 * la BD borra registro y archivo juntos (sin huérfanos en disco).
 */

import { prisma } from '@/shared/database/prisma'
import type { TipoDocumento } from '@prisma/client'
import { randomUUID } from 'crypto'
import path from 'path'

/** Ventanilla privada de descarga (route handler con auth) */
const ARCHIVOS_URL = '/api/archivos'

/** Whitelist de extensiones y MIME types permitidos */
const EXT_PERMITIDAS = new Set(['.pdf', '.png', '.jpg', '.jpeg', '.webp'])
const MIME_PERMITIDOS = new Set([
  'application/pdf',
  'image/png',
  'image/jpeg',
  'image/webp',
])

/** Tamaño máximo por archivo: 10 MB */
const MAX_SIZE = 10 * 1024 * 1024

/** DTO uniforme para la lista combinada de documentos + fotos */
export interface DocumentoItemDTO {
  id: string
  tipo: TipoDocumento
  originalName: string
  mimeType: string
  size: number
  url: string
  descripcion: string | null
  createdAt: Date
  /** true si vive en product_images (foto del inmueble) */
  esFoto: boolean
}

/** ¿El error de Prisma es "registro no encontrado" (P2025)? */
function esNoEncontrado(e: unknown): boolean {
  return (e as { code?: string })?.code === 'P2025'
}

/** Validación del portero: extensión, MIME y tamaño */
function validarArchivo(file: File): void {
  const ext = path.extname(file.name).toLowerCase()
  if (!EXT_PERMITIDAS.has(ext)) {
    throw new Error('Tipo de archivo no permitido. Solo se permiten PDF, JPG, PNG o WEBP')
  }
  if (file.type && !MIME_PERMITIDOS.has(file.type)) {
    throw new Error('Tipo de archivo no permitido. Solo se permiten PDF, JPG, PNG o WEBP')
  }
  if (file.size <= 0) {
    throw new Error('El archivo está vacío')
  }
  if (file.size > MAX_SIZE) {
    throw new Error('El archivo supera el máximo de 10 MB')
  }
}

export const documentoService = {
  /**
   * Guarda un archivo según su naturaleza (foto → product_images; documento →
   * documentos) con los bytes en la BD y URL privada.
   * @param avaluoId  ID del avalúo al que se asocia
   * @param tipo      Tipo de documento (determina la tabla destino)
   * @param file      Archivo (File con name, type, size)
   * @param descripcion  Descripción opcional
   */
  async subirArchivo(
    avaluoId: string,
    tipo: TipoDocumento,
    file: File,
    descripcion?: string,
  ): Promise<DocumentoItemDTO> {
    validarArchivo(file)

    const bytes = Buffer.from(await file.arrayBuffer())
    const id = randomUUID()
    const ext = path.extname(file.name).toLowerCase()
    const base = {
      fileName: `${id}${ext}`,
      originalName: file.name,
      mimeType: file.type || 'application/octet-stream',
      size: file.size,
      url: `${ARCHIVOS_URL}/${id}`,
    }

    if (tipo === 'FOTOGRAFIA') {
      // La foto pertenece al INMUEBLE: sobrevive entre avalúos del mismo producto
      const avaluo = await prisma.avaluo.findUnique({
        where: { id: avaluoId },
        select: { productId: true },
      })
      if (!avaluo) throw new Error('Avalúo no encontrado')

      const img = await prisma.productImage.create({
        data: {
          id,
          productId: avaluo.productId,
          ...base,
          data: bytes,
          descripcion: descripcion ?? null,
        },
      })
      return {
        id: img.id,
        tipo: 'FOTOGRAFIA',
        originalName: img.originalName,
        mimeType: img.mimeType,
        size: img.size,
        url: img.url,
        descripcion: img.descripcion,
        createdAt: img.createdAt,
        esFoto: true,
      }
    }

    const doc = await prisma.documento.create({
      data: {
        id,
        avaluoId,
        tipo,
        ...base,
        data: bytes,
        descripcion: descripcion ?? null,
      },
    })
    return {
      id: doc.id,
      tipo: doc.tipo,
      originalName: doc.originalName,
      mimeType: doc.mimeType,
      size: doc.size,
      url: doc.url,
      descripcion: doc.descripcion,
      createdAt: doc.createdAt,
      esFoto: false,
    }
  },

  /**
   * Lista combinada para la sección de documentos de un avalúo:
   * documentos del expediente + fotos del inmueble, ordenados por fecha.
   */
  async listarPorAvaluo(avaluoId: string): Promise<DocumentoItemDTO[]> {
    const [docs, fotos] = await Promise.all([
      prisma.documento.findMany({
        where: { avaluoId },
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          tipo: true,
          originalName: true,
          mimeType: true,
          size: true,
          url: true,
          descripcion: true,
          createdAt: true,
        },
      }),
      prisma.productImage.findMany({
        where: { product: { avaluos: { some: { id: avaluoId } } } },
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          originalName: true,
          mimeType: true,
          size: true,
          url: true,
          descripcion: true,
          createdAt: true,
        },
      }),
    ])

    const docDTOs: DocumentoItemDTO[] = docs.map((d) => ({ ...d, esFoto: false }))
    const fotoDTOs: DocumentoItemDTO[] = fotos.map((f) => ({
      ...f,
      tipo: 'FOTOGRAFIA' as TipoDocumento,
      esFoto: true,
    }))
    return [...docDTOs, ...fotoDTOs].sort(
      (a, b) => Date.parse(String(b.createdAt)) - Date.parse(String(a.createdAt)),
    )
  },

  /**
   * Elimina un archivo de cualquiera de las dos tablas (documento o foto).
   * Los bytes viven en la BD: se borran junto con la fila (sin archivos huérfanos).
   * @returns true si se eliminó, false si no existía.
   */
  async eliminar(id: string): Promise<boolean> {
    try {
      await prisma.documento.delete({ where: { id } })
      return true
    } catch (e) {
      if (!esNoEncontrado(e)) throw e
    }
    try {
      await prisma.productImage.delete({ where: { id } })
      return true
    } catch (e) {
      if (!esNoEncontrado(e)) throw e
      return false
    }
  },
}
