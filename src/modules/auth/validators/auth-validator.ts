/**
 * Auth Validators
 * Schemas de validación para autenticación
 */

import { z } from "zod"
import { ROLES } from "@/constants/index"

/**
 * Schema de login
 */
export const loginValidator = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(6, "Password debe tener al menos 6 caracteres")
})

/**
 * Schema de registro (si se permitiera auto-registro)
 */
export const registerValidator = z.object({
  email: z.string().email("Email inválido"),
  password: z.string()
    .min(8, "Password debe tener al menos 8 caracteres")
    .regex(/[A-Z]/, "Password debe tener al menos una mayúscula")
    .regex(/[a-z]/, "Password debe tener al menos una minúscula")
    .regex(/[0-9]/, "Password debe tener al menos un número"),
  name: z.string().min(3, "Nombre debe tener al menos 3 caracteres"),
  role: z.enum(Object.values(ROLES) as [string, ...string[]])
})

/**
 * Schema de cambio de password
 */
export const changePasswordValidator = z.object({
  currentPassword: z.string().min(6, "Password actual es requerido"),
  newPassword: z.string()
    .min(8, "Nuevo password debe tener al menos 8 caracteres")
    .regex(/[A-Z]/, "Nuevo password debe tener al menos una mayúscula")
    .regex(/[a-z]/, "Nuevo password debe tener al menos una minúscula")
    .regex(/[0-9]/, "Nuevo password debe tener al menos un número"),
  confirmPassword: z.string()
}).refine(data => data.newPassword === data.confirmPassword, {
  message: "Los passwords no coinciden",
  path: ["confirmPassword"]
})

export type LoginInput = z.infer<typeof loginValidator>
export type RegisterInput = z.infer<typeof registerValidator>
export type ChangePasswordInput = z.infer<typeof changePasswordValidator>
