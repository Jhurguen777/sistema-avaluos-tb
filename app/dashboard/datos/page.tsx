import { redirect } from "next/navigation"

/** El índice del módulo de datos redirige al submódulo Scraper. */
export default function DatosPage() {
  redirect("/dashboard/datos/scraper")
}
