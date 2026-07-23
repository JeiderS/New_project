export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  address?: string;
  active: boolean;
  createdAt?: string;
}

export interface CreateUserPayload {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
  address?: string;
}

export interface UpdateUserPayload {
  firstName: string;
  lastName: string;
  phone?: string;
  address?: string;
}
