import { Routes } from '@angular/router';
import { InventoryManagement } from './pages/inventory-management/inventory-management';

export const INVENTORY_ROUTES: Routes = [
  { path: '', component: InventoryManagement, data: { title: 'Existencias' } },
];
