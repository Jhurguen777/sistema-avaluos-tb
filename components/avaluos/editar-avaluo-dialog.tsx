"use client"

/**
 * EditarAvaluoDialog
 * Edita datos generales, terreno, construcciones y factores de homologación.
 * Recalcula automáticamente el resultado al guardar.
 */

import { useState, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select"
import { Pencil, Loader2, Plus, Trash2 } from "lucide-react"
import { toast } from "@/components/ui/use-toast"
import { actualizarAvaluoAction } from "@/modules/avaluos/actions"

interface ConstrForm {
  id?: string
  tipo: string
  categoria: string
  estado: string
  anoConstruccion: string
  superficieM2: string
  valorUnitarioOverride: string
}

interface EditarAvaluoDialogProps {
  avaluoId: string
  detalle: {
    tipo: string
    solicitante: string | null
    propietario: string | null
    observaciones: string | null
    terreno: any | null
    factores: any | null
    construcciones?: any[]
  }
  onActualizado: () => void
}

const TIPOS_AVALUO = [
  { value: "COMERCIAL", label: "Comercial" },
  { value: "ALQUILER", label: "Alquiler" },
  { value: "VENTA_RAPIDA", label: "Venta rápida" },
  { value: "CAPITAL_COMERCIAL", label: "Capital comercial" },
]

const TIPOS_VIA = [
  { value: "AVENIDA", label: "Avenida" },
  { value: "CALLE", label: "Calle" },
  { value: "PASAJE", label: "Pasaje" },
  { value: "CARRETERA", label: "Carretera" },
  { value: "CAMINO", label: "Camino" },
  { value: "SIN_VIA", label: "Sin vía" },
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

function n(v: any): string {
  return v != null ? String(v) : ""
}

export function EditarAvaluoDialog({ avaluoId, detalle, onActualizado }: EditarAvaluoDialogProps) {
  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)

  const [tipo, setTipo] = useState(detalle.tipo)
  const [solicitante, setSolicitante] = useState(detalle.solicitante ?? "")
  const [propietario, setPropietario] = useState(detalle.propietario ?? "")
  const [observaciones, setObservaciones] = useState(detalle.observaciones ?? "")

  const [superficieM2, setSuperficieM2] = useState(n(detalle.terreno?.superficieM2))
  const [valorUnitario, setValorUnitario] = useState(n(detalle.terreno?.valorUnitario))
  const [frente, setFrente] = useState(n(detalle.terreno?.frente))
  const [fondo, setFondo] = useState(n(detalle.terreno?.fondo))
  const [tipoVia, setTipoVia] = useState(detalle.terreno?.tipoVia ?? "CALLE")
  const [esEsquina, setEsEsquina] = useState<boolean>(detalle.terreno?.esEsquina ?? false)
  const [formaLote, setFormaLote] = useState(detalle.terreno?.formaLote ?? "")

  const [factorUbicacion, setFactorUbicacion] = useState(n(detalle.factores?.factorUbicacion) || "1")
  const [factorVia, setFactorVia] = useState(n(detalle.factores?.factorVia) || "1")
  const [factorFrente, setFactorFrente] = useState(n(detalle.factores?.factorFrente) || "1")
  const [factorEsquina, setFactorEsquina] = useState(n(detalle.factores?.factorEsquina) || "1")
  const [factorMorfologico, setFactorMorfologico] = useState(n(detalle.factores?.factorMorfologico) || "1")
  const [factorServicios, setFactorServicios] = useState(n(detalle.factores?.factorServicios) || "1")

  const [construcciones, setConstrucciones] = useState<ConstrForm[]>(
    (detalle.construcciones ?? []).map((c: any) => ({
      id: c.id,
      tipo: c.tipo ?? "Principal",
      categoria: c.categoria ?? "ESTANDAR",
      estado: c.estado ?? "BUENO",
      anoConstruccion: n(c.anoConstruccion),
      superficieM2: n(c.superficieM2),
      valorUnitarioOverride: n(c.valorUnitarioOverride),
    })),
  )

  /** Resetear el formulario con los datos más recientes del detalle (al abrir) */
  const resetDesdeDetalle = useCallback(() => {
    const t = detalle.terreno
    const f = detalle.factores
    setTipo(detalle.tipo)
    setSolicitante(detalle.solicitante ?? "")
    setPropietario(detalle.propietario ?? "")
    setObservaciones(detalle.observaciones ?? "")
    setSuperficieM2(n(t?.superficieM2))
    setValorUnitario(n(t?.valorUnitario))
    setFrente(n(t?.frente))
    setFondo(n(t?.fondo))
    setTipoVia(t?.tipoVia ?? "CALLE")
    setEsEsquina(t?.esEsquina ?? false)
    setFormaLote(t?.formaLote ?? "")
    setFactorUbicacion(n(f?.factorUbicacion) || "1")
    setFactorVia(n(f?.factorVia) || "1")
    setFactorFrente(n(f?.factorFrente) || "1")
    setFactorEsquina(n(f?.factorEsquina) || "1")
    setFactorMorfologico(n(f?.factorMorfologico) || "1")
    setFactorServicios(n(f?.factorServicios) || "1")
    setConstrucciones(
      (detalle.construcciones ?? []).map((c: any) => ({
        id: c.id,
        tipo: c.tipo ?? "Principal",
        categoria: c.categoria ?? "ESTANDAR",
        estado: c.estado ?? "BUENO",
        anoConstruccion: n(c.anoConstruccion),
        superficieM2: n(c.superficieM2),
        valorUnitarioOverride: n(c.valorUnitarioOverride),
      })),
    )
  }, [detalle])

  const handleOpenChange = (v: boolean) => {
    if (v) resetDesdeDetalle()
    setOpen(v)
  }

  const agregarConstruccion = () => {
    setConstrucciones([
      ...construcciones,
      {
        tipo: "Principal",
        categoria: "ESTANDAR",
        estado: "BUENO",
        anoConstruccion: "",
        superficieM2: "",
        valorUnitarioOverride: "",
      },
    ])
  }

  const actualizarConstruccion = (idx: number, campo: keyof ConstrForm, valor: string) => {
    setConstrucciones(construcciones.map((c, i) => (i === idx ? { ...c, [campo]: valor } : c)))
  }

  const eliminarConstruccion = (idx: number) => {
    setConstrucciones(construcciones.filter((_, i) => i !== idx))
  }

  const guardar = async () => {
    const sup = Number(superficieM2)
    const vu = Number(valorUnitario)
    if (!superficieM2 || sup <= 0) {
      toast.error("Campo requerido", "La superficie del terreno debe ser mayor a 0")
      return
    }
    if (!valorUnitario || vu <= 0) {
      toast.error("Campo requerido", "El valor unitario del terreno debe ser mayor a 0")
      return
    }
    // Nota: los avalúos de terreno puro (sin construcciones) son válidos.
    // Solo validamos cada construcción si el array no está vacío.
    for (let i = 0; i < construcciones.length; i++) {
      const c = construcciones[i]
      if (!c.superficieM2 || Number(c.superficieM2) <= 0) {
        toast.error("Construcción inválida", `La superficie de la construcción ${i + 1} debe ser mayor a 0`)
        return
      }
      if (!c.anoConstruccion || Number(c.anoConstruccion) <= 0) {
        toast.error("Construcción inválida", `El año de la construcción ${i + 1} es obligatorio`)
        return
      }
    }

    setSaving(true)
    try {
      const res = await actualizarAvaluoAction(avaluoId, {
        tipo,
        solicitante: solicitante.trim() || null,
        propietario: propietario.trim() || null,
        observaciones: observaciones.trim() || null,
        terreno: {
          superficieM2: sup,
          valorUnitario: vu,
          frente: frente ? Number(frente) : null,
          fondo: fondo ? Number(fondo) : null,
          tipoVia,
          esEsquina,
          formaLote: formaLote.trim() || null,
        },
        construcciones: construcciones.map((c) => ({
          tipo: c.tipo || "Principal",
          categoria: c.categoria,
          estado: c.estado,
          anoConstruccion: Number(c.anoConstruccion),
          superficieM2: Number(c.superficieM2),
          valorUnitarioOverride: c.valorUnitarioOverride ? Number(c.valorUnitarioOverride) : null,
        })),
        factores: {
          factorUbicacion: Number(factorUbicacion) || 1,
          factorVia: Number(factorVia) || 1,
          factorFrente: Number(factorFrente) || 1,
          factorEsquina: Number(factorEsquina) || 1,
          factorMorfologico: Number(factorMorfologico) || 1,
          factorServicios: Number(factorServicios) || 1,
        },
      })
      if (res.success) {
        toast.success("Avalúo actualizado", "Los valores fueron recalculados")
        setOpen(false)
        onActualizado()
      } else if (!res.success) {
        toast.error("Error", res.error)
      }
    } catch (error: any) {
      console.error("Error actualizando avalúo:", error)
      toast.error("Error al actualizar el avalúo", error.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline" className="border-slate-700 text-white hover:bg-slate-800">
          <Pencil className="w-4 h-4 mr-2" />
          Editar Avalúo
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-slate-900 border-slate-700 max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-white">Editar Avalúo</DialogTitle>
        </DialogHeader>

        <div className="space-y-5">
          {/* Datos generales */}
          <section className="space-y-3">
            <h4 className="text-sm font-semibold text-slate-400 uppercase tracking-wide">Datos Generales</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-slate-300">Tipo de avalúo</Label>
                <Select value={tipo} onValueChange={setTipo}>
                  <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                    <span className="text-white text-sm">
                      {TIPOS_AVALUO.find((x) => x.value === tipo)?.label ?? tipo}
                    </span>
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700">
                    {TIPOS_AVALUO.map((x) => (
                      <SelectItem key={x.value} value={x.value} className="text-white focus:bg-slate-700">
                        {x.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-slate-300">Solicitante</Label>
                <Input value={solicitante} onChange={(e) => setSolicitante(e.target.value)} className="bg-slate-800 border-slate-700 text-white" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-slate-300">Propietario</Label>
                <Input value={propietario} onChange={(e) => setPropietario(e.target.value)} className="bg-slate-800 border-slate-700 text-white" />
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label className="text-slate-300">Observaciones</Label>
                <Input value={observaciones} onChange={(e) => setObservaciones(e.target.value)} className="bg-slate-800 border-slate-700 text-white" />
              </div>
            </div>
          </section>

          {/* Terreno */}
          <section className="space-y-3">
            <h4 className="text-sm font-semibold text-slate-400 uppercase tracking-wide">Terreno</h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label className="text-slate-300">Superficie (m²)</Label>
                <Input type="number" value={superficieM2} onChange={(e) => setSuperficieM2(e.target.value)} className="bg-slate-800 border-slate-700 text-white" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-slate-300">Valor unitario (USD/m²)</Label>
                <Input type="number" value={valorUnitario} onChange={(e) => setValorUnitario(e.target.value)} className="bg-slate-800 border-slate-700 text-white" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-slate-300">Tipo de vía</Label>
                <Select value={tipoVia} onValueChange={setTipoVia}>
                  <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                    <span className="text-white text-sm">
                      {TIPOS_VIA.find((x) => x.value === tipoVia)?.label ?? tipoVia}
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
              <div className="space-y-1.5">
                <Label className="text-slate-300">Frente (m)</Label>
                <Input type="number" value={frente} onChange={(e) => setFrente(e.target.value)} className="bg-slate-800 border-slate-700 text-white" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-slate-300">Fondo (m)</Label>
                <Input type="number" value={fondo} onChange={(e) => setFondo(e.target.value)} className="bg-slate-800 border-slate-700 text-white" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-slate-300">Forma del lote</Label>
                <Input value={formaLote} onChange={(e) => setFormaLote(e.target.value)} className="bg-slate-800 border-slate-700 text-white" />
              </div>
              <div className="flex items-end gap-2 col-span-2 sm:col-span-3 pb-1">
                <button
                  type="button"
                  onClick={() => setEsEsquina(!esEsquina)}
                  className={`px-3 py-2 rounded-lg text-sm border transition-colors ${
                    esEsquina
                      ? "bg-primary/20 border-primary text-primary"
                      : "bg-slate-800 border-slate-700 text-slate-400"
                  }`}
                >
                  {esEsquina ? "Es esquina" : "No es esquina"}
                </button>
              </div>
            </div>
          </section>

          {/* Construcciones */}
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-semibold text-slate-400 uppercase tracking-wide">
                Construcciones ({construcciones.length})
              </h4>
              <Button onClick={agregarConstruccion} size="sm" variant="outline" className="border-slate-700 text-white hover:bg-slate-800 h-8">
                <Plus className="w-4 h-4 mr-1" />
                Agregar
              </Button>
            </div>
            <div className="space-y-3">
              {construcciones.map((c, idx) => (
                <div key={idx} className="bg-slate-800/50 rounded-lg p-3 border border-slate-700/50">
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    <div className="space-y-1">
                      <Label className="text-xs text-slate-400">Categoría</Label>
                      <Select value={c.categoria} onValueChange={(v) => actualizarConstruccion(idx, "categoria", v)}>
                        <SelectTrigger className="bg-slate-900 border-slate-700 text-white h-9">
                          <span className="text-white text-sm">
                            {CATEGORIAS_CONSTR.find((x) => x.value === c.categoria)?.label ?? c.categoria}
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
                    <div className="space-y-1">
                      <Label className="text-xs text-slate-400">Estado</Label>
                      <Select value={c.estado} onValueChange={(v) => actualizarConstruccion(idx, "estado", v)}>
                        <SelectTrigger className="bg-slate-900 border-slate-700 text-white h-9">
                          <span className="text-white text-sm">
                            {ESTADOS_CONSERV.find((x) => x.value === c.estado)?.label ?? c.estado}
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
                    <div className="space-y-1">
                      <Label className="text-xs text-slate-400">Año construcción</Label>
                      <Input
                        type="number"
                        value={c.anoConstruccion}
                        onChange={(e) => actualizarConstruccion(idx, "anoConstruccion", e.target.value)}
                        className="bg-slate-900 border-slate-700 text-white h-9"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs text-slate-400">Superficie (m²)</Label>
                      <Input
                        type="number"
                        value={c.superficieM2}
                        onChange={(e) => actualizarConstruccion(idx, "superficieM2", e.target.value)}
                        className="bg-slate-900 border-slate-700 text-white h-9"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs text-slate-400">Valor unitario (override)</Label>
                      <Input
                        type="number"
                        value={c.valorUnitarioOverride}
                        onChange={(e) => actualizarConstruccion(idx, "valorUnitarioOverride", e.target.value)}
                        placeholder="Auto"
                        className="bg-slate-900 border-slate-700 text-white h-9"
                      />
                    </div>
                    <div className="flex items-end pb-0.5">
                      <Button
                        onClick={() => eliminarConstruccion(idx)}
                        size="sm"
                        variant="ghost"
                        className="h-9 px-2 text-slate-400 hover:text-red-400 hover:bg-slate-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Factores */}
          <section className="space-y-3">
            <h4 className="text-sm font-semibold text-slate-400 uppercase tracking-wide">Factores de Homologación</h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {[
                { label: "Ubicación", val: factorUbicacion, set: setFactorUbicacion },
                { label: "Vía", val: factorVia, set: setFactorVia },
                { label: "Frente", val: factorFrente, set: setFactorFrente },
                { label: "Esquina", val: factorEsquina, set: setFactorEsquina },
                { label: "Morfológico", val: factorMorfologico, set: setFactorMorfologico },
                { label: "Servicios", val: factorServicios, set: setFactorServicios },
              ].map((fac) => (
                <div key={fac.label} className="space-y-1.5">
                  <Label className="text-slate-300">F. {fac.label}</Label>
                  <Input
                    type="number"
                    step="0.0001"
                    value={fac.val}
                    onChange={(e) => fac.set(e.target.value)}
                    className="bg-slate-800 border-slate-700 text-white"
                  />
                </div>
              ))}
            </div>
          </section>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} className="border-slate-700 text-white hover:bg-slate-800">
            Cancelar
          </Button>
          <Button onClick={guardar} disabled={saving} className="bg-primary hover:bg-primary/90">
            {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
            Guardar y Recalcular
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
