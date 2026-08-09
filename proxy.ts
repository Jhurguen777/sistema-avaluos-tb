import { NextResponse } from "next/server"
import { auth } from "@/shared/auth/nextauth"

/**
 * Proxy de autenticación (Next.js 16 renombró middleware → proxy;
 * el proxy corre en runtime de Node.js, por lo que es seguro importar la
 * configuración de NextAuth que instancia Prisma).
 *
 * Redirige a /login si un usuario no autenticado intenta acceder al área
 * protegida /dashboard. La autorización fina (por rol) se mantiene en cada
 * Server Action / Server Component mediante auth(), ya que el proxy no debe
 * ser la única capa de seguridad.
 */
export default auth((req) => {
  const { pathname } = req.nextUrl

  if (pathname.startsWith("/dashboard") && !req.auth) {
    const url = new URL("/login", req.url)
    url.searchParams.set("callbackUrl", pathname)
    return NextResponse.redirect(url)
  }

  return NextResponse.next()
})

export const config = {
  matcher: ["/dashboard/:path*"],
}
