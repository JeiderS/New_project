import { Routes } from '@angular/router';
import { RoleManagement } from './pages/role-management/role-management';

export const ROLES_ROUTES: Routes = [
  { path: '', component: RoleManagement, data: { title: 'Roles' } },
];
