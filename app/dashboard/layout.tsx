"use client"

import { Sidebar } from "@/components/sidebar"
import { Toaster } from "@/components/ui/toaster"
import { Menu, Home, LayoutDashboard } from "lucide-react"
import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import "./dashboard-styles.css"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false)

  const handleOpenSidebar = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsMobileSidebarOpen(true)
  }

  const handleCloseSidebar = () => {
    setIsMobileSidebarOpen(false)
  }

  return (
    <>
      {/* Header con navegación */}
      <header className="border-b border-slate-800/50 bg-slate-950/50 backdrop-blur-xl sticky top-0 z-50">
        <div className="flex items-center justify-between h-16 px-4 sm:px-6 lg:px-8">
          {/* Botón hamburguesa + Logo Premium */}
          <div className="flex items-center gap-4">
            {!isMobileSidebarOpen && (
              <button
                onClick={handleOpenSidebar}
                className="lg:hidden h-10 w-10 flex items-center justify-center rounded-lg bg-[#FAB90E] text-white shadow-lg hover:bg-[#e5a800] transition-all duration-200 active:scale-95"
                aria-label="Abrir menú"
                style={{ pointerEvents: "auto" }}
              >
                <Menu className="w-5 h-5" />
              </button>
            )}

            {/* Logo con efectos premium (trasladado desde el sidebar) */}
            <div className="relative">
              <div
                className="relative flex items-center justify-center"
                style={{
                  filter: 'drop-shadow(0 0 12px rgba(147,51,234,0.5)) drop-shadow(0 0 24px rgba(59,130,246,0.3))'
                }}
              >
                {/* Glow de fondo */}
                <div className="absolute inset-0 bg-gradient-to-tr from-purple-500/20 to-blue-500/20 rounded-xl blur-xl" />
                {/* Logo */}
                <Image
                  src="/recurso2analityc2.png"
                  alt="Alfa Analitycs"
                  width={40}
                  height={40}
                  className="relative w-10 h-10 object-contain"
                />
              </div>
            </div>

            {/* Nombre de la app */}
            <div className="hidden sm:block">
              <h1 className="text-xl md:text-2xl font-bold tracking-tight text-white">
                Alfa Analitycs
              </h1>
              <p className="text-xs text-slate-400">Sistema de gestionamiento de Avalúos</p>
            </div>
          </div>

          {/* Botones de navegación */}
          <nav className="flex items-center gap-2">
            <Link href="/home">
              <button className="flex items-center gap-2 px-3 sm:px-4 py-2 text-sm font-medium text-white bg-primary/20 hover:bg-primary/30 rounded-lg transition-all duration-200 border border-primary/30">
                <Home className="w-4 h-4" />
                <span className="hidden sm:inline">Home</span>
              </button>
            </Link>
            <Link href="/dashboard">
              <button className="flex items-center gap-2 px-3 sm:px-4 py-2 text-sm font-medium text-white bg-secondary/20 hover:bg-secondary/30 rounded-lg transition-all duration-200 border border-secondary/30">
                <LayoutDashboard className="w-4 h-4" />
                <span className="hidden sm:inline">Panel</span>
              </button>
            </Link>
          </nav>
        </div>
      </header>

      {/* Contenido principal */}
      <div className="dashboard-wrapper flex h-[calc(100vh-4rem)] lg:h-[calc(100vh-4rem)] overflow-hidden">
        {/* Sidebar */}
        <Sidebar
          isMobileOpen={isMobileSidebarOpen}
          onCloseMobile={() => handleCloseSidebar()}
        />

        {/* Área de contenido */}
        <main className="flex-1 min-w-0 overflow-y-auto overflow-x-hidden relative z-10 h-full">
          {children}
        </main>

        <Toaster />
      </div>
    </>
  )
}
