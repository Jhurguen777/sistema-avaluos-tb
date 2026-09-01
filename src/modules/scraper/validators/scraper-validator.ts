/**
 * Validadores del módulo Scraper (Zod)
 */

import { z } from "zod"

/** Item de la petición de scraping (etiqueta + URL) */
const peticionItemSchema = z.object({
  etiqueta: z.string().trim().min(1).max(120),
  url: z.string().trim().url("La URL no es válida"),
})

/** Esquema para iniciar un scraping (individual o lote) */
export const iniciarScrapingSchema = z
  .object({
    items: z.array(peticionItemSchema).min(1, "Selecciona al menos una URL").max(30, "Máximo 30 URLs por lote"),
  })
  .refine(
    (data) =>
      data.items.every((item) => {
        if (item.url.includes("c21.com.bo") || item.url.includes("remax.bo")) return true
        return false
      }),
    {
      message: "Las URLs deben ser de c21.com.bo o remax.bo",
      path: ["items"],
    },
  )

export type IniciarScrapingInput = z.infer<typeof iniciarScrapingSchema>
