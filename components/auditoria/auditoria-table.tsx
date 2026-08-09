"use client"

import React, { useState, useEffect } from "react"
import { listAuditLogsAction } from "@/shared/security/audit-action"
import { toast } from "@/components/ui/use-toast"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select"
import {
  Loader2,
  Search,
  History,
  Filter,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
} from "lucide-react"

/** Etiquetas legibles para cada acción auditada */
const ACTION_LABELS: Record<string, { label: string; color: string }> = {
  USER_CREATED: { label: "Usuario creado", color: "text-green-400" },
  USER_UPDATED: { label: "Usuario actualizado", color: "text-blue-400" },
  USER_DELETED: { label: "Usuario eliminado", color: "text-red-400" },
  USER_DEACTIVATED: { label: "Usuario desactivado", color: "text-orange-400" },
  USER_REACTIVATED: { label: "Usuario reactivado", color: "text-green-400" },
  USER_PASSWORD_CHANGED: { label: "Contraseña cambiada", color: "text-yellow-400" },
  USER_PASSWORD_RESET: { label: "Contraseña reseteada", color: "text-yellow-400" },
  USER_ROLE_CHANGED: { label: "Rol cambiado", color: "text-purple-400" },
  AVALUO_CREATED: { label: "Avalúo creado", color: "text-green-400" },
  AVALUO_UPDATED: { label: "Avalúo actualizado", color: "text-blue-400" },
  AVALUO_DELETED: { label: "Avalúo eliminado", color: "text-red-400" },
  AVALUO_APPROVED: { label: "Avalúo aprobado", color: "text-green-400" },
  AVALUO_REJECTED: { label: "Avalúo rechazado", color: "text-red-400" },
  AVALUO_SUBMITTED: { label: "Avalúo enviado", color: "text-blue-400" },
  INMUEBLE_CREATED: { label: "Inmueble creado", color: "text-green-400" },
  INMUEBLE_UPDATED: { label: "Inmueble actualizado", color: "text-blue-400" },
  INMUEBLE_DELETED: { label: "Inmueble eliminado", color: "text-red-400" },
  COMPARABLE_CREATED: { label: "Comparable agregado", color: "text-green-400" },
  COMPARABLE_UPDATED: { label: "Comparable actualizado", color: "text-blue-400" },
  COMPARABLE_DELETED: { label: "Comparable eliminado", color: "text-red-400" },
  DOCUMENTO_UPLOADED: { label: "Documento subido", color: "text-green-400" },
  DOCUMENTO_DELETED: { label: "Documento eliminado", color: "text-red-400" },
  RADAR_GENERATED: { label: "Radar generado", color: "text-cyan-400" },
  LOGIN_SUCCESS: { label: "Inicio de sesión", color: "text-slate-400" },
  LOGIN_FAILED: { label: "Inicio fallido", color: "text-red-400" },
  LOGOUT: { label: "Cierre de sesión", color: "text-slate-400" },
}

const TABLE_LABELS: Record<string, string> = {
  users: "Usuarios",
  Product: "Inmuebles",
  avaluos: "Avalúos",
  comparables: "Comparables",
  Documento: "Documentos",
  AvaluoEntorno: "Entorno/Radar",
}

/** Agrupación de acciones para el filtro */
const ACTION_GROUPS = [
  { group: "Usuarios", actions: ["USER_CREATED", "USER_UPDATED", "USER_DELETED", "USER_DEACTIVATED", "USER_REACTIVATED", "USER_PASSWORD_CHANGED", "USER_PASSWORD_RESET", "USER_ROLE_CHANGED"] },
  { group: "Avalúos", actions: ["AVALUO_CREATED", "AVALUO_UPDATED", "AVALUO_DELETED", "AVALUO_APPROVED", "AVALUO_REJECTED", "AVALUO_SUBMITTED"] },
  { group: "Inmuebles", actions: ["INMUEBLE_CREATED", "INMUEBLE_UPDATED", "INMUEBLE_DELETED"] },
  { group: "Comparables", actions: ["COMPARABLE_CREATED", "COMPARABLE_UPDATED", "COMPARABLE_DELETED"] },
  { group: "Documentos", actions: ["DOCUMENTO_UPLOADED", "DOCUMENTO_DELETED"] },
  { group: "Radar", actions: ["RADAR_GENERATED"] },
]

const PAGE_SIZE = 25

interface AuditLog {
  id: string
  action: string
  tableName: string | null
  recordId: string | null
  oldValue: unknown
  newValue: unknown
  ipAddress: string | null
  createdAt: string | Date
  user: { id: string; email: string; name: string | null } | null
}

export function AuditoriaTable() {
  const [isLoading, setIsLoading] = useState(true)
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)

  // Filtros
  const [search, setSearch] = useState("")
  const [actionFilter, setActionFilter] = useState("all")
  const [tableFilter, setTableFilter] = useState("all")
  const [sinceDate, setSinceDate] = useState("")
  const [untilDate, setUntilDate] = useState("")
  const [refreshKey, setRefreshKey] = useState(0)

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))

  useEffect(() => {
    let active = true

    async function fetchLogs() {
      setIsLoading(true)
      try {
        const params: Record<string, unknown> = {
          skip: (page - 1) * PAGE_SIZE,
          take: PAGE_SIZE,
        }
        if (actionFilter !== "all") params.action = actionFilter
        if (tableFilter !== "all") params.tableName = tableFilter
        if (search.trim()) params.search = search.trim()
        if (sinceDate) params.since = new Date(sinceDate + "T00:00:00")
        if (untilDate) params.until = new Date(untilDate + "T23:59:59")

        const result = await listAuditLogsAction(params as Parameters<typeof listAuditLogsAction>[0])
        if (!active) return
        if (result.success && result.data) {
          setLogs(result.data.logs as unknown as AuditLog[])
          setTotal(result.data.total)
        } else {
          toast.error("Error", result.error || "No se pudieron cargar los logs")
        }
      } catch (error) {
        console.error("Error cargando auditoría:", error)
        toast.error("Error al cargar la auditoría")
      } finally {
        if (active) setIsLoading(false)
      }
    }

    fetchLogs()
    return () => {
      active = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, refreshKey])

  const triggerRefresh = () => setRefreshKey((k) => k + 1)

  const handleApplyFilters = () => {
    setPage(1)
    triggerRefresh()
  }

  const handleClearFilters = () => {
    setSearch("")
    setActionFilter("all")
    setTableFilter("all")
    setSinceDate("")
    setUntilDate("")
    setPage(1)
    triggerRefresh()
  }

  const formatDate = (iso: string | Date) => {
    const d = new Date(iso)
    return d.toLocaleString("es-BO", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  return (
    <div className="space-y-6">
      {/* === FILTROS === */}
      <Card className="border-2 border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl">
            <Filter className="w-5 h-5 text-primary" />
            Filtros
          </CardTitle>
          <CardDescription>Refina la búsqueda de actividad</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Búsqueda por usuario */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Buscar usuario</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                <Input
                  type="text"
                  placeholder="Nombre o correo..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleApplyFilters()}
                  className="pl-9"
                />
              </div>
            </div>

            {/* Filtro por acción */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Acción</label>
              <Select value={actionFilter} onValueChange={setActionFilter}>
                <SelectTrigger className="w-full">
                  <span className="text-sm">
                    {actionFilter === "all"
                      ? "Todas las acciones"
                      : ACTION_LABELS[actionFilter]?.label ?? actionFilter}
                  </span>
                </SelectTrigger>
                <SelectContent className="max-h-[300px]">
                  <SelectItem value="all">Todas las acciones</SelectItem>
                  {ACTION_GROUPS.map((grp) => (
                    <div key={grp.group}>
                      <p className="px-2 pt-2 pb-1 text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
                        {grp.group}
                      </p>
                      {grp.actions.map((a) => (
                        <SelectItem key={a} value={a}>
                          {ACTION_LABELS[a]?.label ?? a}
                        </SelectItem>
                      ))}
                    </div>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Filtro por tabla */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Módulo</label>
              <Select value={tableFilter} onValueChange={setTableFilter}>
                <SelectTrigger className="w-full">
                  <span className="text-sm">
                    {tableFilter === "all"
                      ? "Todos los módulos"
                      : TABLE_LABELS[tableFilter] ?? tableFilter}
                  </span>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los módulos</SelectItem>
                  {Object.entries(TABLE_LABELS).map(([key, label]) => (
                    <SelectItem key={key} value={key}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Fecha desde */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Desde</label>
              <Input
                type="date"
                value={sinceDate}
                onChange={(e) => setSinceDate(e.target.value)}
              />
            </div>

            {/* Fecha hasta */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Hasta</label>
              <Input
                type="date"
                value={untilDate}
                onChange={(e) => setUntilDate(e.target.value)}
              />
            </div>

            {/* Botones */}
            <div className="flex items-end gap-2">
              <Button
                onClick={handleApplyFilters}
                disabled={isLoading}
                className="bg-[#233C7A] hover:bg-[#1e3566] flex-1"
              >
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Filtrar"}
              </Button>
              <Button
                onClick={handleClearFilters}
                variant="outline"
                className="flex-1"
              >
                Limpiar
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* === TABLA DE LOGS === */}
      <Card className="border-2 border-border/50">
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div>
              <CardTitle className="flex items-center gap-2 text-xl">
                <History className="w-5 h-5 text-primary" />
                Registro de Actividad
              </CardTitle>
              <CardDescription>
                {total.toLocaleString("es-BO")} registro(s) en total
              </CardDescription>
            </div>
            <Button
              onClick={triggerRefresh}
              variant="outline"
              size="sm"
              disabled={isLoading}
              className="w-fit"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
              Actualizar
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            </div>
          ) : logs.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <div className="flex flex-col items-center gap-3">
                <div className="p-4 rounded-full bg-muted/50">
                  <Search className="w-8 h-8 text-muted-foreground" />
                </div>
                <p className="text-base">No se encontraron registros</p>
                <p className="text-sm">Prueba con otros filtros</p>
              </div>
            </div>
          ) : (
            <>
              {/* Contenedor con scroll horizontal en móvil */}
              <div className="w-full overflow-x-auto scrollbar-thin">
                <div className="min-w-[800px]">
                  {/* Cabecera */}
                  <div className="grid grid-cols-[1.4fr_1.6fr_2fr_1.2fr_1fr] items-center gap-3 w-full bg-muted/50 px-4 py-3 border-b-2 border-slate-800 text-xs font-medium">
                    <div className="text-left">Fecha</div>
                    <div className="text-left">Usuario</div>
                    <div className="text-left">Acción</div>
                    <div className="text-left hidden md:block">Módulo</div>
                    <div className="text-right pr-2">IP</div>
                  </div>

                  {/* Filas */}
                  {logs.map((log) => {
                    const actionMeta = ACTION_LABELS[log.action] ?? {
                      label: log.action,
                      color: "text-slate-400",
                    }
                    return (
                      <div
                        key={log.id}
                        className="grid grid-cols-[1.4fr_1.6fr_2fr_1.2fr_1fr] items-start gap-3 w-full px-4 py-3 border-b border-slate-800 hover:bg-slate-800/40 transition-colors"
                      >
                        {/* Fecha */}
                        <div className="text-left">
                          <span className="text-xs text-muted-foreground">
                            {formatDate(log.createdAt)}
                          </span>
                        </div>

                        {/* Usuario */}
                        <div className="text-left min-w-0">
                          <p className="text-sm font-medium truncate">
                            {log.user?.name ?? "Sistema"}
                          </p>
                          <p className="text-xs text-muted-foreground truncate">
                            {log.user?.email ?? "—"}
                          </p>
                        </div>

                        {/* Acción */}
                        <div className="text-left min-w-0">
                          <p className={`text-sm font-medium ${actionMeta.color}`}>
                            {actionMeta.label}
                          </p>
                          {log.recordId && (
                            <p className="text-[10px] text-muted-foreground/70 truncate font-mono">
                              ID: {log.recordId}
                            </p>
                          )}
                        </div>

                        {/* Módulo */}
                        <div className="text-left hidden md:block">
                          <span className="text-xs text-muted-foreground">
                            {log.tableName ? (TABLE_LABELS[log.tableName] ?? log.tableName) : "—"}
                          </span>
                        </div>

                        {/* IP */}
                        <div className="text-right">
                          <span className="text-[10px] text-muted-foreground/70 font-mono">
                            {log.ipAddress ?? "—"}
                          </span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Paginación */}
              <div className="flex items-center justify-between mt-4 pt-4 border-t border-border/50">
                <p className="text-xs text-muted-foreground">
                  Página {page} de {totalPages}
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page <= 1 || isLoading}
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page >= totalPages || isLoading}
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
