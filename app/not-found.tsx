import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Home } from "lucide-react"

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center p-8">
      <div className="text-center max-w-md space-y-4">
        <p className="text-7xl sm:text-8xl font-bold bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
          404
        </p>
        <h2 className="text-2xl font-bold text-white">Página no encontrada</h2>
        <p className="text-muted-foreground">
          La página que buscas no existe o fue movida.
        </p>
        <Link href="/dashboard">
          <Button className="bg-primary hover:bg-primary/90">
            <Home className="w-4 h-4 mr-2" />
            Ir al Dashboard
          </Button>
        </Link>
      </div>
    </div>
  )
}
