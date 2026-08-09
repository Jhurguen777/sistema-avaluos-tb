"use client"

import { TablaValoresReposicion } from "@/components/configuracion/tabla-valores-reposicion"

export default function ValoresReposicionPage() {
  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-[#FAB90E]">
          Valores de Reposición
        </h1>
        <p className="text-sm sm:text-base text-muted-foreground">
          Tabla de valores unitarios de construcción (USD/m²)
        </p>
      </div>

      <TablaValoresReposicion />
    </div>
  )
}
