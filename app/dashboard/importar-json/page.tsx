import { redirect } from "next/navigation"

/** Ruta legacy: el importador de JSON ahora vive en /dashboard/datos/importar. */
export default function ImportarJsonPage() {
  redirect("/dashboard/datos/importar")
}
