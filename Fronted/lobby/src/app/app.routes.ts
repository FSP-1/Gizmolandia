import { Routes } from '@angular/router';
import { UserFormComponent } from './components/user-form/user-form';
import { HomeComponent } from './components/home/home';
import { CodingComponent } from './components/coding/coding';
import { GeneralChatComponent } from './components/chat/general-chat/general-chat';
import { GamesComponent } from './components/games/games';

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
    path: 'home/games',
    component: GamesComponent,
    title: 'Gizmolandia | Juegos'
  },
  {
    path: 'home/coding',
    component: CodingComponent,
    title: 'Gizmolandia | Coding'
  },
  {
    path: 'home/games/:game',
    component: GamesComponent,
    title: 'Gizmolandia | Juego'
  },
  {
    path: 'home/chat',
    component: GeneralChatComponent,
    title: 'Gizmolandia | Chat'
  },
  {
    path: '**',
    redirectTo: 'auth'
  }
];