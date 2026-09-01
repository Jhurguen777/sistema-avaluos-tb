"use client"

import { useState } from "react"
import { signIn } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { PasswordInput } from "@/components/ui/password-input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Building2, Mail, Lock, AlertCircle } from "lucide-react"

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsLoading(true)

    try {
      const result = await signIn("credentials", {
        email,
        password,
        callbackUrl: "/home",
        redirect: false, // Cambiamos a false para manejar errores manualmente
      })

      if ((result as any)?.error) {
        // Verificar si el error es por usuario inactivo
        if ((result as any)?.error === "USER_INACTIVE") {
          setError("Sus credenciales están desactivadas. Contáctese con un administrador.")
        } else {
          setError("Credenciales inválidas. Por favor, verifica tus datos.")
        }
        setIsLoading(false)
      } else if ((result as any)?.ok) {
        // Login exitoso, redirigir manualmente
        router.push("/home")
        router.refresh()
      } else {
        // Otro caso
        setIsLoading(false)
      }
      // Si no hay error, la redirección se maneja automáticamente
    } catch (error: any) {
      console.error("Error en login:", error)
      setError("Error al iniciar sesión. Inténtalo nuevamente.")
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden p-4">
      {/* Fondo con gradientes animados */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-secondary/20 to-accent/20 animate-pulse" />
      <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-20" />
      <div className="absolute top-0 left-1/2 w-full h-full bg-gradient-to-b from-transparent to-background" />

      {/* Partículas decorativas */}
      <div className="absolute top-20 left-20 w-72 h-72 bg-primary/30 rounded-full filter blur-[100px] animate-pulse" />
      <div className="absolute bottom-20 right-20 w-96 h-96 bg-secondary/30 rounded-full filter blur-[100px] animate-pulse" style={{ animationDelay: '1s' }} />
      <div className="absolute top-1/2 left-1/2 w-80 h-80 bg-accent/20 rounded-full filter blur-[100px] animate-pulse" style={{ animationDelay: '2s' }} />

      {/* Contenido principal - Layout horizontal */}
      <div className="relative z-10 w-full max-w-6xl animate-fadeIn">
        <div className="flex flex-col lg:flex-row items-center justify-center gap-8 lg:gap-16">
          {/* Logo con efectos solo en las letras */}
          <div className="w-full lg:w-1/2 flex justify-center lg:justify-end">
            <div className="flex flex-col items-center justify-center space-y-6">
              <div className="relative">
                <img
                  src="/recurso2analityc2.png"
                  alt="Recurso 2Analytics Logo"
                  className="w-full max-w-md h-auto object-contain"
                  style={{
                    filter: `
                      drop-shadow(0 0 10px rgba(59, 130, 246, 0.5))
                      drop-shadow(0 0 20px rgba(147, 51, 234, 0.3))
                      drop-shadow(0 0 30px rgba(236, 72, 153, 0.2))
                      drop-shadow(0 4px 8px rgba(0, 0, 0, 0.3))
                    `,
                    transition: 'filter 0.3s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.filter = `
                      drop-shadow(0 0 15px rgba(59, 130, 246, 0.7))
                      drop-shadow(0 0 30px rgba(147, 51, 234, 0.5))
                      drop-shadow(0 0 45px rgba(236, 72, 153, 0.3))
                      drop-shadow(0 6px 12px rgba(0, 0, 0, 0.4))
                    `
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.filter = `
                      drop-shadow(0 0 10px rgba(59, 130, 246, 0.5))
                      drop-shadow(0 0 20px rgba(147, 51, 234, 0.3))
                      drop-shadow(0 0 30px rgba(236, 72, 153, 0.2))
                      drop-shadow(0 4px 8px rgba(0, 0, 0, 0.3))
                    `
                  }}
                />
              </div>
              <div className="text-center">
                <h1 className="text-3xl font-bold bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
                </h1>
                <p className="text-base mt-10 text-muted-foreground">
                  Acceso al Sistema Público
                </p>
              </div>
            </div>
          </div>

          {/* Card de Login */}
          <div className="w-full lg:w-1/2 flex justify-center lg:justify-start">
            <Card className="border-2 border-primary/20 bg-card/95 backdrop-blur-xl shadow-2xl glow-effect w-full max-w-md">
              <CardHeader className="space-y-4 text-center pb-8">
                <div className="mx-auto w-20 h-20 bg-gradient-to-br from-primary to-secondary rounded-2xl flex items-center justify-center shadow-lg">
                  <Building2 className="w-10 h-10 text-white" />
                </div>
                <div>
                  <CardTitle className="text-3xl font-bold bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
                    Iniciar Sesión
                  </CardTitle>
                  <CardDescription className="text-base mt-2 text-muted-foreground">
                    Ingresa tus credenciales para continuar
                  </CardDescription>
                </div>
              </CardHeader>

              <form onSubmit={handleSubmit}>
                <CardContent className="space-y-6">
                  {error && (
                    <div className="bg-destructive/15 border border-destructive/50 text-destructive flex items-center gap-3 p-4 rounded-xl animate-fadeIn">
                      <AlertCircle className="w-5 h-5 flex-shrink-0" />
                      <span className="text-sm">{error}</span>
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-sm font-medium flex items-center gap-2">
                      <Mail className="w-4 h-4" />
                      Correo Electrónico
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder=""
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="h-12 bg-muted/50 border-2 focus:border-primary transition-all duration-200"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-sm font-medium flex items-center gap-2">
                      <Lock className="w-4 h-4" />
                      Contraseña
                    </Label>
                    <PasswordInput
                      id="password"
                      placeholder=""
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="h-12 bg-muted/50 border-2 focus:border-primary transition-all duration-200"
                    />
                  </div>
                </CardContent>

                <CardFooter className="pt-6">
                  <Button
                    type="submit"
                    className="w-full h-12 text-base font-semibold bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 shadow-lg hover:shadow-xl transition-all duration-300"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <span className="flex items-center gap-2">
                        <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        Iniciando sesión...
                      </span>
                    ) : (
                      <span className="flex items-center gap-2">
                        <Lock className="w-4 h-4" />
                        Iniciar Sesión
                      </span>
                    )}
                  </Button>
                </CardFooter>
              </form>

              <div className="text-center pb-6">
                <p className="text-xs text-muted-foreground">
                  Sistema protegido con encriptación de extremo a extremo
                </p>
              </div>
            </Card>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-6 space-y-2">
          <p className="text-sm text-muted-foreground/80">
            sistema{" "}
            <span className="font-semibold text-primary">rapido</span>
            {" "}+{" "}
            <span className="font-semibold text-secondary">eficaz</span>
            {" "}+{" "}
            <span className="font-semibold text-accent">seguro</span>
          </p>
          <p className="text-xs text-muted-foreground/60">
            ACM 365Soft © 2026   Sistema público de propiedades
          </p>
        </div>
      </div>
    </div>
  )
}
