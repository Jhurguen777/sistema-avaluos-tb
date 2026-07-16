"use client"

import { useState } from "react"
import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { PasswordInput } from "@/components/ui/password-input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger } from "@/components/ui/select"
import { createUserValidator } from "@/modules/users/validators/user-validator"
import { createUserAction } from "@/modules/users/actions"
import { ROLES, ROLE_LABELS } from "@/src/constants/roles"
import { Loader2, CheckCircle2, UserPlus } from "lucide-react"
import { toast } from "@/components/ui/use-toast"
import type { z } from "zod"

type FormData = z.infer<typeof createUserValidator>

interface CrearUsuarioModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onUserCreated?: () => void
}

export function CrearUsuarioModal({ open, onOpenChange, onUserCreated }: CrearUsuarioModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [tempPassword, setTempPassword] = useState<string | null>(null)

  const form = useForm<FormData>({
    resolver: zodResolver(createUserValidator),
    defaultValues: {
      email: "",
      name: "",
      password: "",
      role: ""
    }
  })

  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true)
    setTempPassword(null)

    try {
      const result = await createUserAction(data)

      if (result.success && result.data) {
        toast.success("Usuario creado exitosamente", `${result.data.user.name} ha sido añadido al sistema`)

        if (result.data.tempPassword) {
          setTimeout(() => {
            toast.info("Password Temporal Generado", `Password: ${result.data.tempPassword}`)
          }, 500)
          setTempPassword(result.data.tempPassword)
        }

        form.reset()
        setTimeout(() => {
          onOpenChange(false)
          onUserCreated?.()
        }, 1500)
      } else {
        toast.error("Error al crear usuario", result.error || "No se pudo crear el usuario")
      }
    } catch (err) {
      toast.error("Error al procesar la solicitud", "Intente nuevamente más tarde")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = () => {
    if (!isSubmitting) {
      onOpenChange(false)
      setTimeout(() => {
        form.reset()
        setTempPassword(null)
      }, 300)
    }
  }

  const errors = form.formState.errors

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="border-2 border-border/50 max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-3 rounded-xl bg-[#233C7A] text-white shadow-lg">
              <UserPlus className="w-6 h-6" />
            </div>
            <div>
              <DialogTitle className="text-2xl">Nuevo Usuario</DialogTitle>
              <DialogDescription className="text-base">
                Crea un nuevo usuario en el sistema
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 mt-4">
          {/* Email */}
          <div className="space-y-2">
            <Label htmlFor="email" className="text-sm font-medium">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="usuario@ejemplo.com"
              className="h-10 border-2 border-border/50 focus:border-primary transition-all duration-200"
              {...form.register("email")}
            />
            {errors.email && (
              <p className="text-xs text-destructive">{errors.email.message}</p>
            )}
          </div>

          {/* Nombre */}
          <div className="space-y-2">
            <Label htmlFor="name" className="text-sm font-medium">Nombre Completo</Label>
            <Input
              id="name"
              type="text"
              placeholder="Juan Pérez"
              className="h-10 border-2 border-border/50 focus:border-primary transition-all duration-200"
              {...form.register("name")}
            />
            {errors.name && (
              <p className="text-xs text-destructive">{errors.name.message}</p>
            )}
          </div>

          {/* Password */}
          <div className="space-y-2">
            <Label htmlFor="password" className="text-sm font-medium">
              Password (opcional)
            </Label>
            <PasswordInput
              id="password"
              placeholder="Dejar vacío para generar automáticamente"
              className="h-10 border-2 border-border/50 focus:border-primary transition-all duration-200"
              {...form.register("password")}
            />
            {errors.password && (
              <p className="text-xs text-destructive">{errors.password.message}</p>
            )}
            <p className="text-xs text-muted-foreground">
              Mínimo 8 caracteres, mayúscula, minúscula y número
            </p>
          </div>

          {/* Rol */}
          <div className="space-y-2">
            <Label htmlFor="role" className="text-sm font-medium">Rol</Label>
            <Controller
              name="role"
              control={form.control}
              render={({ field }) => (
                <Select
                  onValueChange={field.onChange}
                  value={field.value}
                >
                  <SelectTrigger className="h-10 border-2 border-border/50 text-white focus:border-primary transition-all duration-200 relative">
                    <span className="text-white text-sm">
                      {field.value ? (ROLE_LABELS[field.value as keyof typeof ROLE_LABELS] || field.value) : "Selecciona un rol"}
                    </span>
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(ROLE_LABELS).map(([key, label]) => (
                      <SelectItem key={key} value={key}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.role && (
              <p className="text-xs text-destructive">{errors.role.message}</p>
            )}
          </div>

          {/* Password temporal creado */}
          {tempPassword && (
            <div className="p-3 bg-green-50 rounded-xl border-2 border-green-200">
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-xs font-semibold text-green-900">Password Temporal:</p>
                  <p className="text-sm font-mono font-bold text-green-800 mt-1 select-all">{tempPassword}</p>
                  <p className="text-xs text-green-700 mt-1">Cópielo ahora</p>
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
      </DialogContent>
    </Dialog>
  )
}
