import { Routes } from '@angular/router';
import { SaleManagement } from './pages/sale-management/sale-management';
import { SaleDetailPage } from './pages/sale-detail/sale-detail';

export const SALES_ROUTES: Routes = [
  { path: '', component: SaleManagement, data: { title: 'Ventas' } },
  { path: ':id', component: SaleDetailPage, data: { title: 'Detalle de venta' } },
];
