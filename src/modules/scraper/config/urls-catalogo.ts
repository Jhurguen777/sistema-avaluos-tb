/**
 * Catálogo de URLs reales para el scraper
 * 5 categorías (Casa, Departamento, Terreno, Local Comercial, Oficina)
 * por fuente (C21 y RE/MAX). URLs extraídas de las webs oficiales —
 * NO modificar los slugs ni coordenadas sin verificar en el sitio.
 */

import type { ScraperFuente } from "../types/scraper.types"

/** Categorías del sistema con representación en las inmobiliarias */
export type CategoriaCatalogo = "CASA" | "DEPARTAMENTO" | "TERRENO" | "LOCAL_COMERCIAL" | "OFICINA"

/** Etiquetas legibles para la UI */
export const CATEGORIA_CATALOGO_LABELS: Record<CategoriaCatalogo, string> = {
  CASA: "Casa",
  DEPARTAMENTO: "Departamento",
  TERRENO: "Terreno",
  LOCAL_COMERCIAL: "Local Comercial",
  OFICINA: "Oficina",
}

/** Una URL del catálogo con su descripción */
export interface UrlCatalogo {
  /** Identificador estable (ej. "C21-CASA", "REMAX-CASA") */
  id: string
  fuente: ScraperFuente
  categoria: CategoriaCatalogo
  /** Etiqueta completa para logs/UI (ej. "C21 · Casas en venta") */
  etiqueta: string
  /** Descripción corta para la UI (ej. "Venta · toda Bolivia en el mapa") */
  descripcion: string
  url: string
}

// ---------------------------------------------------------------------------
// C21 — URLs reales (venta, con coordenadas específicas por categoría)
// ---------------------------------------------------------------------------

const CATALOGO_C21: UrlCatalogo[] = [
  {
    id: "C21-CASA",
    fuente: "C21",
    categoria: "CASA",
    etiqueta: "C21 · Casas en venta",
    descripcion: "Venta · casa / casa en condominio",
    url: "https://c21.com.bo/v/resultados/tipo_casa-o-casa-en-condominio/operacion_venta/layout_mapa/coordenadas_-14.541049898060388,-62.083740234375,-21.79010705980786,-69.049072265625,7",
  },
  {
    id: "C21-DEPARTAMENTO",
    fuente: "C21",
    categoria: "DEPARTAMENTO",
    etiqueta: "C21 · Departamentos en venta",
    descripcion: "Venta · departamento / penthouse",
    url: "https://c21.com.bo/v/resultados/tipo_departamento-o-penthouse/operacion_venta/layout_mapa/coordenadas_-15.390135715305204,-62.127685546875,-22.603868842895686,-69.093017578125,7",
  },
  {
    id: "C21-TERRENO",
    fuente: "C21",
    categoria: "TERRENO",
    etiqueta: "C21 · Terrenos en venta",
    descripcion: "Venta · terreno / quinta / rural / rancho",
    url: "https://c21.com.bo/v/resultados/tipo_terreno-o-quinta-o-rural-o-rancho/operacion_venta/layout_mapa/coordenadas_-14.551684056143447,-62.127685546875,-21.80030805097259,-69.093017578125,7",
  },
  {
    id: "C21-LOCAL_COMERCIAL",
    fuente: "C21",
    categoria: "LOCAL_COMERCIAL",
    etiqueta: "C21 · Locales comerciales en venta",
    descripcion: "Venta · local comercial",
    url: "https://c21.com.bo/v/resultados/tipo_local/operacion_venta/layout_mapa/coordenadas_-14.541049898060388,-62.149658203125,-21.79010705980786,-69.114990234375,7",
  },
  {
    id: "C21-OFICINA",
    fuente: "C21",
    categoria: "OFICINA",
    etiqueta: "C21 · Oficinas en venta",
    descripcion: "Venta · oficinas",
    url: "https://c21.com.bo/v/resultados/tipo_oficinas/operacion_venta/layout_mapa/coordenadas_-13.464421817388473,-62.1826171875,-20.756113874762068,-69.14794921875,7",
  },
]

// ---------------------------------------------------------------------------
// RE/MAX — URLs reales (venta). Las dos partes del slug (ciudades y zonas)
// son idénticas en las 5 categorías, se definen una sola vez.
// ---------------------------------------------------------------------------

/** Slug de ubicaciones (ciudades) compartido por todas las URLs de RE/MAX */
const REMAX_UBICACIONES =
  "santa-cruz-de-la-sierra-o-cotoca-o-el-torno-o-la-guardia-o-porongo-o-uyuni-o-aiquile-o-capinota-o-caranavi-o-trinidad-o-cochabamba-o-oruro-o-soracachi-o-tarija-o-sacaba-o-pailon-o-robore-o-san-jose-de-chiquitos-o-cabezas-o-camiri-o-charagua-o-anzaldo-o-arbieto-o-cabot-o-tarata-o-samaipata-o-puerto-suarez-o-cliza-o-tolata-o-villamontes-o-ascension-de-guarayos-o-monteagudo-o-buena-vista-o-san-carlos-o-viacha-o-san-ignacio-de-velasco-o-san-miguel-de-velasco-o-guanay-o-laja-o-pucarani-o-copacabana-o-vista-o-el-puente-o-san-lorenzo-o-san-ignacio-o-la-paz-o-achocalla-o-el-alto-o-huajchilla-o-mecapaca-o-palca-o-coroico-o-concepcion-o-san-ramon-o-san-xavier-o-minero-o-montero-o-sucre-o-yotala-o-punata-o-san-benito-o-apote-o-cochabamba-o-colcapirhua-o-mallco-rancho-o-pairumani-o-quillacollo-o-sipe-sipe-o-suticollo-o-tiquipaya-o-viloma-cala-cala-o-vinto-o-colpa-belgica-o-portachuelo-o-santa-rosa-del-sara-o-chulumani-o-potosi-o-guayaramerin-o-vallegrande-o-okinawa-i-o-Satelite-Norte-o-warnes-o-yamparaez"

/** Slug de zonas/barrios compartido por todas las URLs de RE/MAX */
const REMAX_ZONAS =
  "alalay-o-aranjuez-o-cala-cala-o-centro-o-colcapirhua-o-cona-cona-o-condebamba-o-este-o-hipodromo-o-jayhuayco-o-la-chimba-o-mayorazgo-o-muyurina-o-noreste-o-noroeste-o-norte-o-oeste-o-queru-queru-o-queru-queru-alto-o-quillacollo-o-sacaba-o-san-pedro-o-sarco-o-sur-o-sureste-o-suroeste-o-temporal-o-tiquipaya-o-tupuraya-o-villa-busch-o-villa-tunari-chapare-o-achachicala-o-achumani-o-alto-irpavi-o-alto-obrajes-o-aranjuez-o-auquisamana-o-bella-vista-o-calacoto-o-centro-o-chasquipampa-o-chuquiaguillo-o-cota-cota-o-el-pedregal-o-el-tejar-o-este-o-irpavi-o-llojeta-o-los-pinos-o-mallasa-o-mallasilla-o-miraflores-o-noreste-o-noroeste-o-norte-o-obrajes-o-oeste-o-ovejuyo-o-pampahasi-o-pura-pura-o-rio-abajo-o-san-jorge-o-san-miguel-o-san-pedro-o-seguencoma-o-sopocachi-o-sur-o-suroeste-o-tembladerani-o-umamanta-o-villa-copacabana-o-villa-el-carmen-o-villa-fatima-o-villa-san-antonio-o-centro-o-este-o-noreste-o-noroeste-o-norte-o-oeste-o-sur-o-sureste-o-suroeste-o-centro-o-este-o-noreste-o-oeste-o-alemana-o-av-santos-dumont-o-av-2-de-agosto-o-av-canal-cotoca-o-av-virgen-de-cotoca-o-av-virgen-de-lujan-o-banzer-1er-a-3er-anillo-o-banzer-3er-al-5to-anillo-o-banzer-5to-a-7mo-anillo-o-banzer-7mo-a-9no-anillo-o-banzer-km9-y-km10-o-beni-o-cambodromo-o-centro-casco-viejo-o-distrito-12-o-doble-via-la-guardia-o-el-palmar-o-el-quior-o-el-remanso-o-entre-1er-y-2do-anillo-o-equipetrolnoroeste-o-este-o-hamacas-o-la-colorada-o-la-cuchilla-o-las-palmas-o-los-pozos-o-mutualista-o-noreste-o-noroeste-o-norte-o-oeste-o-ovidio-barbery-o-pampa-de-la-isla-o-parque-urbano-o-parque-urbano-guaracal-o-pirai-o-plan-3000-o-plan-4000-o-radial-26-o-roca-y-coronado-o-santos-dumont-o-sirari-o-sur-o-sureste-o-suroeste-o-trompillo-o-urbari-o-urubo-o-villa-1ro-de-mayo-o-warnes-o-centro-o-este-o-noreste-o-noroeste-o-norte-o-oeste-o-sur-o-sureste-o-suroeste-o-centro-o-este-o-noreste-o-noroeste-o-oeste-o-sur-o-sureste-o-suroeste-o-achocalla-o-sur-o-aiquile-o-anzaldo-o-avenida-cochabamba-o-arbieto-o-ascension-de-guarayos-o-buena-vista-o-cabezas-o-copa-pugio-nuevo-o-camiri-o-capinota-o-caranavi-o-charagua-o-chulumani-o-cliza-o-cochabamba-o-colcapirhua-o-colpa-belgica-o-concepcion-o-copacabana-o-coroico-o-cotoca-o-sureste-o-16-de-julio-o-1ro-de-mayo-o-3-de-mayo-o-alto-de-alianza-o-alto-lima-o-anexo-huayna-potosi-o-ballivian-o-barrio-santa-rosa-o-caluyo-o-central-villa-dolores-o-ciudad-satelite-o-cosmos-79-o-el-kenko-o-horizontes-o-la-ceja-o-los-andes-o-mercedario-o-mercurio-o-puchucollo-o-rio-seco-o-rosas-pampa-anexo-o-san-jose-de-charapaqui-o-san-luis-pampa-o-santiago-i-o-senkata-o-senor-de-lagunas-o-tejada-triangular-o-tilata-o-villa-adela-o-villa-alemana-o-villa-bolivar-o-villa-exaltacion-o-villa-ingenio-o-villa-mercedes-o-el-puente-o-el-torno-o-guanay-o-guayaramerin-o-huajchilla-o-la-guardia-o-laja-o-mallco-rancho-o-mecapaca-o-minero-o-monteagudo-o-montero-o-okinawa-i-o-pailon-o-pairumani-o-palca-o-centro-pueblo-o-oeste-o-urubo-o-portachuelo-o-camino-rn2-corapata-pucarani-o-puerto-suarez-o-punata-o-quillacollo-o-robore-o-sacaba-o-samaipata-o-san-benito-o-san-carlos-o-san-ignacio-o-san-ignacio-de-velasco-o-san-jose-de-chiquitos-o-san-lorenzo-o-san-miguel-de-velasco-o-san-ramon-o-san-xavier-o-santa-rosa-del-sara-o-sipe-sipe-o-soracachi-o-avenida-simon-bolivar-o-tarata-o-tiquipaya-o-tolata-o-centro-o-este-o-noreste-o-noroeste-o-norte-o-sur-o-suroeste-o-Guadalupe%20Central-o-vallegrande-o-viacha-o-villamontes-o-viloma-cala-cala-o-vinto-o-rn2-kasani-copacabana-o-pentaguazu-lll-o-warnes-o-yamparaez-o-yotala"

/** Construye una URL real de RE/MAX para un tipo de propiedad */
function urlRemax(tipo: string): string {
  return `https://remax.bo/search/${tipo}/${REMAX_UBICACIONES}/${REMAX_ZONAS}?order=1%2C3&page=1`
}

const CATALOGO_REMAX: UrlCatalogo[] = [
  {
    id: "REMAX-CASA",
    fuente: "REMAX",
    categoria: "CASA",
    etiqueta: "RE/MAX · Casas en venta",
    descripcion: "Venta · todo el país (multi-ciudad)",
    url: urlRemax("casa"),
  },
  {
    id: "REMAX-DEPARTAMENTO",
    fuente: "REMAX",
    categoria: "DEPARTAMENTO",
    etiqueta: "RE/MAX · Departamentos en venta",
    descripcion: "Venta · departamento / condominio",
    url: urlRemax("departamento-o-condominio-departamento"),
  },
  {
    id: "REMAX-TERRENO",
    fuente: "REMAX",
    categoria: "TERRENO",
    etiqueta: "RE/MAX · Terrenos en venta",
    descripcion: "Venta · todo el país (multi-ciudad)",
    url: urlRemax("terreno"),
  },
  {
    id: "REMAX-LOCAL_COMERCIAL",
    fuente: "REMAX",
    categoria: "LOCAL_COMERCIAL",
    etiqueta: "RE/MAX · Locales comerciales en venta",
    descripcion: "Venta · todo el país (multi-ciudad)",
    url: urlRemax("local-comercial"),
  },
  {
    id: "REMAX-OFICINA",
    fuente: "REMAX",
    categoria: "OFICINA",
    etiqueta: "RE/MAX · Oficinas en venta",
    descripcion: "Venta · todo el país (multi-ciudad)",
    url: urlRemax("oficina"),
  },
]

/** Devuelve el catálogo de una fuente */
export function catalogoPorFuente(fuente: ScraperFuente): UrlCatalogo[] {
  return fuente === "C21" ? CATALOGO_C21 : CATALOGO_REMAX
}

/** Busca una URL del catálogo por su id */
export function urlCatalogoPorId(id: string): UrlCatalogo | undefined {
  return [...CATALOGO_C21, ...CATALOGO_REMAX].find((u) => u.id === id)
}
