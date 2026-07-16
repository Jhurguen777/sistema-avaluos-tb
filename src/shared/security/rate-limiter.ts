/**
 * Rate Limiter Service
 *
 * Servicio para limitar intentos de login por IP y email
 * Previene ataques de fuerza bruta bloqueando temporalmente
 * después de múltiples intentos fallidos.
 *
 * NOTA: En producción usar Redis o similar para almacenamiento distribuido
 */

interface RateLimitEntry {
  count: number
  firstAttempt: number
  blockedUntil?: number
}

interface RateLimitConfig {
  maxAttempts: number
  windowMs: number
  blockDurationMs: number
}

// Configuración por defecto: 5 intentos en 15 minutos, bloqueo de 30 minutos
const DEFAULT_CONFIG: RateLimitConfig = {
  maxAttempts: parseInt(process.env.RATE_LIMIT_MAX_ATTEMPTS || "5"),
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || "900000"), // 15 minutos
  blockDurationMs: 30 * 60 * 1000, // 30 minutos
}

// Almacenamiento en memoria (para desarrollo)
// En producción, usar Redis o similar
const ipAttempts = new Map<string, RateLimitEntry>()
const emailAttempts = new Map<string, RateLimitEntry>()

/**
 * Limpia entradas expiradas del mapa
 */
function cleanupExpiredEntries(map: Map<string, RateLimitEntry>, now: number): void {
  for (const [key, entry] of map.entries()) {
    const windowStart = now - DEFAULT_CONFIG.windowMs
    if (entry.firstAttempt < windowStart && !entry.blockedUntil) {
      map.delete(key)
    } else if (entry.blockedUntil && entry.blockedUntil < now) {
      map.delete(key)
    }
  }
}

/**
 * Verifica si una clave (IP o email) está bloqueada
 */
export function isBlocked(key: string, map: Map<string, RateLimitEntry>): boolean {
  const entry = map.get(key)
  if (!entry) return false

  const now = Date.now()

  // Si está bloqueado y el bloqueo expiró, limpiar
  if (entry.blockedUntil && entry.blockedUntil < now) {
    map.delete(key)
    return false
  }

  return entry.blockedUntil !== undefined && entry.blockedUntil > now
}

/**
 * Verifica si una clave (IP o email) ha excedido el límite de intentos
 */
export function hasExceededLimit(key: string, map: Map<string, RateLimitEntry>): boolean {
  const entry = map.get(key)
  if (!entry) return false

  // Si está bloqueado, no permitir intentos
  if (entry.blockedUntil) {
    const now = Date.now()
    if (entry.blockedUntil > now) {
      return true
    }
    // Bloqueo expirado, resetear
    map.delete(key)
    return false
  }

  const now = Date.now()
  const windowStart = now - DEFAULT_CONFIG.windowMs

  // Si el primer intento fue fuera de la ventana de tiempo, resetear
  if (entry.firstAttempt < windowStart) {
    map.delete(key)
    return false
  }

  // Verificar si excedió el límite
  return entry.count >= DEFAULT_CONFIG.maxAttempts
}

/**
 * Registra un intento de login
 */
export function recordAttempt(
  key: string,
  map: Map<string, RateLimitEntry>,
  success: boolean
): { allowed: boolean; blockedUntil?: number; remainingAttempts?: number } {
  const now = Date.now()

  // Cleanup entradas expiradas periódicamente
  if (map.size > 1000) {
    cleanupExpiredEntries(map, now)
  }

  const entry = map.get(key)

  // Si el intento fue exitoso, limpiar el contador
  if (success) {
    map.delete(key)
    return { allowed: true }
  }

  // Si no existe entrada, crear nueva
  if (!entry) {
    map.set(key, {
      count: 1,
      firstAttempt: now,
    })
    return {
      allowed: true,
      remainingAttempts: DEFAULT_CONFIG.maxAttempts - 1,
    }
  }

  // Si está bloqueado, verificar si expiró
  if (entry.blockedUntil) {
    if (entry.blockedUntil > now) {
      return {
        allowed: false,
        blockedUntil: entry.blockedUntil,
      }
    }
    // Bloqueo expiró, crear nueva entrada
    map.set(key, {
      count: 1,
      firstAttempt: now,
    })
    return {
      allowed: true,
      remainingAttempts: DEFAULT_CONFIG.maxAttempts - 1,
    }
  }

  // Incrementar contador
  const newCount = entry.count + 1

  // Verificar si excedió el límite
  if (newCount >= DEFAULT_CONFIG.maxAttempts) {
    const blockedUntil = now + DEFAULT_CONFIG.blockDurationMs
    map.set(key, {
      count: newCount,
      firstAttempt: entry.firstAttempt,
      blockedUntil,
    })
    return {
      allowed: false,
      blockedUntil,
    }
  }

  // Actualizar entrada
  map.set(key, {
    count: newCount,
    firstAttempt: entry.firstAttempt,
  })

  return {
    allowed: true,
    remainingAttempts: DEFAULT_CONFIG.maxAttempts - newCount,
  }
}

/**
 * Verifica si una IP está bloqueada
 */
export function isIPBlocked(ip: string): boolean {
  return isBlocked(ip, ipAttempts)
}

/**
 * Verifica si un email está bloqueado
 */
export function isEmailBlocked(email: string): boolean {
  return isBlocked(email.toLowerCase(), emailAttempts)
}

/**
 * Verifica si una IP ha excedido el límite de intentos
 */
export function hasIPExceededLimit(ip: string): boolean {
  return hasExceededLimit(ip, ipAttempts)
}

/**
 * Verifica si un email ha excedido el límite de intentos
 */
export function hasEmailExceededLimit(email: string): boolean {
  return hasExceededLimit(email.toLowerCase(), emailAttempts)
}

/**
 * Registra un intento de login para una IP
 */
export function recordIPAttempt(
  ip: string,
  success: boolean
): { allowed: boolean; blockedUntil?: number; remainingAttempts?: number } {
  return recordAttempt(ip, ipAttempts, success)
}

/**
 * Registra un intento de login para un email
 */
export function recordEmailAttempt(
  email: string,
  success: boolean
): { allowed: boolean; blockedUntil?: number; remainingAttempts?: number } {
  return recordAttempt(email.toLowerCase(), emailAttempts, success)
}

/**
 * Obtiene información de rate limiting para una clave
 */
export function getRateLimitInfo(key: string, map: Map<string, RateLimitEntry>):
  | { blocked: boolean; blockedUntil?: number; count: number; remainingAttempts: number }
  | null {
  const entry = map.get(key)
  if (!entry) return null

  const now = Date.now()
  const windowStart = now - DEFAULT_CONFIG.windowMs

  // Si el primer intento fue fuera de la ventana de tiempo
  if (entry.firstAttempt < windowStart && !entry.blockedUntil) {
    map.delete(key)
    return null
  }

  // Si está bloqueado y expiró
  if (entry.blockedUntil && entry.blockedUntil < now) {
    map.delete(key)
    return null
  }

  const remaining = Math.max(0, DEFAULT_CONFIG.maxAttempts - entry.count)

  return {
    blocked: entry.blockedUntil !== undefined && entry.blockedUntil > now,
    blockedUntil: entry.blockedUntil,
    count: entry.count,
    remainingAttempts: remaining,
  }
}

/**
 * Obtiene información de rate limiting para una IP
 */
export function getIPRateLimitInfo(ip: string) {
  return getRateLimitInfo(ip, ipAttempts)
}

/**
 * Obtiene información de rate limiting para un email
 */
export function getEmailRateLimitInfo(email: string) {
  return getRateLimitInfo(email.toLowerCase(), emailAttempts)
}

/**
 * Resetea el contador para una clave (usar después de login exitoso)
 */
export function resetAttempts(key: string, map: Map<string, RateLimitEntry>): void {
  map.delete(key)
}

/**
 * Resetea el contador para una IP
 */
export function resetIPAttempts(ip: string): void {
  resetAttempts(ip, ipAttempts)
}

/**
 * Resetea el contador para un email
 */
export function resetEmailAttempts(email: string): void {
  resetAttempts(email.toLowerCase(), emailAttempts)
}

/**
 * Limpia todas las entradas (útil para testing o mantenimiento)
 */
export function clearAllAttempts(): void {
  ipAttempts.clear()
  emailAttempts.clear()
}

/**
 * Obtiene estadísticas actuales (para monitoreo)
 */
export function getRateLimitStats() {
  return {
    ipEntries: ipAttempts.size,
    emailEntries: emailAttempts.size,
    config: DEFAULT_CONFIG,
  }
}
