"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  FileText,
  Plus,
  Search,
  Eye,
  Edit,
  Download,
  Calendar,
  User,
  Building2,
  CheckCircle,
  Clock,
  XCircle,
  Loader2,
} from "lucide-react"
import Link from "next/link"
import { toast } from "@/components/ui/use-toast"
import { listAvaluosAction } from "@/modules/avaluos/actions"
import type { AvaluoDTO } from "@/modules/avaluos/types/avaluo.types"

type AvaluoEstado = "BORRADOR" | "EN_REVISION" | "APROBADO" | "RECHAZADO"
type AvaluoTipo = "COMERCIAL" | "ALQUILER" | "VENTA_RAPIDA" | "CAPITAL_COMERCIAL"

const estados: { value: AvaluoEstado; label: string; color: string }[] = [
  { value: "BORRADOR", label: "Borrador", color: "text-slate-400 bg-slate-400/10 border-slate-400/30" },
  { value: "EN_REVISION", label: "En Revisión", color: "text-yellow-400 bg-yellow-400/10 border-yellow-400/30" },
  { value: "APROBADO", label: "Aprobado", color: "text-green-400 bg-green-400/10 border-green-400/30" },
  { value: "RECHAZADO", label: "Rechazado", color: "text-red-400 bg-red-400/10 border-red-400/30" },
]

const tipos: { value: AvaluoTipo; label: string }[] = [
  { value: "COMERCIAL", label: "Comercial" },
  { value: "ALQUILER", label: "Alquiler" },
  { value: "VENTA_RAPIDA", label: "Venta Rápida" },
  { value: "CAPITAL_COMERCIAL", label: "Capital Comercial" },
]

export default function AvaluosPage() {
  const { data: session } = useSession()
  const [avaluos, setAvaluos] = useState<AvaluoDTO[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [filtroEstado, setFiltroEstado] = useState<string>("todos")

  const currentUserId = session?.user?.id || ""

  useEffect(() => {
    async function load() {
      try {
        const result = await listAvaluosAction({ page: 1, limit: 100 })
        if (result.success && result.data) setAvaluos(result.data.avaluos)
      } catch (error) {
        console.error("Error cargando avalúos:", error)
        toast.error("Error al cargar los avalúos")
      } finally {
        setIsLoading(false)
      }
    }
    load()
  }, [])

  // Filtrar avalúos
  const filteredAvaluos = avaluos.filter((avaluo) => {
    const q = searchTerm.toLowerCase()
    const matchesSearch =
      avaluo.codigo.toLowerCase().includes(q) ||
      avaluo.nombreInmueble.toLowerCase().includes(q) ||
      (avaluo.direccion ?? "").toLowerCase().includes(q) ||
      (avaluo.solicitante ?? "").toLowerCase().includes(q)

    const matchesEstado = filtroEstado === "todos" || avaluo.estado === filtroEstado

    return matchesSearch && matchesEstado
  })

  const getEstadoInfo = (estado: AvaluoEstado) => {
    return estados.find((e) => e.value === estado) || estados[0]
  }

  const getTipoLabel = (tipo: AvaluoTipo) => {
    return tipos.find((t) => t.value === tipo)?.label ?? tipo
  }

  const getEstadoIcon = (estado: AvaluoEstado) => {
    switch (estado) {
      case "BORRADOR":
        return <Clock className="w-4 h-4" />
      case "EN_REVISION":
        return <Clock className="w-4 h-4" />
      case "APROBADO":
        return <CheckCircle className="w-4 h-4" />
      case "RECHAZADO":
        return <XCircle className="w-4 h-4" />
    }
  }

  const canEdit = (avaluo: AvaluoDTO) => {
    return avaluo.createdBy === currentUserId
  }

  if (isLoading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[400px]">
        <Loader2 className="animate-spin h-10 w-10 text-primary mx-auto" />
      </div>
    )
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white">Total de Avalúos</h1>
          <p className="text-sm sm:text-base text-slate-400 mt-1">
            Todos los avalúos del sistema
          </p>
        </div>
        <Link href="/dashboard/avaluos/crear">
          <Button className="w-full sm:w-auto bg-primary hover:bg-primary/90">
            <Plus className="w-4 h-4 mr-2" />
            Nuevo Avalúo
          </Button>
        </Link>
      </div>

      {/* Filtros */}
      <Card className="border-2 border-slate-800 bg-slate-900/50">
        <div className="p-4 space-y-4">
          {/* Buscador */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
            <Input
              placeholder="Buscar por código, propiedad, solicitante..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-500"
            />
          </div>

          {/* Filtro por estado */}
          <div className="flex flex-wrap gap-2">
            <Button
              variant={filtroEstado === "todos" ? "default" : "outline"}
              size="sm"
              onClick={() => setFiltroEstado("todos")}
              className={filtroEstado === "todos" ? "bg-primary" : "border-slate-700 text-white hover:bg-slate-800"}
            >
              Todos ({avaluos.length})
            </Button>
            {estados.map((estado) => (
              <Button
                key={estado.value}
                variant={filtroEstado === estado.value ? "default" : "outline"}
                size="sm"
                onClick={() => setFiltroEstado(estado.value)}
                className={filtroEstado === estado.value ? "bg-primary" : "border-slate-700 text-white hover:bg-slate-800"}
              >
                {estado.label} ({avaluos.filter((a) => a.estado === estado.value).length})
              </Button>
            ))}
          </div>
        </div>
      </Card>

      {/* Tabla de avalúos - CSS Grid responsivo */}
      <Card className="border-2 border-slate-800 bg-slate-900/50 overflow-hidden">
        {/* Cabecera */}
        <div className="grid grid-cols-[1fr_1.5fr_1fr_1fr_1fr_120px] items-center gap-4 p-4 bg-slate-800/50 border-b-2 border-slate-800 text-xs font-medium text-slate-400 hidden lg:grid">
          <div>Código</div>
          <div>Propiedad</div>
          <div>Tipo</div>
          <div>Estado</div>
          <div>Creado por</div>
          <div className="text-right">Acciones</div>
        </div>

        {/* Filas */}
        <div className="divide-y divide-slate-800">
          {filteredAvaluos.length === 0 ? (
            <div className="p-8 text-center text-slate-500">
              {searchTerm || filtroEstado !== "todos"
                ? "No se encontraron avalúos con los filtros aplicados"
                : "No hay avalúos registrados"}
            </div>
          ) : (
            filteredAvaluos.map((avaluo) => {
              const estadoInfo = getEstadoInfo(avaluo.estado as AvaluoEstado)
              const editable = canEdit(avaluo)

              return (
                <div
                  key={avaluo.id}
                  className="grid grid-cols-1 lg:grid-cols-[1fr_1.5fr_1fr_1fr_1fr_120px] items-start lg:items-center gap-2 lg:gap-4 p-4 hover:bg-slate-800/30 transition-colors"
                >
                  {/* Código */}
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-slate-500 lg:hidden" />
                    <div>
                      <div className="text-xs text-slate-500 lg:hidden">Código</div>
                      <div className="text-sm font-medium text-white">{avaluo.codigo}</div>
                      <div className="text-xs text-slate-500 lg:hidden">
                        {new Date(avaluo.fechaElaboracion).toLocaleDateString()}
                      </div>
                    </div>
                  </div>

                  {/* Propiedad */}
                  <div className="flex-1">
                    <div className="text-xs text-slate-500 lg:hidden">Propiedad</div>
                    <div className="flex items-start gap-2">
                      <Building2 className="w-4 h-4 text-slate-500 mt-0.5 shrink-0" />
                      <div className="min-w-0">
                        <div className="text-sm text-white truncate" title={avaluo.nombreInmueble}>
                          {avaluo.nombreInmueble}
                        </div>
                        <div className="text-xs text-slate-500 truncate hidden sm:block" title={avaluo.direccion ?? ""}>
                          {avaluo.direccion || "Sin dirección"}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Tipo */}
                  <div>
                    <div className="text-xs text-slate-500 lg:hidden">Tipo</div>
                    <div className="text-sm text-slate-300">{getTipoLabel(avaluo.tipo as AvaluoTipo)}</div>
                  </div>

                  {/* Estado */}
                  <div>
                    <div className="text-xs text-slate-500 lg:hidden">Estado</div>
                    <span className={`px-2 py-1 text-xs font-medium rounded border flex items-center gap-1 w-fit ${estadoInfo.color}`}>
                      {getEstadoIcon(avaluo.estado as AvaluoEstado)}
                      {estadoInfo.label}
                    </span>
                  </div>

                  {/* Creado por */}
                  <div className="hidden lg:block">
                    <div className="flex items-center gap-2">
                      <User className="w-3.5 h-3.5 text-slate-500" />
                      <div className="text-sm text-slate-300 truncate" title={avaluo.creadoPorNombre ?? ""}>
                        {avaluo.creadoPorNombre || "—"}
                      </div>
                    </div>
                  </div>

                  {/* Acciones */}
                  <div className="flex items-center gap-2">
                    <Link href={`/dashboard/avaluos/${avaluo.id}`}>
                      <button
                        className="p-2 text-slate-400 hover:text-blue-400 transition-colors"
                        title="Ver detalle"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </Link>
                    {avaluo.estado === "APROBADO" && (
                      <Link href={`/dashboard/avaluos/${avaluo.id}`}>
                        <button
                          className="p-2 text-slate-400 hover:text-green-400 transition-colors"
                          title="Descargar PDF"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                      </Link>
                    )}
                    {editable && avaluo.estado !== "APROBADO" && (
                      <Link href={`/dashboard/avaluos/${avaluo.id}`}>
                        <button
                          className="p-2 text-slate-400 hover:text-yellow-400 transition-colors"
                          title="Editar"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                      </Link>
                    )}
                  </div>
                </div>
              )
            })
          )}
        </div>
      </Card>

      {/* Legend */}
      <Card className="border-2 border-slate-800 bg-slate-900/50">
        <div className="p-4">
          <h3 className="text-sm font-semibold text-white mb-3">Leyenda</h3>
          <div className="flex flex-wrap gap-4 text-xs text-slate-400">
            <div className="flex items-center gap-2">
              <Eye className="w-4 h-4" />
              <span>Ver detalle</span>
            </div>
            <div className="flex items-center gap-2">
              <Download className="w-4 h-4 text-green-400" />
              <span>Descargar PDF</span>
            </div>
            <div className="flex items-center gap-2">
              <Edit className="w-4 h-4 text-yellow-400" />
              <span>Editar (solo propios)</span>
            </div>
          </div>
        </div>
      </Card>
    </div>
  )
}
