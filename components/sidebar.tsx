"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useSession } from "next-auth/react"
import Image from "next/image"
import { cn } from "@/lib/utils"
import { SignOutButton } from "@/components/sign-out-button"
import {
  LayoutDashboard,
  Building2,
  FileText,
  Users,
  Settings,
  TrendingUp,
  User,
  ChevronDown,
  ChevronRight,
  Map,
  PlusCircle,
  List,
  History,
  Table2,
  SlidersHorizontal
} from "lucide-react"
import { useState } from "react"

interface SidebarProps {
  isMobileOpen?: boolean
  onCloseMobile?: () => void
}

// Menú principal - se filtrará según permisos del usuario
const allMenuItems = [
  {
    id: "dashboard",
    title: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
    description: "Vista general del sistema",
    modulo: null, // Solo admin
    roles: ["ADMIN"],
  },
  {
    id: "inmuebles",
    title: "Inmuebles",
    icon: Building2,
    description: "Gestión de propiedades",
    modulo: "inmuebles",
    subItems: [
      {
        title: "Ver Inmuebles",
        href: "/dashboard/inmuebles/ver",
        icon: Map,
        description: "Mapa con todas las propiedades"
      },
      {
        title: "Gestionar Inmuebles",
        href: "/dashboard/inmuebles",
        icon: Settings,
        description: "CRUD de inmuebles"
      }
    ]
  },
  {
    id: "avaluos",
    title: "Avalúos",
    icon: FileText,
    description: "Avalúos y valoraciones",
    modulo: "avaluos",
    subItems: [
      {
        title: "Crear Avalúo",
        href: "/dashboard/avaluos/crear",
        icon: PlusCircle,
        description: "Nuevo avalúo técnico"
      },
      {
        title: "Mis Avalúos",
        href: "/dashboard/avaluos/mis-avaluos",
        icon: List,
        description: "Avalúos creados por mí"
      },
      {
        title: "Total de Avalúos",
        href: "/dashboard/avaluos",
        icon: FileText,
        description: "Todos los avalúos del sistema"
      }
    ]
  },
  {
    id: "usuarios",
    title: "Usuarios",
    href: "/dashboard/usuarios",
    icon: Users,
    description: "Administración de usuarios",
    modulo: "usuarios",
  },
  {
    id: "reportes",
    title: "Reportes",
    href: "/dashboard/reportes",
    icon: TrendingUp,
    description: "Estadísticas y análisis",
    modulo: "reportes",
  },
  {
    id: "valores-reposicion",
    title: "Valores de Reposición",
    href: "/dashboard/valores-reposicion",
    icon: Table2,
    description: "Tabla de valores unitarios de construcción",
    modulo: "configuracion",
  },
  {
    id: "parametros",
    title: "Parámetros de Avalúo",
    href: "/dashboard/parametros",
    icon: SlidersHorizontal,
    description: "Descuentos, alquiler y homologación",
    modulo: "configuracion",
    roles: ["ADMIN"],
  },
  {
    id: "auditoria",
    title: "Auditoría",
    href: "/dashboard/auditoria",
    icon: History,
    description: "Registro de actividad del sistema",
    modulo: "auditoria",
  }
]

export function Sidebar({ isMobileOpen = false, onCloseMobile }: SidebarProps) {
  const pathname = usePathname()
  const { data: session } = useSession()
  const [openMenus, setOpenMenus] = useState<Set<string>>(new Set())

  const userRole = session?.user?.role || "VALUADOR"
  const userPermisos = session?.user?.permisos

  /** Verifica si el usuario tiene acceso a un módulo (permiso read) */
  const tieneAccesoModulo = (modulo: string | null | undefined): boolean => {
    // Items sin módulo asignado (ej. Dashboard) se filtran por rol
    if (!modulo) return true
    // Si hay permisos individuales en sesión, usarlos
    if (userPermisos && userPermisos[modulo]) {
      return userPermisos[modulo].read === true
    }
    // Fallback: si no hay permisos en sesión, permitir (los Server Actions validan igualmente)
    return true
  }

  // Filtrar menú según permisos y rol
  const menuItems = allMenuItems.filter(item => {
    // Si tiene restricción de roles explícita, verificar primero
    if (item.roles && !item.roles.includes(userRole as any)) return false
    // Verificar permiso del módulo
    return tieneAccesoModulo(item.modulo)
  })

  const toggleMenu = (menuId: string) => {
    setOpenMenus(prev => {
      const newSet = new Set(prev)
      if (newSet.has(menuId)) {
        newSet.delete(menuId)
      } else {
        newSet.add(menuId)
      }
      return newSet
    })
  }

  const isMenuActive = (item: any): boolean => {
    if (item.href && pathname === item.href) return true
    if (item.subItems) {
      return item.subItems.some((sub: any) => pathname === sub.href)
    }
    return false
  }

  const isSubItemActive = (href: string): boolean => {
    return pathname === href
  }

  return (
    <>
      {/* Backdrop/Overlay - Solo visible en móvil cuando el sidebar está abierto */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 md:hidden transition-opacity duration-300 ease-in-out"
          onClick={onCloseMobile}
          aria-hidden="true"
        />
      )}

      {/* Sidebar Unificado - Drawer en móvil, estático en desktop */}
      <aside
        className={cn(
          // === Base - Estilo premium compartido ===
          "flex flex-col h-full w-64 bg-card border-r border-slate-800/50 z-10",

          // === Móvil: Drawer/Sheet deslizable ===
          "fixed inset-y-0 left-0 z-50",
          "transition-transform duration-300 ease-in-out",
          isMobileOpen ? "translate-x-0" : "-translate-x-full",

          // === Desktop: siempre visible estático ===
          "md:static md:translate-x-0 md:z-10"
        )}
      >
        {/* === TARJETA DE PERFIL DE USUARIO (ahora en el tope) === */}
        <div className="p-4 pt-5">
          <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-800/40 border border-slate-700/50 backdrop-blur-sm">
            {/* Avatar con gradiente */}
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 flex items-center justify-center shadow-lg shadow-purple-500/20">
              <User className="w-5 h-5 text-white" />
            </div>

            {/* Nombre + Correo */}
            <div className="flex flex-col max-w-[140px]">
              <span className="text-sm font-semibold text-white truncate">
                {session?.user?.name || "Usuario"}
              </span>
              <span className="text-xs text-slate-400 truncate">
                {session?.user?.email || "usuario@example.com"}
              </span>
            </div>
          </div>
        </div>

        {/* Navegación principal - Premium design compartido */}
        <nav className="flex-1 overflow-y-auto py-5 px-3.5 space-y-1.5">
          {menuItems.map((item) => {
            const isActive = isMenuActive(item)
            const hasSubItems = item.subItems && item.subItems.length > 0
            const isMenuOpen = openMenus.has(item.id)
            const Icon = item.icon

            return (
              <div key={item.id}>
                {/* Item principal */}
                {hasSubItems ? (
                  // Item con sub-items - clickable para toggle
                  <div
                    onClick={() => toggleMenu(item.id)}
                    className={cn(
                      "group relative flex items-center gap-3 py-2.5 px-3.5 rounded-lg cursor-pointer",
                      "transition-all duration-200 ease-in-out",
                      !isActive && "md:hover:bg-slate-800/30",
                      isActive && "bg-[#1e293b]"
                    )}
                  >
                    {isActive && (
                      <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-blue-500 rounded-r-full" />
                    )}

                    <div
                      className={cn(
                        "flex-shrink-0 p-1.5 rounded-md",
                        isActive ? "text-blue-400" : "text-slate-400 md:group-hover:text-slate-200",
                        "transition-colors duration-200"
                      )}
                    >
                      <Icon className="w-4.5 h-4.5" />
                    </div>

                    <p
                      className={cn(
                        "flex-1 min-w-0 text-sm font-medium transition-colors duration-200",
                        isActive ? "text-white font-semibold" : "text-slate-400 md:group-hover:text-slate-200"
                      )}
                    >
                      {item.title}
                    </p>

                    {hasSubItems && (
                      <div className="flex-shrink-0">
                        {isMenuOpen ? (
                          <ChevronDown className="w-4 h-4 text-slate-400" />
                        ) : (
                          <ChevronRight className="w-4 h-4 text-slate-400" />
                        )}
                      </div>
                    )}
                  </div>
                ) : (
                  // Item sin sub-items - Link directo
                  <Link
                    href={item.href || "#"}
                    onClick={() => {
                      if (window.innerWidth < 768) {
                        onCloseMobile?.()
                      }
                    }}
                  >
                    <div
                      className={cn(
                        "group relative flex items-center gap-3 py-2.5 px-3.5 rounded-lg cursor-pointer",
                        "transition-all duration-200 ease-in-out",
                        !isActive && "md:hover:bg-slate-800/30",
                        isActive && "bg-[#1e293b]"
                      )}
                    >
                      {isActive && (
                        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-blue-500 rounded-r-full" />
                      )}

                      <div
                        className={cn(
                          "flex-shrink-0 p-1.5 rounded-md",
                          isActive ? "text-blue-400" : "text-slate-400 md:group-hover:text-slate-200",
                          "transition-colors duration-200"
                        )}
                      >
                        <Icon className="w-4.5 h-4.5" />
                      </div>

                      <p
                        className={cn(
                          "flex-1 min-w-0 text-sm font-medium transition-colors duration-200",
                          isActive ? "text-white font-semibold" : "text-slate-400 md:group-hover:text-slate-200"
                        )}
                      >
                        {item.title}
                      </p>
                    </div>
                  </Link>
                )}

                {/* Sub-items */}
                {hasSubItems && isMenuOpen && (
                  <div className="ml-8 mt-1 space-y-1">
                    {item.subItems.map((subItem: any) => {
                      const SubIcon = subItem.icon
                      const isSubActive = isSubItemActive(subItem.href)

                      return (
                        <Link
                          key={subItem.href}
                          href={subItem.href}
                          onClick={() => {
                            if (window.innerWidth < 768) {
                              onCloseMobile?.()
                            }
                          }}
                        >
                          <div
                            className={cn(
                              "group flex items-center gap-2 py-2 px-3 rounded-lg",
                              "transition-all duration-200 ease-in-out",
                              !isSubActive && "md:hover:bg-slate-800/30",
                              isSubActive && "bg-[#1e293b]"
                            )}
                          >
                            {isSubActive && (
                              <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-4 bg-blue-500 rounded-r-full" />
                            )}

                            <div
                              className={cn(
                                "flex-shrink-0 p-1 rounded-md",
                                isSubActive ? "text-blue-400" : "text-slate-500 md:group-hover:text-slate-300",
                                "transition-colors duration-200"
                              )}
                            >
                              <SubIcon className="w-3.5 h-3.5" />
                            </div>

                            <p
                              className={cn(
                                "text-xs font-medium transition-colors duration-200",
                                isSubActive ? "text-white" : "text-slate-500 md:group-hover:text-slate-300"
                              )}
                            >
                              {subItem.title}
                            </p>
                          </div>
                        </Link>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          })}
        </nav>

        {/* Footer - Empujado hacia abajo */}
        <div className="mt-auto pb-6 px-4 border-t border-slate-800/60 space-y-1.5 shrink-0">
          <SignOutButton isCollapsed={false} />
        </div>
      </aside>
    </>
  )
}
