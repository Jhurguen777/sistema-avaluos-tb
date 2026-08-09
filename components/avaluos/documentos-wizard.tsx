"use client"

import { useRef, useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Upload,
  Camera,
  FileText,
  X,
  Paperclip,
  Info,
} from "lucide-react"

export interface DocumentoWizard {
  tipo: string
  descripcion?: string
  file: File
  previewUrl?: string
}

interface DocumentosWizardProps {
  documentos: DocumentoWizard[]
  onChange: (docs: DocumentoWizard[]) => void
}

/** Tipos de documento disponibles en el wizard (paso 6) — alineados con el enum TipoDocumento del schema */
const TIPOS = [
  { value: "FOLIO_REAL", label: "Folio Real / Certificado Alodial" },
  { value: "CATASTRO", label: "Catastro" },
  { value: "IMPUESTOS", label: "Impuestos" },
  { value: "PLANO", label: "Plano" },
  { value: "FOTOGRAFIA", label: "Fotografía" },
  { value: "OTRO", label: "Otro" },
]

export function DocumentosWizard({ documentos, onChange }: DocumentosWizardProps) {
  // Tipo activo que se va a agregar al subir el próximo archivo
  const [tipoActivo, setTipoActivo] = useState<string>("FOLIO_REAL")
  const [otraDescripcion, setOtraDescripcion] = useState("")
  const inputPcRef = useRef<HTMLInputElement>(null)
  const inputCelRef = useRef<HTMLInputElement>(null)
  const inputCamaraRef = useRef<HTMLInputElement>(null)

  const agregarArchivo = (file: File | undefined | null) => {
    if (!file) return
    const desc = tipoActivo === "OTRO" && otraDescripcion.trim() ? otraDescripcion.trim() : undefined
    const nuevo: DocumentoWizard = {
      tipo: tipoActivo,
      descripcion: desc,
      file,
    }
    onChange([...documentos, nuevo])
    setOtraDescripcion("")
    // Reset para que el mismo archivo se pueda volver a seleccionar
    if (inputPcRef.current) inputPcRef.current.value = ""
    if (inputCelRef.current) inputCelRef.current.value = ""
    if (inputCamaraRef.current) inputCamaraRef.current.value = ""
  }

  const eliminar = (idx: number) => {
    onChange(documentos.filter((_, i) => i !== idx))
  }

  const labelTipo = (t: string) => TIPOS.find((x) => x.value === t)?.label ?? t

  return (
    <div className="space-y-4">
      {/* INFO: OPCIONAL */}
      <div className="flex items-start gap-3 bg-blue-500/10 border border-blue-500/30 rounded-lg p-3">
        <Info className="w-4 h-4 text-blue-400 mt-0.5 shrink-0" />
        <div className="text-xs text-blue-200 space-y-1">
          <p className="font-medium">Documentos opcionales</p>
          <p className="text-blue-300">
            Podés omitir todos los documentos y cargarlos después desde la página de detalle.
            Una vez subidos, podés regenerar el PDF con los nuevos documentos incluidos.
          </p>
        </div>
      </div>

      {/* SELECTOR DE TIPO + DESCRIPCIÓN */}
      <Card className="border-2 border-slate-800 bg-slate-900/50">
        <div className="p-4 sm:p-6 space-y-4">
          <div>
            <Label className="text-xs text-slate-400">Tipo de documento a subir</Label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-2">
              {TIPOS.map((t) => (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => setTipoActivo(t.value)}
                  className={`px-3 py-2 rounded text-xs font-medium transition-colors ${
                    tipoActivo === t.value
                      ? "bg-primary text-white"
                      : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {tipoActivo === "OTRO" && (
            <div className="space-y-1.5">
              <Label className="text-xs text-slate-400">Especificar nombre</Label>
              <Input
                type="text"
                value={otraDescripcion}
                onChange={(e) => setOtraDescripcion(e.target.value)}
                placeholder="Ej: Licencia de construcción"
                className="bg-slate-800 border-slate-700 text-white"
              />
            </div>
          )}

          {/* BOTONES DE SUBIDA */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-2">
            <Button
              type="button"
              onClick={() => inputPcRef.current?.click()}
              className="bg-blue-600 hover:bg-blue-700 text-white h-11"
            >
              <Upload className="w-4 h-4 mr-2" />
              Desde PC
            </Button>
            <Button
              type="button"
              onClick={() => inputCelRef.current?.click()}
              className="bg-slate-700 hover:bg-slate-600 text-white h-11"
            >
              <Paperclip className="w-4 h-4 mr-2" />
              Desde celular
            </Button>
            <Button
              type="button"
              onClick={() => inputCamaraRef.current?.click()}
              className="bg-emerald-600 hover:bg-emerald-700 text-white h-11"
            >
              <Camera className="w-4 h-4 mr-2" />
              Sacar foto
            </Button>
          </div>

          {/* INPUTS OCULTOS */}
          <input
            ref={inputPcRef}
            type="file"
            accept="image/*,.pdf"
            className="hidden"
            onChange={(e) => agregarArchivo(e.target.files?.[0])}
          />
          <input
            ref={inputCelRef}
            type="file"
            accept="image/*,.pdf"
            className="hidden"
            onChange={(e) => agregarArchivo(e.target.files?.[0])}
          />
          {/* capture=environment abre la cámara trasera en móviles */}
          <input
            ref={inputCamaraRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={(e) => agregarArchivo(e.target.files?.[0])}
          />
        </div>
      </Card>

      {/* LISTA DE DOCUMENTOS AGREGADOS */}
      {documentos.length > 0 && (
        <Card className="border-2 border-slate-800 bg-slate-900/50">
          <div className="p-4 sm:p-6">
            <h4 className="text-sm font-semibold text-white mb-3">
              Documentos para subir ({documentos.length})
            </h4>
            <div className="space-y-2">
              {documentos.map((d, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-3 bg-slate-800/40 rounded p-2"
                >
                  <FileText className="w-4 h-4 text-slate-400 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white truncate">
                      {labelTipo(d.tipo)}
                      {d.descripcion && (
                        <span className="text-slate-400"> · {d.descripcion}</span>
                      )}
                    </p>
                    <p className="text-xs text-slate-500 truncate">
                      {d.file.name} · {(d.file.size / 1024).toFixed(0)} KB
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => eliminar(idx)}
                    className="text-red-400 hover:text-red-300 p-1 shrink-0"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </Card>
      )}
    </div>
  )
}
