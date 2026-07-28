import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { PrototypeAuthService } from '../services/prototype-auth.service';

export const authenticatedGuard: CanActivateFn = (_route, state) => {
  const auth = inject(PrototypeAuthService);
  return auth.isAuthenticated()
    ? true
    : inject(Router).createUrlTree(['/prijava'], {
        queryParams: { returnUrl: state.url },
      });
};

export const parentGameGuard: CanActivateFn = (_route, state) => {
  const auth = inject(PrototypeAuthService);
  const router = inject(Router);

  if (!auth.isAuthenticated()) {
    return router.createUrlTree(['/prijava'], { queryParams: { returnUrl: state.url } });
  }
  if (!auth.isParent()) {
    return router.createUrlTree(['/profili']);
  }
  return auth.activeChild()
    ? true
    : router.createUrlTree(['/profili'], { queryParams: { returnUrl: state.url } });
};

export const therapistGuard: CanActivateFn = () => {
  const auth = inject(PrototypeAuthService);
  return auth.isTherapist() ? true : inject(Router).createUrlTree(['/prijava']);
};
