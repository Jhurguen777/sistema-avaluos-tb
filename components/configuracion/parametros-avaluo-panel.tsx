"use client"

import React, { useState, useEffect } from "react"
import { getParametrosAction, updateParametroAction } from "@/shared/config/config-action"
import { toast } from "@/components/ui/use-toast"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Loader2, Save, SlidersHorizontal } from "lucide-react"

interface Parametro {
  id: string
  clave: string
  valor: string
  etiqueta: string
  descripcion: string | null
  grupo: string
}

const GRUPO_LABELS: Record<string, string> = {
  Descuentos: "Descuentos por Tipo de Avalúo",
  Alquiler: "Cálculo de Alquiler",
  Homologación: "Homologación",
}

const GRUPO_ORDER = ["Descuentos", "Alquiler", "Homologación"]

export function ParametrosAvaluoPanel() {
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [parametros, setParametros] = useState<Parametro[]>([])
  const [ediciones, setEdiciones] = useState<Record<string, string>>({})
  const [refreshKey, setRefreshKey] = useState(0)

  useEffect(() => {
    let active = true
    async function fetchParametros() {
      setIsLoading(true)
      try {
        const result = await getParametrosAction()
        if (!active) return
        if (result.success && result.data) {
          setParametros(result.data as Parametro[])
        } else {
          toast.error("Error", result.error || "No se pudieron cargar los parámetros")
        }
      } catch {
        if (active) toast.error("Error al cargar los parámetros")
      } finally {
        if (active) setIsLoading(false)
      }
    }
    fetchParametros()
    return () => { active = false }
  }, [refreshKey])

  const guardar = async () => {
    setIsSaving(true)
    try {
      let errores = 0
      for (const [id, valor] of Object.entries(ediciones)) {
        const result = await updateParametroAction(id, valor)
        if (!result.success) {
          errores++
          toast.error("Error", result.error)
        }
      }
      if (errores === 0) {
        toast.success("Parámetros actualizados correctamente")
        setEdiciones({})
        setRefreshKey((k) => k + 1)
      }
    } catch {
      toast.error("Error al guardar")
    } finally {
      setIsSaving(false)
    }
  }

  const hayEdiciones = Object.keys(ediciones).length > 0

  /** Formatea un valor para mostrar (porcentaje si es pequeño, directo si es mayor) */
  const formatearPista = (clave: string, valor: string): string => {
    const n = parseFloat(valor)
    if (Number.isNaN(n)) return ""
    if (clave.startsWith("descuento.")) return `${(n * 100).toFixed(1)}%`
    if (clave.startsWith("alquiler.")) return `${(n * 100).toFixed(1)}%`
    if (clave === "homologacion.factor_maximo") return `máx ${n.toFixed(2)}`
    return valor
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  // Agrupar parámetros
  const grupos = GRUPO_ORDER.filter((g) => parametros.some((p) => p.grupo === g))

  return (
    <div className="space-y-6">
      <Card className="border-2 border-border/50">
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <CardTitle className="flex items-center gap-2 text-xl">
                <SlidersHorizontal className="w-5 h-5 text-primary" />
                Parámetros de Cálculo
              </CardTitle>
              <CardDescription>
                Los cambios solo afectan a avalúos nuevos o editados (no recalculan los existentes)
              </CardDescription>
            </div>
            <Button onClick={guardar} disabled={!hayEdiciones || isSaving} className="bg-[#233C7A] hover:bg-[#1e3566]">
              {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
              Guardar cambios
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {grupos.map((grupo) => (
              <div key={grupo} className="space-y-3">
                <h3 className="text-sm font-bold text-primary uppercase tracking-wide border-b border-border/50 pb-1">
                  {GRUPO_LABELS[grupo] ?? grupo}
                </h3>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {parametros
                    .filter((p) => p.grupo === grupo)
                    .map((p) => (
                      <div key={p.id} className="bg-muted/30 rounded-lg p-4 border border-border/50">
                        <div className="flex items-start justify-between gap-3 mb-2">
                          <div className="flex-1">
                            <p className="text-sm font-semibold text-foreground">{p.etiqueta}</p>
                            {p.descripcion && (
                              <p className="text-xs text-muted-foreground mt-1">{p.descripcion}</p>
                            )}
                          </div>
                          <div className="shrink-0 flex items-center gap-2">
                            <Input
                              type="number"
                              step="0.001"
                              value={ediciones[p.id] ?? p.valor}
                              onChange={(e) =>
                                setEdiciones((prev) => ({ ...prev, [p.id]: e.target.value }))
                              }
                              className="w-28 text-center text-sm"
                            />
                          </div>
                        </div>
                        <p className="text-[10px] text-muted-foreground/70">
                          Equivale a: <strong>{formatearPista(p.clave, ediciones[p.id] ?? p.valor)}</strong>
                        </p>
                      </div>
                    ))}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
