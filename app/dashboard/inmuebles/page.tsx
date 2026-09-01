"use client"

import { useState, useEffect, useCallback } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Plus,
  Search,
  Edit,
  Trash2,
  Building2,
  MapPin,
  DollarSign,
  Maximize,
  Loader2,
} from "lucide-react"
import Link from "next/link"
import { toast } from "@/components/ui/use-toast"
import {
  listInmueblesAction,
  createInmuebleAction,
  updateInmuebleAction,
  deleteInmuebleAction,
} from "@/modules/inmuebles/actions"
import type { InmuebleDTO } from "@/modules/inmuebles/types/inmueble.types"

type PropertyCategory =
  | "CASA" | "DEPARTAMENTO" | "PENTHOUSE" | "TERRENO" | "LOCAL_COMERCIAL" | "OFICINA" | "QUINTA" | "OTROS"
type OperationType = "VENTA" | "ALQUILER" | "ANTICRETICO"

const categories: { value: PropertyCategory; label: string }[] = [
  { value: "CASA", label: "Casa" },
  { value: "DEPARTAMENTO", label: "Departamento" },
  { value: "PENTHOUSE", label: "Penthouse" },
  { value: "TERRENO", label: "Terreno" },
  { value: "LOCAL_COMERCIAL", label: "Local Comercial" },
  { value: "OFICINA", label: "Oficina" },
  { value: "QUINTA", label: "Quinta" },
  { value: "OTROS", label: "Otros" },
]

const operations: { value: OperationType; label: string }[] = [
  { value: "VENTA", label: "Venta" },
  { value: "ALQUILER", label: "Alquiler" },
  { value: "ANTICRETICO", label: "Anticrético" },
]

const emptyForm = {
  codigoInmueble: "",
  nombre: "",
  categoria: "DEPARTAMENTO" as PropertyCategory,
  operacion: "VENTA" as OperationType,
  precioUsd: "",
  superficieUtil: "",
  direccion: "",
  ambientes: "",
  habitaciones: "",
  banos: "",
  lat: "",
  lng: "",
}

/** Calcula los números de página a mostrar (con elipsis tipo Google). */
function getPageNumbers(page: number, totalPages: number): (number | "...")[] {
  if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1)
  const pages: (number | "...")[] = [1]
  const start = Math.max(2, page - 1)
  const end = Math.min(totalPages - 1, page + 1)
  if (start > 2) pages.push("...")
  for (let i = start; i <= end; i++) pages.push(i)
  if (end < totalPages - 1) pages.push("...")
  pages.push(totalPages)
  return pages
}

export default function InmueblesPage() {
  const [properties, setProperties] = useState<InmuebleDTO[]>([])
  const [pagination, setPagination] = useState({ page: 1, limit: 100, total: 0, totalPages: 0 })
  const [currentPage, setCurrentPage] = useState(1)
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [debouncedSearch, setDebouncedSearch] = useState("")
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [selectedProperty, setSelectedProperty] = useState<InmuebleDTO | null>(null)
  const [formData, setFormData] = useState({ ...emptyForm })

  /** Cargar inmuebles desde la BD (paginado + búsqueda en servidor) */
  const loadProperties = useCallback(async (page: number, search: string) => {
    setIsLoading(true)
    try {
      const result = await listInmueblesAction({
        page,
        limit: 100,
        search: search.trim() || undefined,
      })
      if (result.success && result.data) {
        setProperties(result.data.inmuebles)
        setPagination(result.data.pagination)
      } else if (!result.success) {
        toast.error("Error al cargar inmuebles", result.error)
      }
    } catch (error) {
      console.error("Error cargando inmuebles:", error)
      toast.error("Error al cargar los inmuebles")
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Debounce de la búsqueda + reset a página 1 al cambiar el término
  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedSearch(searchTerm)
      setCurrentPage(1)
    }, 400)
    return () => clearTimeout(t)
  }, [searchTerm])

  // Cargar cuando cambia la página o la búsqueda
  useEffect(() => {
    loadProperties(currentPage, debouncedSearch)
  }, [currentPage, debouncedSearch, loadProperties])

  // Al cambiar de página, volver al inicio de la vista
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" })
  }, [currentPage])

  // Recargar después de crear/editar/eliminar (mantiene la página actual)
  const reload = () => loadProperties(currentPage, debouncedSearch)

  const handleCreate = () => {
    setFormData({ ...emptyForm })
    setIsCreateModalOpen(true)
  }

  const handleEdit = (property: InmuebleDTO) => {
    setSelectedProperty(property)
    setFormData({
      codigoInmueble: property.codigoInmueble,
      nombre: property.nombre,
      categoria: (property.categoria as PropertyCategory) ?? "OTROS",
      operacion: property.operacion as OperationType,
      precioUsd: property.precioUsd?.toString() ?? "",
      superficieUtil: property.superficieUtil?.toString() ?? "",
      direccion: property.direccion ?? "",
      ambientes: property.ambientes?.toString() ?? "",
      habitaciones: property.habitaciones?.toString() ?? "",
      banos: property.banos?.toString() ?? "",
      lat: property.lat?.toString() ?? "",
      lng: property.lng?.toString() ?? "",
    })
    setIsEditModalOpen(true)
  }

  const handleDelete = (property: InmuebleDTO) => {
    setSelectedProperty(property)
    setIsDeleteModalOpen(true)
  }

  const buildPayload = () => ({
    codigoInmueble: formData.codigoInmueble.trim(),
    nombre: formData.nombre.trim(),
    categoria: formData.categoria,
    operacion: formData.operacion,
    precioUsd: formData.precioUsd ? parseFloat(formData.precioUsd) : null,
    superficieUtil: formData.superficieUtil ? parseFloat(formData.superficieUtil) : null,
    direccion: formData.direccion || null,
    ambientes: formData.ambientes ? parseInt(formData.ambientes) : null,
    habitaciones: formData.habitaciones ? parseInt(formData.habitaciones) : null,
    banos: formData.banos ? parseInt(formData.banos) : null,
    lat: formData.lat ? parseFloat(formData.lat) : null,
    lng: formData.lng ? parseFloat(formData.lng) : null,
  })

  const handleSaveCreate = async () => {
    setIsSubmitting(true)
    try {
      const result = await createInmuebleAction(buildPayload())
      if (result.success) {
        toast.success("Inmueble creado correctamente")
        setIsCreateModalOpen(false)
        await reload()
      } else {
        toast.error("Error al crear", result.error)
      }
    } catch (error: any) {
      toast.error("Error al crear el inmueble", error.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleSaveEdit = async () => {
    if (!selectedProperty) return
    setIsSubmitting(true)
    try {
      const result = await updateInmuebleAction(selectedProperty.id, buildPayload())
      if (result.success) {
        toast.success("Inmueble actualizado correctamente")
        setIsEditModalOpen(false)
        await reload()
      } else {
        toast.error("Error al actualizar", result.error)
      }
    } catch (error: any) {
      toast.error("Error al actualizar el inmueble", error.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleConfirmDelete = async () => {
    if (!selectedProperty) return
    setIsSubmitting(true)
    try {
      const result = await deleteInmuebleAction(selectedProperty.id)
      if (result.success) {
        toast.success("Inmueble eliminado correctamente")
        setIsDeleteModalOpen(false)
        await reload()
      } else {
        toast.error("Error al eliminar", result.error)
      }
    } catch (error: any) {
      toast.error("Error al eliminar el inmueble", error.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  const getCategoryLabel = (categoria: string) =>
    categories.find((c) => c.value === categoria)?.label ?? categoria

  const getOperationColor = (operacion: OperationType) => {
    switch (operacion) {
      case "VENTA":
        return "text-blue-400 bg-blue-400/10 border-blue-400/30"
      case "ALQUILER":
        return "text-red-400 bg-red-400/10 border-red-400/30"
      case "ANTICRETICO":
        return "text-yellow-400 bg-yellow-400/10 border-yellow-400/30"
      default:
        return "text-slate-400 bg-slate-400/10 border-slate-400/30"
    }
  }

  const getOperationLabel = (operacion: OperationType) =>
    operations.find((o) => o.value === operacion)?.label ?? operacion

  if (isLoading && properties.length === 0) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="animate-spin h-10 w-10 text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Cargando inmuebles...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white">Gestionar Inmuebles</h1>
          <p className="text-sm sm:text-base text-slate-400 mt-1">
            CRUD completo de propiedades
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <Link href="/dashboard/inmuebles/ver">
            <Button variant="outline" className="w-full sm:w-auto border-slate-700 text-white hover:bg-slate-800">
              <MapPin className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">Ver Mapa</span>
              <span className="sm:hidden">Mapa</span>
            </Button>
          </Link>
          <Button onClick={handleCreate} className="w-full sm:w-auto bg-primary hover:bg-primary/90">
            <Plus className="w-4 h-4 mr-2" />
            Nuevo Inmueble
          </Button>
        </div>
      </div>

      {/* Buscador */}
      <Card className="border-2 border-slate-800 bg-slate-900/50">
        <div className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
            <Input
              placeholder="Buscar por código, nombre o dirección..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-500"
            />
          </div>
        </div>
      </Card>

      {/* Tabla de propiedades - CSS Grid responsivo */}
      <Card className="border-2 border-slate-800 bg-slate-900/50 overflow-hidden">
        {/* Cabecera */}
        <div className="grid grid-cols-[1fr_1.5fr_1fr_1fr_1fr_100px] items-center gap-4 p-4 bg-slate-800/50 border-b-2 border-slate-800 text-xs font-medium text-slate-400 hidden sm:grid">
          <div>Código</div>
          <div>Nombre</div>
          <div>Categoría</div>
          <div>Operación</div>
          <div>Precio</div>
          <div className="text-right">Acciones</div>
        </div>

        {/* Filas */}
        <div className="divide-y divide-slate-800">
          {properties.length === 0 ? (
            <div className="p-8 text-center text-slate-500">
              {debouncedSearch ? "No se encontraron propiedades" : "No hay propiedades registradas"}
            </div>
          ) : (
            properties.map((property) => (
              <div
                key={property.id}
                className="grid grid-cols-1 sm:grid-cols-[1fr_1.5fr_1fr_1fr_1fr_100px] items-start sm:items-center gap-2 sm:gap-4 p-4 hover:bg-slate-800/30 transition-colors"
              >
                {/* Código */}
                <div className="flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-slate-500 sm:hidden" />
                  <div>
                    <div className="text-xs text-slate-500 sm:hidden">Código</div>
                    <div className="text-sm font-medium text-white">{property.codigoInmueble}</div>
                  </div>
                </div>

                {/* Nombre */}
                <div className="flex-1">
                  <div className="text-xs text-slate-500 sm:hidden">Nombre</div>
                  <div className="text-sm text-white truncate" title={property.nombre}>
                    {property.nombre}
                  </div>
                  {property.direccion && (
                    <div className="text-xs text-slate-500 truncate hidden sm:block">
                      {property.direccion}
                    </div>
                  )}
                </div>

                {/* Categoría */}
                <div>
                  <div className="text-xs text-slate-500 sm:hidden">Categoría</div>
                  <div className="text-sm text-slate-300">{getCategoryLabel(property.categoria)}</div>
                </div>

                {/* Operación */}
                <div>
                  <div className="text-xs text-slate-500 sm:hidden">Operación</div>
                  <span className={`px-2 py-1 text-xs font-medium rounded border ${getOperationColor(property.operacion as OperationType)}`}>
                    {getOperationLabel(property.operacion as OperationType)}
                  </span>
                </div>

                {/* Precio */}
                <div>
                  <div className="text-xs text-slate-500 sm:hidden">Precio</div>
                  <div className="text-sm font-medium text-green-400">
                    {property.precioUsd ? `US$ ${property.precioUsd.toLocaleString("es-BO")}` : "-"}
                  </div>
                </div>

                {/* Acciones */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleEdit(property)}
                    className="p-2 text-slate-400 hover:text-blue-400 transition-colors"
                    title="Editar"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(property)}
                    className="p-2 text-slate-400 hover:text-red-400 transition-colors"
                    title="Eliminar"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </Card>

      {/* Paginación tipo Google */}
      {pagination.total > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-1">
          <p className="text-xs text-slate-400">
            {isLoading && properties.length > 0
              ? "Cargando…"
              : `Mostrando ${(pagination.page - 1) * pagination.limit + 1}–${Math.min(
                  pagination.page * pagination.limit,
                  pagination.total,
                )} de ${pagination.total} inmuebles`}
          </p>
          {pagination.totalPages > 1 && (
            <div className="flex items-center gap-1 flex-wrap justify-center">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1 || isLoading}
                className="rounded-md border border-slate-700 px-3 py-1.5 text-sm text-slate-300 transition-colors hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Anterior
              </button>
              {getPageNumbers(currentPage, pagination.totalPages).map((p, i) =>
                p === "..." ? (
                  <span key={`e${i}`} className="px-2 text-slate-500">
                    …
                  </span>
                ) : (
                  <button
                    key={p}
                    onClick={() => setCurrentPage(p)}
                    className={`min-w-[36px] rounded-md px-2 py-1.5 text-sm font-medium transition-colors ${
                      p === currentPage
                        ? "bg-primary text-white"
                        : "border border-slate-700 text-slate-300 hover:bg-slate-800"
                    }`}
                  >
                    {p}
                  </button>
                ),
              )}
              <button
                onClick={() => setCurrentPage((p) => Math.min(pagination.totalPages, p + 1))}
                disabled={currentPage === pagination.totalPages || isLoading}
                className="rounded-md border border-slate-700 px-3 py-1.5 text-sm text-slate-300 transition-colors hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Siguiente
              </button>
            </div>
          )}
        </div>
      )}

      {/* Modal Crear */}
      <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
        <DialogContent className="bg-slate-900 border-slate-800 text-white max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-lg sm:text-xl">Nuevo Inmueble</DialogTitle>
            <DialogDescription className="text-slate-400 text-xs sm:text-sm">
              Registra una nueva propiedad en el sistema
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="codigo">Código del Inmueble *</Label>
              <Input
                id="codigo"
                value={formData.codigoInmueble}
                onChange={(e) => setFormData({ ...formData, codigoInmueble: e.target.value })}
                className="bg-slate-800 border-slate-700 text-white"
                placeholder="PROP001"
              />
            </div>

            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="nombre">Nombre del Inmueble *</Label>
              <Input
                id="nombre"
                value={formData.nombre}
                onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                className="bg-slate-800 border-slate-700 text-white"
                placeholder="Ej: Departamento Centro"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="categoria">Categoría</Label>
              <select
                id="categoria"
                value={formData.categoria}
                onChange={(e) => setFormData({ ...formData, categoria: e.target.value as PropertyCategory })}
                className="w-full h-10 px-3 py-2 bg-slate-800 border-2 border-slate-700 rounded-md text-white text-sm"
              >
                {categories.map((cat) => (
                  <option key={cat.value} value={cat.value}>{cat.label}</option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="operacion">Tipo de Operación</Label>
              <select
                id="operacion"
                value={formData.operacion}
                onChange={(e) => setFormData({ ...formData, operacion: e.target.value as OperationType })}
                className="w-full h-10 px-3 py-2 bg-slate-800 border-2 border-slate-700 rounded-md text-white text-sm"
              >
                {operations.map((op) => (
                  <option key={op.value} value={op.value}>{op.label}</option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="precio">Precio (USD)</Label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <Input
                  id="precio"
                  type="number"
                  value={formData.precioUsd}
                  onChange={(e) => setFormData({ ...formData, precioUsd: e.target.value })}
                  className="pl-10 bg-slate-800 border-slate-700 text-white"
                  placeholder="85000"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="superficie">Superficie Útil (m²)</Label>
              <div className="relative">
                <Maximize className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <Input
                  id="superficie"
                  type="number"
                  value={formData.superficieUtil}
                  onChange={(e) => setFormData({ ...formData, superficieUtil: e.target.value })}
                  className="pl-10 bg-slate-800 border-slate-700 text-white"
                  placeholder="85"
                />
              </div>
            </div>

            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="direccion">Dirección</Label>
              <Input
                id="direccion"
                value={formData.direccion}
                onChange={(e) => setFormData({ ...formData, direccion: e.target.value })}
                className="bg-slate-800 border-slate-700 text-white"
                placeholder="Calle, Número, Zona"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="ambientes">Ambientes</Label>
              <Input
                id="ambientes"
                type="number"
                value={formData.ambientes}
                onChange={(e) => setFormData({ ...formData, ambientes: e.target.value })}
                className="bg-slate-800 border-slate-700 text-white"
                placeholder="3"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="habitaciones">Habitaciones</Label>
              <Input
                id="habitaciones"
                type="number"
                value={formData.habitaciones}
                onChange={(e) => setFormData({ ...formData, habitaciones: e.target.value })}
                className="bg-slate-800 border-slate-700 text-white"
                placeholder="2"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="banos">Baños</Label>
              <Input
                id="banos"
                type="number"
                value={formData.banos}
                onChange={(e) => setFormData({ ...formData, banos: e.target.value })}
                className="bg-slate-800 border-slate-700 text-white"
                placeholder="2"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="lat">Latitud</Label>
              <Input
                id="lat"
                type="number"
                step="any"
                value={formData.lat}
                onChange={(e) => setFormData({ ...formData, lat: e.target.value })}
                className="bg-slate-800 border-slate-700 text-white"
                placeholder="-17.7833"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="lng">Longitud</Label>
              <Input
                id="lng"
                type="number"
                step="any"
                value={formData.lng}
                onChange={(e) => setFormData({ ...formData, lng: e.target.value })}
                className="bg-slate-800 border-slate-700 text-white"
                placeholder="-63.1821"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsCreateModalOpen(false)}
              className="border-slate-700 text-white hover:bg-slate-800"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSaveCreate}
              disabled={isSubmitting}
              className="bg-primary hover:bg-primary/90"
            >
              {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Crear Inmueble
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal Editar */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="bg-slate-900 border-slate-800 text-white max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-lg sm:text-xl">Editar Inmueble</DialogTitle>
            <DialogDescription className="text-slate-400 text-xs sm:text-sm">
              Modifica los datos de la propiedad
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="edit-codigo">Código del Inmueble *</Label>
              <Input
                id="edit-codigo"
                value={formData.codigoInmueble}
                onChange={(e) => setFormData({ ...formData, codigoInmueble: e.target.value })}
                className="bg-slate-800 border-slate-700 text-white"
              />
            </div>

            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="edit-nombre">Nombre del Inmueble *</Label>
              <Input
                id="edit-nombre"
                value={formData.nombre}
                onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                className="bg-slate-800 border-slate-700 text-white"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-categoria">Categoría</Label>
              <select
                id="edit-categoria"
                value={formData.categoria}
                onChange={(e) => setFormData({ ...formData, categoria: e.target.value as PropertyCategory })}
                className="w-full h-10 px-3 py-2 bg-slate-800 border-2 border-slate-700 rounded-md text-white text-sm"
              >
                {categories.map((cat) => (
                  <option key={cat.value} value={cat.value}>{cat.label}</option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-operacion">Tipo de Operación</Label>
              <select
                id="edit-operacion"
                value={formData.operacion}
                onChange={(e) => setFormData({ ...formData, operacion: e.target.value as OperationType })}
                className="w-full h-10 px-3 py-2 bg-slate-800 border-2 border-slate-700 rounded-md text-white text-sm"
              >
                {operations.map((op) => (
                  <option key={op.value} value={op.value}>{op.label}</option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-precio">Precio (USD)</Label>
              <Input
                id="edit-precio"
                type="number"
                value={formData.precioUsd}
                onChange={(e) => setFormData({ ...formData, precioUsd: e.target.value })}
                className="bg-slate-800 border-slate-700 text-white"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-superficie">Superficie Útil (m²)</Label>
              <Input
                id="edit-superficie"
                type="number"
                value={formData.superficieUtil}
                onChange={(e) => setFormData({ ...formData, superficieUtil: e.target.value })}
                className="bg-slate-800 border-slate-700 text-white"
              />
            </div>

            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="edit-direccion">Dirección</Label>
              <Input
                id="edit-direccion"
                value={formData.direccion}
                onChange={(e) => setFormData({ ...formData, direccion: e.target.value })}
                className="bg-slate-800 border-slate-700 text-white"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-ambientes">Ambientes</Label>
              <Input
                id="edit-ambientes"
                type="number"
                value={formData.ambientes}
                onChange={(e) => setFormData({ ...formData, ambientes: e.target.value })}
                className="bg-slate-800 border-slate-700 text-white"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-habitaciones">Habitaciones</Label>
              <Input
                id="edit-habitaciones"
                type="number"
                value={formData.habitaciones}
                onChange={(e) => setFormData({ ...formData, habitaciones: e.target.value })}
                className="bg-slate-800 border-slate-700 text-white"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-banos">Baños</Label>
              <Input
                id="edit-banos"
                type="number"
                value={formData.banos}
                onChange={(e) => setFormData({ ...formData, banos: e.target.value })}
                className="bg-slate-800 border-slate-700 text-white"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-lat">Latitud</Label>
              <Input
                id="edit-lat"
                type="number"
                step="any"
                value={formData.lat}
                onChange={(e) => setFormData({ ...formData, lat: e.target.value })}
                className="bg-slate-800 border-slate-700 text-white"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-lng">Longitud</Label>
              <Input
                id="edit-lng"
                type="number"
                step="any"
                value={formData.lng}
                onChange={(e) => setFormData({ ...formData, lng: e.target.value })}
                className="bg-slate-800 border-slate-700 text-white"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsEditModalOpen(false)}
              className="border-slate-700 text-white hover:bg-slate-800"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSaveEdit}
              disabled={isSubmitting}
              className="bg-primary hover:bg-primary/90"
            >
              {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Guardar Cambios
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal Eliminar */}
      <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
        <DialogContent className="bg-slate-900 border-slate-800 text-white max-w-md">
          <DialogHeader>
            <DialogTitle>Eliminar Inmueble</DialogTitle>
            <DialogDescription className="text-slate-400">
              ¿Estás seguro de que deseas eliminar &quot;{selectedProperty?.nombre}&quot;? Esta acción no se puede deshacer.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDeleteModalOpen(false)}
              className="border-slate-700 text-white hover:bg-slate-800"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleConfirmDelete}
              disabled={isSubmitting}
              className="bg-red-500 hover:bg-red-600"
            >
              {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Eliminar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
