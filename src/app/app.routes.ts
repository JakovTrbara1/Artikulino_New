import { Routes } from '@angular/router';

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
    path: 'napredak',
    title: 'Napredak | Artikulino',
    loadComponent: () =>
      import('./features/progress/pages/progress.page').then((m) => m.ProgressPage),
  },
  { path: '**', redirectTo: '' },
];
