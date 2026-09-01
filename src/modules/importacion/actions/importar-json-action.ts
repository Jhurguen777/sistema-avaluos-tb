/**
 * Importar JSON Action
 *
 * Inserta los registros seleccionados (y revisados por el admin) en
 * `products` + `product_locations` de forma idempotente:
 *  - IDs determinísticos = codigoInmueble del listing
 *  - createMany con skipDuplicates dentro de $transaction
 *  - Registra la acción en audit_logs
 */

"use server"

import { auth } from "@/shared/auth/nextauth"
import { prisma } from "@/shared/database/prisma"
import { auditService } from "@/shared/security/audit-service"
import { importarValidator } from "../validators/importacion-validator"
import type { RegistroAImportarInput } from "../validators/importacion-validator"
import type { ImportarJsonResult } from "../types/importacion.types"
import type { OperationType } from "@prisma/client"
import { Prisma } from "@prisma/client"

/** Caché en-memoria de category ID por nombre (dentro del request). */
async function getCategoryIdMap(): Promise<Record<string, string>> {
  const cats = await prisma.productCategory.findMany({ where: { isActive: true } })
  const map: Record<string, string> = {}
  for (const c of cats) {
    map[c.name] = c.id
  }
  return map
}

export async function importarJsonAction(input: unknown): Promise<{
  success: boolean
  data?: ImportarJsonResult
  error?: string
}> {
  try {
    const session = await auth()
    if (!session?.user) {
      return { success: false, error: "No autenticado" }
    }
    if (session.user.role !== "ADMIN") {
      return { success: false, error: "No autorizado. Solo administradores pueden importar JSON." }
    }

    const validated = importarValidator.safeParse(input)
    if (!validated.success) {
      return { success: false, error: validated.error.issues[0].message }
    }

    const registros: RegistroAImportarInput[] = validated.data.registros

    // Deduplicar por código dentro del lote: se conserva la PRIMERA aparición
    // (mismo criterio que ON CONFLICT DO NOTHING) y se reportan las repetidas.
    const unicos = new Map<string, RegistroAImportarInput>()
    const duplicadosEnLote: string[] = []
    for (const r of registros) {
      if (unicos.has(r.codigo)) {
        duplicadosEnLote.push(r.codigo)
        continue
      }
      unicos.set(r.codigo, r)
    }
    const registrosUnicos = Array.from(unicos.values())

    // Precargar categorías
    const categoryIdMap = await getCategoryIdMap()

    // Verificar que todas las categorías existan en la tabla
    const categoriasFaltantes = new Set<string>()
    for (const r of registrosUnicos) {
      if (!categoryIdMap[r.categoria]) {
        categoriasFaltantes.add(r.categoria)
      }
    }
    if (categoriasFaltantes.size > 0) {
      const faltantes = Array.from(categoriasFaltantes).join(", ")
      return {
        success: false,
        error: `Faltan categorías en la BD: ${faltantes}. Ejecuta \`npm run db:seed:categorias\`.`,
      }
    }

    // Filtrar los que no tienen lat/lng (no pueden tener product_location)
    // pero igualmente se importan en products (lat/lng nullable ahí).
    const productosData: Prisma.ProductUncheckedCreateInput[] = registrosUnicos.map(r => ({
      id: r.codigo,
      codigoInmueble: r.codigo,
      nombre: r.titulo,
      categoryId: categoryIdMap[r.categoria],
      operacion: r.operacion as OperationType,
      precioUsd: r.precioUsd ?? null,
      precioBob: r.precioBob ?? null,
      superficieUtil: r.superficieUtil ?? null,
      superficieConstruida: r.superficieConstruida ?? null,
      habitaciones: r.habitaciones ?? null,
      banos: r.banos ?? null,
      cocheras: r.cocheras ?? null,
      direccion: r.direccion ?? null,
      lat: r.lat ?? null,
      lng: r.lng ?? null,
    }))

    const ubicables = registrosUnicos.filter(r => r.lat != null && r.lng != null)
    const locationsData: Prisma.ProductLocationUncheckedCreateInput[] = ubicables.map(r => ({
      id: `${r.codigo}-loc`,
      productId: r.codigo,
      pais: r.pais || "Bolivia",
      departamento: r.departamento ?? null,
      municipio: r.municipio ?? null,
      callePrincipal: r.direccion ?? null,
      lat: r.lat as number,
      lng: r.lng as number,
    }))

    // Conteo previo para saber cuántos eran duplicados
    const codigos = registrosUnicos.map(r => r.codigo)
    const existentes = await prisma.product.findMany({
      where: { codigoInmueble: { in: codigos } },
      select: { codigoInmueble: true },
    })
    const setExistentes = new Set(existentes.map(p => p.codigoInmueble))

    // Transacción: ambos createMany o ninguno
    const [prodResult, locResult] = await prisma.$transaction([
      prisma.product.createMany({
        data: productosData,
        skipDuplicates: true,
      }),
      prisma.productLocation.createMany({
        data: locationsData,
        skipDuplicates: true,
      }),
    ])

    const insertados = prodResult.count
    const omitidos = registros.length - insertados
    const duplicados = registrosUnicos.filter(r => setExistentes.has(r.codigo)).map(r => r.codigo)

    const result: ImportarJsonResult = {
      insertados,
      omitidos,
      duplicados,
      duplicadosEnLote,
      errores: [],
    }

    // Auditoría
    await auditService.log({
      userId: session.user.id,
      action: "IMPORTACION_JSON",
      tableName: "products",
      newValue: {
        totalEnviados: registros.length,
        insertados,
        omitidos,
        ubicaciones: locResult.count,
        duplicadosEnLote: duplicadosEnLote.length,
        ejemploCodigos: codigos.slice(0, 10),
      },
    })

    return { success: true, data: result }
  } catch (error: unknown) {
    console.error("Error importando JSON:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "No se pudo completar la importación.",
    }
  }
}
