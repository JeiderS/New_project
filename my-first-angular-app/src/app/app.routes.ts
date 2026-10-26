import { Routes } from '@angular/router';
import { Login } from './core/auth/pages/login/login';
import { NotFound } from './core/auth/pages/not-found/not-found';
import { Dashboard } from './features/dashboard/pages/dashboard/dashboard.component';
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
        loadChildren: () =>
          import('./features/admin/admin.routes').then((m) => m.ADMIN_ROUTES),
      },
      {
        path: 'products',
        loadChildren: () =>
          import('./features/products/products.routes').then((m) => m.PRODUCTS_ROUTES),
      },
      {
        path: 'users',
        loadChildren: () =>
          import('./features/users/users.routes').then((m) => m.USERS_ROUTES),
      },
      {
        path: 'modules',
        loadChildren: () =>
          import('./features/modules/modules.routes').then((m) => m.MODULES_ROUTES),
      },
      {
        path: 'roles',
        loadChildren: () =>
          import('./features/roles/roles.routes').then((m) => m.ROLES_ROUTES),
      },
      {
        path: 'actions',
        loadChildren: () =>
          import('./features/actions/actions.routes').then((m) => m.ACTIONS_ROUTES),
      },
      {
        path: 'Categories',
        loadChildren: () =>
          import('./features/categories/categories.routes').then((m) => m.CATEGORIES_ROUTES),
      },
    ],
  },
  {
    path: '**',
    component: NotFound
  }
];
