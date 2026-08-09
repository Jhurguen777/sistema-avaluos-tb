/**
 * Server Action que reúne todos los datos necesarios para generar el PDF
 * de informe de avalúo. Trae inmueble completo, fotos, ubicación, valuador,
 * equipamientos, documentos y resultado en una sola consulta.
 */

"use server"

import { auth } from '@/shared/auth/nextauth'
import { prisma } from '@/shared/database/prisma'
import { toNum } from '@/shared/database/decimal'

/** DTO de una fotografía lista para el PDF (url ya resuelta) */
export interface FotoPdfDTO {
  url: string
  descripcion: string | null
  orden: number
  isPrincipal: boolean
}

/** DTO de un equipamiento con coordenadas y dirección */
export interface EquipamientoPdfDTO {
  id: string
  tipo: string
  nombre: string
  direccion: string | null
  distancia: number
  lat: number
  lng: number
}

/** DTO del resultado (todos los valores relevantes) */
export interface ResultadoPdfDTO {
  valorTerreno: number
  valorReposicion: number
  depreciacion: number
  valorConstruccion: number
  valorComercial: number
  valorVentaRapida: number | null
  valorAlquiler: number | null
  valorCapitalComercial: number | null
}

/** DTO completo del avalúo para el PDF */
export interface DatosPdfAvaluo {
  // Avalúo
  avaluoId: string
  codigo: string
  tipo: string
  estado: string
  fechaElaboracion: Date
  fechaAprobacion: Date | null
  solicitante: string | null
  propietario: string | null
  observaciones: string | null

  // Inmueble
  codigoInmueble: string
  nombreInmueble: string
  categoria: string
  operacion: string
  direccion: string | null
  lat: number | null
  lng: number | null
  anoConstruccion: number | null
  superficieUtil: number | null
  superficieConstruida: number | null
  habitaciones: number | null
  banos: number | null
  cocheras: number | null
  servicios: Record<string, unknown> | null
  descripcion: string | null

  // Ubicación (ProductLocation)
  departamento: string | null
  provincia: string | null
  municipio: string | null
  zona: string | null
  callePrincipal: string | null
  numero: string | null
  entreCalles: string | null

  // Valuador (creator) y aprobador
  valuadorNombre: string | null
  valuadorEmail: string | null
  aprobadorNombre: string | null

  // Terreno
  terreno: {
    superficieM2: number
    frente: number | null
    fondo: number | null
    formaLote: string | null
    tipoVia: string | null
    esEsquina: boolean
    valorUnitario: number
    valorTotal: number
  } | null

  // Construcciones
  construcciones: Array<{
    tipo: string
    categoria: string
    estado: string
    anoConstruccion: number
    vidaUtil: number
    superficieM2: number
    valorUnitario: number
    valorReposicion: number
    depreciacionAnual: number
    depreciacionTotal: number
    valorNeto: number
  }>

  // Factores de homologación
  factores: {
    factorUbicacion: number
    factorVia: number
    factorFrente: number
    factorEsquina: number
    factorMorfologico: number
    factorServicios: number
  } | null

  // Resultado
  resultado: ResultadoPdfDTO | null

  // Entorno / radar
  radioAnalisis: number
  equipamientos: EquipamientoPdfDTO[]

  // Fotografías del inmueble
  fotos: FotoPdfDTO[]
}

/**
 * Obtiene todos los datos que el generador de PDF necesita, en una sola
 * consulta relacional. Devuelve `success: false` si el avalúo no existe o
 * si el usuario no está autenticado.
 */
export async function obtenerDatosPdfAction(avaluoId: string): Promise<
  { success: true; data: DatosPdfAvaluo } | { success: false; error: string }
> {
  const session = await auth()
  if (!session?.user) {
    return { success: false, error: 'No autenticado' }
  }

  const a = await prisma.avaluo.findUnique({
    where: { id: avaluoId },
    include: {
      product: {
        include: {
          category: { select: { name: true } },
          location: true,
          images: {
            orderBy: [{ isPrincipal: 'desc' }, { orden: 'asc' }, { createdAt: 'asc' }],
          },
        },
      },
      terreno: true,
      construcciones: { orderBy: { createdAt: 'asc' } },
      factoresHomologacion: true,
      resultados: true,
      entorno: { include: { equipamientos: { orderBy: { distancia: 'asc' } } } },
      creator: { select: { id: true, name: true, email: true } },
      approver: { select: { id: true, name: true } },
    },
  })

  if (!a) return { success: false, error: 'Avalúo no encontrado' }

  const p = a.product
  const loc = p?.location ?? null

  const data: DatosPdfAvaluo = {
    avaluoId: a.id,
    codigo: a.codigo,
    tipo: a.tipo,
    estado: a.estado,
    fechaElaboracion: a.fechaElaboracion,
    fechaAprobacion: a.fechaAprobacion,
    solicitante: a.solicitante,
    propietario: a.propietario,
    observaciones: a.observaciones,

    codigoInmueble: p?.codigoInmueble ?? '',
    nombreInmueble: p?.nombre ?? '',
    categoria: p?.category?.name ?? 'OTROS',
    operacion: p?.operacion ?? 'VENTA',
    direccion: p?.direccion ?? null,
    lat: p?.lat ?? null,
    lng: p?.lng ?? null,
    anoConstruccion: p?.anoConstruccion ?? null,
    superficieUtil: p?.superficieUtil ?? null,
    superficieConstruida: p?.superficieConstruida ?? null,
    habitaciones: p?.habitaciones ?? null,
    banos: p?.banos ?? null,
    cocheras: p?.cocheras ?? null,
    servicios: (p?.servicios as Record<string, unknown> | null) ?? null,
    descripcion: p?.descripcion ?? null,

    departamento: loc?.departamento ?? null,
    provincia: loc?.provincia ?? null,
    municipio: loc?.municipio ?? null,
    zona: loc?.zona ?? null,
    callePrincipal: loc?.callePrincipal ?? null,
    numero: loc?.numero ?? null,
    entreCalles: loc?.entreCalles ?? null,

    valuadorNombre: a.creator?.name ?? null,
    valuadorEmail: a.creator?.email ?? null,
    aprobadorNombre: a.approver?.name ?? null,

    terreno: a.terreno
      ? {
          superficieM2: a.terreno.superficieM2,
          frente: a.terreno.frente ?? null,
          fondo: a.terreno.fondo ?? null,
          formaLote: a.terreno.formaLote ?? null,
          tipoVia: a.terreno.tipoVia ?? null,
          esEsquina: a.terreno.esEsquina,
          valorUnitario: toNum(a.terreno.valorUnitario) ?? 0,
          valorTotal: toNum(a.terreno.valorTotal) ?? 0,
        }
      : null,

    construcciones: a.construcciones.map((c) => ({
      tipo: c.tipo,
      categoria: c.categoria,
      estado: c.estado,
      anoConstruccion: c.anoConstruccion,
      vidaUtil: c.vidaUtil,
      superficieM2: c.superficieM2,
      valorUnitario: toNum(c.valorUnitario) ?? 0,
      valorReposicion: toNum(c.valorReposicion) ?? 0,
      depreciacionAnual: toNum(c.depreciacionAnual) ?? 0,
      depreciacionTotal: toNum(c.depreciacionTotal) ?? 0,
      valorNeto: toNum(c.valorNeto) ?? 0,
    })),

    factores: a.factoresHomologacion
      ? {
          factorUbicacion: toNum(a.factoresHomologacion.factorUbicacion) ?? 1,
          factorVia: toNum(a.factoresHomologacion.factorVia) ?? 1,
          factorFrente: toNum(a.factoresHomologacion.factorFrente) ?? 1,
          factorEsquina: toNum(a.factoresHomologacion.factorEsquina) ?? 1,
          factorMorfologico: toNum(a.factoresHomologacion.factorMorfologico) ?? 1,
          factorServicios: toNum(a.factoresHomologacion.factorServicios) ?? 1,
        }
      : null,

    resultado: a.resultados
      ? {
          valorTerreno: toNum(a.resultados.valorTerreno) ?? 0,
          valorReposicion: toNum(a.resultados.valorReposicion) ?? 0,
          depreciacion: toNum(a.resultados.depreciacion) ?? 0,
          valorConstruccion: toNum(a.resultados.valorConstruccion) ?? 0,
          valorComercial: toNum(a.resultados.valorComercial) ?? 0,
          valorVentaRapida: toNum(a.resultados.valorVentaRapida),
          valorAlquiler: toNum(a.resultados.valorAlquiler),
          valorCapitalComercial: toNum(a.resultados.valorCapitalComercial),
        }
      : null,

    radioAnalisis: a.entorno?.radio ?? 1000,
    equipamientos: (a.entorno?.equipamientos ?? []).map((e) => ({
      id: e.id,
      tipo: e.tipo,
      nombre: e.nombre,
      direccion: e.direccion ?? null,
      distancia: e.distancia,
      lat: e.lat,
      lng: e.lng,
    })),

    fotos: (p?.images ?? []).map((img) => ({
      url: img.url,
      descripcion: img.descripcion ?? null,
      orden: img.orden,
      isPrincipal: img.isPrincipal,
    })),
  }

  return { success: true, data }
}
