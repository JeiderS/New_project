export type ProductStatus = 'activo' | 'bajo-stock' | 'sin-stock' | 'inactivo';

export interface Product {
  id: string;
  name: string;
  sku: string;
  category: string;
  price: number;
  stock: number;
  status: ProductStatus;
  brand?: string;
  unit?: string;
  notes?: string;
}
