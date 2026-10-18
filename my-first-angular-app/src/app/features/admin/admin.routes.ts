import { Routes } from '@angular/router';
import { Admin } from './pages/admin/admin.component';

export const ADMIN_ROUTES: Routes = [
  {
    path: '',
    component: Admin,
    data: { title: 'Admin' },
  },
];
