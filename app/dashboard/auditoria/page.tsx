"use client"

import { AuditoriaTable } from "@/components/auditoria/auditoria-table"

export default function AuditoriaPage() {
  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 lg:space-y-8">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-[#FAB90E]">
          Auditoría del Sistema
        </h1>
        <p className="text-sm sm:text-base text-muted-foreground">
          Registro completo de la actividad de los usuarios
        </p>
      </div>

      <AuditoriaTable />
    </div>
  )
}
