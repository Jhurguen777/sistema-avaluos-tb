export { auth as proxy } from "@/shared/auth/nextauth"

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|login).*)"],
}
