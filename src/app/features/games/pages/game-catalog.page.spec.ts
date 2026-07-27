import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { GAME_TYPE_DESCRIPTIONS, GameType } from '../models/content-package.model';
import { ContentPackagesService } from '../services/content-packages.service';
import { GameCatalogPage } from './game-catalog.page';

describe('GameCatalogPage', () => {
  let fixture: ComponentFixture<GameCatalogPage>;
  let content: ContentPackagesService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GameCatalogPage],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(GameCatalogPage);
    content = fixture.debugElement.injector.get(ContentPackagesService);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  });

  afterEach(() => TestBed.resetTestingModule());

  it('uses the three game types as toggle filters and removes the game select', () => {
    const typeButtons = queryAll<HTMLButtonElement>('.game-type-toggle');

    expect(typeButtons).toHaveLength(3);
    expect(queryAll<HTMLSelectElement>('.filters select')).toHaveLength(3);
    expect(query<HTMLSelectElement>('select[data-filter="game-type"]')).toBeNull();
    expect(typeButtons.every((button) => button.getAttribute('aria-pressed') === 'false')).toBe(
      true,
    );
  });

  it('filters by game type and clears the filter when the selected type is activated again', () => {
    const type: GameType = 'catch-the-sound';
    const toggle = requireElement<HTMLButtonElement>(`button[data-type="${type}"]`);

    toggle.click();
    fixture.detectChanges();

    expect(toggle.getAttribute('aria-pressed')).toBe('true');
    expect(queryAll<HTMLElement>('.package-card')).toHaveLength(
      content.filter({ gameType: type }).length,
    );
    expect(
      queryAll<HTMLElement>('.package-card').every(
        (card) => card.getAttribute('data-type') === type,
      ),
    ).toBe(true);

    toggle.click();
    fixture.detectChanges();

    expect(toggle.getAttribute('aria-pressed')).toBe('false');
    expect(queryAll<HTMLElement>('.package-card')).toHaveLength(content.packages().length);
  });

  it('shows an empty state for incompatible filters and can clear every filter', () => {
    requireElement<HTMLButtonElement>('button[data-type="listen-and-decide"]').click();
    fixture.detectChanges();

    const themeSelect = requireElement<HTMLSelectElement>('select[data-filter="theme"]');
    themeSelect.value = 'igračke';
    themeSelect.dispatchEvent(new Event('change'));
    fixture.detectChanges();

    expect(query<HTMLElement>('.package-grid')).toBeNull();
    expect(requireElement<HTMLElement>('.empty-results').textContent).toContain(
      'Nema paketa s tim odabirom.',
    );

    requireElement<HTMLButtonElement>('.empty-results button').click();
    fixture.detectChanges();

    expect(queryAll<HTMLElement>('.package-card')).toHaveLength(content.packages().length);
    expect(themeSelect.value).toBe('');
  });

  it('opens only one accessible information popover and closes it as expected', () => {
    const infoButtons = queryAll<HTMLButtonElement>('.info-button');
    expect(infoButtons.length).toBeGreaterThan(1);

    infoButtons[0].click();
    fixture.detectChanges();

    expect(infoButtons[0].getAttribute('aria-expanded')).toBe('true');
    expect(queryAll<HTMLElement>('.info-popover')).toHaveLength(1);
    expect(requireElement<HTMLElement>('.info-popover').textContent).toContain('Ciljni glas');
    expect(requireElement<HTMLElement>('.info-popover').textContent).toContain('Razina');
    expect(requireElement<HTMLElement>('.info-popover').textContent).toContain(
      GAME_TYPE_DESCRIPTIONS['listen-and-decide'],
    );

    infoButtons[1].click();
    fixture.detectChanges();

    expect(infoButtons[0].getAttribute('aria-expanded')).toBe('false');
    expect(infoButtons[1].getAttribute('aria-expanded')).toBe('true');
    expect(queryAll<HTMLElement>('.info-popover')).toHaveLength(1);

    infoButtons[1].click();
    fixture.detectChanges();
    expect(query<HTMLElement>('.info-popover')).toBeNull();

    infoButtons[0].click();
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    fixture.detectChanges();
    expect(query<HTMLElement>('.info-popover')).toBeNull();

    infoButtons[0].click();
    document.body.click();
    fixture.detectChanges();
    expect(query<HTMLElement>('.info-popover')).toBeNull();
  });

  it('keeps the card body as the game link with only artwork, title, and subtitle', () => {
    const cards = queryAll<HTMLElement>('.package-card');

    expect(cards).toHaveLength(content.packages().length);
    for (const [index, card] of cards.entries()) {
      const contentPackage = content.packages()[index];
      const link = card.querySelector('.package-link') as HTMLAnchorElement | null;

      expect(link).not.toBeNull();
      expect(link?.getAttribute('href')).toBe(`/igre/${encodeURIComponent(contentPackage.id)}`);
      expect(link?.querySelector('img')?.getAttribute('alt')).toBe(
        contentPackage.catalogImage?.alt,
      );
      expect(link?.querySelector('h3')?.textContent?.trim()).toBe(contentPackage.name);
      expect(link?.querySelector('.package-copy > span')?.textContent?.trim()).toBe(
        contentPackage.description,
      );
      expect(link?.querySelector('button, dl')).toBeNull();
      expect(card.querySelector('.info-button')).not.toBeNull();
    }
  });

  function query<T extends Element>(selector: string): T | null {
    return fixture.nativeElement.querySelector(selector) as T | null;
  }

  function queryAll<T extends Element>(selector: string): T[] {
    return [...fixture.nativeElement.querySelectorAll(selector)] as T[];
  }

  function requireElement<T extends Element>(selector: string): T {
    const element = query<T>(selector);
    if (!element) {
      throw new Error(`Element "${selector}" nije pronađen.`);
    }
    return element;
  }
});
