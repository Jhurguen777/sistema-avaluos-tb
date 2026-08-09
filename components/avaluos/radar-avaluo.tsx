"use client"

/**
 * RadarAvaluo (componente controlado)
 *
 * Muestra el entorno + equipamientos de un avalúo y permite al admin:
 *  - Generar/actualizar el radar (botón que llama al server action)
 *  - Seleccionar qué equipamientos van al PDF (checkboxes, estado en el padre)
 *  - Eliminar permanentemente un equipamiento de la BD (botón de tacho)
 *
 * No mantiene estado propio de datos: todo viene por props desde la página,
 * que es la fuente de verdad (para que el PDF y los mapas usen la misma selección).
 */

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Radar, Loader2, MapPin, RefreshCw, Trash2, CheckCheck, Square, Filter } from "lucide-react"
import { TIPO_EQUIPAMIENTO_LABELS } from "@/constants/tipos-equipamiento"

const RADIOS = [250, 500, 750, 1000]

/** Etiquetas legibles accesibles por string arbitrario (con fallback al propio tipo) */
const LABEL_TIPO = (tipo: string): string =>
  (TIPO_EQUIPAMIENTO_LABELS as Record<string, string>)[tipo] ?? tipo

export interface EquipamientoRadarItem {
  id: string
  tipo: string
  nombre: string
  distancia: number
  lat: number
  lng: number
}

interface RadarAvaluoProps {
  avaluoId: string
  entorno: { radio: number; equipamientos: EquipamientoRadarItem[] } | null
  isLoading: boolean
  generando: boolean
  /** IDs de equipamientos excluidos del PDF (no se borraron, solo desmarcados) */
  excluidos: Set<string>
  editable: boolean
  onGenerar: (radio: number) => void
  onToggleExclusion: (id: string) => void
  onExcluirTodos: () => void
  onIncluirTodos: () => void
  /** Incluye un conjunto de IDs de golpe (para "incluir todos del tipo") */
  onIncluirIds: (ids: string[]) => void
  /** Excluye un conjunto de IDs de golpe (para "excluir todos del tipo") */
  onExcluirIds: (ids: string[]) => void
  onEliminar: (id: string) => void
  radioActual: number
  onCambiarRadio: (radio: number) => void
}

export function RadarAvaluo({
  avaluoId,
  entorno,
  isLoading,
  generando,
  excluidos,
  editable,
  onGenerar,
  onToggleExclusion,
  onExcluirTodos,
  onIncluirTodos,
  onIncluirIds,
  onExcluirIds,
  onEliminar,
  radioActual,
  onCambiarRadio,
}: RadarAvaluoProps) {
  void avaluoId // se conserva por compatibilidad; la data viene por `entorno`
  // Filtro por tipo (estado interno de vista — no afecta la selección)
  const [tipoFiltro, setTipoFiltro] = useState<string | null>(null)

  const equipamientos = entorno?.equipamientos ?? []
  const seleccionados = equipamientos.filter((e) => !excluidos.has(e.id))

  // Agrupar por tipo (sobre el total)
  const porTipo: Record<string, number> = {}
  equipamientos.forEach((e) => {
    porTipo[e.tipo] = (porTipo[e.tipo] ?? 0) + 1
  })
  const tiposActivos = Object.keys(porTipo)

  // Lista filtrada por el tipo seleccionado
  const equipamientosVisibles = tipoFiltro
    ? equipamientos.filter((e) => e.tipo === tipoFiltro)
    : equipamientos
  const idsTipoFiltrado = equipamientosVisibles.map((e) => e.id)
  const seleccionadosDelTipo = equipamientosVisibles.filter((e) => !excluidos.has(e.id))

  return (
    <Card className="border-2 border-slate-800 bg-slate-900/50">
      <div className="p-5">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
          <div className="flex items-center gap-2">
            <Radar className="w-5 h-5 text-primary" />
            <h3 className="text-lg font-semibold text-white">
              Radar de Equipamientos ({equipamientos.length})
            </h3>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <select
              value={radioActual}
              onChange={(e) => onCambiarRadio(Number(e.target.value))}
              className="h-9 px-3 bg-slate-800 border-2 border-slate-700 rounded-md text-white text-sm"
            >
              {RADIOS.map((r) => (
                <option key={r} value={r}>Radio: {r}m</option>
              ))}
            </select>
            <Button onClick={() => onGenerar(radioActual)} disabled={generando} size="sm" className="bg-primary hover:bg-primary/90">
              {generando ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <RefreshCw className="w-4 h-4 mr-2" />}
              {generando ? "Generando..." : entorno ? "Actualizar" : "Generar Radar"}
            </Button>
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-6">
            <Loader2 className="w-6 h-6 text-primary animate-spin" />
          </div>
        ) : equipamientos.length === 0 ? (
          <p className="text-sm text-slate-500 text-center py-6">
            {entorno
              ? "No se encontraron equipamientos en el radio seleccionado. Prueba con un radio mayor."
              : 'Aún no se ha generado el radar. Pulsa "Generar Radar" para analizar los equipamientos cercanos (datos de OpenStreetMap).'}
          </p>
        ) : (
          <>
            {/* Resumen por tipo — CLICABLE para filtrar la lista */}
            <div className="flex flex-wrap gap-2 mb-3">
              <button
                type="button"
                onClick={() => setTipoFiltro(null)}
                className={`px-2.5 py-1 text-xs rounded border transition-colors ${
                  tipoFiltro === null
                    ? "border-primary bg-primary/20 text-white"
                    : "border-slate-600 bg-slate-800/50 text-slate-300 hover:bg-slate-700"
                }`}
              >
                Todos: {equipamientos.length}
              </button>
              {tiposActivos.map((tipo) => {
                const activo = tipoFiltro === tipo
                return (
                  <button
                    key={tipo}
                    type="button"
                    onClick={() => setTipoFiltro(activo ? null : tipo)}
                    className={`px-2.5 py-1 text-xs rounded border transition-colors ${
                      activo
                        ? "border-primary bg-primary/20 text-white"
                        : "border-slate-600 bg-slate-800/50 text-slate-300 hover:bg-slate-700"
                    }`}
                  >
                    {LABEL_TIPO(tipo)}: {porTipo[tipo]}
                  </button>
                )
              })}
            </div>

            {/* Barra de selección para el PDF */}
            <div className="flex items-center justify-between gap-2 mb-3 px-3 py-2 rounded-lg bg-slate-800/70 border border-slate-700 flex-wrap">
              <p className="text-xs text-slate-300">
                {tipoFiltro ? (
                  <>
                    <Filter className="w-3 h-3 inline mr-1 text-primary" />
                    Filtrando: <span className="text-white font-semibold">{LABEL_TIPO(tipoFiltro)}</span>
                    {" · "}
                    <span className="text-green-400 font-semibold">{seleccionadosDelTipo.length}</span>
                    {" / "}
                    {equipamientosVisibles.length} de este tipo incluidos
                  </>
                ) : (
                  <>
                    <span className="text-green-400 font-semibold">{seleccionados.length}</span>
                    {" / "}
                    {equipamientos.length} equipamientos incluidos en el PDF
                  </>
                )}
              </p>
              <div className="flex gap-1 flex-wrap">
                {tipoFiltro ? (
                  <>
                    <Button
                      onClick={() => onIncluirIds(idsTipoFiltrado)}
                      size="sm"
                      variant="ghost"
                      className="h-7 px-2 text-xs text-green-400 hover:text-green-300 hover:bg-slate-700"
                    >
                      <CheckCheck className="w-3.5 h-3.5 mr-1" />
                      Incluir todos
                    </Button>
                    <Button
                      onClick={() => onExcluirIds(idsTipoFiltrado)}
                      size="sm"
                      variant="ghost"
                      className="h-7 px-2 text-xs text-red-400 hover:text-red-300 hover:bg-slate-700"
                    >
                      <Square className="w-3.5 h-3.5 mr-1" />
                      Excluir todos
                    </Button>
                  </>
                ) : (
                  <>
                    <Button
                      onClick={onIncluirTodos}
                      size="sm"
                      variant="ghost"
                      className="h-7 px-2 text-xs text-slate-300 hover:text-white hover:bg-slate-700"
                    >
                      <CheckCheck className="w-3.5 h-3.5 mr-1" />
                      Todos
                    </Button>
                    <Button
                      onClick={onExcluirTodos}
                      size="sm"
                      variant="ghost"
                      className="h-7 px-2 text-xs text-slate-300 hover:text-white hover:bg-slate-700"
                    >
                      <Square className="w-3.5 h-3.5 mr-1" />
                      Ninguno
                    </Button>
                  </>
                )}
              </div>
            </div>

            {/* Lista detallada con checkboxes (filtrada por tipo si hay filtro activo) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 max-h-96 overflow-y-auto pr-1">
              {equipamientosVisibles.map((e) => {
                const incluido = !excluidos.has(e.id)
                return (
                  <div
                    key={e.id}
                    className={`flex items-start gap-2 p-2.5 rounded-lg border transition-colors ${
                      incluido
                        ? "bg-slate-800/50 border-slate-700"
                        : "bg-slate-900/40 border-slate-800 opacity-60"
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => onToggleExclusion(e.id)}
                      className="mt-0.5 shrink-0"
                      title={incluido ? "Excluir del PDF" : "Incluir en el PDF"}
                    >
                      {incluido ? (
                        <span className="block w-5 h-5 rounded border-2 border-primary bg-primary flex items-center justify-center">
                          <CheckCheck className="w-3.5 h-3.5 text-white" />
                        </span>
                      ) : (
                        <span className="block w-5 h-5 rounded border-2 border-slate-600 bg-transparent" />
                      )}
                    </button>
                    <MapPin className={`w-4 h-4 mt-0.5 shrink-0 ${incluido ? "text-primary" : "text-slate-600"}`} />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm text-white truncate" title={e.nombre}>{e.nombre}</p>
                      <p className="text-xs text-slate-500">
                        {LABEL_TIPO(e.tipo)} · {e.distancia}m
                      </p>
                    </div>
                    {editable && (
                      <Button
                        onClick={() => onEliminar(e.id)}
                        size="sm"
                        variant="ghost"
                        className="h-7 w-7 p-0 text-slate-500 hover:text-red-400 hover:bg-slate-700 shrink-0"
                        title="Eliminar permanentemente"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    )}
                  </div>
                )
              })}
            </div>
          </>
        )}
      </div>
    </Card>
  )
}
