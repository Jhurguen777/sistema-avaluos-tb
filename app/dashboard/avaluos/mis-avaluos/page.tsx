"use client"

import { useState } from "react"
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
  Building2,
  CheckCircle,
  Clock,
  XCircle
} from "lucide-react"
import Link from "next/link"

type AvaluoEstado = "BORRADOR" | "EN_REVISION" | "APROBADO" | "RECHAZADO"
type AvaluoTipo = "COMERCIAL" | "ALQUILER" | "VENTA_RAPIDA" | "CAPITAL_COMERCIAL"

interface Avaluo {
  id: string
  codigo: string
  tipo: AvaluoTipo
  estado: AvaluoEstado
  fechaElaboracion: string
  solicitante?: string
  propiedadNombre: string
  propiedadDireccion: string
}

const estados: { value: AvaluoEstado; label: string; color: string }[] = [
  { value: "BORRADOR", label: "Borrador", color: "text-slate-400 bg-slate-400/10 border-slate-400/30" },
  { value: "EN_REVISION", label: "En Revisión", color: "text-yellow-400 bg-yellow-400/10 border-yellow-400/30" },
  { value: "APROBADO", label: "Aprobado", color: "text-green-400 bg-green-400/10 border-green-400/30" },
  { value: "RECHAZADO", label: "Rechazado", color: "text-red-400 bg-red-400/10 border-red-400/30" }
]

const tipos: { value: AvaluoTipo; label: string }[] = [
  { value: "COMERCIAL", label: "Comercial" },
  { value: "ALQUILER", label: "Alquiler" },
  { value: "VENTA_RAPIDA", label: "Venta Rápida" },
  { value: "CAPITAL_COMERCIAL", label: "Capital Comercial" }
]

// Datos mock - en producción vienen de la BD filtrados por usuario
const mockMisAvaluos: Avaluo[] = [
  {
    id: "1",
    codigo: "AVAL-2026-001",
    tipo: "COMERCIAL",
    estado: "APROBADO",
    fechaElaboracion: "2026-01-15",
    solicitante: "Juan Pérez",
    propiedadNombre: "Departamento Centro",
    propiedadDireccion: "Calle Sucre 123"
  },
  {
    id: "3",
    codigo: "AVAL-2026-003",
    tipo: "COMERCIAL",
    estado: "BORRADOR",
    fechaElaboracion: "2026-03-10",
    solicitante: "Luis Torres",
    propiedadNombre: "Local Comercial",
    propiedadDireccion: "Calle Florida 789"
  }
]

export default function MisAvaluosPage() {
  const { data: session } = useSession()
  const [avaluos, setAvaluos] = useState<Avaluo[]>(mockMisAvaluos)
  const [searchTerm, setSearchTerm] = useState("")
  const [filtroEstado, setFiltroEstado] = useState<string>("todos")

  // Filtrar avalúos
  const filteredAvaluos = avaluos.filter(avaluo => {
    const matchesSearch =
      avaluo.codigo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      avaluo.propiedadNombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      avaluo.propiedadDireccion.toLowerCase().includes(searchTerm.toLowerCase()) ||
      avaluo.solicitante?.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesEstado = filtroEstado === "todos" || avaluo.estado === filtroEstado

    return matchesSearch && matchesEstado
  })

  const getEstadoInfo = (estado: AvaluoEstado) => {
    return estados.find(e => e.value === estado) || estados[0]
  }

  const getTipoLabel = (tipo: AvaluoTipo) => {
    return tipos.find(t => t.value === tipo)?.label || tipo
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

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white">Mis Avalúos</h1>
          <p className="text-sm sm:text-base text-slate-400 mt-1">
            Avalúos creados por mí
          </p>
        </div>
        <Link href="/dashboard/avaluos/crear">
          <Button className="w-full sm:w-auto bg-primary hover:bg-primary/90">
            <Plus className="w-4 h-4 mr-2" />
            Nuevo Avalúo
          </Button>
        </Link>
      </div>

      {/* Estadísticas rápidas */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="border-2 border-slate-800 bg-slate-900/50 p-4">
          <div className="text-2xl sm:text-3xl font-bold text-white">{avaluos.length}</div>
          <div className="text-xs sm:text-sm text-slate-400">Total</div>
        </Card>
        <Card className="border-2 border-slate-800 bg-slate-900/50 p-4">
          <div className="text-2xl sm:text-3xl font-bold text-slate-400">
            {avaluos.filter(a => a.estado === "BORRADOR").length}
          </div>
          <div className="text-xs sm:text-sm text-slate-400">Borradores</div>
        </Card>
        <Card className="border-2 border-slate-800 bg-slate-900/50 p-4">
          <div className="text-2xl sm:text-3xl font-bold text-yellow-400">
            {avaluos.filter(a => a.estado === "EN_REVISION").length}
          </div>
          <div className="text-xs sm:text-sm text-slate-400">En Revisión</div>
        </Card>
        <Card className="border-2 border-slate-800 bg-slate-900/50 p-4">
          <div className="text-2xl sm:text-3xl font-bold text-green-400">
            {avaluos.filter(a => a.estado === "APROBADO").length}
          </div>
          <div className="text-xs sm:text-sm text-slate-400">Aprobados</div>
        </Card>
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
            {estados.map(estado => (
              <Button
                key={estado.value}
                variant={filtroEstado === estado.value ? "default" : "outline"}
                size="sm"
                onClick={() => setFiltroEstado(estado.value)}
                className={filtroEstado === estado.value ? "bg-primary" : "border-slate-700 text-white hover:bg-slate-800"}
              >
                {estado.label} ({avaluos.filter(a => a.estado === estado.value).length})
              </Button>
            ))}
          </div>
        </div>
      </Card>

      {/* Tabla de avalúos - CSS Grid responsivo */}
      <Card className="border-2 border-slate-800 bg-slate-900/50 overflow-hidden">
        {/* Cabecera */}
        <div className="grid grid-cols-[1fr_1.5fr_1fr_1fr_100px] items-center gap-4 p-4 bg-slate-800/50 border-b-2 border-slate-800 text-xs font-medium text-slate-400 hidden sm:grid">
          <div>Código</div>
          <div>Propiedad</div>
          <div>Tipo</div>
          <div>Estado</div>
          <div className="text-right">Acciones</div>
        </div>

        {/* Filas */}
        <div className="divide-y divide-slate-800">
          {filteredAvaluos.length === 0 ? (
            <div className="p-8 text-center text-slate-500">
              {searchTerm || filtroEstado !== "todos"
                ? "No se encontraron avalúos con los filtros aplicados"
                : "No has creado ningún avalúo aún"}
            </div>
          ) : (
            filteredAvaluos.map((avaluo) => {
              const estadoInfo = getEstadoInfo(avaluo.estado)

              return (
                <div
                  key={avaluo.id}
                  className="grid grid-cols-1 sm:grid-cols-[1fr_1.5fr_1fr_1fr_100px] items-start sm:items-center gap-2 sm:gap-4 p-4 hover:bg-slate-800/30 transition-colors"
                >
                  {/* Código */}
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-slate-500 sm:hidden" />
                    <div>
                      <div className="text-xs text-slate-500 sm:hidden">Código</div>
                      <div className="text-sm font-medium text-white">{avaluo.codigo}</div>
                      <div className="text-xs text-slate-500 sm:hidden flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {new Date(avaluo.fechaElaboracion).toLocaleDateString()}
                      </div>
                    </div>
                  </div>

                  {/* Propiedad */}
                  <div className="flex-1">
                    <div className="text-xs text-slate-500 sm:hidden">Propiedad</div>
                    <div className="flex items-start gap-2">
                      <Building2 className="w-4 h-4 text-slate-500 mt-0.5 shrink-0" />
                      <div className="min-w-0">
                        <div className="text-sm text-white truncate" title={avaluo.propiedadNombre}>
                          {avaluo.propiedadNombre}
                        </div>
                        <div className="text-xs text-slate-500 truncate hidden sm:block" title={avaluo.propiedadDireccion}>
                          {avaluo.propiedadDireccion}
                        </div>
                        {avaluo.solicitante && (
                          <div className="text-xs text-slate-500 hidden sm:block">
                            Solicitante: {avaluo.solicitante}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Tipo */}
                  <div>
                    <div className="text-xs text-slate-500 sm:hidden">Tipo</div>
                    <div className="text-sm text-slate-300">{getTipoLabel(avaluo.tipo)}</div>
                  </div>

                  {/* Estado */}
                  <div>
                    <div className="text-xs text-slate-500 sm:hidden">Estado</div>
                    <span className={`px-2 py-1 text-xs font-medium rounded border flex items-center gap-1 w-fit ${estadoInfo.color}`}>
                      {getEstadoIcon(avaluo.estado)}
                      {estadoInfo.label}
                    </span>
                  </div>

                  {/* Acciones */}
                  <div className="flex items-center gap-2">
                    <button
                      className="p-2 text-slate-400 hover:text-blue-400 transition-colors"
                      title="Ver detalle"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    {avaluo.estado === "APROBADO" && (
                      <button
                        className="p-2 text-slate-400 hover:text-green-400 transition-colors"
                        title="Descargar PDF"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                    )}
                    {avaluo.estado !== "APROBADO" && (
                      <button
                        className="p-2 text-slate-400 hover:text-yellow-400 transition-colors"
                        title="Editar"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              )
            })
          )}
        </div>
      </Card>

      {/* Mensaje informativo */}
      {avaluos.length === 0 && (
        <Card className="border-2 border-slate-800 bg-gradient-to-r from-primary/20 to-secondary/20 border-primary/30">
          <div className="p-6 text-center">
            <FileText className="w-12 h-12 text-slate-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-white mb-2">Comienza tu primer avalúo</h3>
            <p className="text-sm text-slate-400 mb-4">
              Crea tu primer avalúo técnico utilizando nuestro sistema simplificado
            </p>
            <Link href="/dashboard/avaluos/crear">
              <Button className="bg-primary hover:bg-primary/90">
                <Plus className="w-4 h-4 mr-2" />
                Crear Avalúo
              </Button>
            </Link>
          </div>
        </Card>
      )}
    </div>
  )
}
