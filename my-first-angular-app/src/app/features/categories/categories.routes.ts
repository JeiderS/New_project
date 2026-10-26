import { Routes } from '@angular/router';
import { CategoryManagement } from './pages/category-management/category-management';

export const CATEGORIES_ROUTES: Routes = [
  { path: '', component: CategoryManagement, data: { title: 'Categorias' } },
];
