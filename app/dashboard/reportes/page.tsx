"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  FileText,
  Download,
  Search,
  Calendar,
  TrendingUp,
  DollarSign,
  Building2,
  Eye,
  Filter,
  Clock
} from "lucide-react"

type AvaluoEstado = "BORRADOR" | "EN_REVISION" | "APROBADO" | "RECHAZADO"
type AvaluoTipo = "COMERCIAL" | "ALQUILER" | "VENTA_RAPIDA" | "CAPITAL_COMERCIAL"

interface ReporteAvaluo {
  id: string
  codigo: string
  tipo: AvaluoTipo
  estado: AvaluoEstado
  fechaElaboracion: string
  propiedadNombre: string
  valorTerreno?: number
  valorConstruccion?: number
  valorTotal?: number
}

const mockReportes: ReporteAvaluo[] = [
  {
    id: "1",
    codigo: "AVAL-2026-001",
    tipo: "COMERCIAL",
    estado: "APROBADO",
    fechaElaboracion: "2026-01-15",
    propiedadNombre: "Departamento Centro",
    valorTerreno: 35000,
    valorConstruccion: 50000,
    valorTotal: 85000
  },
  {
    id: "2",
    codigo: "AVAL-2026-002",
    tipo: "ALQUILER",
    estado: "EN_REVISION",
    fechaElaboracion: "2026-02-20",
    propiedadNombre: "Casa Zona Norte",
    valorTerreno: 80000,
    valorConstruccion: 60000,
    valorTotal: 140000
  }
]

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

export default function ReportesPage() {
  const [reportes, setReportes] = useState<ReporteAvaluo[]>(mockReportes)
  const [searchTerm, setSearchTerm] = useState("")
  const [filtroEstado, setFiltroEstado] = useState<string>("todos")
  const [filtroTipo, setFiltroTipo] = useState<string>("todos")

  // Filtrar reportes
  const filteredReportes = reportes.filter(reporte => {
    const matchesSearch =
      reporte.codigo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      reporte.propiedadNombre.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesEstado = filtroEstado === "todos" || reporte.estado === filtroEstado
    const matchesTipo = filtroTipo === "todos" || reporte.tipo === filtroTipo

    return matchesSearch && matchesEstado && matchesTipo
  })

  // Calcular estadísticas
  const totalValor = reportes
    .filter(r => r.estado === "APROBADO" && r.valorTotal)
    .reduce((sum, r) => sum + (r.valorTotal || 0), 0)

  const getEstadoInfo = (estado: AvaluoEstado) => {
    return estados.find(e => e.value === estado) || estados[0]
  }

  const getTipoLabel = (tipo: AvaluoTipo) => {
    return tipos.find(t => t.value === tipo)?.label || tipo
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white">Mis Reportes</h1>
          <p className="text-sm sm:text-base text-slate-400 mt-1">
            Avalúos generados y sus resultados
          </p>
        </div>
        <Button className="w-full sm:w-auto bg-primary hover:bg-primary/90">
          <Download className="w-4 h-4 mr-2" />
          Exportar Todo
        </Button>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-2 border-slate-800 bg-slate-900/50 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="text-2xl font-bold text-white">{reportes.length}</div>
              <div className="text-xs text-slate-400">Total Avalúos</div>
            </div>
          </div>
        </Card>

        <Card className="border-2 border-slate-800 bg-slate-900/50 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-green-500/20 text-green-400 flex items-center justify-center">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <div className="text-2xl font-bold text-white">
                {reportes.filter(r => r.estado === "APROBADO").length}
              </div>
              <div className="text-xs text-slate-400">Aprobados</div>
            </div>
          </div>
        </Card>

        <Card className="border-2 border-slate-800 bg-slate-900/50 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-yellow-500/20 text-yellow-400 flex items-center justify-center">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <div className="text-2xl font-bold text-white">
                {reportes.filter(r => r.estado === "EN_REVISION").length}
              </div>
              <div className="text-xs text-slate-400">En Revisión</div>
            </div>
          </div>
        </Card>

        <Card className="border-2 border-slate-800 bg-slate-900/50 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center">
              <DollarSign className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xl font-bold text-white">
                ${totalValor.toLocaleString()}
              </div>
              <div className="text-xs text-slate-400">Valor Total</div>
            </div>
          </div>
        </Card>
      </div>

      {/* Filtros */}
      <Card className="border-2 border-slate-800 bg-slate-900/50">
        <div className="p-4 space-y-4">
          {/* Buscador */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
            <Input
              placeholder="Buscar por código o propiedad..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-500"
            />
          </div>

          {/* Filtros */}
          <div className="flex flex-wrap items-center gap-3">
            <Filter className="w-4 h-4 text-slate-500" />
            <span className="text-sm text-slate-400">Filtros:</span>

            {/* Estado */}
            <select
              value={filtroEstado}
              onChange={(e) => setFiltroEstado(e.target.value)}
              className="h-9 px-3 bg-slate-800 border-2 border-slate-700 rounded-md text-white text-sm"
            >
              <option value="todos">Todos los estados</option>
              {estados.map(estado => (
                <option key={estado.value} value={estado.value}>{estado.label}</option>
              ))}
            </select>

            {/* Tipo */}
            <select
              value={filtroTipo}
              onChange={(e) => setFiltroTipo(e.target.value)}
              className="h-9 px-3 bg-slate-800 border-2 border-slate-700 rounded-md text-white text-sm"
            >
              <option value="todos">Todos los tipos</option>
              {tipos.map(tipo => (
                <option key={tipo.value} value={tipo.value}>{tipo.label}</option>
              ))}
            </select>
          </div>
        </div>
      </Card>

      {/* Tabla de reportes - CSS Grid responsivo */}
      <Card className="border-2 border-slate-800 bg-slate-900/50 overflow-hidden">
        {/* Cabecera */}
        <div className="grid grid-cols-[1fr_1.5fr_1fr_1fr_1fr_100px] items-center gap-4 p-4 bg-slate-800/50 border-b-2 border-slate-800 text-xs font-medium text-slate-400 hidden lg:grid">
          <div>Código</div>
          <div>Propiedad</div>
          <div>Tipo</div>
          <div>Estado</div>
          <div>Valor Total</div>
          <div className="text-right">Acciones</div>
        </div>

        {/* Filas */}
        <div className="divide-y divide-slate-800">
          {filteredReportes.length === 0 ? (
            <div className="p-8 text-center text-slate-500">
              {searchTerm || filtroEstado !== "todos" || filtroTipo !== "todos"
                ? "No se encontraron reportes con los filtros aplicados"
                : "No hay reportes disponibles"}
            </div>
          ) : (
            filteredReportes.map((reporte) => {
              const estadoInfo = getEstadoInfo(reporte.estado)

              return (
                <div
                  key={reporte.id}
                  className="grid grid-cols-1 lg:grid-cols-[1fr_1.5fr_1fr_1fr_1fr_100px] items-start lg:items-center gap-2 lg:gap-4 p-4 hover:bg-slate-800/30 transition-colors"
                >
                  {/* Código */}
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-slate-500 lg:hidden" />
                    <div>
                      <div className="text-xs text-slate-500 lg:hidden">Código</div>
                      <div className="text-sm font-medium text-white">{reporte.codigo}</div>
                      <div className="text-xs text-slate-500 lg:hidden flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {new Date(reporte.fechaElaboracion).toLocaleDateString()}
                      </div>
                    </div>
                  </div>

                  {/* Propiedad */}
                  <div className="flex-1">
                    <div className="text-xs text-slate-500 lg:hidden">Propiedad</div>
                    <div className="flex items-start gap-2">
                      <Building2 className="w-4 h-4 text-slate-500 mt-0.5 shrink-0" />
                      <div className="text-sm text-white truncate">
                        {reporte.propiedadNombre}
                      </div>
                    </div>
                  </div>

                  {/* Tipo */}
                  <div>
                    <div className="text-xs text-slate-500 lg:hidden">Tipo</div>
                    <div className="text-sm text-slate-300">{getTipoLabel(reporte.tipo)}</div>
                  </div>

                  {/* Estado */}
                  <div>
                    <div className="text-xs text-slate-500 lg:hidden">Estado</div>
                    <span className={`px-2 py-1 text-xs font-medium rounded border ${estadoInfo.color}`}>
                      {estadoInfo.label}
                    </span>
                  </div>

                  {/* Valor Total */}
                  <div>
                    <div className="text-xs text-slate-500 lg:hidden">Valor Total</div>
                    <div className="text-sm font-medium text-green-400">
                      {reporte.valorTotal ? `$${reporte.valorTotal.toLocaleString()}` : "-"}
                    </div>
                  </div>

                  {/* Acciones */}
                  <div className="flex items-center gap-2">
                    <button
                      className="p-2 text-slate-400 hover:text-blue-400 transition-colors"
                      title="Ver detalle"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    {reporte.estado === "APROBADO" && (
                      <button
                        className="p-2 text-slate-400 hover:text-green-400 transition-colors"
                        title="Descargar PDF"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              )
            })
          )}
        </div>
      </Card>

      {/* Detalle de valoración */}
      {filteredReportes.length > 0 && (
        <Card className="border-2 border-slate-800 bg-slate-900/50">
          <div className="p-4">
            <h3 className="text-sm font-semibold text-white mb-4">Resumen de Valoraciones</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-slate-800/50 rounded-lg p-3">
                <p className="text-xs text-slate-500 mb-1">Valor Terreno Promedio</p>
                <p className="text-lg font-semibold text-blue-400">
                  ${reportes.filter(r => r.valorTerreno).length > 0
                    ? Math.round(reportes.filter(r => r.valorTerreno).reduce((sum, r) => sum + (r.valorTerreno || 0), 0) / reportes.filter(r => r.valorTerreno).length).toLocaleString()
                    : "0"}
                </p>
              </div>
              <div className="bg-slate-800/50 rounded-lg p-3">
                <p className="text-xs text-slate-500 mb-1">Valor Construcción Promedio</p>
                <p className="text-lg font-semibold text-purple-400">
                  ${reportes.filter(r => r.valorConstruccion).length > 0
                    ? Math.round(reportes.filter(r => r.valorConstruccion).reduce((sum, r) => sum + (r.valorConstruccion || 0), 0) / reportes.filter(r => r.valorConstruccion).length).toLocaleString()
                    : "0"}
                </p>
              </div>
              <div className="bg-slate-800/50 rounded-lg p-3">
                <p className="text-xs text-slate-500 mb-1">Valor Total Promedio</p>
                <p className="text-lg font-semibold text-green-400">
                  ${reportes.filter(r => r.valorTotal).length > 0
                    ? Math.round(reportes.filter(r => r.valorTotal).reduce((sum, r) => sum + (r.valorTotal || 0), 0) / reportes.filter(r => r.valorTotal).length).toLocaleString()
                    : "0"}
                </p>
              </div>
            </div>
          </div>
        </Card>
      )}
    </div>
  )
}
