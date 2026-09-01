/**
 * Validadores de Importación (Zod)
 *
 * Valida los inputs de los Server Actions.
 */

import { z } from "zod"

/** Categorías y operaciones válidas (espejo de los enums de Prisma). */
const categoriaEnum = z.enum([
  "CASA", "DEPARTAMENTO", "PENTHOUSE", "TERRENO", "LOCAL_COMERCIAL", "OFICINA",
  "QUINTA", "OTROS",
])

const operacionEnum = z.enum(["VENTA", "ALQUILER", "ANTICRETICO"])

/** Schema de un registro seleccionado para importar (viene de la UI). */
export const registroAImportarValidator = z.object({
  codigo: z.string().min(1, "Código requerido").max(100),
  titulo: z.string().min(1, "Título requerido").max(500),
  categoria: categoriaEnum,
  operacion: operacionEnum,
  precioUsd: z.number().nonnegative().nullable().optional(),
  precioBob: z.number().nonnegative().nullable().optional(),
  superficieUtil: z.number().nonnegative().nullable().optional(),
  superficieConstruida: z.number().nonnegative().nullable().optional(),
  habitaciones: z.number().int().nonnegative().nullable().optional(),
  banos: z.number().int().nonnegative().nullable().optional(),
  cocheras: z.number().int().nonnegative().nullable().optional(),
  direccion: z.string().max(500).nullable().optional(),
  departamento: z.string().max(200).nullable().optional(),
  municipio: z.string().max(200).nullable().optional(),
  pais: z.string().min(1).max(100).default("Bolivia"),
  lat: z.number().nullable().optional(),
  lng: z.number().nullable().optional(),
})

export type RegistroAImportarInput = z.infer<typeof registroAImportarValidator>

/** Schema del array completo enviado al action de importación. */
export const importarValidator = z.object({
  registros: z.array(registroAImportarValidator).min(1, "Debe seleccionar al menos un registro."),
})

export type ImportarInput = z.infer<typeof importarValidator>
