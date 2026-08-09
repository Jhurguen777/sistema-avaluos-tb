import { auth } from "@/shared/auth/nextauth"
import { redirect } from "next/navigation"
import { prisma } from "@/shared/database/prisma"
import { toNum } from "@/shared/database/decimal"
import { auditService } from "@/shared/security/audit-service"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Building2,
  FileText,
  Users,
  DollarSign,
  CheckCircle2,
  History,
} from "lucide-react"

export default async function DashboardPage() {
  const session = await auth()

  if (!session) {
    redirect("/login")
  }

  // Estadísticas reales desde la BD
  const [totalInmuebles, avaluosActivos, valorTotalAgg, usuariosActivos, avaluosRecientes] =
    await Promise.all([
      prisma.product.count(),
      prisma.avaluo.count({ where: { estado: { in: ["BORRADOR", "EN_REVISION"] } } }),
      prisma.resultadoAvaluo.aggregate({ _sum: { valorComercial: true } }),
      prisma.user.count({ where: { isActive: true } }),
      prisma.avaluo.findMany({
        take: 5,
        orderBy: { createdAt: "desc" },
        include: {
          product: { select: { nombre: true, codigoInmueble: true } },
          resultados: { select: { valorComercial: true } },
        },
      }),
    ])

  const valorTotal = toNum(valorTotalAgg._sum.valorComercial) ?? 0

  // Actividad reciente (solo ADMIN)
  const isAdmin = session.user.role === "ADMIN"
  let actividadReciente: Awaited<ReturnType<typeof auditService.getLogs>>["logs"] = []
  if (isAdmin) {
    const auditResult = await auditService.getLogs({ take: 10 })
    actividadReciente = auditResult.logs
  }

  const stats = [
    {
      title: "Total Inmuebles",
      value: totalInmuebles.toLocaleString("es-BO"),
      icon: Building2,
      color: "from-blue-500 to-cyan-500",
      bgColor: "bg-blue-500/10",
      iconColor: "text-blue-500",
    },
    {
      title: "Avalúos Activos",
      value: avaluosActivos.toLocaleString("es-BO"),
      icon: FileText,
      color: "from-purple-500 to-pink-500",
      bgColor: "bg-purple-500/10",
      iconColor: "text-purple-500",
    },
    {
      title: "Valor Total Avalúos",
      value: `$${valorTotal.toLocaleString("es-BO", { maximumFractionDigits: 0 })}`,
      icon: DollarSign,
      color: "from-green-500 to-emerald-500",
      bgColor: "bg-green-500/10",
      iconColor: "text-green-500",
    },
    {
      title: "Usuarios Activos",
      value: usuariosActivos.toLocaleString("es-BO"),
      icon: Users,
      color: "from-orange-500 to-amber-500",
      bgColor: "bg-orange-500/10",
      iconColor: "text-orange-500",
    },
  ]

  return (
    <div className="p-4 sm:p-8 pb-16 space-y-8 animate-fadeIn">
      {/* Header */}
      <div className="space-y-2">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
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

      {/* Layout principal: stats verticales (320px) + listas */}
      <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-6 lg:gap-8 items-start">
        {/* Columna izquierda: Stats verticales compactos */}
        <div className="space-y-3 sm:space-y-4">
          {stats.map((stat, index) => {
            const Icon = stat.icon
            return (
              <Card
                key={index}
                className="relative overflow-hidden border-2 border-border/50 hover:border-primary/50 transition-all duration-300 group"
              >
                <div className={`absolute top-0 right-0 w-24 h-24 bg-gradient-to-br ${stat.color} opacity-10 rounded-full filter blur-2xl group-hover:opacity-20 transition-opacity`} />
                <CardContent className="relative p-4 flex items-center gap-4">
                  <div className={`p-2.5 rounded-xl ${stat.bgColor} ${stat.iconColor} shrink-0`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xl sm:text-2xl font-bold leading-tight truncate">{stat.value}</p>
                    <p className="text-xs text-muted-foreground">{stat.title}</p>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {/* Columna derecha: Listas */}
        <div className="space-y-6 lg:space-y-8">
          {/* Avalúos Recientes */}
          <div className="space-y-4">
            <h2 className="text-xl sm:text-2xl font-bold">Avalúos Recientes</h2>
            <Card className="border-2 border-border/50">
              <CardHeader>
                <CardTitle>Últimos Avalúos Registrados</CardTitle>
                <CardDescription>Los avalúos creados más recientemente</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {avaluosRecientes.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <p>No hay avalúos registrados todavía</p>
                    </div>
                  ) : (
                    avaluosRecientes.map((a) => (
                      <div
                        key={a.id}
                        className="flex items-center gap-4 p-4 rounded-xl bg-muted/30 border border-border/50 hover:border-primary/50 transition-all duration-300"
                      >
                        <div className="p-2 rounded-lg bg-green-500/10 text-green-500">
                          <CheckCircle2 className="w-5 h-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">
                            {a.codigo} — {a.product?.nombre ?? "Inmueble"}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {new Date(a.createdAt).toLocaleDateString("es-BO")}
                          </p>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="font-semibold text-green-500">
                            ${toNum(a.resultados?.valorComercial)?.toLocaleString("es-BO", { maximumFractionDigits: 0 }) ?? "—"}
                          </p>
                          <p className="text-xs text-muted-foreground">{a.estado.replace("_", " ")}</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Actividad reciente del sistema (solo ADMIN) */}
          {isAdmin && (
            <div className="space-y-4">
              <h2 className="text-xl sm:text-2xl font-bold">Actividad Reciente</h2>
              <Card className="border-2 border-border/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <History className="w-5 h-5 text-primary" />
                    Última Actividad de Usuarios
                  </CardTitle>
                  <CardDescription>
                    Registro de las acciones más recientes en el sistema
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {actividadReciente.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        <p>No hay actividad registrada todavía</p>
                      </div>
                    ) : (
                      actividadReciente.map((log) => {
                        const usuario = log.user?.name ?? "Sistema"
                        const nv = log.newValue as Record<string, unknown> | null
                        const detalle = nv && typeof nv === "object"
                          ? String(nv.codigo ?? nv.email ?? "")
                          : ""
                        return (
                          <div
                            key={log.id}
                            className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 p-3 sm:p-4 rounded-xl bg-muted/30 border border-border/50 hover:border-primary/50 transition-all duration-300"
                          >
                            <div className="p-2 rounded-lg bg-primary/10 text-primary shrink-0">
                              <History className="w-4 h-4" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">
                                {usuario} —{" "}
                                <span className="text-muted-foreground font-normal">
                                  {log.action.replace(/_/g, " ").toLowerCase()}
                                </span>
                                {detalle ? ` · ${detalle}` : ""}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {new Date(log.createdAt).toLocaleString("es-BO", {
                                  day: "2-digit",
                                  month: "2-digit",
                                  year: "numeric",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </p>
                            </div>
                          </div>
                        )
                      })
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
