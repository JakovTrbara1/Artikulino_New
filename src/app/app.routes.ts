import { Routes } from '@angular/router';
import {
  authenticatedGuard,
  parentGameGuard,
  therapistGuard,
} from './core/guards/prototype-auth.guards';

export const routes: Routes = [
  {
    path: '',
    title: 'Artikulino – naslovnica',
    loadComponent: () => import('./features/home/pages/home.page').then((m) => m.HomePage),
  },
  {
    path: 'igre',
    title: 'Vježbe i igre | Artikulino',
    loadChildren: () => import('./features/games/games.routes').then((m) => m.GAME_ROUTES),
  },
  {
    path: 'prijava',
    title: 'Demo prijava | Artikulino',
    loadComponent: () => import('./features/auth/pages/login.page').then((m) => m.LoginPage),
  },
  {
    path: 'profili',
    title: 'Demo profili | Artikulino',
    canActivate: [authenticatedGuard],
    loadComponent: () =>
      import('./features/profiles/pages/profiles.page').then((m) => m.ProfilesPage),
  },
  {
    path: 'napredak',
    title: 'Napredak | Artikulino',
    canActivate: [parentGameGuard],
    loadComponent: () =>
      import('./features/progress/pages/progress.page').then((m) => m.ProgressPage),
  },
  {
    path: 'pregled-terapeuta',
    title: 'Pregled terapeuta | Artikulino',
    canActivate: [therapistGuard],
    loadComponent: () =>
      import('./features/therapist/pages/therapist-review.page').then((m) => m.TherapistReviewPage),
  },
  { path: '**', redirectTo: '' },
];
