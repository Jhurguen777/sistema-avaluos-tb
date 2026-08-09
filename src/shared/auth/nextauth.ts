/**
 * NextAuth Configuration
 * Configuración completa de autenticación NextAuth v5
 */

import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import { prisma } from "@/shared/database/prisma"
import bcrypt from "bcryptjs"
import { z } from "zod"
import { isEmailBlocked, recordEmailAttempt } from "@/shared/security/rate-limiter"
import { loginAttemptRepository } from "@/modules/auth/repositories/login-attempt-repository"
import { getPermisosEfectivos, type PermisosUsuario } from "@/config/modulos-permisos"

export const { handlers, signIn, signOut, auth } = NextAuth({
  session: {
    strategy: "jwt",
    maxAge: 8 * 60 * 60, // 8 horas (mejorado de 30 días)
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  providers: [
    Credentials({
      id: "credentials",
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      authorize: async (credentials) => {
        // Validar formato de credenciales
        const parsedCredentials = z
          .object({ email: z.string().email(), password: z.string().min(6) })
          .safeParse(credentials)

        if (!parsedCredentials.success) {
          return null
        }

        const { email, password } = parsedCredentials.data

        // Verificar rate limiting - Email bloqueado
        if (isEmailBlocked(email)) {
          throw new Error("Demasiados intentos para este email. Por favor espere 30 minutos antes de intentar nuevamente.")
        }

        // Buscar usuario
        const user = await prisma.user.findUnique({
          where: { email }
        })

        if (!user) {
          // Registrar intento fallido
          recordEmailAttempt(email, false)
          await loginAttemptRepository.create({
            email,
            success: false,
          })
          return null
        }

        // Usuario existe pero está inactivo
        if (!user.isActive) {
          // Registrar intento fallido
          recordEmailAttempt(email, false)
          await loginAttemptRepository.create({
            email,
            success: false,
          })
          throw new Error("USER_INACTIVE")
        }

        // Verificar password
        const passwordsMatch = await bcrypt.compare(password, user.password)

        if (!passwordsMatch) {
          // Registrar intento fallido
          recordEmailAttempt(email, false)
          await loginAttemptRepository.create({
            email,
            success: false,
          })
          return null
        }

        // Login exitoso - registrar intento y resetear contador
        recordEmailAttempt(email, true)
        await loginAttemptRepository.create({
          email,
          success: true,
        })

        // Actualizar último login
        try {
          await prisma.user.update({
            where: { id: user.id },
            data: { lastLoginAt: new Date() }
          })
        } catch (error) {
          console.error("Error updating last login:", error)
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          permisos: getPermisosEfectivos(user.permisos as PermisosUsuario | null, user.role),
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = (user as any).role
        token.id = user.id!
        token.permisos = (user as any).permisos
      }
      return token
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string
        session.user.role = token.role as any
        session.user.permisos = token.permisos as PermisosUsuario
      }
      return session
    },
  },
  trustHost: true,
  debug: process.env.NODE_ENV === 'development',
})
