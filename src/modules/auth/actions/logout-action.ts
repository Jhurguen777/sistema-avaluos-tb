/**
 * Logout Action
 * Server Action para logout de usuarios
 */

"use server"

import { signOut } from "@/shared/auth/nextauth"

/**
 * Server Action para logout
 */
export async function logoutAction() {
  try {
    await signOut({ redirectTo: "/login" })
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message || "Error al cerrar sesión" }
  }
}
