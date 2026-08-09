import { Loader2 } from "lucide-react"

export default function Loading() {
  return (
    <div className="p-8 flex items-center justify-center min-h-[400px]">
      <div className="text-center">
        <Loader2 className="animate-spin h-10 w-10 text-primary mx-auto mb-4" />
        <p className="text-muted-foreground">Cargando...</p>
      </div>
    </div>
  )
}
