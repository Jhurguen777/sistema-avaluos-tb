"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger } from "@/components/ui/select"
import { Map, Search, ArrowRight } from "lucide-react"
import Link from "next/link"

interface FiltrosInmueblesProps {
  className?: string
}

export function FiltrosInmuebles({ className }: FiltrosInmueblesProps) {
  const [tipoInmueble, setTipoInmueble] = useState("todos")
  const [tipoOperacion, setTipoOperacion] = useState("todos")

  const tiposInmueble = [
    { value: "todos", label: "Todos los tipos" },
    { value: "casa", label: "Casa" },
    { value: "departamento", label: "Departamento" },
    { value: "terreno", label: "Terreno" },
    { value: "local", label: "Local Comercial" },
    { value: "oficina", label: "Oficina" },
    { value: "galpon", label: "Galpón" }
  ]

  const tiposOperacion = [
    { value: "todos", label: "Todas las operaciones" },
    { value: "venta", label: "Venta" },
    { value: "alquiler", label: "Alquiler" },
    { value: "anticretico", label: "Anticrético" }
  ]

  const getTipoInmuebleLabel = () => {
    return tiposInmueble.find(t => t.value === tipoInmueble)?.label || "Todos los tipos"
  }

  const getTipoOperacionLabel = () => {
    return tiposOperacion.find(t => t.value === tipoOperacion)?.label || "Todas las operaciones"
  }

  return (
    <Card className={`border-2 border-slate-700/50 bg-slate-900/80 backdrop-blur-xl shadow-2xl overflow-hidden ${className || ""}`}>
      {/* Glow effect */}
      <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 to-blue-500/10 pointer-events-none" />

      <div className="relative p-6 sm:p-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 rounded-lg bg-primary/20 text-primary">
            <Search className="w-5 h-5" />
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-white">
            Buscar Inmuebles en el Mapa
          </h2>
        </div>

        {/* Filtros horizontales */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          {/* Tipo de Inmueble */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-300">Tipo de Inmueble</label>
            <Select value={tipoInmueble} onValueChange={setTipoInmueble}>
              <SelectTrigger className="w-full h-12 px-4 bg-slate-800/50 border-2 border-slate-700 rounded-xl text-white hover:border-primary/50 transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20">
                <span className="text-white text-sm">{getTipoInmuebleLabel()}</span>
              </SelectTrigger>
              <SelectContent className="bg-slate-800 border-slate-700">
                {tiposInmueble.map(tipo => (
                  <SelectItem
                    key={tipo.value}
                    value={tipo.value}
                    className="text-white focus:bg-slate-700 focus:text-white"
                  >
                    {tipo.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Tipo de Operación */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-300">Tipo de Operación</label>
            <Select value={tipoOperacion} onValueChange={setTipoOperacion}>
              <SelectTrigger className="w-full h-12 px-4 bg-slate-800/50 border-2 border-slate-700 rounded-xl text-white hover:border-primary/50 transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20">
                <span className="text-white text-sm">{getTipoOperacionLabel()}</span>
              </SelectTrigger>
              <SelectContent className="bg-slate-800 border-slate-700">
                {tiposOperacion.map(tipo => (
                  <SelectItem
                    key={tipo.value}
                    value={tipo.value}
                    className="text-white focus:bg-slate-700 focus:text-white"
                  >
                    {tipo.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Botón de acción */}
        <Link href="/dashboard/inmuebles/ver">
          <button className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-3 bg-gradient-to-r from-primary to-secondary text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-primary/50 transition-all duration-300 transform hover:scale-105">
            <Map className="w-5 h-5" />
            <span>Ver Mapa Interactivo</span>
            <ArrowRight className="w-5 h-5" />
          </button>
        </Link>
      </div>
    </Card>
  )
}
