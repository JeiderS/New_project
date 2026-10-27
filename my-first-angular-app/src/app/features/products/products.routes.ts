import { Routes } from '@angular/router';
import { ProductManagement } from './pages/product-management/product-management';

export const PRODUCTS_ROUTES: Routes = [
  { path: '', component: ProductManagement, data: { title: 'Productos' } },
];
