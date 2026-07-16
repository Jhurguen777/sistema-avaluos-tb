"use client"

import { useState } from "react"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { ROLE_LABELS } from "@/src/constants/roles"
import { Loader2, Search, Edit, Power, PowerOff, Key, X, AlertTriangle } from "lucide-react"
import { toast } from "@/components/ui/use-toast"
import { RoleBadge } from "./badge-rol"
import { EstadoBadge } from "./badge-estado"
import { deactivateUserAction, reactivateUserAction } from "@/modules/users/actions"
import { EditarUsuarioModalSimple } from "./editar-usuario-modal-simple"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select"

interface User {
  id: string
  email: string
  name: string
  role: string
  isActive: boolean
  createdAt: Date
  lastLoginAt: Date | null
}

interface UsersTableProps {
  initialUsers: User[]
  initialTotal: number
  onUserChange?: () => void
}

export function UsuariosTable({ initialUsers, initialTotal, onUserChange }: UsersTableProps) {
  const [users, setUsers] = useState<User[]>(initialUsers)
  const [total, setTotal] = useState(initialTotal)
  const [isLoading, setIsLoading] = useState(false)

  // Filtros
  const [search, setSearch] = useState("")
  const [roleFilter, setRoleFilter] = useState<string>("all")
  const [isActiveFilter, setIsActiveFilter] = useState<string>("all")
  const [page, setPage] = useState(1)
  const limit = 10

  // Action modal state
  const [actionModal, setActionModal] = useState<{
    open: boolean
    userId: string
    userName: string
    action: "deactivate" | "reactivate" | "reset"
  }>({
    open: false,
    userId: "",
    userName: "",
    action: "deactivate",
  })

  // Edit modal state
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)

  const applyFilters = async () => {
    setIsLoading(true)
    try {
      const params: any = {
        page,
        limit,
      }

      if (search) params.search = search
      if (roleFilter !== "all") params.role = roleFilter
      if (isActiveFilter !== "all") params.isActive = isActiveFilter === "true"

      const { listUsersAction } = await import("@/modules/users/actions")
      const result = await listUsersAction(params)

      if (result.success && result.data) {
        setUsers(result.data.users)
        setTotal(result.data.pagination.total)
      }
    } catch (error) {
      console.error("Error filtering users:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeactivate = async () => {
    if (!actionModal.userId) return

    setIsLoading(true)
    try {
      const result = await deactivateUserAction(actionModal.userId)
      if (result.success) {
        toast.success("Usuario desactivado", `${actionModal.userName} ya no puede acceder al sistema`)
        setActionModal({ ...actionModal, open: false })
        await applyFilters()
        onUserChange?.()
      } else {
        toast.error("Error al desactivar", result.error || "No se pudo desactivar el usuario")
      }
    } catch (error) {
      toast.error("Error al desactivar usuario", "Intente nuevamente más tarde")
    } finally {
      setIsLoading(false)
    }
  }

  const handleReactivate = async () => {
    if (!actionModal.userId) return

    setIsLoading(true)
    try {
      const result = await reactivateUserAction(actionModal.userId)
      if (result.success) {
        toast.success("Usuario reactivado", `${actionModal.userName} puede acceder al sistema nuevamente`)
        setActionModal({ ...actionModal, open: false })
        await applyFilters()
        onUserChange?.()
      } else {
        toast.error("Error al reactivar", result.error || "No se pudo reactivar el usuario")
      }
    } catch (error) {
      toast.error("Error al reactivar usuario", "Intente nuevamente más tarde")
    } finally {
      setIsLoading(false)
    }
  }

  const handleResetPassword = async () => {
    if (!actionModal.userId) return

    setIsLoading(true)
    try {
      const { resetPasswordAction } = await import("@/modules/users/actions")
      const tempPassword = Math.random().toString(36).slice(-8)
      const result = await resetPasswordAction(actionModal.userId, { newPassword: tempPassword, confirmPassword: tempPassword })

      if (result.success) {
        const newPassword = result.data?.tempPassword || tempPassword
        toast.success("Password reseteado", `Nuevo password: ${newPassword}`, 10000)
        setActionModal({ ...actionModal, open: false })
      } else {
        toast.error("Error al resetear", result.error || "No se pudo resetear el password")
      }
    } catch (error) {
      toast.error("Error al resetear password", "Intente nuevamente más tarde")
    } finally {
      setIsLoading(false)
    }
  }

  const totalPages = Math.ceil(total / limit)

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* === FIX 1: FILTROS RESPONSIVOS === */}
      <div className="bg-card border-2 border-border/50 rounded-lg p-3 sm:p-4 lg:p-6">
        <div className="flex flex-col gap-3 w-full sm:flex-row sm:items-center">
          {/* Buscador - full width en móvil */}
          <div className="relative w-full sm:flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Buscar por nombre o email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full h-10 sm:h-11 pl-10 pr-4 border-2 border-border/50 rounded-md focus:border-[#FAB90E] focus:outline-none transition-all duration-200 text-sm"
              onKeyDown={(e) => e.key === "Enter" && applyFilters()}
            />
          </div>

          {/* Dropdowns - full width en móvil, ancho fijo en desktop */}
          <div className="flex flex-col gap-2 w-full sm:flex-row sm:w-auto">
            {/* Select de Roles - Custom con display manual del valor */}
            <Select value={roleFilter} onValueChange={setRoleFilter} defaultValue="all">
              <SelectTrigger className="w-full sm:w-[160px] md:w-[180px] h-10 sm:h-11 border-2 border-border/50 rounded-md bg-card text-white focus:border-[#FAB90E] focus:outline-none focus:ring-2 focus:ring-[#FAB90E] relative">
                <span className="text-white text-sm">{roleFilter === "all" ? "Todos los roles" : (ROLE_LABELS[roleFilter as keyof typeof ROLE_LABELS] || roleFilter)}</span>
              </SelectTrigger>
              <SelectContent align="start" className="w-[var(--radix-select-trigger-width)] bg-card border-border/50">
                <SelectItem value="all">Todos los roles</SelectItem>
                {Object.entries(ROLE_LABELS).map(([key, label]) => (
                  <SelectItem key={key} value={key}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Select de Estados - Custom con display manual del valor */}
            <Select value={isActiveFilter} onValueChange={setIsActiveFilter} defaultValue="all">
              <SelectTrigger className="w-full sm:w-[160px] md:w-[180px] h-10 sm:h-11 border-2 border-border/50 rounded-md bg-card text-white focus:border-[#FAB90E] focus:outline-none focus:ring-2 focus:ring-[#FAB90E] relative">
                <span className="text-white text-sm">
                  {isActiveFilter === "all" ? "Todos los estados" : isActiveFilter === "true" ? "Activos" : "Inactivos"}
                </span>
              </SelectTrigger>
              <SelectContent align="start" className="w-[var(--radix-select-trigger-width)] bg-card border-border/50">
                <SelectItem value="all">Todos los estados</SelectItem>
                <SelectItem value="true">Activos</SelectItem>
                <SelectItem value="false">Inactivos</SelectItem>
              </SelectContent>
            </Select>

            <button
              onClick={applyFilters}
              disabled={isLoading}
              className="h-10 sm:h-11 px-4 sm:px-6 bg-[#233C7A] hover:bg-[#1e3566] shadow-lg hover:shadow-xl transition-all duration-300 text-white font-medium rounded-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center w-full sm:w-auto text-sm"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Filtrar"
              )}
            </button>
          </div>
        </div>
      </div>

      {/* === TABLA CON CSS GRID (Alineación milimétrica + Responsive) === */}
      <div className="bg-card border-2 border-border/50 rounded-lg">
        {/* Contenedor con scroll horizontal optimizado para móvil */}
        <div className="w-full overflow-x-auto scrollbar-thin">
          <div className="min-w-[900px]">
            {/* Cabecera con Grid - Altura fija para alineación perfecta */}
            <div className="grid grid-cols-[2fr_2.5fr_1.2fr_1.2fr_1.8fr_120px] items-center gap-3 w-full bg-muted/50 px-4 py-4 border-b-2 border-slate-800 text-xs font-medium">
              <div className="text-left self-center">Usuario</div>
              <div className="text-left hidden sm:block self-center">Email</div>
              <div className="text-center self-center">Rol</div>
              <div className="text-center self-center">Estado</div>
              <div className="text-center hidden lg:block self-center">Último Login</div>
              <div className="text-right pr-4 self-center min-w-[120px] shrink-0">Acciones</div>
            </div>

            {/* Cuerpo con Grid */}
            {users.length === 0 ? (
              <div className="text-center py-8 sm:py-12 text-muted-foreground">
                <div className="flex flex-col items-center gap-2 sm:gap-3 px-4">
                  <div className="p-3 sm:p-4 rounded-full bg-muted/50">
                    <Search className="w-6 h-6 sm:w-8 sm:h-8 text-muted-foreground" />
                  </div>
                  <p className="text-sm sm:text-base">No se encontraron usuarios</p>
                  <p className="text-xs sm:text-sm">Intenta con otros filtros o crea un nuevo usuario</p>
                </div>
              </div>
            ) : (
              <div>
                {users.map((user) => (
                  <div
                    key={user.id}
                    className="grid grid-cols-[2fr_2.5fr_1.2fr_1.2fr_1.8fr_120px] items-center gap-3 w-full px-4 py-4 border-b border-slate-800 hover:bg-slate-800/50 transition-colors min-h-[60px]"
                  >
                    {/* Usuario */}
                    <div className="text-left self-center">
                      <div className="font-medium text-sm truncate" title={user.name}>
                        {user.name}
                      </div>
                    </div>

                    {/* Email */}
                    <div className="text-left hidden sm:block self-center">
                      <div className="text-sm text-slate-300 truncate" title={user.email}>
                        {user.email}
                      </div>
                    </div>

                    {/* Rol */}
                    <div className="text-center self-center">
                      <div className="flex justify-center">
                        <RoleBadge role={user.role as "ADMIN" | "ARQUITECTO" | "INGENIERO_CIVIL" | "VALUADOR"} />
                      </div>
                    </div>

                    {/* Estado */}
                    <div className="text-center self-center">
                      <div className="flex justify-center">
                        <EstadoBadge isActive={user.isActive} />
                      </div>
                    </div>

                    {/* Último Login */}
                    <div className="text-center text-xs hidden lg:block self-center">
                      <div className="text-slate-400">
                        {user.lastLoginAt
                          ? format(new Date(user.lastLoginAt), "dd/MM/yyyy HH:mm", { locale: es })
                          : "Nunca"}
                      </div>
                    </div>

                    {/* Acciones - Contenedor con nowrap para prevenir colapso */}
                    <div className="text-right pr-4 self-center min-w-[120px] shrink-0">
                      <div className="flex items-center justify-end gap-3 flex-nowrap">
                        <button
                          onClick={() => {
                            setEditingUser(user)
                            setEditModalOpen(true)
                          }}
                          className="p-2.5 rounded-md hover:bg-[#FAB90E]/20 transition-all duration-200"
                          title="Editar"
                        >
                          <Edit className="h-[20px] w-[20px] text-white" />
                        </button>
                        <button
                          onClick={() =>
                            setActionModal({
                              open: true,
                              userId: user.id,
                              userName: user.name,
                              action: user.isActive ? "deactivate" : "reactivate",
                            })
                          }
                          className="p-2.5 rounded-md hover:bg-[#E0081D]/20 transition-all duration-200"
                          title={user.isActive ? "Desactivar" : "Reactivar"}
                        >
                          {user.isActive ? (
                            <PowerOff className="h-[20px] w-[20px] text-[#E0081D]" />
                          ) : (
                            <Power className="h-[20px] w-[20px] text-green-600" />
                          )}
                        </button>
                        <button
                          onClick={() =>
                            setActionModal({
                              open: true,
                              userId: user.id,
                              userName: user.name,
                              action: "reset",
                            })
                          }
                          className="p-2.5 rounded-md hover:bg-[#FAB90E]/20 transition-all duration-200"
                          title="Resetear Password"
                        >
                          <Key className="h-[20px] w-[20px] text-white" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Paginación */}
      {totalPages > 1 && (
        <div className="bg-card border-2 border-border/50 rounded-lg p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4">
            <p className="text-xs sm:text-sm text-muted-foreground text-center sm:text-left">
              Mostrando {(page - 1) * limit + 1} - {Math.min(page * limit, total)} de {total} usuarios
            </p>
            <div className="flex gap-2 w-full sm:w-auto justify-center">
              <button
                onClick={() => {
                  setPage(page - 1)
                  applyFilters()
                }}
                disabled={page === 1 || isLoading}
                className="h-9 sm:h-10 px-3 sm:px-4 border-2 border-border/50 hover:border-[#FAB90E] transition-all duration-200 text-xs sm:text-sm font-medium rounded-md bg-card disabled:opacity-50 disabled:cursor-not-allowed flex-1 sm:flex-none"
              >
                Anterior
              </button>
              <div className="flex items-center gap-2 px-2 sm:px-3">
                <span className="text-xs sm:text-sm font-medium">{page} / {totalPages}</span>
              </div>
              <button
                onClick={() => {
                  setPage(page + 1)
                  applyFilters()
                }}
                disabled={page === totalPages || isLoading}
                className="h-9 sm:h-10 px-3 sm:px-4 border-2 border-border/50 hover:border-[#FAB90E] transition-all duration-200 text-xs sm:text-sm font-medium rounded-md bg-card disabled:opacity-50 disabled:cursor-not-allowed flex-1 sm:flex-none"
              >
                Siguiente
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal nativo de confirmación */}
      {actionModal.open && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-4 lg:p-6">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => !isLoading && setActionModal({ ...actionModal, open: false })}
          />
          <div className="relative bg-card border-2 border-border/50 rounded-lg shadow-2xl max-w-md w-full m-3">
            <button
              onClick={() => !isLoading && setActionModal({ ...actionModal, open: false })}
              disabled={isLoading}
              className="absolute right-3 top-3 sm:right-4 sm:top-4 p-1 rounded-full hover:bg-muted transition-colors disabled:opacity-50 z-10"
            >
              <X className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
            <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className={`p-2 sm:p-3 rounded-xl text-white shadow-lg flex-shrink-0 ${
                  actionModal.action === "deactivate"
                    ? "bg-[#E0081D]"
                    : actionModal.action === "reactivate"
                    ? "bg-green-600"
                    : "bg-[#FAB90E]"
                }`}>
                  <AlertTriangle className="w-5 h-5 sm:w-6 sm:h-6" />
                </div>
                <div className="flex-1 min-w-0">
                  <h2 className="text-lg sm:text-2xl font-bold truncate">
                    {actionModal.action === "deactivate" && "Desactivar Usuario"}
                    {actionModal.action === "reactivate" && "Reactivar Usuario"}
                    {actionModal.action === "reset" && "Resetear Password"}
                  </h2>
                </div>
              </div>
              <div className="text-muted-foreground text-sm sm:text-base">
                {actionModal.action === "deactivate" && (
                  <p>¿Estás seguro de desactivar a <strong>{actionModal.userName}</strong>? El usuario no podrá acceder al sistema.</p>
                )}
                {actionModal.action === "reactivate" && (
                  <p>¿Estás seguro de reactivar a <strong>{actionModal.userName}</strong>? El usuario podrá acceder al sistema nuevamente.</p>
                )}
                {actionModal.action === "reset" && (
                  <p>¿Estás seguro de resetear el password de <strong>{actionModal.userName}</strong>? Se generará un nuevo password temporal.</p>
                )}
              </div>
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 pt-2">
                <button
                  onClick={() => setActionModal({ ...actionModal, open: false })}
                  disabled={isLoading}
                  className="h-10 sm:h-11 border-2 border-border/50 hover:border-[#FAB90E] transition-all duration-200 text-sm font-medium rounded-md bg-card disabled:opacity-50 disabled:cursor-not-allowed order-2 sm:order-1"
                >
                  Cancelar
                </button>
                <button
                  onClick={
                    actionModal.action === "deactivate"
                      ? handleDeactivate
                      : actionModal.action === "reactivate"
                      ? handleReactivate
                      : handleResetPassword
                  }
                  disabled={isLoading}
                  className={`h-10 sm:h-11 px-4 text-white font-medium rounded-md shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center order-1 sm:order-2 ${
                    actionModal.action === "deactivate"
                      ? "bg-[#E0081D] hover:bg-[#c40018]"
                      : "bg-[#233C7A] hover:bg-[#1e3566]"
                  }`}
                >
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {actionModal.action === "deactivate" && "Desactivar"}
                  {actionModal.action === "reactivate" && "Reactivar"}
                  {actionModal.action === "reset" && "Resetear"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de editar usuario */}
      {editingUser && (
        <EditarUsuarioModalSimple
          open={editModalOpen}
          onOpenChange={setEditModalOpen}
          onUserUpdated={async () => {
            await applyFilters()
            onUserChange?.()
          }}
          userId={editingUser.id}
          initialData={{
            email: editingUser.email,
            name: editingUser.name,
            role: editingUser.role,
            isActive: editingUser.isActive,
          }}
        />
      )}
    </div>
  )
}
