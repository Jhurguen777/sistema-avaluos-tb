"use client"

/**
 * ComparablesAvaluo
 * CRUD de comparables de mercado (venta/alquiler) sobre un avalúo existente.
 * Cada alta/baja/modificación recalcula automáticamente el valor del terreno (homologación).
 *
 * Soporta los 6 factores opcionales (preservados al editar).
 */

import { useState } from "react"
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
import { FileText, Plus, Pencil, Trash2, Loader2 } from "lucide-react"
import { toast } from "@/components/ui/use-toast"
import {
  agregarComparableAction,
  actualizarComparableAction,
  eliminarComparableAction,
} from "@/modules/avaluos/actions"

interface Comparable {
  id: string
  direccion: string
  precioOferta: number
  precioM2: number
  superficie: number
  anoConstruccion?: number | null
  tipoComp: "Venta" | "Alquiler"
  // Factores opcionales (pueden venir null si el comparable es de web scraping)
  factorUbicacion?: number | null
  factorVia?: number | null
  factorFrente?: number | null
  factorEsquina?: number | null
  factorMorfologico?: number | null
  factorServicios?: number | null
}

interface ComparablesAvaluoProps {
  avaluoId: string
  comparables: Comparable[]
  editable: boolean
  onActualizado: () => void
}

interface FormState {
  direccion: string
  precioOferta: string
  precioM2: string
  superficie: string
  anoConstruccion: string
  tipo: "VENTA" | "ALQUILER"
  // Factores opcionales: string vacío = null (se envían como null al server)
  factorUbicacion: string
  factorVia: string
  factorFrente: string
  factorEsquina: string
  factorMorfologico: string
  factorServicios: string
}

const emptyForm: FormState = {
  direccion: "",
  precioOferta: "",
  precioM2: "",
  superficie: "",
  anoConstruccion: "",
  tipo: "VENTA",
  factorUbicacion: "",
  factorVia: "",
  factorFrente: "",
  factorEsquina: "",
  factorMorfologico: "",
  factorServicios: "",
}

const FACTOR_FIELDS: { key: keyof FormState; label: string }[] = [
  { key: "factorUbicacion", label: "Fub - Ubicación" },
  { key: "factorVia", label: "Fvia - Vía" },
  { key: "factorFrente", label: "Fff - Frente" },
  { key: "factorEsquina", label: "Fi - Inclinación" },
  { key: "factorMorfologico", label: "Fm - Morfología" },
  { key: "factorServicios", label: "Fs - Servicios" },
]

function money(n: number | null | undefined): string {
  if (n == null) return "—"
  return `$${n.toLocaleString("es-BO", { maximumFractionDigits: 2 })}`
}

/** Convierte un valor string a number | null (vacío → null) */
function factorOrNull(v: string): number | null {
  if (!v.trim()) return null
  const n = parseFloat(v)
  if (Number.isNaN(n)) return null
  return Math.min(1.5, Math.max(0.5, n))
}

export function ComparablesAvaluo({ avaluoId, comparables, editable, onActualizado }: ComparablesAvaluoProps) {
  const [open, setOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<FormState>(emptyForm)
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const abrirNuevo = () => {
    setForm(emptyForm)
    setEditingId(null)
    setOpen(true)
  }

  const abrirEditar = (c: Comparable) => {
    setForm({
      direccion: c.direccion,
      precioOferta: String(c.precioOferta ?? ""),
      precioM2: String(c.precioM2 ?? ""),
      superficie: String(c.superficie ?? ""),
      anoConstruccion: c.anoConstruccion ? String(c.anoConstruccion) : "",
      tipo: c.tipoComp === "Alquiler" ? "ALQUILER" : "VENTA",
      factorUbicacion: c.factorUbicacion != null ? String(c.factorUbicacion) : "",
      factorVia: c.factorVia != null ? String(c.factorVia) : "",
      factorFrente: c.factorFrente != null ? String(c.factorFrente) : "",
      factorEsquina: c.factorEsquina != null ? String(c.factorEsquina) : "",
      factorMorfologico: c.factorMorfologico != null ? String(c.factorMorfologico) : "",
      factorServicios: c.factorServicios != null ? String(c.factorServicios) : "",
    })
    setEditingId(c.id)
    setOpen(true)
  }

  const guardar = async () => {
    if (!form.direccion.trim()) {
      toast.error("Campo requerido", "La dirección es obligatoria")
      return
    }
    setSaving(true)
    try {
      const payload = {
        direccion: form.direccion.trim(),
        precioOferta: Number(form.precioOferta) || 0,
        precioM2: Number(form.precioM2) || 0,
        superficie: Number(form.superficie) || 0,
        anoConstruccion: form.anoConstruccion ? Number(form.anoConstruccion) : null,
        tipo: form.tipo,
        factorUbicacion: factorOrNull(form.factorUbicacion),
        factorVia: factorOrNull(form.factorVia),
        factorFrente: factorOrNull(form.factorFrente),
        factorEsquina: factorOrNull(form.factorEsquina),
        factorMorfologico: factorOrNull(form.factorMorfologico),
        factorServicios: factorOrNull(form.factorServicios),
      }
      const res =
        editingId
          ? await actualizarComparableAction(avaluoId, editingId, payload)
          : await agregarComparableAction(avaluoId, payload)
      if (res.success) {
        toast.success(editingId ? "Comparable actualizado" : "Comparable agregado", "Valor del terreno recalculado")
        setOpen(false)
        onActualizado()
      } else if (!res.success) {
        toast.error("Error", res.error)
      }
    } catch (e) {
      const err = e as Error
      console.error("Error guardando comparable:", err)
      toast.error("Error al guardar el comparable", err.message)
    } finally {
      setSaving(false)
    }
  }

  const eliminar = async (c: Comparable) => {
    setDeletingId(c.id)
    try {
      const res = await eliminarComparableAction(
        avaluoId,
        c.id,
        c.tipoComp === "Alquiler" ? "ALQUILER" : "VENTA",
      )
      if (res.success) {
        toast.success("Comparable eliminado", "Valor del terreno recalculado")
        onActualizado()
      } else if (!res.success) {
        toast.error("Error", res.error)
      }
    } catch (e) {
      const err = e as Error
      console.error("Error eliminando comparable:", err)
      toast.error("Error al eliminar el comparable", err.message)
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <Card className="border-2 border-slate-800 bg-slate-900/50 lg:col-span-2">
      <div className="p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-primary" />
            <h3 className="text-lg font-semibold text-white">
              Comparables de Mercado ({comparables.length})
            </h3>
          </div>
          {editable && (
            <Button onClick={abrirNuevo} size="sm" className="bg-primary hover:bg-primary/90">
              <Plus className="w-4 h-4 mr-1" />
              Agregar
            </Button>
          )}
        </div>

        {comparables.length === 0 ? (
          <p className="text-sm text-slate-500">
            Sin comparables registrados. Agregue comparables para calcular el valor del terreno por homologación.
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {comparables.map((c) => {
              // Los 6 factores de homologación (Fub, Fvia, Fff, Fi, Fm, Fs):
              // badge coherente con tieneFactoresCompletos del server
              const tieneFact =
                c.factorUbicacion != null ||
                c.factorVia != null ||
                c.factorFrente != null ||
                c.factorEsquina != null ||
                c.factorMorfologico != null ||
                c.factorServicios != null
              return (
                <div key={c.id} className="bg-slate-800/50 rounded-lg p-3 text-sm">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs px-2 py-0.5 rounded border border-slate-600 text-slate-300">
                      {c.tipoComp}
                    </span>
                    <span className="text-green-400 font-semibold">{money(c.precioOferta)}</span>
                  </div>
                  <p className="text-white truncate" title={c.direccion}>{c.direccion}</p>
                  <p className="text-xs text-slate-500">
                    {c.superficie} m² · {money(c.precioM2)}/m²
                  </p>
                  <p className="text-[10px] text-slate-500 mt-1">
                    {tieneFact ? "Con factores de homologación" : "Sin factores (promedio simple)"}
                  </p>
                  {editable && (
                    <div className="flex gap-1 mt-2 pt-2 border-t border-slate-700/50">
                      <Button
                        onClick={() => abrirEditar(c)}
                        size="sm"
                        variant="ghost"
                        className="h-7 px-2 text-slate-400 hover:text-white hover:bg-slate-700"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </Button>
                      <Button
                        onClick={() => eliminar(c)}
                        size="sm"
                        variant="ghost"
                        disabled={deletingId === c.id}
                        className="h-7 px-2 text-slate-400 hover:text-red-400 hover:bg-slate-700"
                      >
                        {deletingId === c.id ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Trash2 className="w-3.5 h-3.5" />
                        )}
                      </Button>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Dialog de alta/edición */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="bg-slate-900 border-slate-700 max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-white">
              {editingId ? "Editar Comparable" : "Nuevo Comparable"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label className="text-slate-300">Dirección</Label>
              <Input
                value={form.direccion}
                onChange={(e) => setForm({ ...form, direccion: e.target.value })}
                placeholder="Zona, calle referencial"
                className="bg-slate-800 border-slate-700 text-white"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-slate-300">Precio oferta (USD)</Label>
                <Input
                  type="number"
                  value={form.precioOferta}
                  onChange={(e) => setForm({ ...form, precioOferta: e.target.value })}
                  className="bg-slate-800 border-slate-700 text-white"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-slate-300">Precio m² (USD)</Label>
                <Input
                  type="number"
                  value={form.precioM2}
                  onChange={(e) => setForm({ ...form, precioM2: e.target.value })}
                  className="bg-slate-800 border-slate-700 text-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-slate-300">Superficie (m²)</Label>
                <Input
                  type="number"
                  value={form.superficie}
                  onChange={(e) => setForm({ ...form, superficie: e.target.value })}
                  className="bg-slate-800 border-slate-700 text-white"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-slate-300">Año construcción</Label>
                <Input
                  type="number"
                  value={form.anoConstruccion}
                  onChange={(e) => setForm({ ...form, anoConstruccion: e.target.value })}
                  className="bg-slate-800 border-slate-700 text-white"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-slate-300">Tipo</Label>
              <Select value={form.tipo} onValueChange={(v) => setForm({ ...form, tipo: v as "VENTA" | "ALQUILER" })}>
                <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                  <span className="text-white text-sm">{form.tipo === "VENTA" ? "Venta" : "Alquiler"}</span>
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">
                  <SelectItem value="VENTA" className="text-white focus:bg-slate-700">Venta</SelectItem>
                  <SelectItem value="ALQUILER" className="text-white focus:bg-slate-700">Alquiler</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Factores opcionales */}
            <div className="pt-2 border-t border-slate-700/50">
              <Label className="text-slate-300 text-xs">
                Factores de homologación (opcional — solo si los conoces por visita en campo)
              </Label>
              <p className="text-[10px] text-slate-500 mt-1 mb-2">
                Vacío = 1.0 (neutro). Rango permitido: 0.50 - 1.50.
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {FACTOR_FIELDS.map((f) => (
                  <div key={f.key} className="space-y-1">
                    <Label className="text-[10px] text-slate-400">{f.label}</Label>
                    <Input
                      type="number"
                      step="0.01"
                      min="0.5"
                      max="1.5"
                      value={form[f.key]}
                      onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}
                      className="bg-slate-800 border-slate-700 text-white h-9 text-sm"
                      placeholder="1.0"
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)} className="border-slate-700 text-white hover:bg-slate-800">
              Cancelar
            </Button>
            <Button onClick={guardar} disabled={saving} className="bg-primary hover:bg-primary/90">
              {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              {editingId ? "Guardar cambios" : "Agregar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  )
}
