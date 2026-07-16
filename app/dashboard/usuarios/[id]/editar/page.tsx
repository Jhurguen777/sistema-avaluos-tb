import { auth } from "@/shared/auth/nextauth"
import { redirect } from "next/navigation"
import { userRepository } from "@/modules/users/repositories/user-repository"
import { UsuarioForm } from "@/components/usuarios/usuario-form"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { ArrowLeft, UserCog } from "lucide-react"

interface EditarUsuarioPageProps {
  params: {
    id: string
  }
}

export default async function EditarUsuarioPage({ params }: EditarUsuarioPageProps) {
  const session = await auth()

  if (!session?.user) {
    redirect("/login")
  }

  if (session.user.role !== "ADMIN") {
    redirect("/dashboard")
  }

  // En Next.js 16, params es una promesa
  const { id } = await params

  const user = await userRepository.findById(id)

  if (!user) {
    redirect("/dashboard/usuarios")
  }

  return (
    <div className="p-8 space-y-8">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/dashboard/usuarios">
          <Button variant="ghost" size="icon" className="hover:bg-primary/20 transition-all duration-200">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div className="space-y-2 flex-1">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 text-white shadow-lg">
              <UserCog className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
                Editar Usuario
              </h1>
              <p className="text-muted-foreground">
                Modifica los datos de {user.name}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Formulario */}
      <UsuarioForm
        userId={user.id}
        initialData={{
          email: user.email,
          name: user.name,
          role: user.role,
          isActive: user.isActive,
        }}
      />
    </div>
  )
}
