import { Routes } from '@angular/router';
import { InventoryManagement } from './pages/inventory-management/inventory-management';
import { InventoryHistory } from './pages/inventory-history/inventory-history';

export const INVENTORY_ROUTES: Routes = [
  { path: '', component: InventoryManagement, data: { title: 'Existencias' } },
  { path: 'history', component: InventoryHistory, data: { title: 'Historial de movimientos' } },
];
