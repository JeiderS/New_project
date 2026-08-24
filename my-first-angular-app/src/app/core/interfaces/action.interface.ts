export interface Action {
  id: number;
  code: string;
  name: string;
  moduleId: number;
  moduleName: string | null;
}

export interface CreateActionPayload {
  moduleId: number;
  name: string;
}
