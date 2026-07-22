import { routes } from './app.routes';

describe('application routes', () => {
  it('keeps the three main pages lazy loaded', () => {
    const routePaths = routes.map((route) => route.path);

    expect(routePaths).toEqual(['', 'igre', 'napredak', '**']);
    expect(routes[0].loadComponent).toBeTypeOf('function');
    expect(routes[1].loadChildren).toBeTypeOf('function');
    expect(routes[2].loadComponent).toBeTypeOf('function');
  });
});
