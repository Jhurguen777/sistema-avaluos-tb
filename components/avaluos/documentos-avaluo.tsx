"use client"

import { useState, useEffect, useRef } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Upload, FileText, Trash2, Loader2, Download } from "lucide-react"
import { toast } from "@/components/ui/use-toast"
import {
  subirDocumentoAction,
  listarDocumentosAction,
  eliminarDocumentoAction,
} from "@/modules/documentos/actions"
import type { TipoDocumento } from "@prisma/client"

const TIPOS: { value: TipoDocumento; label: string }[] = [
  { value: "FOLIO_REAL", label: "Folio Real" },
  { value: "CATASTRO", label: "Catastro" },
  { value: "IMPUESTOS", label: "Impuestos" },
  { value: "PLANO", label: "Plano" },
  { value: "FOTOGRAFIA", label: "Fotografía" },
  { value: "OTRO", label: "Otro" },
]

export function DocumentosAvaluo({ avaluoId }: { avaluoId: string }) {
  const [documentos, setDocumentos] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [tipo, setTipo] = useState<TipoDocumento>("FOLIO_REAL")
  const fileRef = useRef<HTMLInputElement>(null)

  const load = async () => {
    const res = await listarDocumentosAction(avaluoId)
    if (res.success && res.data) setDocumentos(res.data)
    setIsLoading(false)
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [avaluoId])

  const handleUpload = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const file = fileRef.current?.files?.[0]
    if (!file) {
      toast.error("Selecciona un archivo")
      return
    }
    setUploading(true)
    try {
      const fd = new FormData()
      fd.append("avaluoId", avaluoId)
      fd.append("tipo", tipo)
      fd.append("file", file)
      const res = await subirDocumentoAction(fd)
      if (res.success) {
        toast.success("Documento subido correctamente")
        if (fileRef.current) fileRef.current.value = ""
        await load()
      } else {
        toast.error("Error al subir", res.error)
      }
    } finally {
      setUploading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("¿Eliminar este documento?")) return
    const res = await eliminarDocumentoAction(id)
    if (res.success) {
      toast.success("Documento eliminado")
      await load()
    } else {
      toast.error("Error al eliminar", res.error)
    }
  }

  return (
    <Card className="border-2 border-slate-800 bg-slate-900/50">
      <div className="p-5">
        <div className="flex items-center gap-2 mb-4">
          <FileText className="w-5 h-5 text-primary" />
          <h3 className="text-lg font-semibold text-white">Documentos ({documentos.length})</h3>
        </div>

        {/* Formulario de subida */}
        <form onSubmit={handleUpload} className="grid grid-cols-1 sm:grid-cols-[1fr_auto_auto] gap-3 mb-5">
          <div className="space-y-1.5">
            <Label htmlFor="tipo-doc" className="text-xs text-slate-400">Tipo</Label>
            <select
              id="tipo-doc"
              value={tipo}
              onChange={(e) => setTipo(e.target.value as TipoDocumento)}
              className="w-full h-10 px-3 bg-slate-800 border-2 border-slate-700 rounded-md text-white text-sm"
            >
              {TIPOS.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="file-doc" className="text-xs text-slate-400">Archivo</Label>
            <input
              ref={fileRef}
              id="file-doc"
              type="file"
              accept=".pdf,.png,.jpg,.jpeg,.webp,application/pdf,image/png,image/jpeg,image/webp"
              className="h-10 file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-primary file:text-white hover:file:bg-primary/90 text-slate-300 text-sm w-full"
            />
          </div>
          <div className="flex items-end">
            <Button type="submit" disabled={uploading} className="bg-primary hover:bg-primary/90 w-full sm:w-auto">
              {uploading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Upload className="w-4 h-4 mr-2" />}
              Subir
            </Button>
          </div>
        </form>

        {/* Lista de documentos */}
        {isLoading ? (
          <div className="flex justify-center py-6">
            <Loader2 className="w-6 h-6 text-primary animate-spin" />
          </div>
        ) : documentos.length === 0 ? (
          <p className="text-sm text-slate-500 text-center py-6">No hay documentos adjuntos.</p>
        ) : (
          <div className="space-y-2">
            {documentos.map((doc) => {
              const tipoLabel = TIPOS.find((t) => t.value === doc.tipo)?.label ?? doc.tipo
              return (
                <div
                  key={doc.id}
                  className="flex items-center gap-3 p-3 rounded-lg bg-slate-800/50 border border-slate-700 hover:border-slate-600 transition-colors"
                >
                  <FileText className="w-5 h-5 text-slate-400 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white truncate" title={doc.originalName}>
                      {doc.originalName}
                    </p>
                    <p className="text-xs text-slate-500">
                      {tipoLabel} · {(doc.size / 1024).toFixed(0)} KB
                    </p>
                  </div>
                  {doc.esFoto && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 shrink-0">
                      Foto del inmueble
                    </span>
                  )}
                  <a
                    href={doc.url}
                    download
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 text-slate-400 hover:text-green-400 transition-colors"
                    title="Descargar"
                  >
                    <Download className="w-4 h-4" />
                  </a>
                  <button
                    onClick={() => handleDelete(doc.id)}
                    className="p-2 text-slate-400 hover:text-red-400 transition-colors"
                    title="Eliminar"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </Card>
  )
}
