"use client"

import { useEffect } from "react"
import { Button } from "@/components/ui/button"
import { AlertTriangle } from "lucide-react"

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error("Error en la aplicación:", error)
  }, [error])

  return (
    <div className="p-8 flex items-center justify-center min-h-[60vh]">
      <div className="text-center max-w-md space-y-4">
        <div className="p-4 rounded-full bg-red-500/10 text-red-500 w-fit mx-auto">
          <AlertTriangle className="w-10 h-10" />
        </div>
        <h2 className="text-2xl font-bold text-white">Algo salió mal</h2>
        <p className="text-muted-foreground">
          Ocurrió un error inesperado. Puedes intentar nuevamente.
        </p>
        <Button onClick={reset} className="bg-primary hover:bg-primary/90">
          Intentar de nuevo
        </Button>
      </div>
    </div>
  )
}
