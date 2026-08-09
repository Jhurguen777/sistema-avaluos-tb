"use client"

import { useState, useMemo } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select"
import {
  ChevronRight,
  ChevronLeft,
  Home,
  Building,
  Store,
  Warehouse,
  Building2,
  MapPin,
  Loader2,
  Check,
  FileText,
  Ruler,
  Sparkles,
  Radar as RadarIcon,
  Calculator,
} from "lucide-react"
import { useRouter } from "next/navigation"
import { toast } from "@/components/ui/use-toast"
import { crearAvaluoAction } from "@/modules/avaluos/actions"
import { valorSugerido } from "@/config/valores-reposicion"
import { MapaUbicacion } from "@/components/avaluos/mapa-ubicacion"
import { TablaReposicion } from "@/components/avaluos/tabla-reposicion"
import { DocumentosWizard, type DocumentoWizard } from "@/components/avaluos/documentos-wizard"
import { ComparablesMapa } from "@/components/avaluos/comparables-mapa"
import type { ComparableCercanoDTO, MetodoCalculoTerreno } from "@/modules/avaluos/types/avaluo.types"
import type { CategoriaConstructiva } from "@/constants/categorias-constructivas"
import type { EstadoConservacion } from "@/constants/estados-conservacion"

type PropertyCategory = "CASA" | "DEPARTAMENTO" | "TERRENO" | "LOCAL_COMERCIAL" | "OFICINA" | "GALPON" | "OTROS"
type OperationType = "VENTA" | "ALQUILER" | "ANTICRETICO"
type AvaluoTipo = "COMERCIAL" | "ALQUILER" | "VENTA_RAPIDA" | "CAPITAL_COMERCIAL"

const categories: { value: PropertyCategory; label: string; icon: React.ComponentType<{ className?: string }>; description: string }[] = [
  { value: "CASA", label: "Casa", icon: Home, description: "Vivienda unifamiliar con terreno" },
  { value: "DEPARTAMENTO", label: "Departamento", icon: Building2, description: "Unidad en edificio multifamiliar" },
  { value: "TERRENO", label: "Terreno", icon: MapPin, description: "Lote sin construcción" },
  { value: "LOCAL_COMERCIAL", label: "Local Comercial", icon: Store, description: "Espacio para actividades comerciales" },
  { value: "OFICINA", label: "Oficina", icon: Building, description: "Espacio para actividades administrativas" },
  { value: "GALPON", label: "Galpón", icon: Warehouse, description: "Espacio industrial o de almacenamiento" },
]

const operations: { value: OperationType; label: string; description: string; color: string }[] = [
  { value: "VENTA", label: "Venta", description: "Avalúo para compraventa de propiedad", color: "from-blue-500 to-cyan-500" },
  { value: "ALQUILER", label: "Alquiler", description: "Avalúo para contrato de arrendamiento", color: "from-red-500 to-pink-500" },
  { value: "ANTICRETICO", label: "Anticrético", description: "Avalúo para contrato de anticrético", color: "from-yellow-500 to-orange-500" },
]

const tiposAvaluo: { value: AvaluoTipo; label: string; descuento: string }[] = [
  { value: "COMERCIAL", label: "Comercial", descuento: "Sin descuento (valor de mercado)" },
  { value: "VENTA_RAPIDA", label: "Venta Rápida", descuento: "−15% sobre el valor comercial" },
  { value: "CAPITAL_COMERCIAL", label: "Capital Comercial", descuento: "−10% sobre el valor comercial" },
  { value: "ALQUILER", label: "Alquiler", descuento: "0.8% mensual del valor comercial" },
]

const FORMAS_LOTE = [
  { value: "REGULAR", label: "Regular" },
  { value: "IRREGULAR", label: "Irregular" },
  { value: "RECTANGULAR", label: "Rectangular" },
  { value: "CUADRADO", label: "Cuadrado" },
]

const TIPOS_VIA = [
  { value: "CALLE", label: "Calle" },
  { value: "AVENIDA", label: "Avenida" },
  { value: "PASAJE", label: "Pasaje" },
  { value: "CARRETERA", label: "Carretera" },
  { value: "CAMINO", label: "Camino" },
]

const CATEGORIAS_CONSTR = [
  { value: "LUJO", label: "Lujo" },
  { value: "PRIMERA", label: "Primera" },
  { value: "ESTANDAR", label: "Estándar" },
  { value: "ECONOMICA", label: "Económica" },
]

const ESTADOS_CONSERV = [
  { value: "EXCELENTE", label: "Excelente" },
  { value: "BUENO", label: "Bueno" },
  { value: "REGULAR", label: "Regular" },
  { value: "MALO", label: "Malo" },
  { value: "DEMOLICION", label: "Demolición" },
]

const FACTORES_LABELS: { key: string; label: string; descripcion: string }[] = [
  { key: "factorUbicacion", label: "Fub - Ubicación", descripcion: "Zona / Barrio" },
  { key: "factorVia", label: "Fvia - Vía", descripcion: "Tipo de calle / accesibilidad" },
  { key: "factorFrente", label: "Fff - Frente-Fondo", descripcion: "Relación frente-fondo del lote" },
  { key: "factorEsquina", label: "Fi - Inclinación", descripcion: "Topografía / pendiente" },
  { key: "factorMorfologico", label: "Fm - Morfología", descripcion: "Forma del lote" },
  { key: "factorServicios", label: "Fs - Servicios", descripcion: "Servicios básicos disponibles" },
]

const steps = [
  { id: 1, name: "Categoría" },
  { id: 2, name: "Operación" },
  { id: 3, name: "Ubicación" },
  { id: 4, name: "Terreno" },
  { id: 5, name: "Comodidades" },
  { id: 6, name: "Documentos" },
  { id: 7, name: "Construcción" },
  { id: 8, name: "Factores" },
  { id: 9, name: "Comparables" },
  { id: 10, name: "Radar" },
  { id: 11, name: "Finalizar" },
]

interface ConstrForm {
  id: string
  categoria: string
  estado: string
  anoConstruccion: string
  superficieM2: string
  tipo: string
}

export default function CrearAvaluoPage() {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(1)
  const [selectedCategory, setSelectedCategory] = useState<PropertyCategory | null>(null)
  const [selectedOperation, setSelectedOperation] = useState<OperationType | null>(null)
  const [selectedTipoAvaluo, setSelectedTipoAvaluo] = useState<AvaluoTipo | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const [createdCodigo, setCreatedCodigo] = useState<string | null>(null)
  const [createdId, setCreatedId] = useState<string | null>(null)

  // PASO 3 - Ubicación
  const [ubicacion, setUbicacion] = useState({
    direccion: "",
    zona: "",
    lat: null as number | null,
    lng: null as number | null,
  })

  // PASO 4 - Terreno
  const [terreno, setTerreno] = useState({
    superficieUtil: "",          // m² totales del lote
    superficieConstruida: "",    // m² edificados
    frente: "",
    fondo: "",
    formaLote: "",
    esquina: false,
    tipoVia: "CALLE",
    valorUnitarioManual: "",     // solo si no hay comparables
  })

  // PASO 5 - Amenities + servicios
  const [amenities, setAmenities] = useState({
    habitaciones: "",
    banos: "",
    cocheras: "",
    ambientes: "",
  })
  const [servicios, setServicios] = useState({
    luz: false,
    agua: false,
    alcantarillado: false,
    gas: false,
    otros: "",
  })

  // PASO 6 - Documentos
  const [documentos, setDocumentos] = useState<DocumentoWizard[]>([])

  // PASO 7 - Construcción (única, simplificada; vacía = terreno puro)
  const [tieneConstruccion, setTieneConstruccion] = useState(true)
  const [construccion, setConstruccion] = useState<ConstrForm>({
    id: "1",
    categoria: "",
    estado: "",
    anoConstruccion: "",
    superficieM2: "",
    tipo: "Principal",
  })

  // PASO 8 - Factores del sujeto
  const [factores, setFactores] = useState<Record<string, string>>({
    factorUbicacion: "1.0",
    factorVia: "1.0",
    factorFrente: "1.0",
    factorEsquina: "1.0",
    factorMorfologico: "1.0",
    factorServicios: "1.0",
  })

  // PASO 9 - Comparables
  const [comparablesSel, setComparablesSel] = useState<ComparableCercanoDTO[]>([])
  const [metodoCalculo, setMetodoCalculo] = useState<MetodoCalculoTerreno>("SIMPLE")

  // DATOS GENERALES (paso 6 también incluye solicitante/propietario)
  const [datosGenerales, setDatosGenerales] = useState({
    solicitante: "",
    propietario: "",
    observaciones: "",
  })

  // ───────────── Derived ─────────────

  const factorTotal = useMemo(() => {
    return (
      (parseFloat(factores.factorUbicacion) || 1) *
      (parseFloat(factores.factorVia) || 1) *
      (parseFloat(factores.factorFrente) || 1) *
      (parseFloat(factores.factorEsquina) || 1) *
      (parseFloat(factores.factorMorfologico) || 1) *
      (parseFloat(factores.factorServicios) || 1)
    )
  }, [factores])

  const valorUnitarioConstruccion = useMemo(() => {
    if (!construccion.categoria || !construccion.estado) return null
    if (construccion.estado === "DEMOLICION") return 0
    return valorSugerido(construccion.categoria as CategoriaConstructiva, construccion.estado as EstadoConservacion)
  }, [construccion.categoria, construccion.estado])

  const valorConstruccion = useMemo(() => {
    if (!tieneConstruccion) return 0
    if (valorUnitarioConstruccion == null) return 0
    const sup = parseFloat(construccion.superficieM2) || 0
    return valorUnitarioConstruccion * sup
  }, [tieneConstruccion, valorUnitarioConstruccion, construccion.superficieM2])

  const promedioSimpleComparables = useMemo(() => {
    if (comparablesSel.length === 0) return 0
    const suma = comparablesSel.reduce((acc, c) => acc + (c.precioM2 ?? 0), 0)
    return suma / comparablesSel.length
  }, [comparablesSel])

  const valorUnitarioTerreno = useMemo(() => {
    if (comparablesSel.length === 0) {
      // Sin comparables: usar valor manual
      const v = parseFloat(terreno.valorUnitarioManual) || 0
      return v
    }
    // Con comparables: método elegido × factor sujeto
    const prom = promedioSimpleComparables
    return prom * factorTotal
  }, [comparablesSel, promedioSimpleComparables, factorTotal, terreno.valorUnitarioManual])

  const valorTerreno = useMemo(() => {
    const sup = parseFloat(terreno.superficieUtil) || 0
    return valorUnitarioTerreno * sup
  }, [valorUnitarioTerreno, terreno.superficieUtil])

  const valorComercial = useMemo(() => valorTerreno + valorConstruccion, [valorTerreno, valorConstruccion])

  const valorSegunTipo = useMemo(() => {
    switch (selectedTipoAvaluo) {
      case "VENTA_RAPIDA":
        return valorComercial * 0.85
      case "CAPITAL_COMERCIAL":
        return valorComercial * 0.9
      case "ALQUILER":
        return valorComercial * 0.008
      default:
        return valorComercial
    }
  }, [valorComercial, selectedTipoAvaluo])

  // ───────────── Validators por paso ─────────────

  const canProceed = (step: number): boolean => {
    switch (step) {
      case 1: return selectedCategory !== null
      case 2: return selectedOperation !== null && selectedTipoAvaluo !== null
      case 3: return ubicacion.lat != null && ubicacion.lng != null
      case 4: return parseFloat(terreno.superficieUtil) > 0
      case 5: return true
      case 6: return true
      case 7: return !tieneConstruccion || (!!construccion.categoria && !!construccion.estado && !!construccion.anoConstruccion && !!construccion.superficieM2)
      case 8: return true
      case 9: return true // Comparables opcionales (si no hay, se usa valor manual)
      case 10: return true
      case 11: return true
      default: return false
    }
  }

  // ───────────── Submit ─────────────

  const handleSubmit = async () => {
    if (selectedCategory === null || selectedOperation === null || selectedTipoAvaluo === null) {
      toast.error("Faltan datos básicos")
      return
    }
    if (!ubicacion.lat || !ubicacion.lng) {
      toast.error("Definí la ubicación en el mapa (paso 3)")
      return
    }
    const supUtil = parseFloat(terreno.superficieUtil) || 0
    if (supUtil <= 0) {
      toast.error("Definí la superficie del terreno (paso 4)")
      return
    }

    setIsSubmitting(true)
    try {
      const construcciones =
        tieneConstruccion &&
        construccion.categoria &&
        construccion.estado &&
        construccion.anoConstruccion &&
        construccion.superficieM2
          ? [{
              categoria: construccion.categoria,
              estado: construccion.estado,
              anoConstruccion: parseInt(construccion.anoConstruccion),
              superficieM2: parseFloat(construccion.superficieM2),
              tipo: construccion.tipo || "Principal",
            }]
          : []

      const metodo: MetodoCalculoTerreno =
        comparablesSel.length === 0 ? "MANUAL" : metodoCalculo

      const valorManual = parseFloat(terreno.valorUnitarioManual) || 0

      const input = {
        categoria: selectedCategory,
        operacion: selectedOperation,
        tipo: selectedTipoAvaluo,
        direccion: ubicacion.direccion || null,
        zona: ubicacion.zona || null,
        lat: ubicacion.lat,
        lng: ubicacion.lng,
        terreno: {
          superficieM2: supUtil,
          superficieUtil: supUtil,
          superficieConstruida: parseFloat(terreno.superficieConstruida) || null,
          valorUnitario: valorManual || valorUnitarioTerreno,
          frente: parseFloat(terreno.frente) || null,
          fondo: parseFloat(terreno.fondo) || null,
          formaLote: terreno.formaLote || null,
          esEsquina: terreno.esquina,
          tipoVia: terreno.tipoVia,
        },
        amenities: {
          habitaciones: parseInt(amenities.habitaciones) || null,
          banos: parseInt(amenities.banos) || null,
          cocheras: parseInt(amenities.cocheras) || null,
          ambientes: parseInt(amenities.ambientes) || null,
        },
        servicios: {
          luz: servicios.luz,
          agua: servicios.agua,
          alcantarillado: servicios.alcantarillado,
          gas: servicios.gas,
          otros: servicios.otros || null,
        },
        construcciones,
        factores: {
          factorUbicacion: parseFloat(factores.factorUbicacion) || 1,
          factorVia: parseFloat(factores.factorVia) || 1,
          factorFrente: parseFloat(factores.factorFrente) || 1,
          factorEsquina: parseFloat(factores.factorEsquina) || 1,
          factorMorfologico: parseFloat(factores.factorMorfologico) || 1,
          factorServicios: parseFloat(factores.factorServicios) || 1,
        },
        comparables: comparablesSel.map((c) => ({
          direccion: c.direccion || c.nombre,
          precioOferta: c.precioUsd ?? 0,
          precioM2: c.precioM2 ?? 0,
          superficie: c.superficieUtil ?? c.superficieConstruida ?? 0,
          tipo: "VENTA" as const,
          lat: c.lat,
          lng: c.lng,
          distancia: c.distanciaMetros,
        })),
        metodoCalculoTerreno: metodo,
        solicitante: datosGenerales.solicitante || null,
        propietario: datosGenerales.propietario || null,
        observaciones: datosGenerales.observaciones || null,
      }

      const res = await crearAvaluoAction(input)
      if (!res.success) {
        toast.error(res.error || "Error al crear el avalúo")
        setIsSubmitting(false)
        return
      }

      const detalle = res.data
      setCreatedCodigo(detalle.codigo)
      setCreatedId(detalle.id)

      // Subir documentos del wizard (si los hay) en segundo plano.
      // Usamos try/catch por archivo para que un fallo no aborte los demás.
      if (documentos.length > 0) {
        try {
          const { subirDocumentoAction } = await import("@/modules/documentos/actions")
          let subidos = 0
          let fallidos = 0
          for (const d of documentos) {
            try {
              const fd = new FormData()
              fd.append("avaluoId", detalle.id)
              fd.append("tipo", d.tipo)
              fd.append("file", d.file)
              if (d.descripcion) fd.append("descripcion", d.descripcion)
              const resDoc = await subirDocumentoAction(fd)
              if (resDoc.success) subidos++
              else fallidos++
            } catch (oneErr) {
              console.error("Error subiendo un documento del wizard:", oneErr)
              fallidos++
            }
          }
          if (fallidos > 0) {
            toast.warning(
              `Documentos: ${subidos} subidos, ${fallidos} fallidos. Podés reintentar desde el detalle.`,
            )
          }
        } catch (docErr) {
          console.error("Error cargando módulo de documentos:", docErr)
          toast.warning("Avalúo creado, pero los documentos no pudieron subirse. Podés subirlos desde el detalle.")
        }
      }

      // El PDF se genera desde la página de detalle (con todos los datos, mapas y fotos)
      setShowSuccessModal(true)
      setIsSubmitting(false)
    } catch (e) {
      const err = e as Error
      console.error("Error submit:", err)
      toast.error(err.message || "Error inesperado")
      setIsSubmitting(false)
    }
  }

  // El PDF completo se genera desde la página de detalle del avalúo.

  // ───────────── Render del paso actual ─────────────

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="max-w-4xl mx-auto">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {categories.map((cat) => {
                const Icon = cat.icon
                const active = selectedCategory === cat.value
                return (
                  <button
                    key={cat.value}
                    onClick={() => setSelectedCategory(cat.value)}
                    className={`p-6 rounded-xl border-2 text-left transition-all ${
                      active
                        ? "border-primary bg-primary/10"
                        : "border-slate-800 bg-slate-900/50 hover:border-slate-700"
                    }`}
                  >
                    <Icon className={`w-8 h-8 mb-3 ${active ? "text-primary" : "text-slate-400"}`} />
                    <h3 className="text-white font-semibold mb-1">{cat.label}</h3>
                    <p className="text-xs text-slate-500">{cat.description}</p>
                  </button>
                )
              })}
            </div>
          </div>
        )

      case 2:
        return (
          <div className="max-w-4xl mx-auto space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-white mb-3">Operación</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {operations.map((op) => {
                  const active = selectedOperation === op.value
                  return (
                    <button
                      key={op.value}
                      onClick={() => setSelectedOperation(op.value)}
                      className={`p-4 rounded-xl border-2 text-left transition-all ${
                        active ? "border-primary bg-primary/10" : "border-slate-800 bg-slate-900/50 hover:border-slate-700"
                      }`}
                    >
                      <h4 className="text-white font-semibold mb-1">{op.label}</h4>
                      <p className="text-xs text-slate-500">{op.description}</p>
                    </button>
                  )
                })}
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-white mb-3">Tipo de avalúo</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {tiposAvaluo.map((t) => {
                  const active = selectedTipoAvaluo === t.value
                  return (
                    <button
                      key={t.value}
                      onClick={() => setSelectedTipoAvaluo(t.value)}
                      className={`p-4 rounded-xl border-2 text-left transition-all ${
                        active ? "border-primary bg-primary/10" : "border-slate-800 bg-slate-900/50 hover:border-slate-700"
                      }`}
                    >
                      <h4 className="text-white font-semibold mb-1">{t.label}</h4>
                      <p className="text-xs text-slate-400">{t.descuento}</p>
                    </button>
                  )
                })}
              </div>
            </div>
          </div>
        )

      case 3:
        return (
          <div className="max-w-4xl mx-auto">
            <MapaUbicacion
              lat={ubicacion.lat}
              lng={ubicacion.lng}
              direccion={ubicacion.direccion}
              zona={ubicacion.zona}
              onChange={(u) => setUbicacion(u)}
            />
          </div>
        )

      case 4:
        return (
          <div className="max-w-4xl mx-auto">
            <Card className="border-2 border-slate-800 bg-slate-900/50">
              <div className="p-4 sm:p-6 space-y-4">
                <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                  <Ruler className="w-5 h-5 text-primary" />
                  Superficies y medidas
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs text-slate-400">
                      Superficie útil (terreno total) m² *
                    </Label>
                    <Input
                      type="number"
                      value={terreno.superficieUtil}
                      onChange={(e) => setTerreno({ ...terreno, superficieUtil: e.target.value })}
                      className="bg-slate-800 border-slate-700 text-white"
                      placeholder="300"
                    />
                    <p className="text-[10px] text-slate-500">Todos los m² del lote</p>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs text-slate-400">
                      Superficie construida m²
                    </Label>
                    <Input
                      type="number"
                      value={terreno.superficieConstruida}
                      onChange={(e) => setTerreno({ ...terreno, superficieConstruida: e.target.value })}
                      className="bg-slate-800 border-slate-700 text-white"
                      placeholder="200"
                    />
                    <p className="text-[10px] text-slate-500">m² edificados (ej: 300 totales, 200 construidos)</p>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs text-slate-400">Frente (m)</Label>
                    <Input
                      type="number"
                      value={terreno.frente}
                      onChange={(e) => setTerreno({ ...terreno, frente: e.target.value })}
                      className="bg-slate-800 border-slate-700 text-white"
                      placeholder="10"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs text-slate-400">Fondo (m)</Label>
                    <Input
                      type="number"
                      value={terreno.fondo}
                      onChange={(e) => setTerreno({ ...terreno, fondo: e.target.value })}
                      className="bg-slate-800 border-slate-700 text-white"
                      placeholder="30"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs text-slate-400">Forma del lote</Label>
                    <Select
                      value={terreno.formaLote}
                      onValueChange={(v) => setTerreno({ ...terreno, formaLote: v })}
                    >
                      <SelectTrigger className="bg-slate-800 border-slate-700 text-white h-10">
                        <span className="text-white text-sm">
                          {terreno.formaLote
                            ? (FORMAS_LOTE.find((x) => x.value === terreno.formaLote)?.label ?? terreno.formaLote)
                            : "Seleccionar..."}
                        </span>
                      </SelectTrigger>
                      <SelectContent className="bg-slate-800 border-slate-700">
                        {FORMAS_LOTE.map((x) => (
                          <SelectItem key={x.value} value={x.value} className="text-white focus:bg-slate-700">
                            {x.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs text-slate-400">Tipo de vía</Label>
                    <Select
                      value={terreno.tipoVia}
                      onValueChange={(v) => setTerreno({ ...terreno, tipoVia: v })}
                    >
                      <SelectTrigger className="bg-slate-800 border-slate-700 text-white h-10">
                        <span className="text-white text-sm">
                          {TIPOS_VIA.find((x) => x.value === terreno.tipoVia)?.label ?? terreno.tipoVia}
                        </span>
                      </SelectTrigger>
                      <SelectContent className="bg-slate-800 border-slate-700">
                        {TIPOS_VIA.map((x) => (
                          <SelectItem key={x.value} value={x.value} className="text-white focus:bg-slate-700">
                            {x.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={terreno.esquina}
                    onChange={(e) => setTerreno({ ...terreno, esquina: e.target.checked })}
                    className="w-4 h-4 rounded border-slate-700 bg-slate-800 text-primary focus:ring-primary"
                  />
                  <span className="text-sm text-slate-300">Es un lote de esquina</span>
                </label>

                <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3">
                  <p className="text-xs text-blue-200">
                    El valor del m² del terreno se calculará en el paso 9 (Comparables).
                    Si no agregás comparables, vas a poder ingresar un valor manual a continuación.
                  </p>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs text-slate-400">
                    Valor unitario manual del terreno (USD/m²) — solo si no hay comparables
                  </Label>
                  <Input
                    type="number"
                    value={terreno.valorUnitarioManual}
                    onChange={(e) => setTerreno({ ...terreno, valorUnitarioManual: e.target.value })}
                    className="bg-slate-800 border-slate-700 text-white"
                    placeholder="Se ignora si hay comparables"
                  />
                </div>
              </div>
            </Card>
          </div>
        )

      case 5:
        return (
          <div className="max-w-4xl mx-auto space-y-4">
            <Card className="border-2 border-slate-800 bg-slate-900/50">
              <div className="p-4 sm:p-6">
                <h3 className="text-base font-semibold text-white mb-3 flex items-center gap-2">
                  <Home className="w-5 h-5 text-primary" />
                  Comodidades (informativo)
                </h3>
                <p className="text-xs text-slate-500 mb-4">
                  Estos datos no afectan el cálculo del avalúo. Van al PDF como información descriptiva.
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs text-slate-400">Habitaciones</Label>
                    <Input
                      type="number"
                      min="0"
                      value={amenities.habitaciones}
                      onChange={(e) => setAmenities({ ...amenities, habitaciones: e.target.value })}
                      className="bg-slate-800 border-slate-700 text-white"
                      placeholder="3"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs text-slate-400">Baños</Label>
                    <Input
                      type="number"
                      min="0"
                      value={amenities.banos}
                      onChange={(e) => setAmenities({ ...amenities, banos: e.target.value })}
                      className="bg-slate-800 border-slate-700 text-white"
                      placeholder="2"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs text-slate-400">Cocheras</Label>
                    <Input
                      type="number"
                      min="0"
                      value={amenities.cocheras}
                      onChange={(e) => setAmenities({ ...amenities, cocheras: e.target.value })}
                      className="bg-slate-800 border-slate-700 text-white"
                      placeholder="1"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs text-slate-400">Ambientes</Label>
                    <Input
                      type="number"
                      min="0"
                      value={amenities.ambientes}
                      onChange={(e) => setAmenities({ ...amenities, ambientes: e.target.value })}
                      className="bg-slate-800 border-slate-700 text-white"
                      placeholder="5"
                    />
                  </div>
                </div>
              </div>
            </Card>

            <Card className="border-2 border-slate-800 bg-slate-900/50">
              <div className="p-4 sm:p-6">
                <h3 className="text-base font-semibold text-white mb-3 flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-primary" />
                  Servicios básicos
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {([
                    { key: "luz", label: "Luz eléctrica" },
                    { key: "agua", label: "Agua potable" },
                    { key: "alcantarillado", label: "Alcantarillado" },
                    { key: "gas", label: "Gas domiciliario" },
                  ] as const).map((s) => (
                    <label
                      key={s.key}
                      className={`flex items-center gap-2 p-3 rounded-lg border cursor-pointer transition-colors ${
                        servicios[s.key]
                          ? "bg-emerald-500/10 border-emerald-500/40"
                          : "bg-slate-800/40 border-slate-700"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={servicios[s.key]}
                        onChange={(e) => setServicios({ ...servicios, [s.key]: e.target.checked })}
                        className="w-4 h-4 rounded border-slate-700 bg-slate-800 text-primary"
                      />
                      <span className={`text-sm ${servicios[s.key] ? "text-emerald-300" : "text-slate-300"}`}>
                        {s.label}
                      </span>
                    </label>
                  ))}
                </div>
                <div className="mt-3 space-y-1.5">
                  <Label className="text-xs text-slate-400">Otros servicios</Label>
                  <Input
                    type="text"
                    value={servicios.otros}
                    onChange={(e) => setServicios({ ...servicios, otros: e.target.value })}
                    className="bg-slate-800 border-slate-700 text-white"
                    placeholder="Internet, alcantarilla pluvial, etc."
                  />
                </div>
              </div>
            </Card>
          </div>
        )

      case 6:
        return (
          <div className="max-w-4xl mx-auto space-y-4">
            <DocumentosWizard documentos={documentos} onChange={setDocumentos} />

            <Card className="border-2 border-slate-800 bg-slate-900/50">
              <div className="p-4 sm:p-6 space-y-4">
                <h3 className="text-base font-semibold text-white flex items-center gap-2">
                  <FileText className="w-5 h-5 text-primary" />
                  Datos del avalúo
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs text-slate-400">Solicitante</Label>
                    <Input
                      value={datosGenerales.solicitante}
                      onChange={(e) => setDatosGenerales({ ...datosGenerales, solicitante: e.target.value })}
                      className="bg-slate-800 border-slate-700 text-white"
                      placeholder="Ej: Banco Unión"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs text-slate-400">Propietario</Label>
                    <Input
                      value={datosGenerales.propietario}
                      onChange={(e) => setDatosGenerales({ ...datosGenerales, propietario: e.target.value })}
                      className="bg-slate-800 border-slate-700 text-white"
                      placeholder="Nombre del propietario"
                    />
                  </div>
                  <div className="space-y-1.5 sm:col-span-2">
                    <Label className="text-xs text-slate-400">Observaciones</Label>
                    <Input
                      value={datosGenerales.observaciones}
                      onChange={(e) => setDatosGenerales({ ...datosGenerales, observaciones: e.target.value })}
                      className="bg-slate-800 border-slate-700 text-white"
                      placeholder="Observaciones adicionales"
                    />
                  </div>
                </div>
              </div>
            </Card>
          </div>
        )

      case 7:
        return (
          <div className="max-w-4xl mx-auto space-y-4">
            <TablaReposicion
              categoriaSel={tieneConstruccion ? (construccion.categoria as CategoriaConstructiva) || "" : ""}
              estadoSel={tieneConstruccion ? (construccion.estado as EstadoConservacion) || "" : ""}
              valorUnitarioActual={valorUnitarioConstruccion}
            />

            <Card className="border-2 border-slate-800 bg-slate-900/50">
              <div className="p-4 sm:p-6 space-y-4">
                <div className="flex items-center justify-between gap-3">
                  <h3 className="text-base font-semibold text-white flex items-center gap-2">
                    <Building2 className="w-5 h-5 text-primary" />
                    Construcción
                  </h3>
                  <label className="flex items-center gap-2 cursor-pointer text-sm">
                    <input
                      type="checkbox"
                      checked={!tieneConstruccion}
                      onChange={(e) => setTieneConstruccion(!e.target.checked)}
                      className="w-4 h-4 rounded border-slate-700 bg-slate-800 text-primary"
                    />
                    <span className="text-slate-300">Terreno puro (sin construcción)</span>
                  </label>
                </div>

                {tieneConstruccion ? (
                  <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      <div className="space-y-1.5">
                        <Label className="text-xs text-slate-400">Tipo</Label>
                        <Input
                          type="text"
                          value={construccion.tipo}
                          onChange={(e) => setConstruccion({ ...construccion, tipo: e.target.value })}
                          className="bg-slate-800 border-slate-700 text-white"
                          placeholder="Principal"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs text-slate-400">Año de construcción *</Label>
                        <Input
                          type="number"
                          min="1900"
                          max={new Date().getFullYear()}
                          value={construccion.anoConstruccion}
                          onChange={(e) => setConstruccion({ ...construccion, anoConstruccion: e.target.value })}
                          className="bg-slate-800 border-slate-700 text-white"
                          placeholder="2010"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs text-slate-400">Estado conservación *</Label>
                        <Select
                          value={construccion.estado}
                          onValueChange={(v) => setConstruccion({ ...construccion, estado: v })}
                        >
                          <SelectTrigger className="bg-slate-800 border-slate-700 text-white h-10">
                            <span className="text-white text-sm">
                              {construccion.estado
                                ? (ESTADOS_CONSERV.find((x) => x.value === construccion.estado)?.label ?? construccion.estado)
                                : "Seleccionar..."}
                            </span>
                          </SelectTrigger>
                          <SelectContent className="bg-slate-800 border-slate-700">
                            {ESTADOS_CONSERV.map((x) => (
                              <SelectItem key={x.value} value={x.value} className="text-white focus:bg-slate-700">
                                {x.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs text-slate-400">Categoría *</Label>
                        <Select
                          value={construccion.categoria}
                          onValueChange={(v) => setConstruccion({ ...construccion, categoria: v })}
                        >
                          <SelectTrigger className="bg-slate-800 border-slate-700 text-white h-10">
                            <span className="text-white text-sm">
                              {construccion.categoria
                                ? (CATEGORIAS_CONSTR.find((x) => x.value === construccion.categoria)?.label ?? construccion.categoria)
                                : "Seleccionar..."}
                            </span>
                          </SelectTrigger>
                          <SelectContent className="bg-slate-800 border-slate-700">
                            {CATEGORIAS_CONSTR.map((x) => (
                              <SelectItem key={x.value} value={x.value} className="text-white focus:bg-slate-700">
                                {x.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs text-slate-400">Superficie construida (m²) *</Label>
                        <Input
                          type="number"
                          value={construccion.superficieM2}
                          onChange={(e) => setConstruccion({ ...construccion, superficieM2: e.target.value })}
                          className="bg-slate-800 border-slate-700 text-white"
                          placeholder="200"
                        />
                      </div>
                    </div>

                    {valorUnitarioConstruccion != null && construccion.superficieM2 && (
                      <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-3">
                        <p className="text-xs text-emerald-300">Valor de la construcción</p>
                        <p className="text-xl font-bold text-white">
                          ${valorConstruccion.toLocaleString()}
                          <span className="text-xs text-slate-500 font-normal">
                            {" "}(USD {valorUnitarioConstruccion.toLocaleString()}/m² × {construccion.superficieM2} m²)
                          </span>
                        </p>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="bg-slate-800/30 border border-slate-700 rounded-lg p-4 text-center">
                    <p className="text-sm text-slate-400">
                      Avalúo de terreno puro. No se calculará valor de construcción.
                    </p>
                  </div>
                )}
              </div>
            </Card>
          </div>
        )

      case 8:
        return (
          <div className="max-w-4xl mx-auto">
            <Card className="border-2 border-slate-800 bg-slate-900/50">
              <div className="p-4 sm:p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-semibold text-white flex items-center gap-2">
                    <Calculator className="w-5 h-5 text-primary" />
                    Factores de homologación del sujeto
                  </h3>
                  <p className="text-xs text-slate-500">Rango: 0.50 - 1.50</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {FACTORES_LABELS.map((f) => (
                    <div key={f.key} className="space-y-1.5">
                      <Label className="text-xs text-slate-400">{f.label}</Label>
                      <Input
                        type="number"
                        step="0.01"
                        min="0.5"
                        max="1.5"
                        value={factores[f.key]}
                        onChange={(e) => {
                          const v = parseFloat(e.target.value)
                          if (!Number.isNaN(v)) {
                            const clamped = Math.min(1.5, Math.max(0.5, v))
                            setFactores({ ...factores, [f.key]: String(clamped) })
                          } else {
                            setFactores({ ...factores, [f.key]: e.target.value })
                          }
                        }}
                        className="bg-slate-800 border-slate-700 text-white"
                      />
                      <p className="text-[10px] text-slate-500">{f.descripcion}</p>
                    </div>
                  ))}
                </div>

                <div className="bg-primary/10 border border-primary/30 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-slate-400">Factor total (multiplicación)</p>
                      <p className="text-2xl font-bold text-primary">{factorTotal.toFixed(4)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-slate-500">Rango válido</p>
                      <p className="text-sm text-slate-300">0.50 - 1.50</p>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        )

      case 9:
        return (
          <div className="max-w-5xl mx-auto space-y-4">
            <ComparablesMapa
              sujetoLat={ubicacion.lat}
              sujetoLng={ubicacion.lng}
              seleccionados={comparablesSel}
              onSeleccionChange={setComparablesSel}
            />

            {comparablesSel.length === 0 ? (
              <Card className="border-2 border-blue-500/30 bg-blue-500/5">
                <div className="p-4 sm:p-6">
                  <h4 className="text-sm font-semibold text-blue-300 mb-2">
                    Sin comparables seleccionados
                  </h4>
                  <p className="text-xs text-blue-200">
                    Se usará el valor unitario manual del paso 4 ({terreno.valorUnitarioManual || "—"} USD/m²).
                    Agregá comparables si querés un cálculo automático basado en el mercado.
                  </p>
                </div>
              </Card>
            ) : (
              <Card className="border-2 border-slate-800 bg-slate-900/50">
                <div className="p-4 sm:p-6 space-y-3">
                  <h4 className="text-sm font-semibold text-white">Resumen del cálculo</h4>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="bg-slate-800/50 rounded-lg p-3">
                      <p className="text-xs text-slate-500">Comparables</p>
                      <p className="text-lg font-semibold text-white">{comparablesSel.length}</p>
                    </div>
                    <div className="bg-slate-800/50 rounded-lg p-3">
                      <p className="text-xs text-slate-500">PU promedio simple</p>
                      <p className="text-lg font-semibold text-white">
                        ${promedioSimpleComparables.toFixed(2)}
                        <span className="text-xs text-slate-500">/m²</span>
                      </p>
                    </div>
                    <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-3">
                      <p className="text-xs text-emerald-300">Valor unitario final</p>
                      <p className="text-lg font-bold text-emerald-300">
                        ${valorUnitarioTerreno.toFixed(2)}
                        <span className="text-xs text-slate-400">/m²</span>
                      </p>
                    </div>
                  </div>

                  <div className="bg-slate-800/30 rounded-lg p-3 text-xs text-slate-400">
                    Promedio simple × factor sujeto ({factorTotal.toFixed(4)}) = {valorUnitarioTerreno.toFixed(2)} USD/m²
                    <br />
                    Superficie útil {terreno.superficieUtil || 0} m² × {valorUnitarioTerreno.toFixed(2)} = ${valorTerreno.toLocaleString()}
                  </div>

                  <div>
                    <Label className="text-xs text-slate-400">Método de cálculo a utilizar</Label>
                    <div className="flex gap-2 mt-2">
                      <button
                        type="button"
                        onClick={() => setMetodoCalculo("SIMPLE")}
                        className={`px-3 py-2 rounded text-xs font-medium ${
                          metodoCalculo === "SIMPLE" ? "bg-primary text-white" : "bg-slate-800 text-slate-300"
                        }`}
                      >
                        Promedio simple
                      </button>
                      <button
                        type="button"
                        onClick={() => setMetodoCalculo("MANUAL")}
                        className={`px-3 py-2 rounded text-xs font-medium ${
                          metodoCalculo === "MANUAL" ? "bg-primary text-white" : "bg-slate-800 text-slate-300"
                        }`}
                      >
                        Manual ({terreno.valorUnitarioManual || "—"} USD/m²)
                      </button>
                    </div>
                  </div>
                </div>
              </Card>
            )}
          </div>
        )

      case 10:
        return (
          <div className="max-w-4xl mx-auto">
            <Card className="border-2 border-slate-800 bg-slate-900/50">
              <div className="p-4 sm:p-6">
                <div className="flex items-start gap-3">
                  <RadarIcon className="w-8 h-8 text-cyan-400 shrink-0 mt-1" />
                  <div className="space-y-2">
                    <h3 className="text-base font-semibold text-white">Radar de equipamientos</h3>
                    <p className="text-sm text-slate-400">
                      El análisis de equipamientos (hospitales, colegios, parques, bancos, etc.) se genera automáticamente
                      <span className="text-white font-medium"> después de crear el avalúo</span>, en la página de detalle,
                      consultando OpenStreetMap.
                    </p>
                    <p className="text-xs text-slate-500">
                      Esta información se incluirá en el PDF cuando lo generes o regeneres desde el detalle.
                    </p>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        )

      case 11:
        return (
          <div className="max-w-4xl mx-auto space-y-4">
            <Card className="border-2 border-slate-800 bg-slate-900/50">
              <div className="p-4 sm:p-6">
                <h3 className="text-lg font-semibold text-white mb-4">Resumen del avalúo</h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
                  <div className="bg-slate-800/40 rounded p-3">
                    <p className="text-xs text-slate-500">Categoría</p>
                    <p className="text-sm font-medium text-white">
                      {categories.find((c) => c.value === selectedCategory)?.label ?? "—"}
                    </p>
                  </div>
                  <div className="bg-slate-800/40 rounded p-3">
                    <p className="text-xs text-slate-500">Operación / Tipo</p>
                    <p className="text-sm font-medium text-white">
                      {operations.find((o) => o.value === selectedOperation)?.label ?? "—"} ·{" "}
                      {tiposAvaluo.find((t) => t.value === selectedTipoAvaluo)?.label ?? "—"}
                    </p>
                  </div>
                  <div className="bg-slate-800/40 rounded p-3 sm:col-span-2">
                    <p className="text-xs text-slate-500">Ubicación</p>
                    <p className="text-sm font-medium text-white">
                      {ubicacion.direccion || "Sin dirección"} · {ubicacion.zona || "Sin zona"}
                    </p>
                    {ubicacion.lat != null && (
                      <p className="text-[10px] text-slate-500 font-mono">
                        {ubicacion.lat.toFixed(5)}, {ubicacion.lng?.toFixed(5)}
                      </p>
                    )}
                  </div>
                  <div className="bg-slate-800/40 rounded p-3">
                    <p className="text-xs text-slate-500">Superficie útil</p>
                    <p className="text-sm font-medium text-white">{terreno.superficieUtil || "—"} m²</p>
                  </div>
                  <div className="bg-slate-800/40 rounded p-3">
                    <p className="text-xs text-slate-500">Superficie construida</p>
                    <p className="text-sm font-medium text-white">{terreno.superficieConstruida || "—"}</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between bg-slate-800/40 rounded p-3">
                    <span className="text-sm text-slate-400">Valor del terreno</span>
                    <span className="text-base font-semibold text-white">
                      ${valorTerreno.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div className="flex items-center justify-between bg-slate-800/40 rounded p-3">
                    <span className="text-sm text-slate-400">Valor de la construcción</span>
                    <span className="text-base font-semibold text-white">
                      ${valorConstruccion.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div className="flex items-center justify-between bg-primary/10 border border-primary/30 rounded p-3">
                    <span className="text-sm text-primary font-medium">
                      Valor final ({tiposAvaluo.find((t) => t.value === selectedTipoAvaluo)?.label})
                    </span>
                    <span className="text-2xl font-bold text-primary">
                      ${valorSegunTipo.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>

                <div className="mt-4 text-xs text-slate-500 space-y-1">
                  <p>
                    Comparables: {comparablesSel.length} · Método: {comparablesSel.length === 0 ? "MANUAL" : metodoCalculo}
                  </p>
                  <p>Factor total: {factorTotal.toFixed(4)} · Documentos: {documentos.length}</p>
                </div>
              </div>
            </Card>

            <Button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="w-full h-14 bg-emerald-600 hover:bg-emerald-700 text-white text-base font-semibold"
            >
              {isSubmitting ? (
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              ) : (
                <FileText className="w-5 h-5 mr-2" />
              )}
              {isSubmitting ? "Creando avalúo y generando PDF..." : "Crear y Generar PDF"}
            </Button>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="max-w-6xl mx-auto">
        {/* HEADER */}
        <div className="mb-6 sm:mb-8 space-y-1">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-[#FAB90E]">Crear Avalúo</h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            Paso {currentStep} de {steps.length}: {steps[currentStep - 1].name}
          </p>
        </div>

        {/* STEPPER */}
        <div className="mb-6 sm:mb-8 overflow-x-auto">
          <div className="flex items-center gap-1 sm:gap-2 min-w-max pb-2">
            {steps.map((step, idx) => (
              <div key={step.id} className="flex items-center">
                <button
                  onClick={() => {
                    if (step.id < currentStep) setCurrentStep(step.id)
                  }}
                  disabled={step.id > currentStep}
                  className={`flex items-center gap-2 px-2 sm:px-3 py-1.5 rounded text-xs sm:text-sm transition-colors ${
                    currentStep === step.id
                      ? "bg-primary text-white"
                      : step.id < currentStep
                      ? "bg-slate-800 text-slate-300 hover:bg-slate-700 cursor-pointer"
                      : "bg-slate-900 text-slate-600"
                  }`}
                >
                  <span className={`w-5 h-5 sm:w-6 sm:h-6 rounded-full flex items-center justify-center text-[10px] sm:text-xs font-bold ${
                    currentStep === step.id
                      ? "bg-white text-primary"
                      : step.id < currentStep
                      ? "bg-emerald-500 text-white"
                      : "bg-slate-800 text-slate-600"
                  }`}>
                    {step.id < currentStep ? <Check className="w-3 h-3" /> : step.id}
                  </span>
                  <span className="hidden sm:inline">{step.name}</span>
                </button>
                {idx < steps.length - 1 && (
                  <ChevronRight className="w-3 h-3 sm:w-4 sm:h-4 text-slate-700 mx-0.5" />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* CONTENIDO DEL PASO */}
        {renderStep()}

        {/* NAVEGACIÓN */}
        <div className="mt-6 sm:mt-8 flex items-center justify-between">
          <Button
            onClick={() => setCurrentStep(Math.max(1, currentStep - 1))}
            disabled={currentStep === 1 || isSubmitting}
            variant="outline"
            className="border-slate-700 text-white hover:bg-slate-800"
          >
            <ChevronLeft className="w-4 h-4 mr-1" />
            Anterior
          </Button>

          {currentStep < steps.length ? (
            <Button
              onClick={() => setCurrentStep(Math.min(steps.length, currentStep + 1))}
              disabled={!canProceed(currentStep) || isSubmitting}
              className="bg-primary hover:bg-primary/90"
            >
              Siguiente
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          ) : (
            <div className="w-24" />
          )}
        </div>
      </div>

      {/* MODAL DE ÉXITO */}
      <Dialog open={showSuccessModal} onOpenChange={setShowSuccessModal}>
        <DialogContent>
          <DialogHeader>
            <div className="w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-3">
              <Check className="w-8 h-8 text-emerald-400" />
            </div>
            <DialogTitle className="text-center text-2xl">¡Avalúo creado!</DialogTitle>
          </DialogHeader>
          <div className="text-center space-y-2 py-4">
            <p className="text-sm text-slate-400">El código del avalúo es</p>
            <p className="text-2xl font-bold text-white">{createdCodigo}</p>
            <p className="text-xs text-slate-500 mt-2">
              Podés descargar el informe PDF profesional desde el detalle del avalúo.
            </p>
          </div>
          <DialogFooter className="flex flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              onClick={() => setShowSuccessModal(false)}
              className="border-slate-700 text-white hover:bg-slate-800 w-full sm:w-auto"
            >
              Crear otro
            </Button>
            <Button
              onClick={() => {
                setShowSuccessModal(false)
                if (createdId) router.push(`/dashboard/avaluos/${createdId}`)
              }}
              className="bg-primary hover:bg-primary/90 w-full sm:w-auto"
            >
              Ver detalle
            </Button>
            <Button
              onClick={() => {
                setShowSuccessModal(false)
                router.push("/dashboard/avaluos")
              }}
              variant="ghost"
              className="w-full sm:w-auto"
            >
              Ir al listado
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
