import { Routes } from '@angular/router';
import { Login } from './core/auth/pages/login/login';
import { NotFound } from './core/auth/pages/not-found/not-found';
import { Dashboard } from './features/dashboard/pages/dashboard/dashboard.component';
import { Admin } from './features/admin/pages/admin/admin.component';
import { Products } from './features/products/pages/products/products.component';
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
      },
      {
        path: 'admin',
        component: Admin,
      },
      {
        path: 'products',
        component: Products,
      },
    ],
  },
  {
    path: '**',
    component: NotFound
  }
];
