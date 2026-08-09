/**
 * Configuración de Módulos y Permisos Granulares por Usuario
 * Define los módulos del sistema, acciones CRUD disponibles y defaults por rol.
 */

/** Acciones CRUD estándar */
export type AccionCRUD = "read" | "create" | "edit" | "delete"

/** Estructura de permisos para un módulo */
export interface PermisosModulo {
  read: boolean
  create: boolean
  edit: boolean
  delete: boolean
}

/** Mapa completo de permisos: moduleKey → PermisosModulo */
export type PermisosUsuario = Record<string, PermisosModulo>

/** Definición de un módulo del sistema */
export interface ModuloPermisos {
  key: string
  label: string
  /** Icono de lucide-react (referencia como string para evitar dependencia) */
  icon: string
  /** Qué acciones aplican a este módulo (false = no aplica, se deshabilita) */
  acciones: PermisosModulo
}

/** Lista de módulos del sistema con sus acciones aplicables */
export const MODULOS_PERMISOS: ModuloPermisos[] = [
  {
    key: "avaluos",
    label: "Avalúos",
    icon: "FileText",
    acciones: { read: true, create: true, edit: true, delete: true },
  },
  {
    key: "inmuebles",
    label: "Inmuebles",
    icon: "Building2",
    acciones: { read: true, create: true, edit: true, delete: true },
  },
  {
    key: "usuarios",
    label: "Usuarios",
    icon: "Users",
    acciones: { read: true, create: true, edit: true, delete: true },
  },
  {
    key: "documentos",
    label: "Documentos",
    icon: "FolderOpen",
    acciones: { read: true, create: true, edit: true, delete: true },
  },
  {
    key: "reportes",
    label: "Reportes",
    icon: "BarChart3",
    acciones: { read: true, create: true, edit: false, delete: false },
  },
  {
    key: "configuracion",
    label: "Configuración",
    icon: "Settings",
    acciones: { read: true, create: false, edit: true, delete: false },
  },
  {
    key: "auditoria",
    label: "Auditoría",
    icon: "History",
    acciones: { read: true, create: false, edit: false, delete: false },
  },
]

/** Etiquetas legibles para cada acción CRUD */
export const ACCIONES_LABELS: { key: AccionCRUD; label: string; icon: string }[] = [
  { key: "read", label: "Ver", icon: "Eye" },
  { key: "create", label: "Crear", icon: "Plus" },
  { key: "edit", label: "Editar", icon: "Pencil" },
  { key: "delete", label: "Eliminar", icon: "Trash2" },
]

/**
 * Permisos por defecto según el rol del usuario.
 * Se asignan automáticamente al crear un usuario nuevo.
 * El ADMIN puede luego personalizarlos individualmente.
 */
export const PERMISOS_DEFAULT: Record<string, PermisosUsuario> = {
  ADMIN: {
    avaluos: { read: true, create: true, edit: true, delete: true },
    inmuebles: { read: true, create: true, edit: true, delete: true },
    usuarios: { read: true, create: true, edit: true, delete: true },
    documentos: { read: true, create: true, edit: true, delete: true },
    reportes: { read: true, create: true, edit: true, delete: true },
    configuracion: { read: true, create: true, edit: true, delete: true },
    auditoria: { read: true, create: true, edit: true, delete: true },
  },
  ARQUITECTO: {
    avaluos: { read: true, create: true, edit: true, delete: false },
    inmuebles: { read: true, create: true, edit: true, delete: false },
    usuarios: { read: false, create: false, edit: false, delete: false },
    documentos: { read: true, create: true, edit: true, delete: false },
    reportes: { read: true, create: true, edit: false, delete: false },
    configuracion: { read: true, create: false, edit: false, delete: false },
    auditoria: { read: false, create: false, edit: false, delete: false },
  },
  INGENIERO_CIVIL: {
    avaluos: { read: true, create: true, edit: true, delete: false },
    inmuebles: { read: true, create: true, edit: true, delete: false },
    usuarios: { read: false, create: false, edit: false, delete: false },
    documentos: { read: true, create: true, edit: true, delete: false },
    reportes: { read: true, create: true, edit: false, delete: false },
    configuracion: { read: true, create: false, edit: false, delete: false },
    auditoria: { read: false, create: false, edit: false, delete: false },
  },
  VALUADOR: {
    avaluos: { read: true, create: true, edit: true, delete: false },
    inmuebles: { read: true, create: false, edit: false, delete: false },
    usuarios: { read: false, create: false, edit: false, delete: false },
    documentos: { read: true, create: true, edit: true, delete: false },
    reportes: { read: true, create: false, edit: false, delete: false },
    configuracion: { read: true, create: false, edit: false, delete: false },
    auditoria: { read: false, create: false, edit: false, delete: false },
  },
}

/**
 * Obtiene los permisos efectivos de un usuario.
 * Si tiene permisos individuales en DB, los usa.
 * Si no, usa los defaults del rol.
 */
export function getPermisosEfectivos(
  permisosDB: PermisosUsuario | null | undefined,
  role: string,
): PermisosUsuario {
  if (permisosDB && Object.keys(permisosDB).length > 0) {
    return permisosDB
  }
  return PERMISOS_DEFAULT[role] ?? PERMISOS_DEFAULT.VALUADOR
}

/**
 * Verifica si un usuario tiene un permiso específico.
 */
export function tienePermisoGranular(
  permisos: PermisosUsuario | null | undefined,
  role: string,
  modulo: string,
  accion: AccionCRUD,
): boolean {
  const efectivos = getPermisosEfectivos(permisos, role)
  return efectivos[modulo]?.[accion] ?? false
}

/**
 * Genera una estructura de permisos vacía (todos false).
 */
export function permisosVacios(): PermisosUsuario {
  const result: PermisosUsuario = {}
  for (const mod of MODULOS_PERMISOS) {
    result[mod.key] = { read: false, create: false, edit: false, delete: false }
  }
  return result
}
