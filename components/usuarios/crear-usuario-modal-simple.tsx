"use client"

import { useState } from "react"
import { createUserAction } from "@/modules/users/actions"
import { ROLE_LABELS } from "@/src/constants/roles"
import { Loader2, CheckCircle2, UserPlus, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { PasswordInput } from "@/components/ui/password-input"
import { toast } from "@/components/ui/use-toast"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select"

interface CrearUsuarioModalSimpleProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onUserCreated?: () => void
}

export function CrearUsuarioModalSimple({ open, onOpenChange, onUserCreated }: CrearUsuarioModalSimpleProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [tempPassword, setTempPassword] = useState<string | null>(null)

  // Form state
  const [email, setEmail] = useState("")
  const [name, setName] = useState("")
  const [password, setPassword] = useState("")
  const [role, setRole] = useState<string>("all") // Valor inicial: "all" (mismo patrón que filtros)

  // Errors
  const [errors, setErrors] = useState<Record<string, string>>({})

  const validate = () => {
    const newErrors: Record<string, string> = {}

    // Email validation
    if (!email) {
      newErrors.email = "Email es requerido"
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = "Email inválido"
    }

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
    if (!role || role === "all") {
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
    setTempPassword(null)

    try {
      const result = await createUserAction({
        email,
        name,
        password: password || undefined, // Send undefined if empty, server will generate
        role
      })

      if (result.success && result.data) {
        toast.success("Usuario creado exitosamente", `${result.data.user.name} ha sido añadido al sistema`)

        if (result.data.tempPassword) {
          setTimeout(() => {
            toast.info("Password Temporal Generado", `Password: ${result.data.tempPassword}`)
          }, 500)
          setTempPassword(result.data.tempPassword)
        }

        // Reset form
        setEmail("")
        setName("")
        setPassword("")
        setRole("all")
        setErrors({})

        setTimeout(() => {
          onOpenChange(false)
          onUserCreated?.()
        }, 1500)
      } else {
        toast.error("Error al crear usuario", result.error || "No se pudo crear el usuario")
      }
    } catch (err) {
      console.error("Error creating user:", err)
      toast.error("Error al procesar la solicitud", "Intente nuevamente más tarde")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = () => {
    if (!isSubmitting) {
      onOpenChange(false)
      setTimeout(() => {
        setEmail("")
        setName("")
        setPassword("")
        setRole("all")
        setErrors({})
        setTempPassword(null)
      }, 300)
    }
  }

  if (!open) return null

  return (
    <div className="fixed top-16 inset-x-0 bottom-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-md bg-[#1e293b] rounded-2xl p-5 sm:p-6 border border-slate-800 shadow-2xl max-h-[calc(90vh-4rem)] overflow-y-auto">
        {/* Close button */}
        <button
          onClick={handleClose}
          disabled={isSubmitting}
          className="absolute right-3 sm:right-4 top-3 sm:top-4 p-1 rounded-full hover:bg-muted transition-colors disabled:opacity-50 z-10"
        >
          <X className="w-4 h-4 sm:w-5 sm:h-5" />
        </button>

        <div className="space-y-4 sm:space-y-5">
          {/* Header */}
          <div className="flex items-center gap-3">
            <div className="p-2 sm:p-3 rounded-xl bg-[#233C7A] text-white shadow-lg">
              <UserPlus className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-xl sm:text-2xl font-bold truncate">Nuevo Usuario</h2>
              <p className="text-muted-foreground text-xs sm:text-sm">Crea un nuevo usuario en el sistema</p>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
            {/* Email */}
            <div className="space-y-1.5 sm:space-y-2">
              <label htmlFor="email" className="text-xs sm:text-sm font-medium block">
                Email <span className="text-red-500">*</span>
              </label>
              <Input
                id="email"
                type="email"
                placeholder="usuario@ejemplo.com"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value)
                  if (errors.email) setErrors({...errors, email: ""})
                }}
                className={`h-9 sm:h-11 text-sm ${errors.email ? "border-destructive" : ""}`}
              />
              {errors.email && (
                <p className="text-xs text-destructive">{errors.email}</p>
              )}
            </div>

            {/* Nombre */}
            <div className="space-y-1.5 sm:space-y-2">
              <label htmlFor="name" className="text-xs sm:text-sm font-medium block">
                Nombre Completo <span className="text-red-500">*</span>
              </label>
              <Input
                id="name"
                type="text"
                placeholder="Juan Pérez"
                value={name}
                onChange={(e) => {
                  setName(e.target.value)
                  if (errors.name) setErrors({...errors, name: ""})
                }}
                className={errors.name ? "border-destructive" : ""}
              />
              {errors.name && (
                <p className="text-xs text-destructive">{errors.name}</p>
              )}
            </div>

            {/* Password */}
            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium">
                Password <span className="text-red-500">*</span>
              </label>
              <PasswordInput
                id="password"
                placeholder="Ingresa una contraseña segura"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value)
                  if (errors.password) setErrors({...errors, password: ""})
                }}
                className={errors.password ? "border-destructive" : ""}
              />
              {errors.password && (
                <p className="text-xs text-destructive">{errors.password}</p>
              )}
              <div className="mt-2 p-3 bg-slate-900/60 rounded-lg border border-slate-800 text-xs text-slate-400 space-y-1">
                <p className="font-medium text-slate-300">La contraseña debe contener:</p>
                <ul className="list-disc list-inside space-y-0.5 pl-1">
                  <li>Mínimo 8 caracteres</li>
                  <li>Al menos una letra mayúscula</li>
                  <li>Al menos una letra minúscula</li>
                  <li>Al menos un número</li>
                </ul>
              </div>
            </div>

            {/* Rol */}
            <div className="space-y-2">
              <label htmlFor="role" className="text-sm font-medium">
                Rol <span className="text-red-500">*</span>
              </label>
              <Select
                value={role}
                onValueChange={(value) => {
                  // Solo actualizar si el valor no es vacío
                  if (value && value.trim() !== "") {
                    setRole(value)
                    if (errors.role) setErrors({...errors, role: ""})
                  }
                }}
              >
                <SelectTrigger className="w-full h-11 border-2 border-border/50 rounded-md bg-card text-white focus:border-[#FAB90E] focus:outline-none focus:ring-2 focus:ring-[#FAB90E] relative">
                  <span className="text-white text-sm">
                    {role === "all" ? "(Elige un rol)" : (ROLE_LABELS[role as keyof typeof ROLE_LABELS] || role)}
                  </span>
                </SelectTrigger>
                <SelectContent align="start" className="w-[var(--radix-select-trigger-width)] bg-card border-border/50">
                  <SelectItem value="all">(Elige un rol)</SelectItem>
                  {Object.entries(ROLE_LABELS).map(([key, label]) => (
                    <SelectItem key={key} value={key}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.role && (
                <p className="text-xs text-destructive">{errors.role}</p>
              )}
            </div>

            {/* Password temporal creado */}
            {tempPassword && (
              <div className="p-3 bg-green-50 dark:bg-green-950 rounded-xl border-2 border-green-200 dark:border-green-800">
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-xs font-semibold text-green-900 dark:text-green-100">Password Temporal:</p>
                    <p className="text-sm font-mono font-bold text-green-800 dark:text-green-200 mt-1 select-all">{tempPassword}</p>
                    <p className="text-xs text-green-700 dark:text-green-300 mt-1">Cópielo ahora</p>
                  </div>
                </div>
              </div>
            )}

            {/* Botones */}
            <div className="flex gap-3 pt-2">
              <Button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 h-11 bg-[#233C7A] hover:bg-[#1e3566] shadow-lg hover:shadow-xl transition-all duration-300 text-sm font-medium text-white"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creando...
                  </>
                ) : (
                  "Crear Usuario"
                )}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={isSubmitting}
                className="h-11 border-2 border-border/50 hover:border-primary/50 transition-all duration-200 text-sm font-medium"
              >
                Cancelar
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
