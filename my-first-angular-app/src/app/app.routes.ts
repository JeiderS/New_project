import { Routes } from '@angular/router';
import { Login } from './public/login/login';
import { NotFound } from './public/not-found/not-found';
import { Dashboard } from './pages/dashboard/dashboard';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full'
  },
  { 
    path: 'login', 
    component: Login 
  },
  {
    path: 'dashboard',
    component: Dashboard
  },
  {
    path: '**',
    component: NotFound
  }
];