/**
 * Importación Service
 *
 * Lógica de parseo, mapeo y detección para la importación masiva
 * de listings inmobiliarios desde JSON hacia `products` + `product_locations`.
 *
 * Tolerante a variaciones de nombres de campo (alias múltiples por cada destino)
 * y detecta categoría + operación desde el título, cruzando con el campo declarado.
 *
 * Referencia: /GUIA-IMPORT-JSON.md
 */

import type { OperationType, ProductCategoryEnum } from "@prisma/client"
import type {
  RegistroAnalizado,
  ResumenAnalisis,
  EstadoRegistro,
} from "../types/importacion.types"

// ---------------------------------------------------------------------------
// ALIASES DE CAMPOS — el mapper prueba cada alias en orden hasta encontrarlo
// Soporta rutas anidadas con "." (ej. "ubicacion.calle")
// ---------------------------------------------------------------------------

const CAMPO_ALIASES: Record<string, string[]> = {
  titulo: [
    "titulo", "title", "nombre", "name", "descripcion_titulo", "encabezado",
  ],
  codigo: [
    "codigo", "codigoInmueble", "id", "codigo_inmueble", "ref", "referencia", "code",
  ],
  precio: [
    "precio", "price", "precioUsd", "precio_usd", "valor", "costo", "monto",
    "precioUSD", "precio_dolares", "precio_dolares_usd",
  ],
  area_terreno: [
    "area_terreno", "areaTerreno", "superficie", "superficie_terreno", "area",
    "terreno", "area_total", "areaTotal", "superficie_total", "superficieTerreno",
  ],
  area_construccion: [
    "area_construccion", "areaConstruccion", "construccion", "superficie_construida",
    "superficieConstruida", "area_constr", "construida", "superficie_util_construida",
  ],
  habitaciones: [
    "habitaciones", "hab", "dormitorios", "recamaras", "recámaras", "rooms",
    "bedrooms", "dorm", "alcobas", "hs",
  ],
  banos: [
    "banos", "baños", "banios", "bathrooms", "baths", "ban", "wc", "aseos",
  ],
  cocheras: [
    "estacionamientos", "cocheras", "garajes", "parking", "garage", "parkings",
    "estac", "gar",
  ],
  calle: [
    "ubicacion.calle", "calle", "direccion", "address", "street", "ubicacion.direccion",
    "direccion_calle",
  ],
  departamento: [
    "ubicacion.departamento", "departamento", "state", "ubicacion.dep",
    "ubicacion.region", "region",
  ],
  municipio: [
    "ubicacion.municipio", "municipio", "ciudad", "city", "ubicacion.ciudad",
    "ubicacion.zona", "zona",
  ],
  pais: [
    "ubicacion.pais", "pais", "country",
  ],
  lat: [
    "coordenadas.latitud", "latitud", "lat", "latitude", "coordenadas.lat",
    "ubicacion.lat", "geo.lat",
  ],
  lng: [
    "coordenadas.longitud", "longitud", "lng", "lon", "longitude", "coordenadas.lng",
    "coordenadas.lon", "ubicacion.lng", "geo.lng",
  ],
  operacion_declarada: [
    "tipo_operacion", "operacion", "operation", "tipo_oper", "modalidad",
    "operacion_inmobiliaria",
  ],
}

// ---------------------------------------------------------------------------
// DETECTORES DE CATEGORÍA Y OPERACIÓN DESDE EL TÍTULO
// Orden importa: patrones más específicos primero (penthouse antes que casa,
// porque "penthouse" no contiene "casa")
// ---------------------------------------------------------------------------

const CATEGORIA_KEYWORDS: Array<{ cat: ProductCategoryEnum; re: RegExp }> = [
  { cat: "PENTHOUSE", re: /\bpent\s*house\b|\bph\b/i },
  { cat: "DEPARTAMENTO", re: /\bdepto\b|\bdepartamento\b|\bapartamento\b|\bapto\b|\bdto\b/i },
  { cat: "LOCAL_COMERCIAL", re: /\blocal(?:\s+comercial)?\b|\btienda\b|\bstand\b/i },
  { cat: "OFICINA", re: /\boficina(?:s)?\b/i },
  { cat: "QUINTA", re: /\bquinta(?:s)?\b/i },
  { cat: "TERRENO", re: /\bterreno\b|\blote\b|\bparcela\b|\bterrenos\b|\blotes\b/i },
  { cat: "CASA", re: /\bcasa(?:s)?\b|\bchalet\b|\bvilla\b|\bhouse\b/i },
]

const OPERACION_KEYWORDS: Array<{ op: OperationType; re: RegExp }> = [
  { op: "ANTICRETICO", re: /\banticret[ií]co\b|\banticret[ií]cos\b|\banticresis\b/i },
  { op: "ALQUILER", re: /\balquiler\b|\balqu[ií]ler\b|\brenta\b|\barriendo\b|\bse\s+renta\b|\bse\s+alquila\b|\bfor\s+rent\b|\brent\b/i },
  { op: "VENTA", re: /\bventa\b|\bvendo\b|\bse\s+vende\b|\bsale\b|\bfor\s+sale\b|\bemprevenda\b/i },
]

/** Mapas texto → enum para normalizar el campo operacion_declarada. */
const OPERACION_TEXT_MAP: Array<{ op: OperationType; re: RegExp }> = OPERACION_KEYWORDS

// ---------------------------------------------------------------------------
// HELPERS DE PARSEO
// ---------------------------------------------------------------------------

/**
 * Lee un valor anidado desde un objeto usando una ruta con puntos.
 * Soporta arrays numéricos: getNested({"a":{"b":1}}, "a.b") === 1
 */
function getNested(obj: unknown, path: string): unknown {
  if (!obj || typeof obj !== "object") return undefined
  const parts = path.split(".")
  let cur: unknown = obj
  for (const p of parts) {
    if (cur == null) return undefined
    cur = (cur as Record<string, unknown>)[p]
  }
  return cur == null ? undefined : cur
}

/** Busca el primer alias que exista en el registro (no undefined/null/""), devuelve [path, valor]. */
function resolveField(registro: unknown, campoDestino: string): { path: string; valor: unknown } | null {
  const aliases = CAMPO_ALIASES[campoDestino]
  if (!aliases) return null
  for (const alias of aliases) {
    const v = getNested(registro, alias)
    if (v !== undefined && v !== null && v !== "") {
      return { path: alias, valor: v }
    }
  }
  // Fallback: si el registro trae un bloque "caracteristicas", buscar ahí dentro.
  // Cubre el formato común donde los atributos vienen anidados:
  //   caracteristicas: { area_terreno, area_construccion, habitaciones, banos, ... }
  // Se prueba cada alias usando solo su última parte (sin prefijo de ruta).
  const caract = getNested(registro, "caracteristicas")
  if (caract && typeof caract === "object") {
    for (const alias of aliases) {
      const ultima = alias.split(".").pop()!
      const v = getNested(caract, ultima)
      if (v !== undefined && v !== null && v !== "") {
        return { path: `caracteristicas.${ultima}`, valor: v }
      }
    }
  }
  return null
}

/** Extrae un número de texto con separador de miles boliviano (punto). */
function parseNumero(s: unknown): number | null {
  if (s == null) return null
  if (typeof s === "number") return isNaN(s) ? null : s
  const str = String(s).trim()
  if (!str) return null
  // Tomar la 1er secuencia de dígitos/puntos/comas
  const m = str.match(/-?[\d.,]+/)
  if (!m) return null
  let raw = m[0]
  // Si hay coma como decimal (formato 620.000,50 → 620000.50)
  if (raw.includes(",") && raw.includes(".")) {
    raw = raw.replace(/\.(?=\d{3}(\D|$))/g, "").replace(",", ".")
  } else if (raw.includes(",") && !raw.includes(".")) {
    // Coma sola: si son 2 dígitos tras coma → decimal, sino → miles
    const partes = raw.split(",")
    if (partes.length === 2 && partes[1].length === 2) {
      raw = partes[0] + "." + partes[1]
    } else {
      raw = raw.replace(/,/g, "")
    }
  } else if (raw.includes(".")) {
    // Puntos: contar grupos. Si el último grupo tiene 3 dígitos → separador de miles
    const partes = raw.split(".")
    if (partes.length > 1) {
      const ultimo = partes[partes.length - 1]
      if (ultimo.length === 3) {
        // todos los puntos son separadores de miles
        raw = raw.replace(/\./g, "")
      } else if (ultimo.length !== 0) {
        // probable decimal
        raw = partes.slice(0, -1).join("") + "." + ultimo
      }
    }
  }
  const n = parseFloat(raw)
  return isNaN(n) ? null : n
}

/** Moneda declarada en el campo precio del JSON original */
type MonedaDetectada = "USD" | "BOB" | null

/**
 * Parsea precio: detecta la moneda declarada (BOB/Bs/Bolivianos o USD/dólares)
 * y extrae el monto. Sin moneda explícita se asume USD (comportamiento C21/REMAX).
 */
function parsePrecio(s: unknown): { monto: number | null; moneda: MonedaDetectada } {
  if (s == null) return { monto: null, moneda: null }
  if (typeof s === "number") return { monto: isNaN(s) ? null : s, moneda: null }
  const str = String(s).toLowerCase()
  // Si dice "a consultar" / "consultar" / "trato" → no hay precio
  if (/consult|trato|negociab|sin\s+precio/.test(str)) return { monto: null, moneda: null }
  const moneda: MonedaDetectada = /\bbob\b|\bbs\b|\bbolivianos?\b/.test(str)
    ? "BOB"
    : /\busd\b|\bu\$s\b|\$us\b|\bd[oó]lar(es)?\b/.test(str)
      ? "USD"
      : null
  return { monto: parseNumero(str), moneda }
}

/** Redondea a 2 decimales */
function redondear2(n: number): number {
  return Math.round(n * 100) / 100
}

/** Normaliza texto a OperationType. */
function textoAOperacion(s: unknown): OperationType | null {
  if (s == null) return null
  const str = String(s).trim().toLowerCase()
  if (!str) return null
  for (const { op, re } of OPERACION_TEXT_MAP) {
    if (re.test(str)) return op
  }
  return null
}

/** Detecta categoría desde un texto (título). */
function detectarCategoria(titulo: string | null): ProductCategoryEnum {
  if (!titulo) return "OTROS"
  for (const { cat, re } of CATEGORIA_KEYWORDS) {
    if (re.test(titulo)) return cat
  }
  return "OTROS"
}

/** Detecta operación desde un texto (título). */
function detectarOperacion(titulo: string | null): OperationType | null {
  if (!titulo) return null
  for (const { op, re } of OPERACION_KEYWORDS) {
    if (re.test(titulo)) return op
  }
  return null
}

/** Genera código determinístico cuando el registro no trae uno. */
function generarCodigo(indice: number, titulo: string | null): string {
  const prefijo = "IMP"
  const slug = (titulo || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 30)
  return `${prefijo}-${String(indice).padStart(5, "0")}-${slug || "s/t"}`
}

// ---------------------------------------------------------------------------
// API PÚBLICA DEL SERVICE
// ---------------------------------------------------------------------------

export const importacionService = {
  /**
   * Analiza un array crudo de listings y devuelve registros normalizados
   * con detección de categoría/operación, conflictos y estado.
   * @param tasaBobUsd - Tipo de cambio Bs/USD (BCB) para convertir precios en ambas direcciones.
   */
  analizar(jsonRaw: unknown, tasaBobUsd: number): { registros: RegistroAnalizado[]; resumen: ResumenAnalisis } {
    if (!Array.isArray(jsonRaw)) {
      throw new Error("El JSON debe ser un array de registros.")
    }
    if (jsonRaw.length === 0) {
      throw new Error("El JSON no contiene registros.")
    }
    if (!tasaBobUsd || tasaBobUsd < 0.5 || tasaBobUsd > 1000) {
      throw new Error("Tipo de cambio inválido. Obtén el dólar del día antes de analizar.")
    }

    const registros: RegistroAnalizado[] = []
    const camposNoMapeadosMap = new Map<string, number>()
    // Códigos ya vistos en el lote → la 2ª aparición en adelante se marca duplicada
    const codigosVistos = new Set<string>()

    jsonRaw.forEach((raw, indice) => {
      if (!raw || typeof raw !== "object") {
        const codigoInvalido = generarCodigo(indice, null)
        registros.push({
          indice,
          codigo: codigoInvalido,
          duplicadoEnLote: codigosVistos.has(codigoInvalido),
          titulo: null,
          categoriaDetectada: "OTROS",
          operacionDetectada: "VENTA",
          operacionDeclarada: null,
          conflictoOperacion: false,
          precioUsd: null,
          superficieUtil: null,
          superficieConstruida: null,
          habitaciones: null,
          banos: null,
          cocheras: null,
          direccion: null,
          departamento: null,
          municipio: null,
          pais: "Bolivia",
          lat: null,
          lng: null,
          estado: "SIN_TITULO",
          motivoEstado: "Registro no es un objeto válido",
          camposMapeados: {},
          camposFaltantes: [],
          precioBob: null,
          monedaOriginal: null,
        })
        codigosVistos.add(codigoInvalido)
        return
      }

      const camposMapeados: Record<string, string> = {}
      const camposFaltantes: string[] = []

      const leer = (campo: string): unknown => {
        const r = resolveField(raw, campo)
        if (r) {          camposMapeados[campo] = r.path
          return r.valor
        }
        camposFaltantes.push(campo)
        // Contabilizar campo no mapeado para el reporte global
        camposNoMapeadosMap.set(campo, (camposNoMapeadosMap.get(campo) || 0) + 1)
        return null
      }

      const tituloRaw = leer("titulo")
      const titulo = tituloRaw == null ? null : String(tituloRaw).trim() || null

      const codigoRaw = leer("codigo")
      const codigo = codigoRaw == null || String(codigoRaw).trim() === ""
        ? generarCodigo(indice, titulo)
        : String(codigoRaw).trim()

      // Precio con moneda: BOB se convierte a USD (y viceversa) con la tasa del BCB
      const { monto: precioMonto, moneda: monedaOriginal } = parsePrecio(leer("precio"))
      let precioUsd: number | null = null
      let precioBob: number | null = null
      if (precioMonto != null) {
        if (monedaOriginal === "BOB") {
          precioBob = precioMonto
          precioUsd = redondear2(precioMonto / tasaBobUsd)
        } else {
          // USD explícito o sin moneda (asume USD, como C21/REMAX)
          precioUsd = precioMonto
          precioBob = redondear2(precioMonto * tasaBobUsd)
        }
      }
      const superficieUtil = parseNumero(leer("area_terreno"))
      const superficieConstruida = parseNumero(leer("area_construccion"))
      const habitaciones = parseNumero(leer("habitaciones"))
      const banos = parseNumero(leer("banos"))
      const cocheras = parseNumero(leer("cocheras"))

      const direccionRaw = leer("calle")
      const direccion = direccionRaw == null ? null : String(direccionRaw).trim() || null

      const depRaw = leer("departamento")
      const departamento = depRaw == null ? null : String(depRaw).trim() || null

      const munRaw = leer("municipio")
      const municipio = munRaw == null ? null : String(munRaw).trim() || null

      const paisRaw = leer("pais")
      const pais = paisRaw == null ? "Bolivia" : String(paisRaw).trim() || "Bolivia"

      const lat = parseNumero(leer("lat"))
      const lng = parseNumero(leer("lng"))

      const operacionDeclarada = textoAOperacion(leer("operacion_declarada"))

      // Detección desde título
      const categoriaDetectada = detectarCategoria(titulo)
      const operacionDetectadaDesdeTitulo = detectarOperacion(titulo)

      // Resolución final de operación: título gana si hay; sino la declarada; sino VENTA por defecto
      const operacionDetectada: OperationType =
        operacionDetectadaDesdeTitulo ?? operacionDeclarada ?? "VENTA"

      // Conflicto: título dice X, campo declarado dice Y (distinto y ambos no-null)
      const conflictoOperacion =
        operacionDetectadaDesdeTitulo !== null &&
        operacionDeclarada !== null &&
        operacionDetectadaDesdeTitulo !== operacionDeclarada

      // Determinar estado
      let estado: EstadoRegistro = "VALIDO"
      let motivoEstado = "OK"
      if (!titulo) {
        estado = "SIN_TITULO"
        motivoEstado = "Sin título"
      } else if (precioUsd == null) {
        estado = "SIN_PRECIO"
        motivoEstado = "Sin precio válido (¿'A consultar'?)"
      } else if (lat == null || lng == null) {
        estado = "SIN_COORDS"
        motivoEstado = "Sin lat/lng (no tendrá ubicación)"
      }

      // Duplicado: otra aparición anterior del lote ya usó este código
      const duplicadoEnLote = codigosVistos.has(codigo)
      codigosVistos.add(codigo)

      registros.push({
        indice,
        codigo,
        duplicadoEnLote,
        titulo,
        categoriaDetectada,
        operacionDetectada,
        operacionDeclarada,
        conflictoOperacion,
        precioUsd,
        precioBob,
        monedaOriginal,
        superficieUtil,
        superficieConstruida,
        habitaciones,
        banos,
        cocheras,
        direccion,
        departamento,
        municipio,
        pais,
        lat,
        lng,
        estado,
        motivoEstado,
        camposMapeados,
        camposFaltantes,
      })
    })

    const resumen: ResumenAnalisis = {
      total: registros.length,
      validos: registros.filter(r => r.estado === "VALIDO").length,
      sinPrecio: registros.filter(r => r.estado === "SIN_PRECIO").length,
      sinCoords: registros.filter(r => r.estado === "SIN_COORDS").length,
      sinTitulo: registros.filter(r => r.estado === "SIN_TITULO").length,
      conflictosOperacion: registros.filter(r => r.conflictoOperacion).length,
      duplicadosLote: registros.filter(r => r.duplicadoEnLote).length,
      camposNoMapeados: Array.from(camposNoMapeadosMap.entries())
        .map(([campo, count]) => ({ campo, count }))
        .sort((a, b) => b.count - a.count),
    }

    return { registros, resumen }
  },
}
