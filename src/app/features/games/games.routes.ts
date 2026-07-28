import { Routes } from '@angular/router';
import { parentGameGuard } from '../../core/guards/prototype-auth.guards';

export const GAME_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./pages/game-catalog.page').then((m) => m.GameCatalogPage),
  },
  {
    path: ':packageId',
    canActivate: [parentGameGuard],
    loadComponent: () => import('./pages/game-player.page').then((m) => m.GamePlayerPage),
  },
];
