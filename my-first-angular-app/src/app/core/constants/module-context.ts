/**
 * Valores válidos del header X-Module-Code: el Route estable de cada módulo
 * (debe coincidir con la columna Modules.Route en el backend). Identifica
 * desde qué pantalla se pide un endpoint compartido (ej. GET /api/v1/actions,
 * leído tanto por Acciones como por Roles/Módulos) para que el backend exija
 * el permiso correcto según el contexto, no un OR entre varios permisos.
 */
export const ModuleContext = {
  Actions: 'actions',
  Roles: 'roles',
  Modules: 'modules',
} as const;

export type ModuleContextValue = (typeof ModuleContext)[keyof typeof ModuleContext];
