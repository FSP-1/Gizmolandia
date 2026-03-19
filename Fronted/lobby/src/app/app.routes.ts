import { Routes } from '@angular/router';
import { UserFormComponent } from './components/user-form/user-form';
import { HomeComponent } from './components/home/home';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'auth',
    pathMatch: 'full'
  },
  {
    path: 'auth',
    component: UserFormComponent,
    title: 'Gizmolandia | Acceso'
  },
  {
    path: 'home',
    component: HomeComponent,
    title: 'Gizmolandia | Home'
  },
  {
    path: '**',
    redirectTo: 'auth'
  }
];