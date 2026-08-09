"use client"

import { Card } from "@/components/ui/card"
import { VALORES_REPOSICION, ANTIGUEDAD_POR_ESTADO } from "@/config/valores-reposicion"
import type { CategoriaConstructiva } from "@/constants/categorias-constructivas"
import type { EstadoConservacion } from "@/constants/estados-conservacion"
import { Check, Table2 } from "lucide-react"

interface TablaReposicionProps {
  categoriaSel?: CategoriaConstructiva | ""
  estadoSel?: EstadoConservacion | ""
  valorUnitarioActual?: number | null
}

const CATEGORIAS: CategoriaConstructiva[] = ["LUJO", "PRIMERA", "ESTANDAR", "ECONOMICA"]
const ESTADOS: EstadoConservacion[] = ["EXCELENTE", "BUENO", "REGULAR", "MALO", "DEMOLICION"]

const LABELS_CAT: Record<CategoriaConstructiva, string> = {
  LUJO: "Lujo",
  PRIMERA: "Primera",
  ESTANDAR: "Estándar",
  ECONOMICA: "Económica",
}

const LABELS_EST: Record<EstadoConservacion, string> = {
  EXCELENTE: "Excelente",
  BUENO: "Bueno",
  REGULAR: "Regular",
  MALO: "Malo",
  DEMOLICION: "Demolición",
}

/** Texto chico de referencia de antigüedad por estado (ej: "1-10 años"). */
function antiguedadTexto(est: EstadoConservacion): string {
  const a = ANTIGUEDAD_POR_ESTADO[est]
  if (a === "inhabitable") return "inhabitable"
  return `${a.min}-${a.max} años`
}

/** Devuelve el texto a mostrar en cada celda (rango o costo). */
function celdaTexto(cat: CategoriaConstructiva, est: EstadoConservacion): string {
  const celda = VALORES_REPOSICION[cat][est]
  if ("costo" in celda) {
    return `costo ${celda.costo}`
  }
  return `${celda.min}–${celda.max}`
}

/**
 * Tabla de valores de reposición (USD/m²) por categoría × estado.
 * Solo lectura: refleja la selección hecha en los dropdowns del formulario.
 * - Desktop (≥ sm): tabla con resaltado cruzado fila+columna de la selección.
 * - Móvil (< sm): tarjeta destacada con la selección + categorías colapsables.
 */
export function TablaReposicion({
  categoriaSel = "",
  estadoSel = "",
  valorUnitarioActual,
}: TablaReposicionProps) {
  const haySeleccion = Boolean(categoriaSel && estadoSel)

  return (
    <Card className="border-2 border-slate-800 bg-slate-900/50">
      <div className="p-4 sm:p-6">
        {/* Encabezado */}
        <div className="flex items-center gap-2 mb-1">
          <Table2 className="w-4 h-4 text-slate-400 shrink-0" />
          <h4 className="text-sm font-semibold text-white">Valores de Reposición (USD/m²)</h4>
        </div>
        <p className="text-xs text-slate-500 mb-4">
          El valor unitario se toma automáticamente de la tabla según categoría y estado.
        </p>

        {/* ═══════════════════ VISTA DESKTOP (≥ sm): tabla con resaltado cruzado ═══════════════════ */}
        <div className="hidden sm:block overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr>
                <th className="text-left p-2.5 border border-slate-700 bg-slate-800/60 text-slate-300 text-xs font-semibold uppercase tracking-wide">
                  Categoría
                </th>
                {ESTADOS.map((est) => {
                  const colActiva = estadoSel === est
                  return (
                    <th
                      key={est}
                      className={`p-2 border border-slate-700 text-center min-w-[90px] transition-colors ${
                        colActiva
                          ? "bg-emerald-500/20 text-emerald-300"
                          : "bg-slate-800/60 text-slate-300"
                      }`}
                    >
                      <div className="text-xs font-semibold">{LABELS_EST[est]}</div>
                      <div className="text-[10px] font-normal text-slate-500">
                        {antiguedadTexto(est)}
                      </div>
                    </th>
                  )
                })}
              </tr>
            </thead>
            <tbody>
              {CATEGORIAS.map((cat) => {
                const filaActiva = categoriaSel === cat
                return (
                  <tr key={cat}>
                    <th
                      className={`text-left p-2.5 border border-slate-700 font-medium transition-colors ${
                        filaActiva
                          ? "bg-emerald-500/20 text-emerald-300"
                          : "bg-slate-800/60 text-slate-300"
                      }`}
                    >
                      {LABELS_CAT[cat]}
                    </th>
                    {ESTADOS.map((est) => {
                      const seleccionada = categoriaSel === cat && estadoSel === est
                      const resaltada = (filaActiva || estadoSel === est) && !seleccionada
                      return (
                        <td
                          key={est}
                          className={`p-2 border text-center transition-colors ${
                            seleccionada
                              ? "border-2 border-emerald-400 bg-emerald-500/30"
                              : resaltada
                              ? "bg-emerald-500/5 border-slate-700"
                              : "border-slate-700"
                          }`}
                        >
                          <span
                            className={`text-sm ${
                              seleccionada ? "text-white font-bold" : "text-slate-300"
                            }`}
                          >
                            {celdaTexto(cat, est)}
                          </span>
                          {seleccionada && (
                            <Check className="w-3.5 h-3.5 text-emerald-300 inline-block ml-1 -mt-0.5" />
                          )}
                        </td>
                      )
                    })}
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {/* ═══════════════════ VISTA MÓVIL (< sm): selección destacada + acordeón ═══════════════════ */}
        <div className="sm:hidden space-y-3">
          {/* Tarjeta con la selección actual */}
          {haySeleccion ? (
            <div className="rounded-xl border-2 border-emerald-500/50 bg-emerald-500/10 p-3">
              <p className="text-[11px] text-emerald-300/80 uppercase tracking-wide font-semibold">
                Selección actual
              </p>
              <p className="text-sm text-white font-semibold mt-0.5">
                {LABELS_CAT[categoriaSel as CategoriaConstructiva]} ·{" "}
                {LABELS_EST[estadoSel as EstadoConservacion]}
              </p>
              <p className="text-[10px] text-slate-400">
                {antiguedadTexto(estadoSel as EstadoConservacion)}
              </p>
              <div className="mt-2 flex items-baseline gap-1">
                <span className="text-2xl font-bold text-emerald-300">
                  ${valorUnitarioActual?.toLocaleString() ?? "—"}
                </span>
                <span className="text-xs text-slate-400">USD/m²</span>
              </div>
            </div>
          ) : (
            <div className="rounded-xl border border-slate-700 bg-slate-800/40 p-3 text-center">
              <p className="text-xs text-slate-400">
                Seleccioná <span className="text-slate-200 font-medium">Categoría</span> y{" "}
                <span className="text-slate-200 font-medium">Estado</span> para ver el valor
                aplicable.
              </p>
            </div>
          )}

          {/* Acordeón con la tabla completa (categoría seleccionada abierta por defecto) */}
          <div className="space-y-2">
            {CATEGORIAS.map((cat) => {
              const catSeleccionada = categoriaSel === cat
              return (
                <details
                  key={cat}
                  open={catSeleccionada || !haySeleccion}
                  className={`rounded-lg border overflow-hidden ${
                    catSeleccionada
                      ? "border-emerald-500/40 bg-emerald-500/5"
                      : "border-slate-700 bg-slate-800/30"
                  }`}
                >
                  <summary className="flex items-center justify-between p-3 cursor-pointer list-none">
                    <span
                      className={`text-sm font-semibold ${
                        catSeleccionada ? "text-emerald-300" : "text-slate-200"
                      }`}
                    >
                      {LABELS_CAT[cat]}
                    </span>
                    <span className="text-xs text-slate-500">Ver estados ▾</span>
                  </summary>
                  <div className="px-3 pb-3 space-y-1.5">
                    {ESTADOS.map((est) => {
                      const seleccionada = categoriaSel === cat && estadoSel === est
                      return (
                        <div
                          key={est}
                          className={`flex items-center justify-between rounded-md px-2.5 py-2 border ${
                            seleccionada
                              ? "bg-emerald-500/20 border-emerald-500/50"
                              : "bg-slate-800/40 border-slate-700"
                          }`}
                        >
                          <div className="min-w-0">
                            <span
                              className={`text-sm font-medium block ${
                                seleccionada ? "text-white" : "text-slate-200"
                              }`}
                            >
                              {LABELS_EST[est]}
                            </span>
                            <span className="text-[10px] text-slate-500">
                              {antiguedadTexto(est)}
                            </span>
                          </div>
                          <span
                            className={`text-sm font-semibold flex items-center gap-1 ${
                              seleccionada ? "text-emerald-300" : "text-slate-300"
                            }`}
                          >
                            {celdaTexto(cat, est)}
                            {seleccionada && <Check className="w-3.5 h-3.5" />}
                          </span>
                        </div>
                      )
                    })}
                  </div>
                </details>
              )
            })}
          </div>
        </div>

        {/* VALOR UNITARIO RESULTANTE (ambas vistas) */}
        {haySeleccion && (
          <div className="mt-4 p-3 rounded-lg bg-primary/10 border border-primary/30">
            <p className="text-xs text-slate-400 mb-1">
              Valor unitario sugerido (
              {LABELS_CAT[categoriaSel as CategoriaConstructiva]} ×{" "}
              {LABELS_EST[estadoSel as EstadoConservacion]})
            </p>
            <p className="text-xl sm:text-2xl font-bold text-primary">
              ${valorUnitarioActual?.toLocaleString() ?? "—"}
              <span className="text-xs text-slate-500 font-normal"> /m²</span>
            </p>
          </div>
        )}
      </div>
    </Card>
  )
}
