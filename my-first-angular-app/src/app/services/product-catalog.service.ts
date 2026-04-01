import { Injectable } from '@angular/core';
import { Product } from '../core/interfaces/product.interface';

@Injectable({
  providedIn: 'root',
})
export class ProductCatalogService {
  private readonly products: Product[] = [
    {
      id: 'p-001',
      name: 'Yerba Mate 1kg',
      sku: 'ALM-YER-001',
      category: 'Almacen',
      price: 6490,
      stock: 42,
      status: 'activo',
      brand: 'La Tranquera',
      unit: 'unidad',
    },
    {
      id: 'p-002',
      name: 'Gaseosa Cola 2.25L',
      sku: 'BEB-COL-225',
      category: 'Bebidas',
      price: 3890,
      stock: 8,
      status: 'bajo-stock',
      unit: 'botella',
    },
    {
      id: 'p-003',
      name: 'Detergente Limon 750ml',
      sku: 'LIM-DET-750',
      category: 'Limpieza',
      price: 3120,
      stock: 0,
      status: 'sin-stock',
      brand: 'Brillo Max',
      unit: 'unidad',
    },
    {
      id: 'p-004',
      name: 'Harina 000 1kg',
      sku: 'ALM-HAR-001',
      category: 'Panificados',
      price: 1670,
      stock: 25,
      status: 'activo',
      unit: 'paquete',
    },
    {
      id: 'p-005',
      name: 'Pilas AA x4',
      sku: 'VAR-PIL-AA4',
      category: 'Bazar',
      price: 4980,
      stock: 0,
      status: 'inactivo',
      notes: 'Producto discontinuado por proveedor',
    },
  ];

  getProducts(): Product[] {
    return [...this.products];
  }
}
