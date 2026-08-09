"use client"

import React, { useState, useEffect, useMemo } from "react"
import { cn } from "@/lib/utils"
import { toast } from "@/components/ui/use-toast"
import { ROLE_LABELS } from "@/src/constants/roles"
import {
  MODULOS_PERMISOS,
  ACCIONES_LABELS,
  type PermisosUsuario,
  type AccionCRUD,
  permisosVacios,
} from "@/config/modulos-permisos"
import {
  getPermisosUsuarioAction,
  updatePermisosUsuarioAction,
  deactivateUserAction,
  reactivateUserAction,
} from "@/modules/users/actions"
import { EditarUsuarioModalSimple } from "./editar-usuario-modal-simple"
import { RoleBadge } from "./badge-rol"
import { EstadoBadge } from "./badge-estado"
import {
  X, Shield, Loader2, Edit, Power, PowerOff, Key, Save,
  AlertTriangle, FileText, Building2, Users, FolderOpen,
  BarChart3, Settings, History, Eye, Plus, Pencil, Trash2,
  Zap,
} from "lucide-react"

/** Mapa de iconos para módulos (string → componente) */
const ICONOS_MODULOS: Record<string, React.ComponentType<{ className?: string }>> = {
  FileText, Building2, Users, FolderOpen, BarChart3, Settings, History,
}

/** Mapa de iconos para acciones CRUD */
const ICONOS_ACCIONES: Record<string, React.ComponentType<{ className?: string }>> = {
  Eye, Plus, Pencil, Trash2,
}

/** Toggle Switch personalizado */
function ToggleSwitch({
  active,
  disabled,
  onToggle,
}: {
  active: boolean
  disabled?: boolean
  onToggle: () => void
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      disabled={disabled}
      className={cn(
        "relative h-6 w-10 rounded-full transition-colors duration-200 shrink-0",
        active ? "bg-[#FAB90E]" : "bg-slate-600/60",
        disabled ? "opacity-20 cursor-not-allowed" : "cursor-pointer hover:opacity-80",
      )}
      aria-label={active ? "Activado" : "Desactivado"}
    >
      <span
        className={cn(
          "absolute top-1 left-1 h-4 w-4 rounded-full bg-white shadow-sm transition-transform duration-200",
          active && "translate-x-4",
        )}
      />
    </button>
  )
}

/** Props del drawer */
interface GestionUsuarioDrawerProps {
  user: {
    id: string
    name: string
    email: string
    role: string
    isActive: boolean
  } | null
  open: boolean
  onClose: () => void
  onUserUpdated: () => void
}

/** Estado para modal de confirmación de acciones */
interface ActionConfirm {
  open: boolean
  action: "deactivate" | "reactivate" | "reset"
}

export function GestionUsuarioDrawer({
  user,
  open,
  onClose,
  onUserUpdated,
}: GestionUsuarioDrawerProps) {
  const [permisos, setPermisos] = useState<PermisosUsuario>(permisosVacios())
  const [permisosOriginales, setPermisosOriginales] = useState<PermisosUsuario>(permisosVacios())
  const [isLoadingPermisos, setIsLoadingPermisos] = useState(false)
  const [isSavingPermisos, setIsSavingPermisos] = useState(false)
  const [isActionLoading, setIsActionLoading] = useState(false)

  const [editModalOpen, setEditModalOpen] = useState(false)
  const [actionConfirm, setActionConfirm] = useState<ActionConfirm>({
    open: false,
    action: "deactivate",
  })

  /** Cargar permisos al abrir el drawer */
  useEffect(() => {
    if (open && user) {
      setIsLoadingPermisos(true)
      getPermisosUsuarioAction(user.id)
        .then((result) => {
          if (result.success && result.data) {
            setPermisos(result.data)
            setPermisosOriginales(result.data)
          }
        })
        .catch(() => toast.error("Error", "No se pudieron cargar los permisos"))
        .finally(() => setIsLoadingPermisos(false))
    }
  }, [open, user])

  /** Cerrar con tecla Escape */
  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !isSavingPermisos && !isActionLoading) {
        onClose()
      }
    }
    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [open, isSavingPermisos, isActionLoading, onClose])

  /** Toggle de un permiso individual */
  const handleToggle = (modulo: string, accion: AccionCRUD) => {
    setPermisos((prev) => ({
      ...prev,
      [modulo]: {
        ...prev[modulo],
        [accion]: !prev[modulo]?.[accion],
      },
    }))
  }

  /** Detectar cambios sin guardar */
  const hayCambios = useMemo(() => {
    return JSON.stringify(permisos) !== JSON.stringify(permisosOriginales)
  }, [permisos, permisosOriginales])

  /** Guardar permisos */
  const handleSavePermisos = async () => {
    if (!user) return
    setIsSavingPermisos(true)
    try {
      const result = await updatePermisosUsuarioAction(user.id, permisos)
      if (result.success) {
        toast.success("Permisos actualizados", `Los permisos de ${user.name} se guardaron correctamente`)
        setPermisosOriginales(permisos)
      } else {
        toast.error("Error", result.error || "No se pudieron guardar los permisos")
      }
    } catch {
      toast.error("Error", "Intente nuevamente más tarde")
    } finally {
      setIsSavingPermisos(false)
    }
  }

  /** Ejecutar acción rápida (desactivar/reactivar/reset) */
  const handleAction = async () => {
    if (!user) return
    setIsActionLoading(true)
    try {
      if (actionConfirm.action === "deactivate") {
        const result = await deactivateUserAction(user.id)
        if (result.success) {
          toast.success("Usuario desactivado", `${user.name} ya no puede acceder al sistema`)
        } else {
          toast.error("Error", result.error || "No se pudo desactivar")
        }
      } else if (actionConfirm.action === "reactivate") {
        const result = await reactivateUserAction(user.id)
        if (result.success) {
          toast.success("Usuario reactivado", `${user.name} puede acceder nuevamente`)
        } else {
          toast.error("Error", result.error || "No se pudo reactivar")
        }
      } else {
        const { resetPasswordAction } = await import("@/modules/users/actions")
        const tempPassword = Math.random().toString(36).slice(-8)
        const result = await resetPasswordAction(user.id, {
          newPassword: tempPassword,
          confirmPassword: tempPassword,
        })
        if (result.success) {
          const newPassword = result.data?.tempPassword || tempPassword
          toast.success("Password reseteado", `Nuevo password: ${newPassword}`, 10000)
        } else {
          toast.error("Error", result.error || "No se pudo resetear")
        }
      }
      setActionConfirm({ open: false, action: "deactivate" })
      onUserUpdated()
    } catch {
      toast.error("Error", "Intente nuevamente más tarde")
    } finally {
      setIsActionLoading(false)
    }
  }

  if (!user) return null

  /** Inicial del nombre para el avatar */
  const inicial = user.name.charAt(0).toUpperCase()

  return (
    <>
      {/* === OVERLAY (debajo del header) === */}
      <div
        className={cn(
          "fixed top-16 inset-x-0 bottom-0 bg-black/50 backdrop-blur-sm z-40 transition-opacity duration-300",
          open ? "opacity-100" : "opacity-0 pointer-events-none",
        )}
        onClick={() => !isSavingPermisos && !isActionLoading && onClose()}
      />

      {/* === DRAWER LATERAL DERECHO (debajo del header, panel flotante en móvil) === */}
      <aside
        className={cn(
          "fixed right-0 top-16 h-[calc(100vh-4rem)] z-50 flex flex-col",
          "bg-card border-l-2 border-border/50 shadow-2xl",
          "transition-transform duration-300 ease-out",
          "w-[88%] max-w-[480px] rounded-l-2xl",
          open ? "translate-x-0" : "translate-x-full",
        )}
        role="dialog"
        aria-modal="true"
      >
        {/* === HEADER STICKY === */}
        <div className="shrink-0 border-b border-border/50 p-4 sm:p-6 relative">
          {/* Botón cerrar */}
          <button
            onClick={() => !isSavingPermisos && !isActionLoading && onClose()}
            disabled={isSavingPermisos || isActionLoading}
            className="absolute right-3 top-3 sm:right-4 sm:top-4 p-2 rounded-lg hover:bg-muted transition-colors disabled:opacity-50"
            aria-label="Cerrar"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Info del usuario */}
          <div className="flex items-center gap-3 sm:gap-4 pr-8">
            {/* Avatar */}
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg shrink-0">
              <span className="text-xl sm:text-2xl font-bold text-white">{inicial}</span>
            </div>

            {/* Nombre + Email */}
            <div className="min-w-0 flex-1">
              <h2 className="text-lg sm:text-xl font-bold text-white truncate">{user.name}</h2>
              <p className="text-sm text-muted-foreground truncate">{user.email}</p>

              {/* Badges */}
              <div className="flex items-center gap-2 mt-1.5">
                <EstadoBadge isActive={user.isActive} />
                <RoleBadge role={user.role as any} />
              </div>
            </div>
          </div>
        </div>

        {/* === CONTENIDO SCROLLABLE === */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {/* --- ACCIONES RÁPIDAS --- */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              <Zap className="w-3.5 h-3.5" />
              <span>Acciones Rápidas</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {/* Editar */}
              <button
                onClick={() => setEditModalOpen(true)}
                className="flex items-center justify-center gap-2 h-11 rounded-lg border-2 border-blue-500/40 hover:border-blue-500 hover:bg-blue-500/10 text-blue-400 text-sm font-medium transition-all duration-200"
              >
                <Edit className="w-4 h-4" />
                <span>Editar</span>
              </button>

              {/* Activar / Desactivar */}
              <button
                onClick={() =>
                  setActionConfirm({
                    open: true,
                    action: user.isActive ? "deactivate" : "reactivate",
                  })
                }
                className={cn(
                  "flex items-center justify-center gap-2 h-11 rounded-lg border-2 text-sm font-medium transition-all duration-200",
                  user.isActive
                    ? "border-red-500/40 hover:border-red-500 hover:bg-red-500/10 text-red-400"
                    : "border-green-500/40 hover:border-green-500 hover:bg-green-500/10 text-green-400",
                )}
              >
                {user.isActive ? (
                  <>
                    <PowerOff className="w-4 h-4" />
                    <span>Desactivar</span>
                  </>
                ) : (
                  <>
                    <Power className="w-4 h-4" />
                    <span>Reactivar</span>
                  </>
                )}
              </button>

              {/* Reset Password */}
              <button
                onClick={() => setActionConfirm({ open: true, action: "reset" })}
                className="flex items-center justify-center gap-2 h-11 rounded-lg border-2 border-[#FAB90E]/40 hover:border-[#FAB90E] hover:bg-[#FAB90E]/10 text-[#FAB90E] text-sm font-medium transition-all duration-200"
              >
                <Key className="w-4 h-4" />
                <span className="hidden sm:inline">Reset Password</span>
                <span className="sm:hidden">Reset</span>
              </button>
            </div>
          </div>

          {/* Separador */}
          <div className="border-t border-border/50" />

          {/* --- PERMISOS DE ACCESO --- */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              <Shield className="w-3.5 h-3.5" />
              <span>Permisos de Acceso</span>
            </div>

            {isLoadingPermisos ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <>
                {/* Cabecera de la matriz */}
                <div className="grid grid-cols-[minmax(0,1fr)_repeat(4,2.75rem)] gap-2 items-center pb-2 border-b-2 border-border/50">
                  <div className="text-xs font-medium text-muted-foreground">Módulo</div>
                  {ACCIONES_LABELS.map((acc) => {
                    const Icon = ICONOS_ACCIONES[acc.icon]
                    return (
                      <div key={acc.key} className="flex flex-col items-center gap-0.5">
                        {Icon && <Icon className="w-3.5 h-3.5 text-muted-foreground" />}
                        <span className="text-[10px] text-muted-foreground hidden sm:inline">{acc.label}</span>
                      </div>
                    )
                  })}
                </div>

                {/* Filas de módulos */}
                {MODULOS_PERMISOS.map((mod) => {
                  const ModIcon = ICONOS_MODULOS[mod.icon] || FileText
                  return (
                    <div
                      key={mod.key}
                      className="grid grid-cols-[minmax(0,1fr)_repeat(4,2.75rem)] gap-2 items-center py-2.5 border-b border-border/20"
                    >
                      {/* Nombre del módulo */}
                      <div className="flex items-center gap-2 min-w-0">
                        <ModIcon className="w-4 h-4 text-muted-foreground shrink-0" />
                        <span className="text-sm font-medium truncate">{mod.label}</span>
                      </div>

                      {/* Toggles CRUD */}
                      {ACCIONES_LABELS.map((acc) => {
                        const applicable = mod.acciones[acc.key]
                        const active = permisos[mod.key]?.[acc.key] ?? false
                        return (
                          <div key={acc.key} className="flex justify-center">
                            <ToggleSwitch
                              active={active && applicable}
                              disabled={!applicable}
                              onToggle={() => handleToggle(mod.key, acc.key)}
                            />
                          </div>
                        )
                      })}
                    </div>
                  )
                })}

                {/* Nota informativa */}
                <div className="p-3 bg-muted/30 rounded-lg border border-border/50">
                  <p className="text-xs text-muted-foreground">
                    Los permisos se aplican inmediatamente después de guardar. El usuario necesitará volver a iniciar sesión para que los cambios surtan efecto en su sesión actual.
                  </p>
                </div>
              </>
            )}
          </div>
        </div>

        {/* === FOOTER STICKY === */}
        <div className="shrink-0 border-t border-border/50 p-4 sm:p-6">
          <button
            onClick={handleSavePermisos}
            disabled={!hayCambios || isSavingPermisos || isLoadingPermisos}
            className={cn(
              "w-full h-12 rounded-lg font-semibold text-sm transition-all duration-200 flex items-center justify-center gap-2",
              hayCambios && !isSavingPermisos
                ? "bg-[#FAB90E] hover:bg-[#e5a705] text-black shadow-lg"
                : "bg-muted/50 text-muted-foreground cursor-not-allowed",
            )}
          >
            {isSavingPermisos ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Guardando...</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>Guardar Cambios</span>
              </>
            )}
          </button>
        </div>
      </aside>

      {/* === MODAL DE CONFIRMACIÓN PARA ACCIONES === */}
      {actionConfirm.open && (
        <div className="fixed top-16 inset-x-0 bottom-0 z-[60] flex items-center justify-center p-3 sm:p-4">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => !isActionLoading && setActionConfirm({ open: false, action: "deactivate" })}
          />
          <div className="relative bg-card border-2 border-border/50 rounded-xl shadow-2xl max-w-md w-full">
            <div className="p-5 sm:p-6 space-y-4">
              <div className="flex items-center gap-3">
                <div
                  className={cn(
                    "p-2.5 sm:p-3 rounded-xl text-white shadow-lg shrink-0",
                    actionConfirm.action === "deactivate"
                      ? "bg-red-500"
                      : actionConfirm.action === "reactivate"
                        ? "bg-green-600"
                        : "bg-[#FAB90E]",
                  )}
                >
                  <AlertTriangle className="w-5 h-5 sm:w-6 sm:h-6" />
                </div>
                <h3 className="text-lg sm:text-xl font-bold">
                  {actionConfirm.action === "deactivate" && "Desactivar Usuario"}
                  {actionConfirm.action === "reactivate" && "Reactivar Usuario"}
                  {actionConfirm.action === "reset" && "Resetear Password"}
                </h3>
              </div>

              <p className="text-sm text-muted-foreground">
                {actionConfirm.action === "deactivate" && (
                  <>¿Desactivar a <strong className="text-white">{user.name}</strong>? No podrá acceder al sistema.</>
                )}
                {actionConfirm.action === "reactivate" && (
                  <>¿Reactivar a <strong className="text-white">{user.name}</strong>? Podrá acceder nuevamente.</>
                )}
                {actionConfirm.action === "reset" && (
                  <>¿Resetear el password de <strong className="text-white">{user.name}</strong>? Se generará uno nuevo.</>
                )}
              </p>

              <div className="flex gap-2 pt-1">
                <button
                  onClick={() => setActionConfirm({ open: false, action: "deactivate" })}
                  disabled={isActionLoading}
                  className="flex-1 h-11 border-2 border-border/50 hover:border-border rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleAction}
                  disabled={isActionLoading}
                  className={cn(
                    "flex-1 h-11 rounded-lg text-white text-sm font-medium transition-colors flex items-center justify-center gap-2 disabled:opacity-50",
                    actionConfirm.action === "deactivate"
                      ? "bg-red-600 hover:bg-red-700"
                      : actionConfirm.action === "reactivate"
                        ? "bg-green-600 hover:bg-green-700"
                        : "bg-[#233C7A] hover:bg-[#1e3566]",
                  )}
                >
                  {isActionLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                  {actionConfirm.action === "deactivate" && "Desactivar"}
                  {actionConfirm.action === "reactivate" && "Reactivar"}
                  {actionConfirm.action === "reset" && "Resetear"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* === MODAL DE EDICIÓN === */}
      {editModalOpen && (
        <EditarUsuarioModalSimple
          open={editModalOpen}
          onOpenChange={setEditModalOpen}
          onUserUpdated={async () => {
            onUserUpdated()
          }}
          userId={user.id}
          initialData={{
            email: user.email,
            name: user.name,
            role: user.role,
            isActive: user.isActive,
          }}
        />
      )}
    </>
  )
}
