"use client"

import React, { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { getValoresReposicionAction, updateValorReposicionAction } from "@/shared/config/config-action"
import { toNum } from "@/shared/database/decimal"
import { toast } from "@/components/ui/use-toast"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Loader2, Save, Lock, Table2 } from "lucide-react"

const CATEGORIAS = ["LUJO", "PRIMERA", "ESTANDAR", "ECONOMICA"] as const
const ESTADOS = ["EXCELENTE", "BUENO", "REGULAR", "MALO", "DEMOLICION"] as const

const LABELS_CAT: Record<string, string> = {
  LUJO: "Lujo",
  PRIMERA: "Primera",
  ESTANDAR: "Estándar",
  ECONOMICA: "Económica",
}

const LABELS_EST: Record<string, string> = {
  EXCELENTE: "Excelente",
  BUENO: "Bueno",
  REGULAR: "Regular",
  MALO: "Malo",
  DEMOLICION: "Demolición",
}

interface ValorFila {
  id: string
  categoria: string
  estado: string
  min: unknown
  max: unknown
  costo: unknown
}

/** Edición local: map key → { min?, max?, costo? } */
type EdicionLocal = Record<string, { min?: string; max?: string; costo?: string }>

function filaKey(categoria: string, estado: string) {
  return `${categoria}_${estado}`
}

export function TablaValoresReposicion() {
  const { data: session } = useSession()
  const isAdmin = session?.user?.role === "ADMIN"

  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [filas, setFilas] = useState<ValorFila[]>([])
  const [ediciones, setEdiciones] = useState<EdicionLocal>({})
  const [refreshKey, setRefreshKey] = useState(0)

  useEffect(() => {
    let active = true
    async function fetchValores() {
      setIsLoading(true)
      try {
        const result = await getValoresReposicionAction()
        if (!active) return
        if (result.success && result.data) {
          setFilas(result.data as ValorFila[])
        } else {
          toast.error("Error", result.error || "No se pudieron cargar los valores")
        }
      } catch {
        if (active) toast.error("Error al cargar la tabla")
      } finally {
        if (active) setIsLoading(false)
      }
    }
    fetchValores()
    return () => { active = false }
  }, [refreshKey])

  /** Obtiene una fila por categoria+estado */
  const getFila = (cat: string, est: string): ValorFila | undefined =>
    filas.find((f) => f.categoria === cat && f.estado === est)

  /** Valor actual de un campo (editado o de DB) */
  const getValor = (cat: string, est: string, campo: "min" | "max" | "costo"): string => {
    const key = filaKey(cat, est)
    if (ediciones[key]?.[campo] !== undefined) return ediciones[key][campo]!
    const fila = getFila(cat, est)
    if (!fila) return ""
    const v = toNum(fila[campo])
    return v !== null ? String(v) : ""
  }

  /** Actualiza un campo en la edición local */
  const setValor = (cat: string, est: string, campo: "min" | "max" | "costo", valor: string) => {
    const key = filaKey(cat, est)
    setEdiciones((prev) => ({
      ...prev,
      [key]: { ...prev[key], [campo]: valor },
    }))
  }

  /** Guarda todas las ediciones pendientes */
  const guardar = async () => {
    // Validar que celdas no-DEMOLICION tengan min y max válidos
    for (const [key, vals] of Object.entries(ediciones)) {
      const [cat, est] = key.split("_")
      if (est !== "DEMOLICION") {
        if (vals.min !== undefined && vals.min === "") {
          toast.error("Error", `El valor mínimo no puede estar vacío para ${cat}/${est}`)
          return
        }
        if (vals.max !== undefined && vals.max === "") {
          toast.error("Error", `El valor máximo no puede estar vacío para ${cat}/${est}`)
          return
        }
        const min = vals.min !== undefined ? parseFloat(vals.min) : null
        const max = vals.max !== undefined ? parseFloat(vals.max) : null
        if (min !== null && max !== null && min > max) {
          toast.error("Error", `El mínimo no puede ser mayor al máximo para ${cat}/${est}`)
          return
        }
      }
    }

    setIsSaving(true)
    try {
      let errores = 0
      for (const [key, vals] of Object.entries(ediciones)) {
        const [cat, est] = key.split("_")
        const fila = getFila(cat, est)
        if (!fila) continue

        const data: { min?: number | null; max?: number | null; costo?: number | null } = {}
        if (vals.min !== undefined) data.min = vals.min === "" ? null : parseFloat(vals.min)
        if (vals.max !== undefined) data.max = vals.max === "" ? null : parseFloat(vals.max)
        if (vals.costo !== undefined) data.costo = vals.costo === "" ? null : parseFloat(vals.costo)

        const result = await updateValorReposicionAction(fila.id, data)
        if (!result.success) errores++
      }

      if (errores > 0) {
        toast.error(`${errores} valor(es) no se pudieron guardar`)
      } else {
        toast.success("Tabla actualizada correctamente")
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <Card className="border-2 border-border/50">
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <CardTitle className="flex items-center gap-2 text-xl">
              <Table2 className="w-5 h-5 text-primary" />
              Valores de Reposición (USD/m²)
            </CardTitle>
            <CardDescription>
              Valores unitarios por categoría constructiva y estado de conservación
            </CardDescription>
          </div>
          {isAdmin ? (
            <Button onClick={guardar} disabled={!hayEdiciones || isSaving} className="bg-[#233C7A] hover:bg-[#1e3566]">
              {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
              Guardar cambios
            </Button>
          ) : (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Lock className="w-4 h-4" />
              Solo lectura (solo ADMIN puede editar)
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {/* Tabla responsive: scroll horizontal en móvil */}
        <div className="w-full overflow-x-auto scrollbar-thin">
          <div className="min-w-[700px]">
            {/* Cabecera */}
            <div className="grid grid-cols-[120px_repeat(4,1fr)] gap-2 mb-2">
              <div className="text-xs font-medium text-muted-foreground">Estado \ Categoría</div>
              {CATEGORIAS.map((cat) => (
                <div key={cat} className="text-xs font-bold text-center text-primary">
                  {LABELS_CAT[cat]}
                </div>
              ))}
            </div>

            {/* Filas */}
            {ESTADOS.map((est) => {
              const esDemolicion = est === "DEMOLICION"
              return (
                <div
                  key={est}
                  className="grid grid-cols-[120px_repeat(4,1fr)] gap-2 items-center py-2 border-b border-border/30"
                >
                  <div className={`text-sm font-medium ${esDemolicion ? "text-red-400" : "text-foreground"}`}>
                    {LABELS_EST[est]}
                  </div>
                  {CATEGORIAS.map((cat) => {
                    if (esDemolicion) {
                      return (
                        <div key={cat} className="flex items-center justify-center">
                          {isAdmin ? (
                            <Input
                              type="number"
                              value={getValor(cat, est, "costo")}
                              onChange={(e) => setValor(cat, est, "costo", e.target.value)}
                              className="h-9 text-center text-sm bg-red-500/5 border-red-500/30"
                              placeholder="0"
                            />
                          ) : (
                            <span className="text-sm text-red-400 font-medium">
                              ${getValor(cat, est, "costo") || "0"} c/u
                            </span>
                          )}
                        </div>
                      )
                    }
                    return (
                      <div key={cat} className="flex items-center justify-center gap-1">
                        {isAdmin ? (
                          <>
                            <Input
                              type="number"
                              value={getValor(cat, est, "min")}
                              onChange={(e) => setValor(cat, est, "min", e.target.value)}
                              className="h-9 w-16 text-center text-xs"
                              placeholder="min"
                            />
                            <span className="text-muted-foreground text-xs">-</span>
                            <Input
                              type="number"
                              value={getValor(cat, est, "max")}
                              onChange={(e) => setValor(cat, est, "max", e.target.value)}
                              className="h-9 w-16 text-center text-xs"
                              placeholder="max"
                            />
                          </>
                        ) : (
                          <span className="text-sm text-foreground">
                            {getValor(cat, est, "min")} - {getValor(cat, est, "max")}
                          </span>
                        )}
                      </div>
                    )
                  })}
                </div>
              )
            })}
          </div>
        </div>

        {/* Nota */}
        <div className="mt-4 p-3 bg-muted/30 rounded-lg border border-border/50">
          <p className="text-xs text-muted-foreground">
            <strong>Nota:</strong> El valor unitario sugerido para cada celda es el promedio del rango (min + max) ÷ 2.
            Para DEMOLICIÓN, el costo indicado se <strong>resta</strong> del valor total del avalúo.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
