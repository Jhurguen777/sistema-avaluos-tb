import { auth } from "@/shared/auth/nextauth"
import { redirect } from "next/navigation"
import { Card } from "@/components/ui/card"
import { FiltrosInmuebles } from "@/components/home-filtros"
import {
  Building2,
  FileText,
  TrendingUp,
  ArrowRight,
  Home,
  LayoutDashboard,
  Map,
  Search,
  Mail,
  Phone,
  MapPin,
  Globe,
  MessageCircle,
  Check
} from "lucide-react"
import Link from "next/link"
import Image from "next/image"

export default async function HomePage() {
  const session = await auth()

  if (!session) {
    redirect("/login")
  }

  const userRole = session.user.role

  const modules = [
    {
      title: "Inmuebles",
      description: "Gestiona propiedades, visualiza en mapa y administra el catálogo",
      icon: Building2,
      href: "/dashboard/inmuebles",
      color: "from-blue-500 to-cyan-500",
      bgColor: "bg-blue-500/10",
      textColor: "text-blue-500"
    },
    {
      title: "Avalúos",
      description: "Crear avalúos técnicos, gestionar valuaciones y generar reportes",
      icon: FileText,
      href: "/dashboard/avaluos",
      color: "from-purple-500 to-pink-500",
      bgColor: "bg-purple-500/10",
      textColor: "text-purple-500"
    },
    {
      title: "Reportes",
      description: "Estadísticas, análisis y reportes de avalúos generados",
      icon: TrendingUp,
      href: "/dashboard/reportes",
      color: "from-green-500 to-emerald-500",
      bgColor: "bg-green-500/10",
      textColor: "text-green-500"
    }
  ]

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header con navegación */}
      <header className="border-b border-slate-800/50 bg-slate-950/50 backdrop-blur-xl sticky top-0 z-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo y título juntos */}
            <div className="flex items-center gap-3">
              {/* Logo con efectos premium */}
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
            <nav className="flex items-center gap-2 sm:gap-3">
              <Link href="/home">
                <button className="flex items-center gap-2 px-3 sm:px-4 py-2 text-sm font-medium text-white bg-primary/20 hover:bg-primary/30 rounded-lg transition-all duration-200 border border-primary/30">
                  <Home className="w-4 h-4" />
                  <span className="hidden sm:inline">Home</span>
                </button>
              </Link>
              <Link href="/dashboard">
                <button className="flex items-center gap-2 px-3 sm:px-4 py-2 text-sm font-medium text-white bg-secondary/20 hover:bg-secondary/30 rounded-lg transition-all duration-200 border border-secondary/30">
                  <LayoutDashboard className="w-4 h-4" />
                  <span className="hidden sm:inline">Panel Admin</span>
                </button>
              </Link>
            </nav>
          </div>
        </div>
      </header>

      {/* Hero Section Horizontal Premium */}
      <section className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* Contenedor Principal del Hero */}
        <div className="relative w-full min-h-[500px] bg-slate-950 rounded-3xl overflow-hidden p-8 md:p-16 border border-slate-800 shadow-[0_0_80px_rgba(59,130,246,0.15)] flex flex-col md:flex-row items-center gap-12">

          {/* Imagen de Fondo Unificada */}
          <div className="absolute inset-0 z-0">
            {/* Máscara de desvanecimiento muy profunda de izquierda a derecha */}
            <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/70 to-transparent z-10 pointer-events-none" />

            {/* Imagen de la ciudad extendida */}
            <Image
              src="/fondo-pro.png"
              alt="Ciudad y Montaña - GeoPricer Avalúos"
              fill
              className="w-full h-full object-cover object-right opacity-80"
              priority
              quality={100}
            />
          </div>

          {/* Bloque de Texto (Lado Izquierdo) */}
          <div className="relative z-10 w-full md:w-1/2">
            <div className="space-y-6">
              {/* Título Principal */}
              <h1 className="text-3xl md:text-5xl font-extrabold text-white tracking-tight leading-tight">
                Comienza a avaluar{" "}
                <span className="text-amber-400 block mt-1">de forma eficaz</span>
              </h1>

              {/* Subtexto */}
              <p className="text-slate-400 text-base md:text-lg max-w-md leading-relaxed">
                Sistema profesional de avalúos inmobiliarios para Bolivia.
                Valora propiedades con precisión técnica y genera reportes profesionales en minutos.
              </p>

              {/* Información del usuario */}
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-2 px-4 py-2 bg-slate-800/50 rounded-lg border border-slate-700 text-sm">
                  <span className="text-slate-400">Rol:</span>
                  <span className="font-semibold text-amber-400">{userRole}</span>
                </div>
                <div className="flex items-center gap-2 px-4 py-2 bg-slate-800/50 rounded-lg border border-slate-700 text-sm">
                  <span className="text-slate-400">Usuario:</span>
                  <span className="font-semibold text-white">{session.user.name}</span>
                </div>
              </div>


              {/* Grid de Iconos - Información */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-8 pt-8 border-t border-slate-800 text-slate-400 text-sm">
                <div className="flex items-center gap-2">
                  <Home className="w-5 h-5 text-amber-400 shrink-0" />
                  <span>+10,000 Propiedades</span>
                </div>
                <div className="flex items-center gap-2">
                  <Search className="w-5 h-5 text-amber-400 shrink-0" />
                  <span>+20 Agencias</span>
                </div>
                <div className="flex items-center gap-2">
                  <Map className="w-5 h-5 text-amber-400 shrink-0" />
                  <span>24/7 Disponible</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-5 h-5 text-amber-400 shrink-0" />
                  <span>Gratis Sin costo</span>
                </div>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* Sección de Filtros */}
      <section className="container mx-auto px-4 sm:px-6 lg:px-8 -mt-4">
        <FiltrosInmuebles />
      </section>



      {/* Spacer para empujar el footer con más espacio */}
      <div className="h-16 mt-8" />

      {/* Footer Compacto */}
      <footer className="bg-slate-950 border-t border-slate-800/50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
            {/* Columna 1: Logo y Descripción */}
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div
                    className="relative flex items-center justify-center"
                    style={{
                      filter: 'drop-shadow(0 0 8px rgba(147,51,234,0.4))'
                    }}
                  >
                    <Image
                      src="/recurso2analityc2.png"
                      alt="Alfa Analitycs"
                      width={32}
                      height={32}
                      className="relative w-8 h-8 object-contain"
                    />
                  </div>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Alfa Analitycs</h3>
                  <p className="text-xs text-slate-400">Avalúos Pro</p>
                </div>
              </div>
              <p className="text-sm text-slate-400 leading-relaxed max-w-md">
                Sistema profesional de avalúos inmobiliarios para Bolivia. Tecnología de punta para valoraciones precisas.
              </p>
            </div>

            {/* Columna 2: Contacto horizontal */}
            <div className="space-y-4">
              <h4 className="text-sm font-bold text-white uppercase tracking-wider">Contacto</h4>
              <div className="flex flex-wrap items-start gap-x-6 gap-y-4">
                {/* Email */}
                <div className="flex items-start gap-2.5">
                  <Mail className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                  <div>
                    <p className="text-[11px] text-slate-400">Email</p>
                    <p className="text-sm text-white">contacto@alfanalitycs.bo</p>
                  </div>
                </div>
                {/* Teléfono */}
                <div className="flex items-start gap-2.5">
                  <Phone className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                  <div>
                    <p className="text-[11px] text-slate-400">Teléfono</p>
                    <p className="text-sm text-white">+591 77490451</p>
                  </div>
                </div>
                {/* Ubicación */}
                <div className="flex items-start gap-2.5">
                  <MapPin className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                  <div>
                    <p className="text-[11px] text-slate-400">Ubicación</p>
                    <p className="text-sm text-white">Cochabamba-Bolivia</p>
                  </div>
                </div>

                {/* Iconos de página web / chat — al final de la fila */}
                <div className="flex items-center gap-2 lg:ml-auto self-center">
                  <a href="#" className="p-2 rounded-lg bg-slate-800/50 text-slate-400 hover:text-white hover:bg-slate-700 transition-all" title="Sitio Web">
                    <Globe className="w-5 h-5" />
                  </a>
                  <a href="#" className="p-2 rounded-lg bg-slate-800/50 text-slate-400 hover:text-white hover:bg-slate-700 transition-all" title="Chat">
                    <MessageCircle className="w-5 h-5" />
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* Barra separadora */}
          <div className="mt-8 pt-6 border-t border-slate-800">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <p className="text-sm text-slate-500">
                © 2026 ACM Analytics 365Soft. Todos los derechos reservados.
              </p>
              <p className="text-sm text-slate-500">
                Hecho por 365soft — Bolivia
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
