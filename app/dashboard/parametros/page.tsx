"use client"

import { ParametrosAvaluoPanel } from "@/components/configuracion/parametros-avaluo-panel"

export default function ParametrosPage() {
  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-[#FAB90E]">
          Parámetros de Avalúo
        </h1>
        <p className="text-sm sm:text-base text-muted-foreground">
          Configuración de descuentos, alquiler y homologación
        </p>
      </div>

      <ParametrosAvaluoPanel />
    </div>
  )
}
