/**
 * Documento Repository
 * Acceso a datos para documentos de avalúos
 */

import { prisma } from '@/shared/database/prisma'
import type { TipoDocumento } from '@prisma/client'

export interface CreateDocumentoInput {
  avaluoId: string
  tipo: TipoDocumento
  fileName: string
  originalName: string
  mimeType: string
  size: number
  url: string
  descripcion?: string | null
}

export const documentoRepository = {
  async create(data: CreateDocumentoInput) {
    return prisma.documento.create({ data })
  },

  async listByAvaluo(avaluoId: string) {
    return prisma.documento.findMany({
      where: { avaluoId },
      orderBy: { createdAt: 'desc' },
    })
  },

  async findById(id: string) {
    return prisma.documento.findUnique({ where: { id } })
  },

  async delete(id: string) {
    return prisma.documento.delete({ where: { id } })
  },
}
