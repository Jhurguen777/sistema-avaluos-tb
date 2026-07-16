/**
 * User Validators
 * Schemas de validación para CRUD de usuarios
 */

import { z } from "zod"
import { ROLES } from "@/src/constants/index"

/**
 * Schema para crear usuario
 */
export const createUserValidator = z.object({
  email: z.string().email("Email inválido"),
  name: z.string().min(3, "Nombre debe tener al menos 3 caracteres"),
  password: z.string()
    .min(8, "Password debe tener al menos 8 caracteres")
    .regex(/[A-Z]/, "Password debe tener al menos una mayúscula")
    .regex(/[a-z]/, "Password debe tener al menos una minúscula")
    .regex(/[0-9]/, "Password debe tener al menos un número")
    .optional()
    .or(z.literal("")),
  role: z.string().refine((val) => val !== "" && Object.values(ROLES).includes(val as any), {
    message: "Debe seleccionar un rol válido"
  })
})

/**
 * Schema para actualizar usuario
 */
export const updateUserValidator = z.object({
  email: z.string().email("Email inválido").optional(),
  name: z.string().min(3, "Nombre debe tener al menos 3 caracteres").optional(),
  password: z.string()
    .min(8, "Password debe tener al menos 8 caracteres")
    .regex(/[A-Z]/, "Password debe tener al menos una mayúscula")
    .regex(/[a-z]/, "Password debe tener al menos una minúscula")
    .regex(/[0-9]/, "Password debe tener al menos un número")
    .optional(),
  role: z.enum(Object.values(ROLES) as [string, ...string[]]).optional(),
  isActive: z.boolean().optional()
}).refine(data => Object.keys(data).length > 0, {
  message: "Debe proporcionar al menos un campo para actualizar"
})

/**
 * Schema para listar usuarios
 */
export const listUsersValidator = z.object({
  page: z.number().int().positive().optional().default(1),
  limit: z.number().int().positive().max(100).optional().default(20),
  role: z.enum(Object.values(ROLES) as [string, ...string[]]).optional(),
  isActive: z.boolean().optional(),
  search: z.string().optional()
})

/**
 * Schema para reset de password
 */
export const resetPasswordValidator = z.object({
  newPassword: z.string()
    .min(8, "Password debe tener al menos 8 caracteres")
    .regex(/[A-Z]/, "Password debe tener al menos una mayúscula")
    .regex(/[a-z]/, "Password debe tener al menos una minúscula")
    .regex(/[0-9]/, "Password debe tener al menos un número"),
  confirmPassword: z.string()
}).refine(data => data.newPassword === data.confirmPassword, {
  message: "Los passwords no coinciden",
  path: ["confirmPassword"]
})

export type CreateUserInput = z.infer<typeof createUserValidator>
export type UpdateUserInput = z.infer<typeof updateUserValidator>
export type ListUsersInput = z.infer<typeof listUsersValidator>
export type ResetPasswordInput = z.infer<typeof resetPasswordValidator>
