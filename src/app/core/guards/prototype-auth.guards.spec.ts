import { TestBed } from '@angular/core/testing';
import { Router, RouterStateSnapshot, UrlTree } from '@angular/router';
import { describe, expect, it, vi } from 'vitest';
import { PrototypeAuthService } from '../services/prototype-auth.service';
import { parentGameGuard, therapistGuard } from './prototype-auth.guards';

interface AuthState {
  authenticated: boolean;
  parent: boolean;
  therapist: boolean;
  child: object | null;
}

function configure(state: AuthState) {
  const tree = {} as UrlTree;
  const router = { createUrlTree: vi.fn(() => tree) };
  const auth = {
    isAuthenticated: () => state.authenticated,
    isParent: () => state.parent,
    isTherapist: () => state.therapist,
    activeChild: () => state.child,
  };
  TestBed.configureTestingModule({
    providers: [
      { provide: PrototypeAuthService, useValue: auth },
      { provide: Router, useValue: router },
    ],
  });
  return { router, tree };
}

describe('prototype route guards', () => {
  it('redirects an anonymous game start to login with its return URL', () => {
    const { router, tree } = configure({
      authenticated: false,
      parent: false,
      therapist: false,
      child: null,
    });

    const result = TestBed.runInInjectionContext(() =>
      parentGameGuard({} as never, { url: '/igre/demo' } as RouterStateSnapshot),
    );

    expect(result).toBe(tree);
    expect(router.createUrlTree).toHaveBeenCalledWith(['/prijava'], {
      queryParams: { returnUrl: '/igre/demo' },
    });
  });

  it('requires a selected child before a parent starts a game', () => {
    const { router, tree } = configure({
      authenticated: true,
      parent: true,
      therapist: false,
      child: null,
    });

    const result = TestBed.runInInjectionContext(() =>
      parentGameGuard({} as never, { url: '/igre/demo' } as RouterStateSnapshot),
    );

    expect(result).toBe(tree);
    expect(router.createUrlTree).toHaveBeenCalledWith(['/profili'], {
      queryParams: { returnUrl: '/igre/demo' },
    });
  });

  it('allows a parent with a selected fictional child to start a game', () => {
    configure({
      authenticated: true,
      parent: true,
      therapist: false,
      child: { id: 'demo-child' },
    });

    const result = TestBed.runInInjectionContext(() =>
      parentGameGuard({} as never, { url: '/igre/demo' } as RouterStateSnapshot),
    );

    expect(result).toBe(true);
  });

  it('allows only the therapist role through the therapist guard', () => {
    configure({
      authenticated: true,
      parent: false,
      therapist: true,
      child: null,
    });
    expect(TestBed.runInInjectionContext(() => therapistGuard({} as never, {} as never))).toBe(
      true,
    );
  });
});
