export interface AppModule {
  id: number;
  name: string;
  icon?: string;
  route?: string;
  parentId?: number;
  isActive: boolean;
  sortOrder: number;
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
}
