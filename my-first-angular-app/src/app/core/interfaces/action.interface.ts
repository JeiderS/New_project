export interface Action {
  id: number;
  code: string;
  name: string;
}

export interface CreateActionPayload {
  code: string;
  name: string;
}

export interface UpdateActionPayload {
  code: string;
  name: string;
}
