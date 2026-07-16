/**
 * Login Action
 * Server Action para login de usuarios
 */

"use server"

import { signIn } from "@/shared/auth/nextauth"
import { redirect } from "next/navigation"

/**
 * Server Action para login
 * Redirige al dashboard tras login exitoso
 */
export async function loginAction(formData: FormData) {
  const email = formData.get("email") as string
  const password = formData.get("password") as string

  try {
    const result = await signIn("credentials", {
      email,
      password,
      redirect: false
    })

    if ((result as any)?.error) {
      return { success: false, error: (result as any).error }
    }

    redirect("/dashboard")
  } catch (error: any) {
    return { success: false, error: error.message || "Error al iniciar sesión" }
  }
}
