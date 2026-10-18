import { Routes } from '@angular/router';
import { ModuleManagement } from './pages/module-management/module-management';

export const MODULES_ROUTES: Routes = [
  { path: '', component: ModuleManagement, data: { title: 'Modulos' } },
];
