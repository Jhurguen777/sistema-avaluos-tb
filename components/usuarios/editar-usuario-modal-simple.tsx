"use client"

import { useState, useEffect } from "react"
import { updateUserAction } from "@/modules/users/actions"
import { ROLE_LABELS } from "@/src/constants/roles"
import { Loader2, CheckCircle2, UserCog, X, Eye, EyeOff } from "lucide-react"
import { toast } from "@/components/ui/use-toast"

interface EditarUsuarioModalSimpleProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onUserUpdated?: () => void
  userId: string
  initialData?: {
    email: string
    name: string
    role: string
    isActive: boolean
  }
}

export function EditarUsuarioModalSimple({
  open,
  onOpenChange,
  onUserUpdated,
  userId,
  initialData
}: EditarUsuarioModalSimpleProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  // Form state
  const [name, setName] = useState("")
  const [password, setPassword] = useState("")
  const [role, setRole] = useState("")
  const [isActive, setIsActive] = useState(true)

  // Errors
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Cargar datos iniciales cuando se abre el modal
  useEffect(() => {
    if (initialData) {
      setName(initialData.name)
      setRole(initialData.role)
      setIsActive(initialData.isActive)
      setPassword("")
      setErrors({})
    }
  }, [initialData, open])

  const validate = () => {
    const newErrors: Record<string, string> = {}

    // Name validation
    if (!name) {
      newErrors.name = "Nombre es requerido"
    } else if (name.length < 3) {
      newErrors.name = "Nombre debe tener al menos 3 caracteres"
    }

    // Password validation (optional but if provided, must meet requirements)
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

    // Role validation
    if (!role) {
      newErrors.role = "Debe seleccionar un rol"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validate()) {
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
        toast.success("Usuario actualizado", "Los cambios han sido guardados correctamente")

        // Reset form
        setPassword("")
        setErrors({})

        setTimeout(() => {
          onOpenChange(false)
          onUserUpdated?.()
        }, 1000)
      } else {
        toast.error("Error al actualizar", result.error || "No se pudo actualizar el usuario")
      }
    } catch (err) {
      console.error("Error updating user:", err)
      toast.error("Error al procesar", "Intente nuevamente más tarde")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = () => {
    if (!isSubmitting) {
      onOpenChange(false)
      setTimeout(() => {
        setPassword("")
        setErrors({})
      }, 300)
    }
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="relative bg-background border-2 border-border/50 rounded-lg shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Close button */}
        <button
          onClick={handleClose}
          disabled={isSubmitting}
          className="absolute right-4 top-4 p-1 rounded-full hover:bg-muted transition-colors disabled:opacity-50"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="p-6 space-y-6">
          {/* Header */}
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-[#233C7A] text-white shadow-lg">
              <UserCog className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">Editar Usuario</h2>
              <p className="text-muted-foreground text-sm">Modifica los datos del usuario</p>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email (readonly) */}
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium">Email</label>
              <input
                id="email"
                type="email"
                value={initialData?.email || ""}
                disabled
                className="w-full h-10 px-3 border-2 border-border/50 rounded-md bg-muted/50 text-muted-foreground cursor-not-allowed transition-all duration-200"
              />
              <p className="text-xs text-muted-foreground">El email no se puede modificar</p>
            </div>

            {/* Nombre */}
            <div className="space-y-2">
              <label htmlFor="name" className="text-sm font-medium">Nombre Completo</label>
              <input
                id="name"
                type="text"
                placeholder="Juan Pérez"
                value={name}
                onChange={(e) => {
                  setName(e.target.value)
                  if (errors.name) setErrors({...errors, name: ""})
                }}
                className={`
                  w-full h-10 px-3 border-2 rounded-md transition-all duration-200
                  focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2
                  ${errors.name ? 'border-destructive' : 'border-border/50 focus:border-primary'}
                `}
              />
              {errors.name && (
                <p className="text-xs text-destructive">{errors.name}</p>
              )}
            </div>

            {/* Password */}
            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium">
                Nuevo Password (dejar vacío para no cambiar)
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value)
                    if (errors.password) setErrors({...errors, password: ""})
                  }}
                  className={`
                    w-full h-10 px-3 pr-10 border-2 rounded-md transition-all duration-200
                    focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2
                    ${errors.password ? 'border-destructive' : 'border-border/50 focus:border-primary'}
                  `}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && (
                <p className="text-xs text-destructive">{errors.password}</p>
              )}
              <p className="text-xs text-muted-foreground">
                Mínimo 8 caracteres, mayúscula, minúscula y número
              </p>
            </div>

            {/* Rol */}
            <div className="space-y-2">
              <label htmlFor="role" className="text-sm font-medium">Rol</label>
              <select
                id="role"
                value={role}
                onChange={(e) => {
                  setRole(e.target.value)
                  if (errors.role) setErrors({...errors, role: ""})
                }}
                className={`
                  w-full h-10 px-3 border-2 rounded-md appearance-none cursor-pointer
                  transition-all duration-200 text-sm bg-background
                  focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2
                  ${errors.role ? 'border-destructive' : 'border-border/50'}
                  [&:not([multiple])]:pr-10
                  [&:not([multiple])]:bg-[url('data:image/svg+xml,%3csvg%20xmlns%3d%22http%3a%2f%2fwww.w3.org%2f2000%2fsvg%22%20fill%3d%22none%22%20viewBox%3d%220%200%2020%2020%22%3e%3cpath%20stroke%3d%22%236b7280%22%20stroke-linecap%3d%22round%22%20stroke-linejoin%3d%22round%22%20stroke-width%3d%221.5%22%20d%3d%22M6%208l4%204%204-4%22%2f%3e%3c%2fsvg%3e')]
                  [&:not([multiple])]:bg-[right_0.5rem_center]
                  [&:not([multiple])]:bg-no-repeat
                  [&:not([multiple])]:bg-[length:1.5em_1.5em]
                `}
              >
                {Object.entries(ROLE_LABELS).map(([key, label]) => (
                  <option key={key} value={key}>
                    {label}
                  </option>
                ))}
              </select>
              {errors.role && (
                <p className="text-xs text-destructive">{errors.role}</p>
              )}
            </div>

            {/* Estado */}
            <div className="space-y-2">
              <label htmlFor="isActive" className="text-sm font-medium">Estado</label>
              <select
                id="isActive"
                value={isActive ? "true" : "false"}
                onChange={(e) => setIsActive(e.target.value === "true")}
                className={`
                  w-full h-10 px-3 border-2 border-border/50 rounded-md appearance-none cursor-pointer
                  transition-all duration-200 text-sm bg-background
                  focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2
                  [&:not([multiple])]:pr-10
                  [&:not([multiple])]:bg-[url('data:image/svg+xml,%3csvg%20xmlns%3d%22http%3a%2f%2fwww.w3.org%2f2000%2fsvg%22%20fill%3d%22none%22%20viewBox%3d%220%200%2020%2020%22%3e%3cpath%20stroke%3d%22%236b7280%22%20stroke-linecap%3d%22round%22%20stroke-linejoin%3d%22round%22%20stroke-width%3d%221.5%22%20d%3d%22M6%208l4%204%204-4%22%2f%3e%3c%2fsvg%3e')]
                  [&:not([multiple])]:bg-[right_0.5rem_center]
                  [&:not([multiple])]:bg-no-repeat
                  [&:not([multiple])]:bg-[length:1.5em_1.5em]
                `}
              >
                <option value="true">Activo</option>
                <option value="false">Inactivo</option>
              </select>
            </div>

            {/* Botones */}
            <div className="flex gap-3 pt-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 h-11 px-4 bg-[#233C7A] hover:bg-[#1e3566] shadow-lg hover:shadow-xl transition-all duration-300 text-sm font-medium text-white rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin inline" />
                    Guardando...
                  </>
                ) : (
                  "Guardar Cambios"
                )}
              </button>
              <button
                type="button"
                onClick={handleClose}
                disabled={isSubmitting}
                className="h-11 px-4 border-2 border-border/50 hover:border-primary/50 transition-all duration-200 text-sm font-medium rounded-md bg-background disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
