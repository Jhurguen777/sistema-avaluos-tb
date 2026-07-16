"use client"

import { signOut as nextAuthSignOut } from "next-auth/react"
import { useRouter } from "next/navigation"
import { LogOut } from "lucide-react"
import { cn } from "@/lib/utils"

interface SignOutButtonProps {
  isCollapsed?: boolean
}

export function SignOutButton({ isCollapsed = false }: SignOutButtonProps) {
  const router = useRouter()

  const handleSignOut = async () => {
    try {
      // Limpiar sesión del cliente primero
      await fetch("/api/auth/signout", { method: "POST" })

      // Redirigir al login sin errores
      router.push("/login")
      router.refresh()
    } catch (error) {
      console.error("Error al cerrar sesión:", error)
      // En caso de error, igual redirigir al login
      router.push("/login")
    }
  }

  return (
    <button
      onClick={handleSignOut}
      className={cn(
        "w-full text-left flex items-center gap-3 py-2 px-3.5 rounded-lg",
        // === FIX #2: Hover solo en Desktop ===
        "md:hover:bg-slate-800/30 transition-all duration-200 ease-in-out group",
        isCollapsed && "justify-center"
      )}
    >
      <div className="p-1.5 rounded-md text-slate-400 md:group-hover:text-slate-200 transition-colors duration-200">
        <LogOut className="w-4.5 h-4.5" />
      </div>
      {!isCollapsed && (
        <span className="text-sm font-medium text-slate-400 md:group-hover:text-slate-200 transition-colors duration-200">
          Cerrar Sesión
        </span>
      )}
    </button>
  )
}
