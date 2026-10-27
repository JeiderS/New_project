export interface Product {
  id: number;
  imageUrl?: string;
  name: string;
  description?: string;
  price: number;
  categoryId: number;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}
