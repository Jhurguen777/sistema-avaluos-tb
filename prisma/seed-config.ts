/**
 * Seed: Tabla de Valores de Reposición + Parámetros de Avalúo.
 *
 * Puebla las tablas valores_reposicion y parametros_avaluo con los valores
 * actuales. Es idempotente (upsert).
 *
 * Uso individual:  npm run db:seed:config
 */

import { PrismaClient } from '@prisma/client'

declare const require: NodeJS.Require

const CATEGORIAS = ['LUJO', 'PRIMERA', 'ESTANDAR', 'ECONOMICA'] as const
const ESTADOS = ['EXCELENTE', 'BUENO', 'REGULAR', 'MALO', 'DEMOLICION'] as const

// Tabla de valores [categoria][estado] = { min, max } | { costo }
const TABLA: Record<string, Record<string, { min: number; max: number } | { costo: number }>> = {
  LUJO: {
    EXCELENTE: { min: 500, max: 550 },
    BUENO: { min: 450, max: 500 },
    REGULAR: { min: 350, max: 400 },
    MALO: { min: 300, max: 350 },
    DEMOLICION: { costo: 100 },
  },
  PRIMERA: {
    EXCELENTE: { min: 450, max: 500 },
    BUENO: { min: 400, max: 450 },
    REGULAR: { min: 300, max: 350 },
    MALO: { min: 250, max: 300 },
    DEMOLICION: { costo: 100 },
  },
  ESTANDAR: {
    EXCELENTE: { min: 400, max: 450 },
    BUENO: { min: 350, max: 400 },
    REGULAR: { min: 250, max: 300 },
    MALO: { min: 200, max: 250 },
    DEMOLICION: { costo: 80 },
  },
  ECONOMICA: {
    EXCELENTE: { min: 350, max: 400 },
    BUENO: { min: 250, max: 350 },
    REGULAR: { min: 200, max: 250 },
    MALO: { min: 150, max: 200 },
    DEMOLICION: { costo: 0 },
  },
}

/**
 * Puebla la tabla de valores de reposición (idempotente).
 * @param prisma Cliente Prisma reutilizable.
 */
async function seedValoresReposicion(prisma: PrismaClient) {
  for (const cat of CATEGORIAS) {
    for (const est of ESTADOS) {
      const celda = TABLA[cat][est]
      const esDemolicion = est === 'DEMOLICION'

      await prisma.valorReposicion.upsert({
        where: { categoria_estado: { categoria: cat, estado: est } },
        update: {
          min: esDemolicion ? null : (celda as { min: number; max: number }).min,
          max: esDemolicion ? null : (celda as { min: number; max: number }).max,
          costo: esDemolicion ? (celda as { costo: number }).costo : null,
        },
        create: {
          categoria: cat,
          estado: est,
          min: esDemolicion ? null : (celda as { min: number; max: number }).min,
          max: esDemolicion ? null : (celda as { min: number; max: number }).max,
          costo: esDemolicion ? (celda as { costo: number }).costo : null,
        },
      })
    }
  }
  console.log(`✅ Valores de reposición: ${CATEGORIAS.length * ESTADOS.length} registros`)
}

/**
 * Puebla los parámetros de avalúo (idempotente).
 * @param prisma Cliente Prisma reutilizable.
 */
async function seedParametros(prisma: PrismaClient) {
  const parametros = [
    {
      clave: 'descuento.venta_rapida',
      valor: '0.15',
      etiqueta: 'Descuento Venta Rápida',
      descripcion: 'Porcentaje de descuento aplicado al valor comercial para avalúos de venta rápida.',
      grupo: 'Descuentos',
    },
    {
      clave: 'descuento.capital_comercial',
      valor: '0.10',
      etiqueta: 'Descuento Capital Comercial',
      descripcion: 'Porcentaje de descuento para avalúos de capital comercial.',
      grupo: 'Descuentos',
    },
    {
      clave: 'alquiler.multiplicador_mensual',
      valor: '0.008',
      etiqueta: 'Multiplicador Alquiler Mensual',
      descripcion: 'Factor mensual del valor comercial para calcular el valor de alquiler (0.008 = 0.8%).',
      grupo: 'Alquiler',
    },
    {
      clave: 'alquiler.multiplicador_anual',
      valor: '0.10',
      etiqueta: 'Multiplicador Alquiler Anual',
      descripcion: 'Factor anual del valor comercial para alquiler (0.10 = 10%).',
      grupo: 'Alquiler',
    },
    {
      clave: 'homologacion.factor_maximo',
      valor: '1.50',
      etiqueta: 'Factor Máximo de Homologación',
      descripcion: 'Valor máximo permitido para cualquier factor de homologación individual.',
      grupo: 'Homologación',
    },
  ]

  for (const p of parametros) {
    await prisma.parametroAvaluo.upsert({
      where: { clave: p.clave },
      update: { valor: p.valor, etiqueta: p.etiqueta, descripcion: p.descripcion, grupo: p.grupo },
      create: p,
    })
  }
  console.log(`✅ Parámetros de avalúo: ${parametros.length} registros`)
}

/**
 * Ejecuta la configuración completa de avalúos (valores + parámetros).
 * Idempotente: seguro de re-ejecutar.
 * @param prisma Cliente Prisma reutilizable.
 */
export async function seedConfiguracion(prisma: PrismaClient) {
  await seedValoresReposicion(prisma)
  await seedParametros(prisma)
}

async function main() {
  const prisma = new PrismaClient()
  try {
    console.log('=== Seed de Configuración de Avalúos ===\n')
    await seedConfiguracion(prisma)
    console.log('\n✅ Seed completado.')
  } catch (e) {
    console.error('❌ Error en seed de configuración:', e)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

if (require.main === module) {
  main()
}
