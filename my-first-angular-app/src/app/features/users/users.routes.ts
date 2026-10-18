import { Routes } from '@angular/router';
import { UserManagement } from './pages/user-management/user-management';

export const USERS_ROUTES: Routes = [
  { path: '', component: UserManagement, data: { title: 'Usuarios' } },
];
