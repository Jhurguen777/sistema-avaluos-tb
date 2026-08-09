/**
 * Avalúo Repository
 * Acceso a datos para avalúos y sus entidades relacionadas
 */

import { prisma } from '@/shared/database/prisma'
import { toNum } from '@/shared/database/decimal'
import type { Prisma } from '@prisma/client'
import type { AvaluoDTO } from '../types/avaluo.types'

/** Incluye estándar para traer inmueble + resultado */
const avaluoInclude = {
  product: {
    select: {
      id: true,
      codigoInmueble: true,
      nombre: true,
      operacion: true,
      direccion: true,
      location: { select: { zona: true } },
      category: { select: { name: true } },
    },
  },
  resultados: true,
  creator: { select: { id: true, name: true } },
} as const

function toDTO(a: any): AvaluoDTO {
  return {
    id: a.id,
    codigo: a.codigo,
    tipo: a.tipo,
    estado: a.estado,
    fechaElaboracion: a.fechaElaboracion,
    fechaAprobacion: a.fechaAprobacion,
    solicitante: a.solicitante,
    propietario: a.propietario,
    observaciones: a.observaciones,
    createdBy: a.createdBy,
    creadoPorNombre: a.creator?.name ?? null,
    approvedBy: a.approvedBy,
    createdAt: a.createdAt,
    updatedAt: a.updatedAt,
    productId: a.productId,
    codigoInmueble: a.product?.codigoInmueble ?? '',
    nombreInmueble: a.product?.nombre ?? '',
    categoria: a.product?.category?.name ?? 'OTROS',
    operacion: a.product?.operacion ?? 'VENTA',
    direccion: a.product?.direccion ?? null,
    zona: a.product?.location?.zona ?? null,
    valorComercial: toNum(a.resultados?.valorComercial),
    valorTerreno: toNum(a.resultados?.valorTerreno),
    valorConstruccion: toNum(a.resultados?.valorConstruccion),
  }
}

/** Normaliza campos Decimal → number para Terreno */
function mapTerreno(t: any) {
  if (!t) return null
  return {
    ...t,
    valorUnitario: toNum(t.valorUnitario),
    valorTotal: toNum(t.valorTotal),
  }
}

/** Normaliza campos Decimal → number para Construcción */
function mapConstruccion(c: any) {
  return {
    ...c,
    valorUnitario: toNum(c.valorUnitario),
    valorReposicion: toNum(c.valorReposicion),
    depreciacionAnual: toNum(c.depreciacionAnual),
    depreciacionTotal: toNum(c.depreciacionTotal),
    valorNeto: toNum(c.valorNeto),
  }
}

/** Normaliza factores Decimal → number */
function mapFactores(f: any) {
  if (!f) return null
  return {
    ...f,
    factorUbicacion: toNum(f.factorUbicacion),
    factorVia: toNum(f.factorVia),
    factorFrente: toNum(f.factorFrente),
    factorEsquina: toNum(f.factorEsquina),
    factorMorfologico: toNum(f.factorMorfologico),
    factorServicios: toNum(f.factorServicios),
  }
}

/** Normaliza comparable Decimal → number */
function mapComparable(c: any) {
  return {
    ...c,
    precioOferta: toNum(c.precioOferta),
    precioCierre: toNum(c.precioCierre),
    precioM2: toNum(c.precioM2),
    factorUbicacion: toNum(c.factorUbicacion),
    factorVia: toNum(c.factorVia),
    factorFrente: toNum(c.factorFrente),
    factorEsquina: toNum(c.factorEsquina),
    factorMorfologico: toNum(c.factorMorfologico),
    factorServicios: toNum(c.factorServicios),
  }
}

/** Normaliza ResultadoAvaluo Decimal → number (incluye campos nuevos del cálculo dual) */
function mapResultado(r: any) {
  if (!r) return null
  return {
    ...r,
    valorTerreno: toNum(r.valorTerreno),
    valorReposicion: toNum(r.valorReposicion),
    depreciacion: toNum(r.depreciacion),
    valorConstruccion: toNum(r.valorConstruccion),
    valorComercial: toNum(r.valorComercial),
    valorVentaRapida: toNum(r.valorVentaRapida),
    valorAlquiler: toNum(r.valorAlquiler),
    valorCapitalComercial: toNum(r.valorCapitalComercial),
    valorUnitarioTerrenoSimple: toNum(r.valorUnitarioTerrenoSimple),
    valorUnitarioTerrenoHomologo: toNum(r.valorUnitarioTerrenoHomologo),
    metodoCalculoTerreno: r.metodoCalculoTerreno ?? null,
  }
}

export const avaluoRepository = {
  /** Ejecuta una función dentro de una transacción Prisma */
  async transaction<T>(fn: (tx: Prisma.TransactionClient) => Promise<T>): Promise<T> {
    return prisma.$transaction(fn)
  },

  /** Buscar avalúo por ID con todas las relaciones */
  async findById(id: string) {
    const a = await prisma.avaluo.findUnique({
      where: { id },
      include: {
        ...avaluoInclude,
        terreno: true,
        construcciones: true,
        factoresHomologacion: true,
        comparablesVenta: true,
        comparablesAlquiler: true,
      },
    })
    return a
      ? {
          ...toDTO(a),
          terreno: mapTerreno(a.terreno),
          construcciones: (a.construcciones ?? []).map(mapConstruccion),
          factores: mapFactores(a.factoresHomologacion),
          resultado: mapResultado(a.resultados),
          comparablesVenta: (a.comparablesVenta ?? []).map(mapComparable),
          comparablesAlquiler: (a.comparablesAlquiler ?? []).map(mapComparable),
          product: a.product,
        }
      : null
  },

  /** Listar avalúos con filtros y paginación */
  async list(params: { skip?: number; take?: number; where?: Prisma.AvaluoWhereInput }) {
    const { skip = 0, take = 20, where } = params
    const [avaluos, total] = await Promise.all([
      prisma.avaluo.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        include: avaluoInclude,
      }),
      prisma.avaluo.count({ where }),
    ])
    return { avaluos: avaluos.map(toDTO), total }
  },

  /** Actualizar estado del avalúo */
  async updateEstado(id: string, estado: any, approvedBy?: string | null, observaciones?: string | null) {
    return prisma.avaluo.update({
      where: { id },
      data: {
        estado,
        ...(observaciones !== undefined ? { observaciones } : {}),
        ...(estado === 'APROBADO' ? { fechaAprobacion: new Date(), approvedBy: approvedBy ?? null } : {}),
      },
      include: avaluoInclude,
    })
  },

  /** Eliminar avalúo (las relaciones en cascada las maneja la BD) */
  async delete(id: string) {
    return prisma.avaluo.delete({ where: { id } })
  },
}
