import { Routes } from '@angular/router';
import { ActionManagement } from './pages/action-management/action-management';

export const ACTIONS_ROUTES: Routes = [
  { path: '', component: ActionManagement, data: { title: 'Acciones' } },
];
