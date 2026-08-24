export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  address?: string;
  active: boolean;
  createdAt?: string;
  roleId?: number;
  roleName?: string;
}

export interface CreateUserPayload {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
  address?: string;
  roleId?: number;
}

export interface UpdateUserPayload {
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  address?: string;
  roleId?: number;
}
