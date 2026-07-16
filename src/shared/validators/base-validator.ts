/**
 * Base Validator Helpers
 * Utilidades para validación con Zod
 */

import { z } from "zod"

/**
 * Schema base para email
 */
export const emailSchema = z.string().email("Email inválido")

/**
 * Schema base para password
 */
export const passwordSchema = z
  .string()
  .min(8, "Password debe tener al menos 8 caracteres")
  .regex(/[A-Z]/, "Password debe tener al menos una mayúscula")
  .regex(/[a-z]/, "Password debe tener al menos una minúscula")
  .regex(/[0-9]/, "Password debe tener al menos un número")

/**
 * Schema base para nombre
 */
export const nameSchema = z
  .string()
  .min(3, "Nombre debe tener al menos 3 caracteres")
  .max(100, "Nombre no puede exceder 100 caracteres")

/**
 * Schema base para código
 */
export const codeSchema = z
  .string()
  .min(3, "Código debe tener al menos 3 caracteres")
  .max(50, "Código no puede exceder 50 caracteres")
  .regex(/^[A-Z0-9-]+$/, "Código solo puede tener letras mayúsculas, números y guiones")

/**
 * Schema base para coordenadas
 */
export const coordinatesSchema = z.object({
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180)
})

/**
 * Schema base para fecha
 */
export const dateSchema = z.string().or(z.date()).transform((val) => {
  if (typeof val === 'string') return new Date(val)
  return val
})

/**
 * Schema base para URL
 */
export const urlSchema = z.string().url("URL inválida")

/**
 * Schema base para teléfono
 */
export const phoneSchema = z.string().regex(/^\+?\d{7,15}$/, "Teléfono inválido")

/**
 * Error de validación personalizado
 */
export class ValidationError extends Error {
  constructor(public errors: Record<string, string[]>) {
    super("Validación fallida")
    this.name = "ValidationError"
  }
}
