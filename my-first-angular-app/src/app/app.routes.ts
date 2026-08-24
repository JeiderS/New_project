import { Routes } from '@angular/router';
import { Login } from './core/auth/pages/login/login';
import { NotFound } from './core/auth/pages/not-found/not-found';
import { Dashboard } from './features/dashboard/pages/dashboard/dashboard.component';
import { Admin } from './features/admin/pages/admin/admin.component';
import { Products } from './features/products/pages/products/products.component';
import { UserManagement } from './features/users/pages/user-management/user-management';
import { ModuleManagement } from './features/modules/pages/module-management/module-management';
import { RoleManagement } from './features/roles/pages/role-management/role-management';
import { AppShell } from './core/layout/app-shell/app-shell';
import { authGuard, authGuardLoggedIn } from './core/auth/guards/auth.guard';
import { LayoutComponent } from '@core/layout/layout/layout.component';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full'
  },
  { 
    path: 'login', 
    component: Login,
    canActivate: [authGuardLoggedIn]
  },
  {
    path: '',
    component: LayoutComponent,
    canActivate: [authGuard],
    children: [
      {
        path: 'dashboard',
        component: Dashboard,
        data: { title: 'Dashboard' },
      },
      {
        path: 'admin',
        component: Admin,
        data: { title: 'Admin' },
      },
      {
        path: 'products',
        component: Products,
        data: { title: 'Products' },
      },
      {
        path: 'users',
        component: UserManagement,
        data: { title: 'Usuarios' },
      },
      {
        path: 'modules',
        component: ModuleManagement,
        data: { title: 'Modulos' },
      },
      {
        path: 'roles',
        component: RoleManagement,
        data: { title: 'Roles' },
      },
    ],
  },
  {
    path: '**',
    component: NotFound
  }
];
