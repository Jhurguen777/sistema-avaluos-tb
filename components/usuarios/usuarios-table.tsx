"use client"

import { useState } from "react"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { ROLE_LABELS } from "@/src/constants/roles"
import { Loader2, Search } from "lucide-react"
import { RoleBadge } from "./badge-rol"
import { EstadoBadge } from "./badge-estado"
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

  const applyFilters = async (targetPage?: number) => {
    const pageToUse = targetPage ?? page
    setIsLoading(true)
    try {
      const params: any = {
        page: pageToUse,
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
        onUserChange?.()
      }
    } catch (error) {
      console.error("Error filtering users:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const totalPages = Math.ceil(total / limit)

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* === FILTROS RESPONSIVOS === */}
      <div className="bg-card border-2 border-border/50 rounded-lg p-3 sm:p-4 lg:p-6">
        <div className="flex flex-col gap-3 w-full sm:flex-row sm:items-center">
          {/* Buscador */}
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

          {/* Dropdowns */}
          <div className="flex flex-col gap-2 w-full sm:flex-row sm:w-auto">
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
              onClick={() => applyFilters()}
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

      {/* === TABLA CON CSS GRID === */}
      <div className="bg-card border-2 border-border/50 rounded-lg">
        {/* Cabecera */}
        <div className="grid grid-cols-[1.5fr_1fr_1fr] sm:grid-cols-[1.5fr_2fr_1fr_1fr] lg:grid-cols-[1.5fr_2fr_1fr_1fr_1.5fr] items-center gap-2 sm:gap-3 w-full bg-muted/50 px-3 sm:px-4 py-3 border-b-2 border-slate-800 text-xs font-medium">
          <div className="text-left self-center">Usuario</div>
          <div className="text-left hidden sm:block self-center">Email</div>
          <div className="text-center self-center">Rol</div>
          <div className="text-center self-center">Estado</div>
          <div className="text-center hidden lg:block self-center">Último Login</div>
        </div>

        {/* Cuerpo */}
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
                className="grid grid-cols-[1.5fr_1fr_1fr] sm:grid-cols-[1.5fr_2fr_1fr_1fr] lg:grid-cols-[1.5fr_2fr_1fr_1fr_1.5fr] items-center gap-2 sm:gap-3 w-full px-3 sm:px-4 py-3 sm:py-4 border-b border-slate-800 hover:bg-slate-800/50 transition-colors min-h-[56px] sm:min-h-[60px]"
              >
                {/* Usuario */}
                <div className="text-left self-center min-w-0">
                  <div className="font-medium text-sm truncate" title={user.name}>
                    {user.name}
                  </div>
                </div>

                {/* Email */}
                <div className="text-left hidden sm:block self-center min-w-0">
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
                <div className="text-center text-xs hidden lg:block self-center min-w-0">
                  <div className="text-slate-400">
                    {user.lastLoginAt
                      ? format(new Date(user.lastLoginAt), "dd/MM/yyyy HH:mm", { locale: es })
                      : "Nunca"}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
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
                  const newPage = Math.max(1, page - 1)
                  setPage(newPage)
                  applyFilters(newPage)
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
                  const newPage = Math.min(totalPages, page + 1)
                  setPage(newPage)
                  applyFilters(newPage)
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
    </div>
  )
}
