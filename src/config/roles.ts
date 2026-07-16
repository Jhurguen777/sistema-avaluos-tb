/**
 * Configuración de Roles y Permisos (RBAC)
 * Define roles del sistema y permisos asociados
 */

export const ROLES_CONFIG = {
  /**
   * Roles definidos en el sistema
   */
  roles: {
    ADMIN: {
      nombre: 'Administrador',
      descripcion: 'Acceso total al sistema',
      nivel: 4
    },
    ARQUITECTO: {
      nombre: 'Arquitecto',
      descripcion: 'Crear avalúos, registrar construcciones',
      nivel: 3
    },
    INGENIERO_CIVIL: {
      nombre: 'Ingeniero Civil',
      descripcion: 'Crear avalúos, registrar depreciaciones',
      nivel: 3
    },
    VALUADOR: {
      nombre: 'Valuador',
      descripcion: 'Generar avalúos básicos',
      nivel: 2
    }
  } as const,

  /**
   * Permisos por módulo
   */
  permisos: {
    usuarios: {
      CREATE: 'usuarios.create',
      READ: 'usuarios.read',
      UPDATE: 'usuarios.update',
      DELETE: 'usuarios.delete',
      RESET_PASSWORD: 'usuarios.reset_password'
    },
    inmuebles: {
      CREATE: 'inmuebles.create',
      READ: 'inmuebles.read',
      UPDATE: 'inmuebles.update',
      DELETE: 'inmuebles.delete'
    },
    avaluos: {
      CREATE: 'avaluos.create',
      READ: 'avaluos.read',
      UPDATE: 'avaluos.update',
      DELETE: 'avaluos.delete',
      APPROVE: 'avaluos.approve',
      REJECT: 'avaluos.reject'
    },
    reportes: {
      GENERATE: 'reportes.generate',
      EXPORT: 'reportes.export'
    },
    configuracion: {
      MANAGE: 'configuracion.manage'
    }
  } as const,

  /**
   * Matriz de permisos por rol
   * true: tiene permiso, false: no tiene permiso
   */
  matrizPermisos: {
    ADMIN: {
      'usuarios.create': true,
      'usuarios.read': true,
      'usuarios.update': true,
      'usuarios.delete': true,
      'usuarios.reset_password': true,
      'inmuebles.create': true,
      'inmuebles.read': true,
      'inmuebles.update': true,
      'inmuebles.delete': true,
      'avaluos.create': true,
      'avaluos.read': true,
      'avaluos.update': true,
      'avaluos.delete': true,
      'avaluos.approve': true,
      'avaluos.reject': true,
      'reportes.generate': true,
      'reportes.export': true,
      'configuracion.manage': true
    },
    ARQUITECTO: {
      'usuarios.create': false,
      'usuarios.read': false,
      'usuarios.update': false,
      'usuarios.delete': false,
      'usuarios.reset_password': false,
      'inmuebles.create': true,
      'inmuebles.read': true,
      'inmuebles.update': true,
      'inmuebles.delete': false,
      'avaluos.create': true,
      'avaluos.read': true,
      'avaluos.update': true,
      'avaluos.delete': false,
      'avaluos.approve': false,
      'avaluos.reject': false,
      'reportes.generate': true,
      'reportes.export': true,
      'configuracion.manage': false
    },
    INGENIERO_CIVIL: {
      'usuarios.create': false,
      'usuarios.read': false,
      'usuarios.update': false,
      'usuarios.delete': false,
      'usuarios.reset_password': false,
      'inmuebles.create': true,
      'inmuebles.read': true,
      'inmuebles.update': true,
      'inmuebles.delete': false,
      'avaluos.create': true,
      'avaluos.read': true,
      'avaluos.update': true,
      'avaluos.delete': false,
      'avaluos.approve': false,
      'avaluos.reject': false,
      'reportes.generate': true,
      'reportes.export': true,
      'configuracion.manage': false
    },
    VALUADOR: {
      'usuarios.create': false,
      'usuarios.read': false,
      'usuarios.update': false,
      'usuarios.delete': false,
      'usuarios.reset_password': false,
      'inmuebles.create': false,
      'inmuebles.read': true,
      'inmuebles.update': false,
      'inmuebles.delete': false,
      'avaluos.create': true,
      'avaluos.read': true,
      'avaluos.update': true,
      'avaluos.delete': false,
      'avaluos.approve': false,
      'avaluos.reject': false,
      'reportes.generate': true,
      'reportes.export': false,
      'configuracion.manage': false
    }
  } as const,

  /**
   * Utilidad para verificar si un rol tiene un permiso
   */
  tienePermiso(rol: string, permiso: string): boolean {
    return ROLES_CONFIG.matrizPermisos[rol as keyof typeof ROLES_CONFIG.matrizPermisos]?.[permiso as keyof typeof ROLES_CONFIG.matrizPermisos[keyof typeof ROLES_CONFIG.matrizPermisos]] || false
  }
} as const

export type Rol = keyof typeof ROLES_CONFIG.roles
export type Permiso = typeof ROLES_CONFIG.permisos
