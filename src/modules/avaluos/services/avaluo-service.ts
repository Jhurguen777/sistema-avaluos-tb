/**
 * Avalúo Service
 * Lógica de negocio: creación completa, listado, cambio de estado (workflow)
 */

import { avaluoRepository } from '../repositories/avaluo-repository'
import {
  calcularResultadoAvaluo,
  calcularConstruccion,
  calcularTerrenoDual,
  type EntradaComparable,
} from './calculo-service'
import { toNum } from '@/shared/database/decimal'
import { loadConfigAvaluo, type ConfigAvaluo } from '@/shared/config/config-loader'
import { VIDA_UTIL_ANIOS, validarRango } from '@/config/valores-reposicion'
import { AVALUO_CONFIG } from '@/config/avaluo'
import type { Prisma } from '@prisma/client'
import type { MetodoCalculoTerreno } from '../types/avaluo.types'
import type {
  CrearAvaluoInput,
  ListAvaluosInput,
  CambiarEstadoInput,
  ActualizarAvaluoInput,
  ComparableInput,
} from '../validators/avaluo-validator'

/**
 * Construye el objeto de factores del sujeto normalizado (default 1.0 si falta).
 */
function buildFactoresSujeto(factoresRow: any): Record<string, number> {
  return {
    factorUbicacion: toNum(factoresRow?.factorUbicacion) ?? 1,
    factorVia: toNum(factoresRow?.factorVia) ?? 1,
    factorFrente: toNum(factoresRow?.factorFrente) ?? 1,
    factorEsquina: toNum(factoresRow?.factorEsquina) ?? 1,
    factorMorfologico: toNum(factoresRow?.factorMorfologico) ?? 1,
    factorServicios: toNum(factoresRow?.factorServicios) ?? 1,
  }
}

/**
 * Construye la entrada de comparable para el cálculo dual desde una fila de la BD.
 */
function toEntradaComparable(c: any): EntradaComparable {
  return {
    precioUnitario: toNum(c.precioM2) ?? 0,
    factores: {
      factorUbicacion: toNum(c.factorUbicacion),
      factorVia: toNum(c.factorVia),
      factorFrente: toNum(c.factorFrente),
      factorEsquina: toNum(c.factorEsquina),
      factorMorfologico: toNum(c.factorMorfologico),
      factorServicios: toNum(c.factorServicios),
    },
  }
}

/**
 * Recalcula el valor del terreno (dual) + resultado del avalúo
 * y persiste dentro de la transacción indicada.
 */
async function recalcularAvaluo(
  tx: Prisma.TransactionClient,
  avaluoId: string,
  config: ConfigAvaluo,
  valorUnitarioManual?: number,
  metodoOverride?: MetodoCalculoTerreno,
): Promise<void> {
  const avaluo = await tx.avaluo.findUnique({
    where: { id: avaluoId },
    select: { tipo: true },
  })
  if (!avaluo) throw new Error('Avalúo no encontrado para recalcular')

  const terreno = await tx.terreno.findUnique({ where: { avaluoId } })
  if (!terreno) throw new Error('Terreno no encontrado para recalcular')

  const factoresRow = await tx.factorHomologacion.findUnique({ where: { avaluoId } })
  const construcciones = await tx.construccion.findMany({ where: { avaluoId } })
  const compsVenta = await tx.comparableVenta.findMany({ where: { avaluoId } })

  const superficie = terreno.superficieM2
  const baseManual = valorUnitarioManual ?? toNum(terreno.valorUnitario) ?? 0
  const factoresSujeto = buildFactoresSujeto(factoresRow)

  // Cálculo dual del terreno
  const comparablesEntrada = compsVenta.map(toEntradaComparable)
  const dual = calcularTerrenoDual(comparablesEntrada, factoresSujeto)

  // Decidir método:
  //  - Si override viene del input, usarlo
  //  - Si hay homogéneo disponible y comparables con factores → HOMOLOGEO
  //  - Si hay comparables sin factores → SIMPLE
  //  - Si no hay comparables → MANUAL
  let metodo: MetodoCalculoTerreno
  if (metodoOverride) {
    metodo = metodoOverride
  } else if (comparablesEntrada.length === 0) {
    metodo = 'MANUAL'
  } else if (dual.valorUnitarioHomogeneo != null) {
    metodo = 'HOMOLOGEO'
  } else {
    metodo = 'SIMPLE'
  }

  let valorUnitarioTerreno: number
  let valorTotalTerreno: number
  if (metodo === 'MANUAL' || comparablesEntrada.length === 0) {
    valorUnitarioTerreno = baseManual
    valorTotalTerreno = baseManual * superficie
    metodo = 'MANUAL'
  } else if (metodo === 'HOMOLOGEO' && dual.valorUnitarioHomogeneo != null) {
    valorUnitarioTerreno = dual.valorUnitarioHomogeneo
    valorTotalTerreno = valorUnitarioTerreno * superficie
  } else {
    valorUnitarioTerreno = dual.valorUnitarioSimple
    valorTotalTerreno = valorUnitarioTerreno * superficie
    metodo = 'SIMPLE'
  }

  await tx.terreno.update({
    where: { avaluoId },
    data: { valorUnitario: valorUnitarioTerreno, valorTotal: valorTotalTerreno },
  })

  const resultado = calcularResultadoAvaluo(
    valorTotalTerreno,
    construcciones.map((c) => ({
      categoria: c.categoria,
      estado: c.estado,
      superficieM2: c.superficieM2,
      anoConstruccion: c.anoConstruccion,
      valorUnitarioOverride: toNum(c.valorUnitarioOverride) ?? undefined,
    })),
    avaluo.tipo,
    config,
  )

  await tx.resultadoAvaluo.upsert({
    where: { avaluoId },
    update: {
      valorTerreno: resultado.valorTerreno,
      valorReposicion: resultado.valorReposicion,
      depreciacion: resultado.depreciacion,
      valorConstruccion: resultado.valorConstruccion,
      valorComercial: resultado.valorComercial,
      valorVentaRapida: resultado.valorVentaRapida,
      valorAlquiler: resultado.valorAlquiler,
      valorCapitalComercial: resultado.valorCapitalComercial,
      metodoCalculoTerreno: metodo,
      valorUnitarioTerrenoSimple: dual.valorUnitarioSimple,
      valorUnitarioTerrenoHomologo: dual.valorUnitarioHomogeneo,
    },
    create: {
      avaluoId,
      valorTerreno: resultado.valorTerreno,
      valorReposicion: resultado.valorReposicion,
      depreciacion: resultado.depreciacion,
      valorConstruccion: resultado.valorConstruccion,
      valorComercial: resultado.valorComercial,
      valorVentaRapida: resultado.valorVentaRapida,
      valorAlquiler: resultado.valorAlquiler,
      valorCapitalComercial: resultado.valorCapitalComercial,
      metodoCalculoTerreno: metodo,
      valorUnitarioTerrenoSimple: dual.valorUnitarioSimple,
      valorUnitarioTerrenoHomologo: dual.valorUnitarioHomogeneo,
    },
  })
}

export const avaluoService = {
  /**
   * Crear un avalúo completo en una sola transacción.
   * Genera inmueble + avalúo + terreno + construcciones (opcional) + factores + resultado.
   * Soporta avalúo sin construcción (terreno puro) y cálculo dual del terreno.
   */
  async createCompleto(input: CrearAvaluoInput, createdBy: string): Promise<string> {
    const config = await loadConfigAvaluo()

    const ejecutar = (): Promise<string> => avaluoRepository.transaction(async (tx) => {
      const year = new Date().getFullYear()
      const nAvaluos = await tx.avaluo.count()
      const nProducts = await tx.product.count()
      const codigoAvaluo = `AVAL-${year}-${String(nAvaluos + 1).padStart(3, '0')}`
      const codigoInmueble = `INM-${year}-${String(nProducts + 1).padStart(3, '0')}`

      // Resolver categoría del inmueble
      let cat = await tx.productCategory.findFirst({ where: { name: input.categoria } })
      if (!cat) {
        cat = await tx.productCategory.create({
          data: { name: input.categoria, description: String(input.categoria), isActive: true },
        })
      }

      // 1. Inmueble (Product)
      const product = await tx.product.create({
        data: {
          codigoInmueble,
          nombre: input.direccion || `Inmueble ${codigoInmueble}`,
          categoryId: cat.id,
          operacion: input.operacion,
          direccion: input.direccion ?? null,
          lat: input.lat ?? null,
          lng: input.lng ?? null,
          superficieUtil: input.terreno.superficieUtil ?? input.terreno.superficieM2,
          superficieConstruida: input.terreno.superficieConstruida ?? null,
          habitaciones: input.amenities?.habitaciones ?? null,
          banos: input.amenities?.banos ?? null,
          cocheras: input.amenities?.cocheras ?? null,
          ambientes: input.amenities?.ambientes ?? null,
          servicios: (input.servicios as any) ?? undefined,
        },
      })

      // Persistir zona en ProductLocation cuando hay coordenadas
      if (input.lat != null && input.lng != null) {
        await tx.productLocation.create({
          data: {
            productId: product.id,
            zona: input.zona ?? null,
            lat: input.lat,
            lng: input.lng,
          },
        })
      }

      // 2. Avalúo
      const avaluo = await tx.avaluo.create({
        data: {
          productId: product.id,
          codigo: codigoAvaluo,
          tipo: input.tipo ?? 'COMERCIAL',
          estado: 'BORRADOR',
          solicitante: input.solicitante ?? null,
          propietario: input.propietario ?? null,
          observaciones: input.observaciones ?? null,
          createdBy,
        },
      })

      // 3. Factores del sujeto
      const factoresSujeto = buildFactoresSujeto(input.factores)

      // 4. Cálculo dual del terreno
      const comparablesVenta = (input.comparables ?? []).filter((c) => c.tipo !== 'ALQUILER')
      const comparablesEntrada: EntradaComparable[] = comparablesVenta.map((c) => ({
        precioUnitario: c.precioM2,
        factores: {
          factorUbicacion: c.factorUbicacion ?? null,
          factorVia: c.factorVia ?? null,
          factorFrente: c.factorFrente ?? null,
          factorEsquina: c.factorEsquina ?? null,
          factorMorfologico: c.factorMorfologico ?? null,
          factorServicios: c.factorServicios ?? null,
        },
      }))

      const dual = calcularTerrenoDual(comparablesEntrada, factoresSujeto)
      const metodo: MetodoCalculoTerreno =
        input.metodoCalculoTerreno ??
        (comparablesEntrada.length === 0
          ? 'MANUAL'
          : dual.valorUnitarioHomogeneo != null
            ? 'HOMOLOGEO'
            : 'SIMPLE')

      let valorUnitarioTerreno: number
      let valorTotalTerreno: number
      if (metodo === 'MANUAL' || comparablesEntrada.length === 0) {
        valorUnitarioTerreno = input.terreno.valorUnitario
        valorTotalTerreno = input.terreno.superficieM2 * input.terreno.valorUnitario
      } else if (metodo === 'HOMOLOGEO' && dual.valorUnitarioHomogeneo != null) {
        valorUnitarioTerreno = dual.valorUnitarioHomogeneo
        valorTotalTerreno = valorUnitarioTerreno * input.terreno.superficieM2
      } else {
        valorUnitarioTerreno = dual.valorUnitarioSimple
        valorTotalTerreno = valorUnitarioTerreno * input.terreno.superficieM2
      }

      // 5. Terreno
      await tx.terreno.create({
        data: {
          avaluoId: avaluo.id,
          superficieM2: input.terreno.superficieM2,
          superficieUtil: input.terreno.superficieUtil ?? input.terreno.superficieM2,
          superficieConstruida: input.terreno.superficieConstruida ?? null,
          valorUnitario: valorUnitarioTerreno,
          valorTotal: valorTotalTerreno,
          frente: input.terreno.frente ?? null,
          fondo: input.terreno.fondo ?? null,
          formaLote: input.terreno.formaLote ?? null,
          esEsquina: input.terreno.esEsquina ?? false,
          tipoVia: input.terreno.tipoVia ?? 'CALLE',
          morfologia: input.terreno.morfologia ?? null,
        },
      })

      // 6. Construcciones (con cálculo automático de reposición/depreciación)
      // Ahora son opcionales: si no hay, el avalúo es de terreno puro
      const construccionesInput = input.construcciones ?? []
      for (const c of construccionesInput) {
        if (
          c.valorUnitarioOverride !== undefined &&
          c.valorUnitarioOverride !== null &&
          c.estado !== 'DEMOLICION'
        ) {
          if (!validarRango(c.categoria, c.estado, c.valorUnitarioOverride, config.valoresReposicion)) {
            throw new Error(
              `Valor unitario ${c.valorUnitarioOverride} fuera de rango para ${c.categoria}/${c.estado}. Revisar la tabla de reposición.`,
            )
          }
        }
        const calc = calcularConstruccion(
          c.categoria,
          c.estado,
          c.superficieM2,
          c.anoConstruccion,
          c.valorUnitarioOverride ?? undefined,
          config.valoresReposicion,
        )
        await tx.construccion.create({
          data: {
            avaluoId: avaluo.id,
            tipo: c.tipo ?? 'Principal',
            categoria: c.categoria,
            estado: c.estado,
            anoConstruccion: c.anoConstruccion,
            vidaUtil: VIDA_UTIL_ANIOS,
            superficieM2: c.superficieM2,
            valorUnitario: calc.valorUnitario,
            valorUnitarioOverride: c.valorUnitarioOverride ?? null,
            valorReposicion: calc.valorReposicion,
            depreciacionAnual: calc.depreciacionAnual,
            depreciacionTotal: calc.depreciacionTotal,
            valorNeto: calc.valorNeto,
            descripcion: c.descripcion ?? null,
          },
        })
      }

      // 7. Factores de homologación (6 factores)
      await tx.factorHomologacion.create({
        data: {
          avaluoId: avaluo.id,
          factorUbicacion: input.factores?.factorUbicacion ?? 1,
          factorVia: input.factores?.factorVia ?? 1,
          factorFrente: input.factores?.factorFrente ?? 1,
          factorEsquina: input.factores?.factorEsquina ?? 1,
          factorMorfologico: input.factores?.factorMorfologico ?? 1,
          factorServicios: input.factores?.factorServicios ?? 1,
        },
      })

      // 8. Resultado del avalúo (cálculo final)
      const resultado = calcularResultadoAvaluo(
        valorTotalTerreno,
        construccionesInput.map((c) => ({
          categoria: c.categoria,
          estado: c.estado,
          superficieM2: c.superficieM2,
          anoConstruccion: c.anoConstruccion,
          valorUnitarioOverride: c.valorUnitarioOverride ?? undefined,
        })),
        input.tipo ?? 'COMERCIAL',
        config,
      )

      await tx.resultadoAvaluo.create({
        data: {
          avaluoId: avaluo.id,
          valorTerreno: resultado.valorTerreno,
          valorReposicion: resultado.valorReposicion,
          depreciacion: resultado.depreciacion,
          valorConstruccion: resultado.valorConstruccion,
          valorComercial: resultado.valorComercial,
          valorVentaRapida: resultado.valorVentaRapida,
          valorAlquiler: resultado.valorAlquiler,
          valorCapitalComercial: resultado.valorCapitalComercial,
          metodoCalculoTerreno: metodo,
          valorUnitarioTerrenoSimple: dual.valorUnitarioSimple,
          valorUnitarioTerrenoHomologo: dual.valorUnitarioHomogeneo,
        },
      })

      // 9. Comparables de mercado
      if (input.comparables && input.comparables.length > 0) {
        for (const comp of input.comparables) {
          const data: any = {
            avaluoId: avaluo.id,
            direccion: comp.direccion,
            precioOferta: comp.precioOferta,
            precioM2: comp.precioM2,
            superficie: comp.superficie,
            anoConstruccion: comp.anoConstruccion ?? null,
            lat: comp.lat ?? null,
            lng: comp.lng ?? null,
            distancia: comp.distancia ?? null,
            factorUbicacion: comp.factorUbicacion ?? null,
            factorVia: comp.factorVia ?? null,
            factorFrente: comp.factorFrente ?? null,
            factorEsquina: comp.factorEsquina ?? null,
            factorMorfologico: comp.factorMorfologico ?? null,
            factorServicios: comp.factorServicios ?? null,
          }
          if (comp.tipo === 'ALQUILER') {
            await tx.comparableAlquiler.create({ data })
          } else {
            await tx.comparableVenta.create({ data })
          }
        }
      }

      return avaluo.id
    })

    // Reintentar ante colisión de código (count()+1 puede chocar en creación concurrente)
    const MAX_INTENTOS = 3
    for (let intento = 1; intento <= MAX_INTENTOS; intento++) {
      try {
        return await ejecutar()
      } catch (error: any) {
        if (error?.code === 'P2002' && intento < MAX_INTENTOS) {
          continue
        }
        throw error
      }
    }
    throw new Error(
      'No se pudo crear el avalúo: código duplicado tras varios intentos. Intente nuevamente.',
    )
  },

  /** Obtener avalúo por ID (con detalle completo) */
  async getById(id: string) {
    const avaluo = await avaluoRepository.findById(id)
    if (!avaluo) throw new Error('Avalúo no encontrado')
    return avaluo
  },

  /** Listar avalúos con filtros */
  async list(params: ListAvaluosInput) {
    const { page = 1, limit = 20, estado, tipo, search, createdBy } = params
    const skip = (page - 1) * limit

    const where: any = {}
    if (estado) where.estado = estado
    if (tipo) where.tipo = tipo
    if (createdBy) where.createdBy = createdBy
    if (search) {
      where.OR = [
        { codigo: { contains: search, mode: 'insensitive' } },
        { solicitante: { contains: search, mode: 'insensitive' } },
        { propietario: { contains: search, mode: 'insensitive' } },
        { product: { codigoInmueble: { contains: search, mode: 'insensitive' } } },
        { product: { nombre: { contains: search, mode: 'insensitive' } } },
      ]
    }

    const { avaluos, total } = await avaluoRepository.list({ skip, take: limit, where })
    return {
      avaluos,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    }
  },

  /** Cambiar estado del avalúo validando el workflow */
  async cambiarEstado(id: string, input: CambiarEstadoInput, userId: string) {
    const actual = await avaluoRepository.findById(id)
    if (!actual) throw new Error('Avalúo no encontrado')

    const transiciones = AVALUO_CONFIG.workflow.transiciones
    const estadoKey = actual.estado as keyof typeof transiciones
    const permitidas: readonly string[] = transiciones[estadoKey] ?? []
    if (!permitidas.includes(input.estado)) {
      throw new Error(
        `Transición no permitida: ${actual.estado} → ${input.estado}. Permitidas: ${permitidas.join(', ') || 'ninguna'}`,
      )
    }

    const actualizado = await avaluoRepository.updateEstado(
      id,
      input.estado,
      input.estado === 'APROBADO' ? userId : undefined,
      input.observaciones,
    )
    return actualizado
  },

  /**
   * Actualizar un avalúo existente: edita terreno, construcciones, factores y
   * datos generales, luego recalcula terreno + resultado.
   * No permite editar avalúos APROBADOS.
   */
  async actualizar(id: string, input: ActualizarAvaluoInput) {
    const config = await loadConfigAvaluo()
    return avaluoRepository.transaction(async (tx) => {
      const actual = await tx.avaluo.findUnique({ where: { id } })
      if (!actual) throw new Error('Avalúo no encontrado')
      if (actual.estado === 'APROBADO') {
        throw new Error('No se puede editar un avalúo aprobado. Páselo a borrador primero.')
      }

      // Datos generales del avalúo
      await tx.avaluo.update({
        where: { id },
        data: {
          ...(input.tipo !== undefined ? { tipo: input.tipo } : {}),
          ...(input.solicitante !== undefined ? { solicitante: input.solicitante } : {}),
          ...(input.propietario !== undefined ? { propietario: input.propietario } : {}),
          ...(input.observaciones !== undefined ? { observaciones: input.observaciones } : {}),
        },
      })

      // Terreno
      if (input.terreno) {
        await tx.terreno.update({
          where: { avaluoId: id },
          data: {
            superficieM2: input.terreno.superficieM2,
            ...(input.terreno.superficieUtil !== undefined ? { superficieUtil: input.terreno.superficieUtil } : {}),
            ...(input.terreno.superficieConstruida !== undefined ? { superficieConstruida: input.terreno.superficieConstruida } : {}),
            valorUnitario: input.terreno.valorUnitario,
            ...(input.terreno.frente !== undefined ? { frente: input.terreno.frente } : {}),
            ...(input.terreno.fondo !== undefined ? { fondo: input.terreno.fondo } : {}),
            ...(input.terreno.formaLote !== undefined ? { formaLote: input.terreno.formaLote } : {}),
            ...(input.terreno.esEsquina !== undefined ? { esEsquina: input.terreno.esEsquina } : {}),
            ...(input.terreno.tipoVia !== undefined ? { tipoVia: input.terreno.tipoVia } : {}),
            ...(input.terreno.morfologia !== undefined ? { morfologia: input.terreno.morfologia } : {}),
          },
        })
      }

      // Reemplazar construcciones (si viene el array, aunque sea vacío para terreno puro)
      if (input.construcciones !== undefined) {
        await tx.construccion.deleteMany({ where: { avaluoId: id } })
        for (const c of input.construcciones) {
          if (c.valorUnitarioOverride != null && c.estado !== 'DEMOLICION') {
            if (!validarRango(c.categoria, c.estado, c.valorUnitarioOverride, config.valoresReposicion)) {
              throw new Error(
                `Valor unitario ${c.valorUnitarioOverride} fuera de rango para ${c.categoria}/${c.estado}. Revisar la tabla de reposición.`,
              )
            }
          }
          const calc = calcularConstruccion(
            c.categoria,
            c.estado,
            c.superficieM2,
            c.anoConstruccion,
            c.valorUnitarioOverride ?? undefined,
            config.valoresReposicion,
          )
          await tx.construccion.create({
            data: {
              avaluoId: id,
              tipo: c.tipo ?? 'Principal',
              categoria: c.categoria,
              estado: c.estado,
              anoConstruccion: c.anoConstruccion,
              vidaUtil: VIDA_UTIL_ANIOS,
              superficieM2: c.superficieM2,
              valorUnitario: calc.valorUnitario,
              valorUnitarioOverride: c.valorUnitarioOverride ?? null,
              valorReposicion: calc.valorReposicion,
              depreciacionAnual: calc.depreciacionAnual,
              depreciacionTotal: calc.depreciacionTotal,
              valorNeto: calc.valorNeto,
              descripcion: c.descripcion ?? null,
            },
          })
        }
      }

      // Factores de homologación
      if (input.factores) {
        const f = input.factores
        await tx.factorHomologacion.upsert({
          where: { avaluoId: id },
          update: {
            ...(f.factorUbicacion !== undefined ? { factorUbicacion: f.factorUbicacion } : {}),
            ...(f.factorVia !== undefined ? { factorVia: f.factorVia } : {}),
            ...(f.factorFrente !== undefined ? { factorFrente: f.factorFrente } : {}),
            ...(f.factorEsquina !== undefined ? { factorEsquina: f.factorEsquina } : {}),
            ...(f.factorMorfologico !== undefined ? { factorMorfologico: f.factorMorfologico } : {}),
            ...(f.factorServicios !== undefined ? { factorServicios: f.factorServicios } : {}),
          },
          create: {
            avaluoId: id,
            factorUbicacion: f.factorUbicacion ?? 1,
            factorVia: f.factorVia ?? 1,
            factorFrente: f.factorFrente ?? 1,
            factorEsquina: f.factorEsquina ?? 1,
            factorMorfologico: f.factorMorfologico ?? 1,
            factorServicios: f.factorServicios ?? 1,
          },
        })
      }

      // Recalcular terreno + resultado (manual base = valorUnitario recién guardado)
      const manualBase =
        input.terreno?.valorUnitario !== undefined ? input.terreno.valorUnitario : undefined
      await recalcularAvaluo(tx, id, config, manualBase)

      return id
    })
  },

  /** Agregar un comparable de mercado y recalcular el avalúo */
  async agregarComparable(avaluoId: string, input: ComparableInput) {
    const config = await loadConfigAvaluo()
    return avaluoRepository.transaction(async (tx) => {
      const data = {
        avaluoId,
        direccion: input.direccion,
        precioOferta: input.precioOferta,
        precioM2: input.precioM2,
        superficie: input.superficie,
        anoConstruccion: input.anoConstruccion ?? null,
        lat: input.lat ?? null,
        lng: input.lng ?? null,
        distancia: input.distancia ?? null,
        factorUbicacion: input.factorUbicacion ?? null,
        factorVia: input.factorVia ?? null,
        factorFrente: input.factorFrente ?? null,
        factorEsquina: input.factorEsquina ?? null,
        factorMorfologico: input.factorMorfologico ?? null,
        factorServicios: input.factorServicios ?? null,
      }
      if (input.tipo === 'ALQUILER') {
        await tx.comparableAlquiler.create({ data })
      } else {
        await tx.comparableVenta.create({ data })
      }
      await recalcularAvaluo(tx, avaluoId, config)
    })
  },

  /** Actualizar un comparable existente y recalcular el avalúo */
  async actualizarComparable(
    avaluoId: string,
    comparableId: string,
    input: ComparableInput,
  ) {
    const config = await loadConfigAvaluo()
    return avaluoRepository.transaction(async (tx) => {
      const data = {
        direccion: input.direccion,
        precioOferta: input.precioOferta,
        precioM2: input.precioM2,
        superficie: input.superficie,
        anoConstruccion: input.anoConstruccion ?? null,
        lat: input.lat ?? null,
        lng: input.lng ?? null,
        distancia: input.distancia ?? null,
        factorUbicacion: input.factorUbicacion ?? null,
        factorVia: input.factorVia ?? null,
        factorFrente: input.factorFrente ?? null,
        factorEsquina: input.factorEsquina ?? null,
        factorMorfologico: input.factorMorfologico ?? null,
        factorServicios: input.factorServicios ?? null,
      }

      // Verificar en qué tabla existe actualmente el comparable
      const enVenta = await tx.comparableVenta.findUnique({ where: { id: comparableId } }).catch(() => null)
      const enAlquiler = await tx.comparableAlquiler.findUnique({ where: { id: comparableId } }).catch(() => null)

      const tipoActual = enVenta ? 'VENTA' : enAlquiler ? 'ALQUILER' : null
      if (!tipoActual) throw new Error('Comparable no encontrado')

      // Si el tipo cambia, borrar de la tabla vieja y crear en la nueva
      if (input.tipo !== tipoActual) {
        if (tipoActual === 'VENTA') {
          await tx.comparableVenta.delete({ where: { id: comparableId } })
        } else {
          await tx.comparableAlquiler.delete({ where: { id: comparableId } })
        }
        const nuevoData = { ...data, avaluoId }
        if (input.tipo === 'ALQUILER') {
          await tx.comparableAlquiler.create({ data: nuevoData })
        } else {
          await tx.comparableVenta.create({ data: nuevoData })
        }
      } else {
        // Mismo tipo: actualizar in-place
        if (input.tipo === 'ALQUILER') {
          await tx.comparableAlquiler.update({ where: { id: comparableId }, data })
        } else {
          await tx.comparableVenta.update({ where: { id: comparableId }, data })
        }
      }

      await recalcularAvaluo(tx, avaluoId, config)
    })
  },

  /** Eliminar un comparable y recalcular el avalúo */
  async eliminarComparable(avaluoId: string, comparableId: string, tipo: 'VENTA' | 'ALQUILER') {
    const config = await loadConfigAvaluo()
    return avaluoRepository.transaction(async (tx) => {
      if (tipo === 'ALQUILER') {
        await tx.comparableAlquiler.delete({ where: { id: comparableId } })
      } else {
        await tx.comparableVenta.delete({ where: { id: comparableId } })
      }
      await recalcularAvaluo(tx, avaluoId, config)
    })
  },

  /** Eliminar un avalúo (no se permiten eliminar avalúos aprobados) */
  async eliminar(id: string) {
    const actual = await avaluoRepository.findById(id)
    if (!actual) throw new Error('Avalúo no encontrado')
    if (actual.estado === 'APROBADO') {
      throw new Error('No se puede eliminar un avalúo aprobado.')
    }
    return avaluoRepository.delete(id)
  },
}
