import { routes } from './app.routes';

describe('application routes', () => {
  it('keeps public and prototype pages lazy loaded', () => {
    const routePaths = routes.map((route) => route.path);

    expect(routePaths).toEqual([
      '',
      'igre',
      'prijava',
      'profili',
      'napredak',
      'pregled-terapeuta',
      '**',
    ]);
    expect(routes[0].loadComponent).toBeTypeOf('function');
    expect(routes[1].loadChildren).toBeTypeOf('function');
    expect(routes[2].loadComponent).toBeTypeOf('function');
    expect(routes[3].canActivate).toHaveLength(1);
    expect(routes[3].loadComponent).toBeTypeOf('function');
    expect(routes[4].loadComponent).toBeTypeOf('function');
    expect(routes[5].canActivate).toHaveLength(1);
    expect(routes[5].loadComponent).toBeTypeOf('function');
  });
});
