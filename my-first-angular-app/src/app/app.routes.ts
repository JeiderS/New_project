import { Routes } from '@angular/router';
import { Login } from './public/login/login';
import { NotFound } from './public/not-found/not-found';
import { Dashboard } from './pages/dashboard/dashboard';
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
    path: 'dashboard',
    component: Dashboard,
    canActivate: [authGuard]
  },
  {
    path: '**',
    component: NotFound
  }
];