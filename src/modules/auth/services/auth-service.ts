/**
 * Auth Service
 * Utilidades de hashing de passwords.
 *
 * La validación de credenciales en runtime la hace NextAuth inline en
 * `src/shared/auth/nextauth.ts` (callback `authorize`), por lo que este
 * servicio solo expone el helper de hash usado al crear/actualizar usuarios.
 */

import bcrypt from "bcryptjs"

export const authService = {
  /** Hashea un password con bcrypt (cost 10). */
  async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, 10)
  },
}
