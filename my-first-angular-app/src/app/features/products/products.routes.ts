import { Routes } from '@angular/router';
import { Products } from './pages/products/products.component';

export const PRODUCTS_ROUTES: Routes = [
  { path: '', component: Products, data: { title: 'Products' } },
];
