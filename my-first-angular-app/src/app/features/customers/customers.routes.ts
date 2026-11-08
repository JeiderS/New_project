import { Routes } from '@angular/router';
import { CustomerManagement } from './pages/customer-management/customer-management';

export const CUSTOMERS_ROUTES: Routes = [
  { path: '', component: CustomerManagement, data: { title: 'Clientes' } },
];
