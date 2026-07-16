import { auth } from "@/shared/auth/nextauth"
import { redirect } from "next/navigation"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { ArrowLeft, UserPlus } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"

export default async function NuevoUsuarioPage() {
  const session = await auth()

  if (!session?.user) {
    redirect("/login")
  }

  if (session.user.role !== "ADMIN") {
    redirect("/dashboard")
  }

  // Ya no usamos esta página, el formulario es un modal
  // Redirigir a la lista de usuarios
  redirect("/dashboard/usuarios")

  return (
    <div className="p-8 space-y-8">
      <div className="text-center">
        <p className="text-muted-foreground">Redirigiendo...</p>
      </div>
    </div>
  )
}
