/**
 * Ventanilla privada de descarga de archivos
 *
 * Sirve los bytes almacenados en la BD (documentos del expediente y fotos del
 * inmueble) con verificación de sesión. Los documentos legales (Folio Real,
 * Catastro, Impuestos) nunca se exponen públicamente: se entregan únicamente
 * a usuarios autenticados y siempre como descarga (attachment), nunca
 * renderizados/ejecutados por el navegador en el origen de la app.
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/shared/auth/nextauth'
import { prisma } from '@/shared/database/prisma'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
  }

  const { id } = await params

  // Buscar en documentos; si no está, en fotos del inmueble
  let registro: {
    data: Uint8Array | null
    fileName: string
    mimeType: string
    url: string
  } | null = null

  const doc = await prisma.documento.findUnique({ where: { id } }).catch(() => null)
  if (doc) {
    registro = {
      data: doc.data,
      fileName: doc.originalName,
      mimeType: doc.mimeType,
      url: doc.url,
    }
  } else {
    const img = await prisma.productImage.findUnique({ where: { id } }).catch(() => null)
    if (img) {
      registro = {
        data: img.data,
        fileName: img.originalName,
        mimeType: img.mimeType,
        url: img.url,
      }
    }
  }

  if (!registro) {
    return NextResponse.json({ error: 'Archivo no encontrado' }, { status: 404 })
  }

  // Filas legacy sin bytes: redirigir a la URL pública vieja si existe
  if (!registro.data || registro.data.length === 0) {
    if (registro.url && registro.url.startsWith('/uploads/')) {
      return NextResponse.redirect(new URL(registro.url, req.url))
    }
    return NextResponse.json({ error: 'Archivo sin contenido' }, { status: 404 })
  }

  // Descarga forzada: el navegador nunca interpreta el contenido como página
  const ext = registro.fileName.includes('.')
    ? registro.fileName.slice(registro.fileName.lastIndexOf('.'))
    : ''
  const nombreCodificado = encodeURIComponent(registro.fileName)
  return new NextResponse(new Uint8Array(registro.data), {
    headers: {
      'Content-Type': registro.mimeType || 'application/octet-stream',
      'Content-Length': String(registro.data.length),
      'Content-Disposition': `attachment; filename="archivo${ext}"; filename*=UTF-8''${nombreCodificado}`,
      'Cache-Control': 'private, no-store',
    },
  })
}
