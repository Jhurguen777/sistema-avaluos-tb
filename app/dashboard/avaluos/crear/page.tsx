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
  ChevronRight,
  ChevronLeft,
  Home,
  Building,
  Store,
  Warehouse,
  Building2,
  MapPin,
  Check,
  Plus,
  Trash2,
  Calculator
} from "lucide-react"
import Link from "next/link"

type PropertyCategory = "CASA" | "DEPARTAMENTO" | "TERRENO" | "LOCAL_COMERCIAL" | "OFICINA" | "GALPON" | "OTROS"
type OperationType = "VENTA" | "ALQUILER" | "ANTICRETICO"
type AvaluoTipo = "COMERCIAL" | "ALQUILER" | "VENTA_RAPIDA" | "CAPITAL_COMERCIAL"

const categories: { value: PropertyCategory; label: string; icon: any; description: string }[] = [
  { value: "CASA", label: "Casa", icon: Home, description: "Vivienda unifamiliar con terreno" },
  { value: "DEPARTAMENTO", label: "Departamento", icon: Building2, description: "Unidad en edificio multifamiliar" },
  { value: "TERRENO", label: "Terreno", icon: MapPin, description: "Lote sin construcción" },
  { value: "LOCAL_COMERCIAL", label: "Local Comercial", icon: Store, description: "Espacio para actividades comerciales" },
  { value: "OFICINA", label: "Oficina", icon: Building, description: "Espacio para actividades administrativas" },
  { value: "GALPON", label: "Galpón", icon: Warehouse, description: "Espacio industrial o de almacenamiento" }
]

const operations: { value: OperationType; label: string; description: string; color: string }[] = [
  { value: "VENTA", label: "Venta", description: "Avalúo para compraventa de propiedad", color: "from-blue-500 to-cyan-500" },
  { value: "ALQUILER", label: "Alquiler", description: "Avalúo para contrato de arrendamiento", color: "from-red-500 to-pink-500" },
  { value: "ANTICRETICO", label: "Anticrético", description: "Avalúo para contrato de anticrético", color: "from-yellow-500 to-orange-500" }
]

const steps = [
  { id: 1, name: "Categoría", icon: "1" },
  { id: 2, name: "Operación", icon: "2" },
  { id: 3, name: "Ubicación", icon: "3" },
  { id: 4, name: "Terreno", icon: "4" },
  { id: 5, name: "Construcción", icon: "5" },
  { id: 6, name: "Depreciación", icon: "6" },
  { id: 7, name: "Comparables", icon: "7" },
  { id: 8, name: "Factores", icon: "8" },
  { id: 9, name: "Radar", icon: "9" },
  { id: 10, name: "Documentos", icon: "10" },
  { id: 11, name: "Finalizar", icon: "11" }
]

interface Comparable {
  id: string
  codigo: string
  direccion: string
  precio: number
  superficie: number
  precioM2: number
}

export default function CrearAvaluoPage() {
  const [currentStep, setCurrentStep] = useState(1)
  const [selectedCategory, setSelectedCategory] = useState<PropertyCategory | null>(null)
  const [selectedOperation, setSelectedOperation] = useState<OperationType | null>(null)
  const [showSuccessModal, setShowSuccessModal] = useState(false)

  // Form data
  const [formData, setFormData] = useState({
    // Paso 3: Ubicación
    direccion: "",
    zona: "",
    lat: "",
    lng: "",

    // Paso 4: Terreno
    superficieTerreno: "",
    frente: "",
    fondo: "",
    formaLote: "",
    esquina: false,
    tipoVia: "",
    valorUnitario: "",

    // Paso 5: Construcción
    anioConstruccion: "",
    estadoConservacion: "",
    categoriaConstruccion: "",
    niveles: "",
    valorReposicion: "",

    // Paso 6: Depreciación
    anosTranscurridos: "",
    vidaUtil: "50",
    depreciacionAnual: "",
    valorNeto: "",

    // Paso 7: Comparables
    comparables: [] as Comparable[],

    // Paso 8: Factores de Homologación
    factorUbicacion: "1.00",
    factorVia: "1.00",
    factorFrente: "1.00",
    factorEsquina: "1.00",
    factorMorfologico: "1.00",
    factorServicios: "1.00",
    factorEquipamiento: "1.00",

    // Paso 9: Radar
    radioRadar: "500",

    // Paso 10: Documentos
    folioReal: false,
    catastro: false,
    impuestos: false,
    plano: false,
    fotografias: false,

    // General
    solicitante: "",
    propietario: "",
    observaciones: ""
  })

  // Calcular depreciación automáticamente
  const calculateDepreciacion = () => {
    if (formData.anioConstruccion && formData.valorReposicion) {
      const anioConstruccion = parseInt(formData.anioConstruccion)
      const valorReposicion = parseFloat(formData.valorReposicion)
      const anioActual = new Date().getFullYear()
      const anosTranscurridos = anioActual - anioConstruccion
      const vidaUtil = 50
      const depreciacionAnual = 1 / vidaUtil
      const depreciacionTotal = depreciacionAnual * anosTranscurridos
      const valorNeto = valorReposicion * (1 - depreciacionTotal)

      setFormData({
        ...formData,
        anosTranscurridos: anosTranscurridos.toString(),
        depreciacionAnual: (depreciacionAnual * 100).toFixed(2) + "%",
        valorNeto: valorNeto.toFixed(2)
      })
    }
  }

  // Agregar comparable
  const [showComparableModal, setShowComparableModal] = useState(false)
  const [newComparable, setNewComparable] = useState({
    codigo: "",
    direccion: "",
    precio: "",
    superficie: ""
  })

  const addComparable = () => {
    if (newComparable.codigo && newComparable.precio && newComparable.superficie) {
      const precio = parseFloat(newComparable.precio)
      const superficie = parseFloat(newComparable.superficie)
      const comparable: Comparable = {
        id: Date.now().toString(),
        codigo: newComparable.codigo,
        direccion: newComparable.direccion,
        precio,
        superficie,
        precioM2: precio / superficie
      }
      setFormData({
        ...formData,
        comparables: [...formData.comparables, comparable]
      })
      setNewComparable({ codigo: "", direccion: "", precio: "", superficie: "" })
      setShowComparableModal(false)
    }
  }

  const removeComparable = (id: string) => {
    setFormData({
      ...formData,
      comparables: formData.comparables.filter(c => c.id !== id)
    })
  }

  const handleNext = () => {
    if (currentStep < steps.length) {
      setCurrentStep(currentStep + 1)
    }
  }

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleFinish = () => {
    setShowSuccessModal(true)
  }

  const getStepContent = () => {
    switch (currentStep) {
      case 1: // Categoría
        return (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {categories.map((category) => {
              const Icon = category.icon
              const isSelected = selectedCategory === category.value
              return (
                <Card
                  key={category.value}
                  className={`border-2 transition-all duration-300 bg-slate-900/50 cursor-pointer group ${
                    isSelected ? "border-primary bg-primary/10 shadow-xl shadow-primary/20" : "border-slate-800 hover:border-primary/50 hover:bg-slate-800/50 hover:shadow-xl hover:shadow-primary/20"
                  }`}
                  onClick={() => setSelectedCategory(category.value)}
                >
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform ${isSelected ? "bg-primary text-white" : "bg-primary/20 text-primary"}`}>
                        <Icon className="w-6 h-6" />
                      </div>
                      {isSelected && <Check className="w-5 h-5 text-primary" />}
                    </div>
                    <h3 className="text-lg font-semibold text-white mb-2">
                      {category.label}
                    </h3>
                    <p className="text-sm text-slate-400">
                      {category.description}
                    </p>
                  </div>
                </Card>
              )
            })}
          </div>
        )

      case 2: // Operación
        return (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 max-w-4xl mx-auto">
            {operations.map((operation) => {
              const isSelected = selectedOperation === operation.value
              return (
                <Card
                  key={operation.value}
                  className={`border-2 transition-all duration-300 bg-slate-900/50 cursor-pointer group overflow-hidden ${
                    isSelected ? "border-white bg-white/5 shadow-xl shadow-white/20" : "border-slate-800 hover:border-white/50 hover:bg-slate-800/50 hover:shadow-xl hover:shadow-white/20"
                  }`}
                  onClick={() => setSelectedOperation(operation.value)}
                >
                  <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${operation.color} opacity-10 rounded-full filter blur-3xl group-hover:opacity-20 transition-opacity`} />
                  <div className="relative p-6 text-center">
                    <div className={`w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br ${operation.color} flex items-center justify-center group-hover:scale-110 transition-transform`}>
                      <span className="text-2xl font-bold text-white">
                        {operation.value === "VENTA" ? "$" : operation.value === "ALQUILER" ? "🔑" : "📋"}
                      </span>
                    </div>
                    <h3 className="text-xl sm:text-2xl font-bold text-white mb-3">
                      {operation.label}
                    </h3>
                    <p className="text-sm text-slate-400">
                      {operation.description}
                    </p>
                  </div>
                </Card>
              )
            })}
          </div>
        )

      case 3: // Ubicación
        return (
          <div className="max-w-4xl mx-auto space-y-6">
            <Card className="border-2 border-slate-800 bg-slate-900/50 overflow-hidden">
              <div className="relative h-[300px] sm:h-[400px] bg-slate-800">
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center space-y-4">
                    <MapPin className="w-12 h-12 text-slate-600 mx-auto" />
                    <p className="text-sm text-slate-500">Mapa con selección de ubicación</p>
                    <Button className="bg-primary hover:bg-primary/90">
                      Seleccionar en Mapa
                    </Button>
                  </div>
                </div>
              </div>
            </Card>

            <Card className="border-2 border-slate-800 bg-slate-900/50">
              <div className="p-6">
                <h3 className="text-lg font-semibold text-white mb-4">Datos de Ubicación</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="direccion">Dirección *</Label>
                    <Input
                      id="direccion"
                      value={formData.direccion}
                      onChange={(e) => setFormData({ ...formData, direccion: e.target.value })}
                      className="bg-slate-800 border-slate-700 text-white"
                      placeholder="Calle, Número, Zona"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="zona">Zona / Barrio</Label>
                    <Input
                      id="zona"
                      value={formData.zona}
                      onChange={(e) => setFormData({ ...formData, zona: e.target.value })}
                      className="bg-slate-800 border-slate-700 text-white"
                      placeholder="Zona Sur, Centro, etc."
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lat">Latitud</Label>
                    <Input
                      id="lat"
                      type="number"
                      value={formData.lat}
                      onChange={(e) => setFormData({ ...formData, lat: e.target.value })}
                      className="bg-slate-800 border-slate-700 text-white"
                      placeholder="-17.3895"
                      step="0.00001"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lng">Longitud</Label>
                    <Input
                      id="lng"
                      type="number"
                      value={formData.lng}
                      onChange={(e) => setFormData({ ...formData, lng: e.target.value })}
                      className="bg-slate-800 border-slate-700 text-white"
                      placeholder="-66.1569"
                      step="0.00001"
                    />
                  </div>
                </div>
              </div>
            </Card>
          </div>
        )

      case 4: // Terreno
        return (
          <div className="max-w-4xl mx-auto">
            <Card className="border-2 border-slate-800 bg-slate-900/50">
              <div className="p-6">
                <h3 className="text-lg font-semibold text-white mb-4">Datos del Terreno</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="superficieTerreno">Superficie (m²) *</Label>
                    <Input
                      id="superficieTerreno"
                      type="number"
                      value={formData.superficieTerreno}
                      onChange={(e) => setFormData({ ...formData, superficieTerreno: e.target.value })}
                      className="bg-slate-800 border-slate-700 text-white"
                      placeholder="150"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="frente">Frente (m)</Label>
                    <Input
                      id="frente"
                      type="number"
                      value={formData.frente}
                      onChange={(e) => setFormData({ ...formData, frente: e.target.value })}
                      className="bg-slate-800 border-slate-700 text-white"
                      placeholder="10"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="fondo">Fondo (m)</Label>
                    <Input
                      id="fondo"
                      type="number"
                      value={formData.fondo}
                      onChange={(e) => setFormData({ ...formData, fondo: e.target.value })}
                      className="bg-slate-800 border-slate-700 text-white"
                      placeholder="15"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="formaLote">Forma del Lote</Label>
                    <select
                      id="formaLote"
                      value={formData.formaLote}
                      onChange={(e) => setFormData({ ...formData, formaLote: e.target.value })}
                      className="w-full h-10 px-3 bg-slate-800 border-2 border-slate-700 rounded-md text-white text-sm"
                    >
                      <option value="">Seleccionar...</option>
                      <option value="REGULAR">Regular</option>
                      <option value="IRREGULAR">Irregular</option>
                      <option value="RECTANGULAR">Rectangular</option>
                      <option value="CUADRADO">Cuadrado</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="tipoVia">Tipo de Vía</Label>
                    <select
                      id="tipoVia"
                      value={formData.tipoVia}
                      onChange={(e) => setFormData({ ...formData, tipoVia: e.target.value })}
                      className="w-full h-10 px-3 bg-slate-800 border-2 border-slate-700 rounded-md text-white text-sm"
                    >
                      <option value="">Seleccionar...</option>
                      <option value="PRINCIPAL">Avenida Principal</option>
                      <option value="SECUNDARIA">Calle Secundaria</option>
                      <option value="CALLEJON">Callejón</option>
                      <option value="PASAJE">Pasaje</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="valorUnitario">Valor Unitario (USD/m²) *</Label>
                    <Input
                      id="valorUnitario"
                      type="number"
                      value={formData.valorUnitario}
                      onChange={(e) => setFormData({ ...formData, valorUnitario: e.target.value })}
                      className="bg-slate-800 border-slate-700 text-white"
                      placeholder="250"
                    />
                  </div>
                </div>

                <div className="mt-4 flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="esquina"
                    checked={formData.esquina}
                    onChange={(e) => setFormData({ ...formData, esquina: e.target.checked })}
                    className="w-4 h-4 rounded border-slate-700 bg-slate-800 text-primary focus:ring-primary"
                  />
                  <Label htmlFor="esquina" className="text-sm text-slate-300">
                    Es un lote de esquina
                  </Label>
                </div>
              </div>
            </Card>
          </div>
        )

      case 5: // Construcción
        return (
          <div className="max-w-4xl mx-auto">
            <Card className="border-2 border-slate-800 bg-slate-900/50">
              <div className="p-6">
                <h3 className="text-lg font-semibold text-white mb-4">Datos de la Construcción</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="anioConstruccion">Año de Construcción *</Label>
                    <Input
                      id="anioConstruccion"
                      type="number"
                      value={formData.anioConstruccion}
                      onChange={(e) => setFormData({ ...formData, anioConstruccion: e.target.value })}
                      className="bg-slate-800 border-slate-700 text-white"
                      placeholder="2010"
                      min="1900"
                      max={new Date().getFullYear()}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="estadoConservacion">Estado de Conservación</Label>
                    <select
                      id="estadoConservacion"
                      value={formData.estadoConservacion}
                      onChange={(e) => setFormData({ ...formData, estadoConservacion: e.target.value })}
                      className="w-full h-10 px-3 bg-slate-800 border-2 border-slate-700 rounded-md text-white text-sm"
                    >
                      <option value="">Seleccionar...</option>
                      <option value="NUEVO">Nuevo</option>
                      <option value="EXCELENTE">Excelente</option>
                      <option value="BUENO">Bueno</option>
                      <option value="REGULAR">Regular</option>
                      <option value="MALO">Malo</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="categoriaConstruccion">Categoría</Label>
                    <select
                      id="categoriaConstruccion"
                      value={formData.categoriaConstruccion}
                      onChange={(e) => setFormData({ ...formData, categoriaConstruccion: e.target.value })}
                      className="w-full h-10 px-3 bg-slate-800 border-2 border-slate-700 rounded-md text-white text-sm"
                    >
                      <option value="">Seleccionar...</option>
                      <option value="LUJO">Lujo</option>
                      <option value="ECONOMICA">Económica</option>
                      <option value="MEDIA">Media</option>
                      <option value="POPULAR">Popular</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="niveles">Número de Niveles</Label>
                    <Input
                      id="niveles"
                      type="number"
                      value={formData.niveles}
                      onChange={(e) => setFormData({ ...formData, niveles: e.target.value })}
                      className="bg-slate-800 border-slate-700 text-white"
                      placeholder="2"
                      min="1"
                    />
                  </div>
                  <div className="space-y-2 sm:col-span-2">
                    <Label htmlFor="valorReposicion">Valor de Reposición (USD) *</Label>
                    <Input
                      id="valorReposicion"
                      type="number"
                      value={formData.valorReposicion}
                      onChange={(e) => setFormData({ ...formData, valorReposicion: e.target.value })}
                      className="bg-slate-800 border-slate-700 text-white"
                      placeholder="60000"
                    />
                  </div>
                </div>
              </div>
            </Card>
          </div>
        )

      case 6: // Depreciación
        return (
          <div className="max-w-4xl mx-auto space-y-6">
            <Card className="border-2 border-slate-800 bg-slate-900/50">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-white">Cálculo de Depreciación</h3>
                  <Button onClick={calculateDepreciacion} size="sm" className="bg-primary hover:bg-primary/90">
                    <Calculator className="w-4 h-4 mr-2" />
                    Calcular
                  </Button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-slate-800/50 rounded-lg p-4">
                    <p className="text-xs text-slate-500 mb-1">Año Construcción</p>
                    <p className="text-lg font-semibold text-white">{formData.anioConstruccion || "-"}</p>
                  </div>
                  <div className="bg-slate-800/50 rounded-lg p-4">
                    <p className="text-xs text-slate-500 mb-1">Años Transcurridos</p>
                    <p className="text-lg font-semibold text-white">{formData.anosTranscurridos || "-"}</p>
                  </div>
                  <div className="bg-slate-800/50 rounded-lg p-4">
                    <p className="text-xs text-slate-500 mb-1">Vida Útil</p>
                    <p className="text-lg font-semibold text-white">{formData.vidaUtil} años</p>
                  </div>
                  <div className="bg-slate-800/50 rounded-lg p-4">
                    <p className="text-xs text-slate-500 mb-1">Depreciación Anual</p>
                    <p className="text-lg font-semibold text-yellow-400">{formData.depreciacionAnual || "-"}</p>
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="bg-slate-800/50 rounded-lg p-4">
                    <p className="text-xs text-slate-500 mb-1">Valor de Reposición</p>
                    <p className="text-xl font-semibold text-white">
                      ${formData.valorReposicion ? parseFloat(formData.valorReposicion).toLocaleString() : "0"}
                    </p>
                  </div>
                  <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4">
                    <p className="text-xs text-slate-500 mb-1">Valor Neto (con depreciación)</p>
                    <p className="text-xl font-semibold text-green-400">
                      ${formData.valorNeto ? parseFloat(formData.valorNeto).toLocaleString() : "0"}
                    </p>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        )

      case 7: // Comparables
        return (
          <div className="max-w-4xl mx-auto space-y-6">
            <Card className="border-2 border-slate-800 bg-slate-900/50">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-white">Comparables de Mercado</h3>
                  <Button onClick={() => setShowComparableModal(true)} size="sm" className="bg-primary hover:bg-primary/90">
                    <Plus className="w-4 h-4 mr-2" />
                    Agregar Comparable
                  </Button>
                </div>

                {formData.comparables.length === 0 ? (
                  <div className="text-center py-8 text-slate-500">
                    No hay comparables agregados aún
                  </div>
                ) : (
                  <div className="space-y-3">
                    {formData.comparables.map((comp) => (
                      <div key={comp.id} className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg">
                        <div className="flex-1">
                          <p className="text-sm font-medium text-white">{comp.codigo}</p>
                          <p className="text-xs text-slate-500">{comp.direccion}</p>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <p className="text-xs text-slate-500">Precio</p>
                            <p className="text-sm font-medium text-white">${comp.precio.toLocaleString()}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-xs text-slate-500">m²</p>
                            <p className="text-sm font-medium text-white">{comp.superficie}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-xs text-slate-500">USD/m²</p>
                            <p className="text-sm font-medium text-green-400">${comp.precioM2.toFixed(2)}</p>
                          </div>
                          <button
                            onClick={() => removeComparable(comp.id)}
                            className="p-2 text-slate-400 hover:text-red-400 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </Card>

            {/* Resumen */}
            {formData.comparables.length > 0 && (
              <Card className="border-2 border-slate-800 bg-slate-900/50">
                <div className="p-6">
                  <h4 className="text-sm font-semibold text-white mb-3">Promedios de Comparables</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="bg-slate-800/50 rounded-lg p-3">
                      <p className="text-xs text-slate-500 mb-1">Precio Promedio</p>
                      <p className="text-lg font-semibold text-white">
                        ${(formData.comparables.reduce((sum, c) => sum + c.precio, 0) / formData.comparables.length).toFixed(2)}
                      </p>
                    </div>
                    <div className="bg-slate-800/50 rounded-lg p-3">
                      <p className="text-xs text-slate-500 mb-1">Superficie Promedio</p>
                      <p className="text-lg font-semibold text-white">
                        {(formData.comparables.reduce((sum, c) => sum + c.superficie, 0) / formData.comparables.length).toFixed(2)} m²
                      </p>
                    </div>
                    <div className="bg-slate-800/50 rounded-lg p-3">
                      <p className="text-xs text-slate-500 mb-1">Precio/m² Promedio</p>
                      <p className="text-lg font-semibold text-green-400">
                        ${(formData.comparables.reduce((sum, c) => sum + c.precioM2, 0) / formData.comparables.length).toFixed(2)}
                      </p>
                    </div>
                  </div>
                </div>
              </Card>
            )}
          </div>
        )

      case 8: // Factores de Homologación
        return (
          <div className="max-w-4xl mx-auto">
            <Card className="border-2 border-slate-800 bg-slate-900/50">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-white">Factores de Homologación</h3>
                  <p className="text-xs text-slate-500">Máximo: 1.50 cada factor</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {[
                    { key: "factorUbicacion", label: "Ubicación" },
                    { key: "factorVia", label: "Vía" },
                    { key: "factorFrente", label: "Frente" },
                    { key: "factorEsquina", label: "Esquina" },
                    { key: "factorMorfologico", label: "Morfología" },
                    { key: "factorServicios", label: "Servicios" },
                    { key: "factorEquipamiento", label: "Equipamiento" }
                  ].map((factor) => (
                    <div key={factor.key} className="space-y-2">
                      <Label htmlFor={factor.key}>{factor.label}</Label>
                      <Input
                        id={factor.key}
                        type="number"
                        step="0.01"
                        min="0.5"
                        max="1.50"
                        value={formData[factor.key as keyof typeof formData] as string}
                        onChange={(e) => {
                          const value = parseFloat(e.target.value)
                          if (value >= 0.5 && value <= 1.50) {
                            setFormData({ ...formData, [factor.key]: e.target.value })
                          }
                        }}
                        className="bg-slate-800 border-slate-700 text-white"
                      />
                    </div>
                  ))}
                </div>

                {/* Factor total */}
                <div className="mt-6 bg-primary/10 border border-primary/30 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-slate-500 mb-1">Factor de Homologación Total</p>
                      <p className="text-2xl font-bold text-primary">
                        {
                          (parseFloat(formData.factorUbicacion) +
                           parseFloat(formData.factorVia) +
                           parseFloat(formData.factorFrente) +
                           parseFloat(formData.factorEsquina) +
                           parseFloat(formData.factorMorfologico) +
                           parseFloat(formData.factorServicios) +
                           parseFloat(formData.factorEquipamiento)) / 7
                        }
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-slate-500">Rango válido</p>
                      <p className="text-sm text-slate-400">0.50 - 1.50</p>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        )

      case 9: // Radar de Equipamientos
        return (
          <div className="max-w-4xl mx-auto space-y-6">
            <Card className="border-2 border-slate-800 bg-slate-900/50">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-white">Radar de Equipamientos</h3>
                  <select
                    value={formData.radioRadar}
                    onChange={(e) => setFormData({ ...formData, radioRadar: e.target.value })}
                    className="h-9 px-3 bg-slate-800 border-2 border-slate-700 rounded-md text-white text-sm"
                  >
                    <option value="250">Radio: 250m</option>
                    <option value="500">Radio: 500m</option>
                    <option value="750">Radio: 750m</option>
                    <option value="1000">Radio: 1000m</option>
                  </select>
                </div>

                <div className="relative h-[300px] sm:h-[400px] bg-slate-800 rounded-lg">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center space-y-4">
                      <MapPin className="w-12 h-12 text-slate-600 mx-auto" />
                      <p className="text-sm text-slate-500">Mapa con radar de equipamientos</p>
                      <p className="text-xs text-slate-600">
                        Hospitales, Colegios, Universidades, Parques, Bancos, Comercios
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </Card>

            <Card className="border-2 border-slate-800 bg-slate-900/50">
              <div className="p-6">
                <h4 className="text-sm font-semibold text-white mb-3">Equipamientos Detectados</h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {[
                    { name: "Hospitales", count: 2, icon: "🏥" },
                    { name: "Colegios", count: 3, icon: "🎓" },
                    { name: "Universidades", count: 1, icon: "📚" },
                    { name: "Parques", count: 2, icon: "🌳" },
                    { name: "Bancos", count: 4, icon: "🏦" },
                    { name: "Comercios", count: 8, icon: "🛒" },
                    { name: "Iglesias", count: 2, icon: "⛪" },
                    { name: "Transporte", count: 3, icon: "🚌" }
                  ].map((item) => (
                    <div key={item.name} className="bg-slate-800/50 rounded-lg p-3 text-center">
                      <div className="text-2xl mb-1">{item.icon}</div>
                      <p className="text-xs text-slate-400">{item.name}</p>
                      <p className="text-lg font-semibold text-white">{item.count}</p>
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          </div>
        )

      case 10: // Documentos
        return (
          <div className="max-w-4xl mx-auto">
            <Card className="border-2 border-slate-800 bg-slate-900/50">
              <div className="p-6">
                <h3 className="text-lg font-semibold text-white mb-4">Documentos y Fotografías</h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {[
                    { key: "folioReal", label: "Folio Real", icon: "📄" },
                    { key: "catastro", label: "Catastro", icon: "📋" },
                    { key: "impuestos", label: "Impuestos", icon: "💰" },
                    { key: "plano", label: "Plano", icon: "📐" },
                    { key: "fotografias", label: "Fotografías", icon: "📷" },
                    { key: "avaluoPdf", label: "Avalúo PDF", icon: "📑", disabled: true }
                  ].map((doc) => (
                    <div key={doc.key} className={`relative border-2 rounded-lg p-4 transition-all ${
                      formData[doc.key as keyof typeof formData]
                        ? "border-green-500 bg-green-500/10"
                        : "border-slate-700 bg-slate-800/50 hover:border-slate-600"
                    } ${doc.disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
                    onClick={() => !doc.disabled && setFormData({ ...formData, [doc.key]: !formData[doc.key as keyof typeof formData] })}
                    >
                      <div className="flex items-center gap-3">
                        <div className="text-2xl">{doc.icon}</div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-white">{doc.label}</p>
                          <p className="text-xs text-slate-500">
                            {formData[doc.key as keyof typeof formData] ? "Agregado" : "Pendiente"}
                          </p>
                        </div>
                        {formData[doc.key as keyof typeof formData] && (
                          <Check className="w-5 h-5 text-green-500" />
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Datos generales */}
                <div className="mt-6 space-y-4">
                  <h4 className="text-sm font-semibold text-white">Datos del Avalúo</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="solicitante">Solicitante</Label>
                      <Input
                        id="solicitante"
                        value={formData.solicitante}
                        onChange={(e) => setFormData({ ...formData, solicitante: e.target.value })}
                        className="bg-slate-800 border-slate-700 text-white"
                        placeholder="Nombre del solicitante"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="propietario">Propietario</Label>
                      <Input
                        id="propietario"
                        value={formData.propietario}
                        onChange={(e) => setFormData({ ...formData, propietario: e.target.value })}
                        className="bg-slate-800 border-slate-700 text-white"
                        placeholder="Nombre del propietario"
                      />
                    </div>
                    <div className="space-y-2 sm:col-span-2">
                      <Label htmlFor="observaciones">Observaciones</Label>
                      <Input
                        id="observaciones"
                        value={formData.observaciones}
                        onChange={(e) => setFormData({ ...formData, observaciones: e.target.value })}
                        className="bg-slate-800 border-slate-700 text-white"
                        placeholder="Observaciones adicionales"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        )

      case 11: // Finalizar
        return (
          <div className="max-w-4xl mx-auto space-y-6">
            <Card className="border-2 border-slate-800 bg-slate-900/50">
              <div className="p-6">
                <h3 className="text-lg font-semibold text-white mb-4">Resumen del Avalúo</h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <div className="bg-slate-800/50 rounded-lg p-3">
                      <p className="text-xs text-slate-500 mb-1">Categoría</p>
                      <p className="text-sm font-medium text-white">
                        {selectedCategory && categories.find(c => c.value === selectedCategory)?.label}
                      </p>
                    </div>
                    <div className="bg-slate-800/50 rounded-lg p-3">
                      <p className="text-xs text-slate-500 mb-1">Operación</p>
                      <p className="text-sm font-medium text-white">
                        {selectedOperation && operations.find(o => o.value === selectedOperation)?.label}
                      </p>
                    </div>
                    <div className="bg-slate-800/50 rounded-lg p-3">
                      <p className="text-xs text-slate-500 mb-1">Ubicación</p>
                      <p className="text-sm font-medium text-white">{formData.direccion || "-"}</p>
                    </div>
                    <div className="bg-slate-800/50 rounded-lg p-3">
                      <p className="text-xs text-slate-500 mb-1">Superficie Terreno</p>
                      <p className="text-sm font-medium text-white">
                        {formData.superficieTerreno ? `${formData.superficieTerreno} m²` : "-"}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="bg-slate-800/50 rounded-lg p-3">
                      <p className="text-xs text-slate-500 mb-1">Valor Terreno</p>
                      <p className="text-sm font-medium text-white">
                        ${formData.valorUnitario && formData.superficieTerreno
                          ? (parseFloat(formData.valorUnitario) * parseFloat(formData.superficieTerreno)).toLocaleString()
                          : "0"}
                      </p>
                    </div>
                    <div className="bg-slate-800/50 rounded-lg p-3">
                      <p className="text-xs text-slate-500 mb-1">Valor Construcción</p>
                      <p className="text-sm font-medium text-green-400">
                        ${formData.valorNeto || "0"}
                      </p>
                    </div>
                    <div className="bg-slate-800/50 rounded-lg p-3">
                      <p className="text-xs text-slate-500 mb-1">Comparables</p>
                      <p className="text-sm font-medium text-white">
                        {formData.comparables.length} agregados
                      </p>
                    </div>
                    <div className="bg-slate-800/50 rounded-lg p-3">
                      <p className="text-xs text-slate-500 mb-1">Factor Homologación</p>
                      <p className="text-sm font-medium text-white">
                        {((parseFloat(formData.factorUbicacion) +
                          parseFloat(formData.factorVia) +
                          parseFloat(formData.factorFrente) +
                          parseFloat(formData.factorEsquina) +
                          parseFloat(formData.factorMorfologico) +
                          parseFloat(formData.factorServicios) +
                          parseFloat(formData.factorEquipamiento)) / 7).toFixed(2)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </Card>

            <Card className="border-2 border-primary/30 bg-gradient-to-r from-primary/20 to-secondary/20">
              <div className="p-6 text-center">
                <Check className="w-12 h-12 text-green-500 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-white mb-2">¡Avalúo Completo!</h3>
                <p className="text-sm text-slate-400 mb-4">
                  Todos los datos han sido ingresados correctamente
                </p>
                <Button onClick={handleFinish} size="lg" className="bg-green-500 hover:bg-green-600">
                  Finalizar y Generar Avalúo
                </Button>
              </div>
            </Card>
          </div>
        )

      default:
        return null
    }
  }

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return selectedCategory !== null
      case 2:
        return selectedOperation !== null
      case 3:
        return formData.direccion !== ""
      case 4:
        return formData.superficieTerreno !== "" && formData.valorUnitario !== ""
      case 5:
        return formData.anioConstruccion !== "" && formData.valorReposicion !== ""
      case 6:
        return true
      case 7:
        return true
      case 8:
        return true
      case 9:
        return true
      case 10:
        return true
      case 11:
        return true
      default:
        return false
    }
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white">Crear Avalúo</h1>
          <p className="text-sm sm:text-base text-slate-400 mt-1">
            Paso {currentStep} de {steps.length}: {steps[currentStep - 1].name}
          </p>
        </div>
        <Link href="/dashboard/avaluos">
          <Button variant="outline" className="border-slate-700 text-white hover:bg-slate-800">
            Cancelar
          </Button>
        </Link>
      </div>

      {/* Progress Steps */}
      <div className="overflow-x-auto">
        <div className="flex items-center gap-2 min-w-max pb-2">
          {steps.map((step, index) => (
            <div key={step.id} className="flex items-center">
              <div
                className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-xs sm:text-sm font-medium transition-all ${
                  currentStep === step.id
                    ? "bg-primary text-white"
                    : currentStep > step.id
                    ? "bg-green-500 text-white"
                    : "bg-slate-700 text-slate-400"
                }`}
              >
                {currentStep > step.id ? <Check className="w-4 h-4 sm:w-5 sm:h-5" /> : step.icon}
              </div>
              {index < steps.length - 1 && (
                <div className={`w-8 sm:w-16 h-0.5 mx-1 ${currentStep > step.id ? "bg-green-500" : "bg-slate-700"}`} />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Step Content */}
      {getStepContent()}

      {/* Navigation */}
      <div className="flex items-center justify-between pt-4 border-t border-slate-800">
        <Button
          variant="outline"
          onClick={handleBack}
          disabled={currentStep === 1}
          className="border-slate-700 text-white hover:bg-slate-800"
        >
          <ChevronLeft className="w-4 h-4 mr-2" />
          Atrás
        </Button>

        {currentStep < steps.length ? (
          <Button
            onClick={handleNext}
            disabled={!canProceed()}
            className="bg-primary hover:bg-primary/90"
          >
            Siguiente
            <ChevronRight className="w-4 h-4 ml-2" />
          </Button>
        ) : (
          <Button
            onClick={handleFinish}
            className="bg-green-500 hover:bg-green-600"
          >
            Finalizar Avalúo
          </Button>
        )}
      </div>

      {/* Modal de Comparable */}
      <Dialog open={showComparableModal} onOpenChange={setShowComparableModal}>
        <DialogContent className="bg-slate-900 border-slate-800 text-white max-w-md">
          <DialogHeader>
            <DialogTitle>Agregar Comparable</DialogTitle>
            <DialogDescription className="text-slate-400">
              Ingresa los datos del comparable de mercado
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="comp-codigo">Código</Label>
              <Input
                id="comp-codigo"
                value={newComparable.codigo}
                onChange={(e) => setNewComparable({ ...newComparable, codigo: e.target.value })}
                className="bg-slate-800 border-slate-700 text-white"
                placeholder="PROP-001"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="comp-direccion">Dirección</Label>
              <Input
                id="comp-direccion"
                value={newComparable.direccion}
                onChange={(e) => setNewComparable({ ...newComparable, direccion: e.target.value })}
                className="bg-slate-800 border-slate-700 text-white"
                placeholder="Calle, Número"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="comp-precio">Precio (USD)</Label>
                <Input
                  id="comp-precio"
                  type="number"
                  value={newComparable.precio}
                  onChange={(e) => setNewComparable({ ...newComparable, precio: e.target.value })}
                  className="bg-slate-800 border-slate-700 text-white"
                  placeholder="85000"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="comp-superficie">Superficie (m²)</Label>
                <Input
                  id="comp-superficie"
                  type="number"
                  value={newComparable.superficie}
                  onChange={(e) => setNewComparable({ ...newComparable, superficie: e.target.value })}
                  className="bg-slate-800 border-slate-700 text-white"
                  placeholder="85"
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowComparableModal(false)}
              className="border-slate-700 text-white hover:bg-slate-800"
            >
              Cancelar
            </Button>
            <Button onClick={addComparable} className="bg-primary hover:bg-primary/90">
              Agregar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de Éxito */}
      <Dialog open={showSuccessModal} onOpenChange={setShowSuccessModal}>
        <DialogContent className="bg-slate-900 border-slate-800 text-white">
          <DialogHeader>
            <DialogTitle className="text-center text-xl">¡Avalúo Creado Exitosamente!</DialogTitle>
          </DialogHeader>

          <div className="text-center py-4">
            <Check className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <p className="text-slate-400 mb-2">
              El avalúo ha sido registrado con éxito
            </p>
            <p className="text-sm text-slate-500">
              Código: <span className="font-mono font-medium text-white">AVAL-2026-{String(Math.floor(Math.random() * 900) + 100)}</span>
            </p>
          </div>

          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Link href="/dashboard/avaluos/mis-avaluos">
              <Button variant="outline" className="border-slate-700 text-white hover:bg-slate-800 w-full">
                Ver Mis Avalúos
              </Button>
            </Link>
            <Link href="/dashboard/avaluos">
              <Button className="bg-primary hover:bg-primary/90 w-full">
                Crear Nuevo Avalúo
              </Button>
            </Link>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
