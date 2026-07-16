"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { updateUserAction } from "@/modules/users/actions"
import { ROLE_LABELS } from "@/src/constants/roles"
import { Loader2 } from "lucide-react"
import { toast } from "@/components/ui/use-toast"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { PasswordInput } from "@/components/ui/password-input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

interface UsuarioFormProps {
  initialData?: {
    email: string
    name: string
    role?: string
    isActive?: boolean
  }
  userId: string
}

export function UsuarioForm({ initialData, userId }: UsuarioFormProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Form state
  const [name, setName] = useState(initialData?.name || "")
  const [password, setPassword] = useState("")
  const [role, setRole] = useState(initialData?.role || "")
  const [isActive, setIsActive] = useState(initialData?.isActive ?? true)

  // Errors
  const [errors, setErrors] = useState<Record<string, string>>({})

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validaciones
    const newErrors: Record<string, string> = {}

    if (!name || name.length < 3) {
      newErrors.name = "Nombre debe tener al menos 3 caracteres"
    }

    if (password && password.length > 0) {
      if (password.length < 8) {
        newErrors.password = "Password debe tener al menos 8 caracteres"
      } else if (!/[A-Z]/.test(password)) {
        newErrors.password = "Password debe tener al menos una mayúscula"
      } else if (!/[a-z]/.test(password)) {
        newErrors.password = "Password debe tener al menos una minúscula"
      } else if (!/[0-9]/.test(password)) {
        newErrors.password = "Password debe tener al menos un número"
      }
    }

    if (!role) {
      newErrors.role = "Debe seleccionar un rol"
    }

    setErrors(newErrors)

    if (Object.keys(newErrors).length > 0) {
      return
    }

    setIsSubmitting(true)

    try {
      const updateData: any = {
        name,
        role,
        isActive,
      }

      // Solo incluir password si se proporcionó
      if (password) {
        updateData.password = password
      }

      const result = await updateUserAction(userId, updateData)

      if (result.success) {
        toast.success("Usuario actualizado exitosamente", "Los cambios han sido guardados")
        setTimeout(() => {
          router.push("/dashboard/usuarios")
        }, 1000)
      } else {
        toast.error("Error al actualizar usuario", result.error || "No se pudo actualizar el usuario")
      }
    } catch (err) {
      toast.error("Error al procesar la solicitud", "Intente nuevamente más tarde")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Card className="border-2 border-border/50 hover:border-primary/50 transition-all duration-300">
      <CardHeader>
        <CardTitle className="text-2xl">
          Modificar Usuario
        </CardTitle>
        <CardDescription className="text-base">
          Modifica los datos del usuario. Los campos vacíos se mantienen igual.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Email (readonly) */}
          <div className="space-y-2">
            <Label htmlFor="email" className="text-base font-medium">Email</Label>
            <Input
              id="email"
              type="email"
              value={initialData?.email || ""}
              disabled
              className="h-11 border-2 border-border/50 bg-muted/50 transition-all duration-200"
            />
            <p className="text-xs text-muted-foreground">El email no se puede modificar</p>
          </div>

          {/* Nombre */}
          <div className="space-y-2">
            <Label htmlFor="name" className="text-base font-medium">Nombre Completo</Label>
            <Input
              id="name"
              type="text"
              placeholder="Juan Pérez"
              value={name}
              onChange={(e) => {
                setName(e.target.value)
                if (errors.name) setErrors({ ...errors, name: "" })
              }}
              className={errors.name ? "h-11 border-2 border-destructive" : "h-11 border-2 border-border/50 focus:border-primary transition-all duration-200"}
            />
            {errors.name && (
              <p className="text-sm text-destructive">{errors.name}</p>
            )}
          </div>

          {/* Password */}
          <div className="space-y-2">
            <Label htmlFor="password" className="text-base font-medium">
              Nuevo Password (dejar vacío para no cambiar)
            </Label>
            <PasswordInput
              id="password"
              placeholder="••••••••••"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value)
                if (errors.password) setErrors({ ...errors, password: "" })
              }}
              className={errors.password ? "h-11 border-2 border-destructive" : "h-11 border-2 border-border/50 focus:border-primary transition-all duration-200"}
            />
            {errors.password && (
              <p className="text-sm text-destructive">{errors.password}</p>
            )}
          </div>

          {/* Rol - SELECT NATIVO */}
          <div className="space-y-2">
            <Label htmlFor="role" className="text-base font-medium">Rol</Label>
            <select
              id="role"
              value={role}
              onChange={(e) => {
                setRole(e.target.value)
                if (errors.role) setErrors({ ...errors, role: "" })
              }}
              className={`
                w-full h-11 px-3 pr-10 border-2 rounded-md appearance-none cursor-pointer
                transition-all duration-200 text-sm bg-background
                focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2
                ${errors.role ? 'border-destructive' : 'border-border/50'}
              `}
              style={{
                backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
                backgroundPosition: 'right 0.5rem center',
                backgroundRepeat: 'no-repeat',
                backgroundSize: '1.5em 1.5em',
                paddingRight: '2.5rem'
              }}
            >
              <option value="">Selecciona un rol</option>
              {Object.entries(ROLE_LABELS).map(([key, label]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </select>
            {errors.role && (
              <p className="text-sm text-destructive">{errors.role}</p>
            )}
          </div>

          {/* Estado - SELECT NATIVO */}
          <div className="space-y-2">
            <Label htmlFor="isActive" className="text-base font-medium">Estado</Label>
            <select
              id="isActive"
              value={isActive ? "true" : "false"}
              onChange={(e) => setIsActive(e.target.value === "true")}
              className="w-full h-11 px-3 pr-10 border-2 border-border/50 rounded-md appearance-none cursor-pointer transition-all duration-200 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
                backgroundPosition: 'right 0.5rem center',
                backgroundRepeat: 'no-repeat',
                backgroundSize: '1.5em 1.5em',
                paddingRight: '2.5rem'
              }}
            >
              <option value="true">Activo</option>
              <option value="false">Inactivo</option>
            </select>
          </div>

          {/* Botones */}
          <div className="flex gap-3 pt-4">
            <Button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 h-12 bg-[#233C7A] hover:bg-[#1e3566] shadow-lg hover:shadow-xl transition-all duration-300 text-base font-medium text-white"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Procesando...
                </>
              ) : (
                "Guardar Cambios"
              )}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push("/dashboard/usuarios")}
              disabled={isSubmitting}
              className="h-12 border-2 border-border/50 hover:border-primary/50 transition-all duration-200 text-base font-medium"
            >
              Cancelar
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
