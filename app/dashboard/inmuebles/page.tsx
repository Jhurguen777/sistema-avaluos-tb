"use client"

import { useState } from "react"
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
  Maximize
} from "lucide-react"
import Link from "next/link"

type OperationType = "VENTA" | "ALQUILER" | "ANTICRETICO"
type PropertyCategory = "CASA" | "DEPARTAMENTO" | "TERRENO" | "LOCAL_COMERCIAL" | "OFICINA" | "GALPON" | "OTROS"

interface Property {
  id: string
  codigoInmueble: string
  nombre: string
  categoria: PropertyCategory
  operacion: OperationType
  precioUsd?: number
  superficieUtil?: number
  direccion?: string
  ambientes?: number
  habitaciones?: number
  banos?: number
}

const mockProperties: Property[] = [
  {
    id: "1",
    codigoInmueble: "PROP001",
    nombre: "Departamento Centro",
    categoria: "DEPARTAMENTO",
    operacion: "VENTA",
    precioUsd: 85000,
    superficieUtil: 85,
    direccion: "Calle Sucre, Centro",
    ambientes: 3,
    habitaciones: 2,
    banos: 2
  },
  {
    id: "2",
    codigoInmueble: "PROP002",
    nombre: "Casa Zona Sur",
    categoria: "CASA",
    operacion: "ALQUILER",
    precioUsd: 450,
    superficieUtil: 150,
    direccion: "Av. Costa Verde, Zona Sur",
    ambientes: 4,
    habitaciones: 3,
    banos: 2
  },
  {
    id: "3",
    codigoInmueble: "PROP003",
    nombre: "Local Comercial",
    categoria: "LOCAL_COMERCIAL",
    operacion: "VENTA",
    precioUsd: 120000,
    superficieUtil: 80,
    direccion: "Calle Florida, Centro Comercial",
    ambientes: 1,
    habitaciones: 0,
    banos: 1
  }
]

const categories: { value: PropertyCategory; label: string }[] = [
  { value: "CASA", label: "Casa" },
  { value: "DEPARTAMENTO", label: "Departamento" },
  { value: "TERRENO", label: "Terreno" },
  { value: "LOCAL_COMERCIAL", label: "Local Comercial" },
  { value: "OFICINA", label: "Oficina" },
  { value: "GALPON", label: "Galpón" },
  { value: "OTROS", label: "Otros" }
]

const operations: { value: OperationType; label: string }[] = [
  { value: "VENTA", label: "Venta" },
  { value: "ALQUILER", label: "Alquiler" },
  { value: "ANTICRETICO", label: "Anticrético" }
]

export default function InmueblesPage() {
  const [properties, setProperties] = useState<Property[]>(mockProperties)
  const [searchTerm, setSearchTerm] = useState("")
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null)
  const [formData, setFormData] = useState({
    codigoInmueble: "",
    nombre: "",
    categoria: "DEPARTAMENTO" as PropertyCategory,
    operacion: "VENTA" as OperationType,
    precioUsd: "",
    superficieUtil: "",
    direccion: "",
    ambientes: "",
    habitaciones: "",
    banos: ""
  })

  // Filtrar propiedades por búsqueda
  const filteredProperties = properties.filter(prop =>
    prop.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    prop.codigoInmueble.toLowerCase().includes(searchTerm.toLowerCase()) ||
    prop.direccion?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleCreate = () => {
    setFormData({
      codigoInmueble: "",
      nombre: "",
      categoria: "DEPARTAMENTO",
      operacion: "VENTA",
      precioUsd: "",
      superficieUtil: "",
      direccion: "",
      ambientes: "",
      habitaciones: "",
      banos: ""
    })
    setIsCreateModalOpen(true)
  }

  const handleEdit = (property: Property) => {
    setSelectedProperty(property)
    setFormData({
      codigoInmueble: property.codigoInmueble,
      nombre: property.nombre,
      categoria: property.categoria,
      operacion: property.operacion,
      precioUsd: property.precioUsd?.toString() || "",
      superficieUtil: property.superficieUtil?.toString() || "",
      direccion: property.direccion || "",
      ambientes: property.ambientes?.toString() || "",
      habitaciones: property.habitaciones?.toString() || "",
      banos: property.banos?.toString() || ""
    })
    setIsEditModalOpen(true)
  }

  const handleDelete = (property: Property) => {
    setSelectedProperty(property)
    setIsDeleteModalOpen(true)
  }

  const handleSaveCreate = () => {
    const newProperty: Property = {
      id: Date.now().toString(),
      codigoInmueble: formData.codigoInmueble,
      nombre: formData.nombre,
      categoria: formData.categoria,
      operacion: formData.operacion,
      precioUsd: formData.precioUsd ? parseFloat(formData.precioUsd) : undefined,
      superficieUtil: formData.superficieUtil ? parseFloat(formData.superficieUtil) : undefined,
      direccion: formData.direccion,
      ambientes: formData.ambientes ? parseInt(formData.ambientes) : undefined,
      habitaciones: formData.habitaciones ? parseInt(formData.habitaciones) : undefined,
      banos: formData.banos ? parseInt(formData.banos) : undefined
    }
    setProperties([...properties, newProperty])
    setIsCreateModalOpen(false)
  }

  const handleSaveEdit = () => {
    if (!selectedProperty) return

    setProperties(properties.map(prop =>
      prop.id === selectedProperty.id
        ? {
            ...prop,
            codigoInmueble: formData.codigoInmueble,
            nombre: formData.nombre,
            categoria: formData.categoria,
            operacion: formData.operacion,
            precioUsd: formData.precioUsd ? parseFloat(formData.precioUsd) : undefined,
            superficieUtil: formData.superficieUtil ? parseFloat(formData.superficieUtil) : undefined,
            direccion: formData.direccion,
            ambientes: formData.ambientes ? parseInt(formData.ambientes) : undefined,
            habitaciones: formData.habitaciones ? parseInt(formData.habitaciones) : undefined,
            banos: formData.banos ? parseInt(formData.banos) : undefined
          }
        : prop
    ))
    setIsEditModalOpen(false)
  }

  const handleConfirmDelete = () => {
    if (!selectedProperty) return
    setProperties(properties.filter(prop => prop.id !== selectedProperty.id))
    setIsDeleteModalOpen(false)
  }

  const getCategoryLabel = (categoria: PropertyCategory) => {
    return categories.find(c => c.value === categoria)?.label || categoria
  }

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

  const getOperationLabel = (operacion: OperationType) => {
    return operations.find(o => o.value === operacion)?.label || operacion
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
          {filteredProperties.length === 0 ? (
            <div className="p-8 text-center text-slate-500">
              {searchTerm ? "No se encontraron propiedades" : "No hay propiedades registradas"}
            </div>
          ) : (
            filteredProperties.map((property) => (
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
                  <span className={`px-2 py-1 text-xs font-medium rounded border ${getOperationColor(property.operacion)}`}>
                    {getOperationLabel(property.operacion)}
                  </span>
                </div>

                {/* Precio */}
                <div>
                  <div className="text-xs text-slate-500 sm:hidden">Precio</div>
                  <div className="text-sm font-medium text-green-400">
                    {property.precioUsd ? `$${property.precioUsd.toLocaleString()}` : "-"}
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

      {/* Modal Crear */}
      <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
        <DialogContent className="bg-slate-900 border-slate-800 text-white max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Nuevo Inmueble</DialogTitle>
            <DialogDescription className="text-slate-400">
              Registra una nueva propiedad en el sistema
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-4">
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
                {categories.map(cat => (
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
                {operations.map(op => (
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
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsCreateModalOpen(false)}
              className="border-slate-700 text-white hover:bg-slate-800"
            >
              Cancelar
            </Button>
            <Button onClick={handleSaveCreate} className="bg-primary hover:bg-primary/90">
              Crear Inmueble
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal Editar */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="bg-slate-900 border-slate-800 text-white max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Inmueble</DialogTitle>
            <DialogDescription className="text-slate-400">
              Modifica los datos de la propiedad
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-4">
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
                {categories.map(cat => (
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
                {operations.map(op => (
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
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsEditModalOpen(false)}
              className="border-slate-700 text-white hover:bg-slate-800"
            >
              Cancelar
            </Button>
            <Button onClick={handleSaveEdit} className="bg-primary hover:bg-primary/90">
              Guardar Cambios
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal Eliminar */}
      <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
        <DialogContent className="bg-slate-900 border-slate-800 text-white">
          <DialogHeader>
            <DialogTitle>Eliminar Inmueble</DialogTitle>
            <DialogDescription className="text-slate-400">
              ¿Estás seguro de que deseas eliminar "{selectedProperty?.nombre}"? Esta acción no se puede deshacer.
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
            <Button onClick={handleConfirmDelete} className="bg-red-500 hover:bg-red-600">
              Eliminar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
