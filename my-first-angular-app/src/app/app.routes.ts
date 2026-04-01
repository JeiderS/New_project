import { Routes } from '@angular/router';
import { Login } from './public/login/login';
import { NotFound } from './public/not-found/not-found';
import { Dashboard } from './pages/dashboard/dashboard';
import { Admin } from './pages/admin/admin';
import { Products } from './pages/products/products';
import { AppShell } from './core/layout/app-shell/app-shell';
import { authGuard, authGuardLoggedIn } from './core/guards/auth.guard';

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
    component: AppShell,
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
