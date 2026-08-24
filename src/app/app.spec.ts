import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { App } from './app';
import { routes } from './app.routes';

describe('App', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [provideRouter(routes)],
    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  it('should render the shared navigation', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.brand')?.textContent).toContain('Artikulino');
    expect(compiled.querySelectorAll('nav a')).toHaveLength(4);
    expect(compiled.querySelector('app-prototype-notice')).toBeNull();
  });

  it('marks the current navigation destination with its own palette hook', async () => {
    const fixture = TestBed.createComponent(App);
    const router = TestBed.inject(Router);

    await router.navigateByUrl('/igre');
    await fixture.whenStable();
    fixture.detectChanges();

    const activeLink = fixture.nativeElement.querySelector('nav a.active') as HTMLAnchorElement;
    expect(activeLink.dataset['nav']).toBe('games');
    expect(activeLink.getAttribute('aria-current')).toBe('page');
  });
});
