import { Routes } from '@angular/router';

export const GAME_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./pages/game-catalog.page').then((m) => m.GameCatalogPage),
  },
  {
    path: ':packageId',
    loadComponent: () => import('./pages/game-player.page').then((m) => m.GamePlayerPage),
  },
];
