export interface AppModule {
  id: number;
  name: string;
  icon?: string;
  route?: string;
  parentId?: number;
  isActive: boolean;
  sortOrder: number;
  actionIds: number[];
}

export interface CreateModulePayload {
  name: string;
  icon?: string;
  route?: string;
  parentId?: number;
  sortOrder: number;
}

export interface UpdateModulePayload {
  name: string;
  icon?: string;
  route?: string;
  parentId?: number;
  sortOrder: number;
  /** Omitido: no toca las acciones del módulo. Lista (incluso vacía): las reemplaza. */
  actionIds?: number[];
  /** Acciones sin id todavía: el backend las crea y las agrega al conjunto final, en el mismo request. */
  newActions?: { code: string; name: string }[];
}
