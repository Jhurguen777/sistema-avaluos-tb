import { Role } from "@prisma/client"
import type { PermisosUsuario } from "@/config/modulos-permisos"
import "next-auth"
import "next-auth/jwt"

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      email: string
      name: string
      role: Role
      permisos: PermisosUsuario
    }
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string
    role: Role
    permisos: PermisosUsuario
  }
}
