import { auth } from "@/shared/auth/nextauth"
import { redirect } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { QuickActions } from "@/components/quick-actions"
import {
  Building2,
  FileText,
  Users,
  TrendingUp,
  DollarSign,
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  CheckCircle2
} from "lucide-react"

export default async function DashboardPage() {
  const session = await auth()

  if (!session) {
    redirect("/login")
  }

  // Datos de ejemplo (reemplazar con datos reales de la BD)
  const stats = [
    {
      title: "Total Inmuebles",
      value: "0",
      change: "+0%",
      trend: "up",
      icon: Building2,
      color: "from-blue-500 to-cyan-500",
      bgColor: "bg-blue-500/10",
      iconColor: "text-blue-500"
    },
    {
      title: "Avalúos Activos",
      value: "0",
      change: "+0%",
      trend: "up",
      icon: FileText,
      color: "from-purple-500 to-pink-500",
      bgColor: "bg-purple-500/10",
      iconColor: "text-purple-500"
    },
    {
      title: "Valor Total",
      value: "$0",
      change: "+0%",
      trend: "up",
      icon: DollarSign,
      color: "from-green-500 to-emerald-500",
      bgColor: "bg-green-500/10",
      iconColor: "text-green-500"
    },
    {
      title: "Usuarios Activos",
      value: "1",
      change: "+100%",
      trend: "up",
      icon: Users,
      color: "from-orange-500 to-amber-500",
      bgColor: "bg-orange-500/10",
      iconColor: "text-orange-500"
    },
  ]

  const recentActivity = [
    { id: 1, action: "Sistema inicializado", time: "Hace un momento", type: "success" },
  ]

  const quickActions = [
    {
      title: "Nuevo Inmueble",
      description: "Registra una nueva propiedad en el sistema",
      iconName: "Building2",
      href: "/dashboard/inmuebles/nuevo",
      color: "from-blue-500 to-cyan-500"
    },
    {
      title: "Crear Avalúo",
      description: "Inicia un nuevo avalúo técnico",
      iconName: "FileText",
      href: "/dashboard/avaluos/nuevo",
      color: "from-purple-500 to-pink-500"
    },
    {
      title: "Gestionar Usuarios",
      description: "Administra permisos y roles",
      iconName: "Users",
      href: "/dashboard/usuarios",
      color: "from-orange-500 to-amber-500"
    },
  ]

  return (
    <div className="p-8 pb-16 space-y-8 animate-fadeIn">
      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
              Dashboard
            </h1>
            <p className="text-muted-foreground mt-1">
              Bienvenido de vuelta, {session.user.name}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="px-4 py-2 bg-gradient-to-r from-primary/20 to-secondary/20 rounded-xl border-2 border-primary/30">
              <p className="text-sm font-medium">Rol: {session.user.role}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => {
          const Icon = stat.icon
          return (
            <Card
              key={index}
              className="relative overflow-hidden border-2 border-border/50 hover:border-primary/50 transition-all duration-300 group hover:shadow-2xl hover:shadow-primary/20"
            >
              <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${stat.color} opacity-10 rounded-full filter blur-3xl group-hover:opacity-20 transition-opacity`} />
              <CardHeader className="relative pb-3">
                <div className="flex items-center justify-between">
                  <div className={`p-3 rounded-xl ${stat.bgColor} ${stat.iconColor}`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <div className={`flex items-center gap-1 text-sm ${
                    stat.trend === "up" ? "text-green-500" : "text-red-500"
                  }`}>
                    {stat.trend === "up" ? (
                      <ArrowUpRight className="w-4 h-4" />
                    ) : (
                      <ArrowDownRight className="w-4 h-4" />
                    )}
                    <span className="font-semibold">{stat.change}</span>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="relative">
                <div className="space-y-1">
                  <p className="text-3xl font-bold">{stat.value}</p>
                  <p className="text-sm text-muted-foreground">{stat.title}</p>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Quick Actions */}
      <div className="space-y-4">
        <h2 className="text-2xl font-bold">Acciones Rápidas</h2>
        <QuickActions actions={quickActions} />
      </div>

      {/* Recent Activity */}
      <div className="space-y-4">
        <h2 className="text-2xl font-bold">Actividad Reciente</h2>
        <Card className="border-2 border-border/50">
          <CardHeader>
            <CardTitle>Historial de Acciones</CardTitle>
            <CardDescription>Últimas actividades en el sistema</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivity.map((activity) => (
                <div
                  key={activity.id}
                  className="flex items-start gap-4 p-4 rounded-xl bg-muted/30 border border-border/50 hover:border-primary/50 transition-all duration-300 group hover:bg-muted/50"
                >
                  <div className="p-2 rounded-lg bg-green-500/10 text-green-500 group-hover:scale-110 transition-transform">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">{activity.action}</p>
                    <p className="text-sm text-muted-foreground">{activity.time}</p>
                  </div>
                </div>
              ))}
              {recentActivity.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <p>No hay actividad reciente</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Welcome Message */}
      <Card className="bg-gradient-to-r from-primary/20 via-secondary/20 to-accent/20 border-2 border-primary/30">
        <CardHeader>
          <CardTitle className="text-2xl">🎉 ¡Bienvenido a GeoPricer Avalúos Pro!</CardTitle>
          <CardDescription className="text-base">
            Sistema profesional de avalúos inmobiliarios para Bolivia
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Comienza registrando inmuebles, creando avalúos técnicos, y gestionando usuarios.
            El sistema está listo para ayudarte a valorar propiedades de manera profesional.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
