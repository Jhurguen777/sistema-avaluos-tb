"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Bug, FileJson, ArrowLeftRight } from "lucide-react"
import { cn } from "@/lib/utils"

/**
 * Layout del módulo unificado "Extracción / Inserción de Datos".
 * Muestra tabs para alternar entre los submódulos Scraper e Importación.
 */
export default function DatosLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()

  const tabs = [
    {
      href: "/dashboard/datos/scraper",
      label: "Scraper",
      icon: Bug,
      activo: pathname.startsWith("/dashboard/datos/scraper"),
    },
    {
      href: "/dashboard/datos/importar",
      label: "Importación",
      icon: FileJson,
      activo: pathname.startsWith("/dashboard/datos/importar"),
    },
  ]

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Encabezado del módulo */}
      <div className="space-y-2">
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-[#FAB90E] flex items-center gap-3">
          <ArrowLeftRight className="w-7 h-7 sm:w-8 sm:h-8" />
          Extracción / Inserción de Datos
        </h1>
        <p className="text-sm sm:text-base text-muted-foreground">
          Extrae propiedades de inmobiliarias (C21, RE/MAX) con los scrapers de Python
          e impórtalas al catálogo de productos.
        </p>
      </div>

      {/* Tabs de submódulos */}
      <div className="flex gap-2 p-1 rounded-xl bg-slate-900/60 border border-slate-800 w-fit max-w-full overflow-x-auto">
        {tabs.map((tab) => {
          const Icon = tab.icon
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 whitespace-nowrap",
                tab.activo
                  ? "bg-[#233C7A] text-white shadow"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60",
              )}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </Link>
          )
        })}
      </div>

      {/* Contenido del submódulo activo */}
      {children}
    </div>
  )
}
