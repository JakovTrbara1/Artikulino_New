import { DEMO_CONTENT_PACKAGES } from './demo-content-packages';
import { validateContentPackages } from '../models/content-package.validation';

describe('demonstration content packages', () => {
  it('covers the requested sounds, pairs, themes and difficulty levels', () => {
    const sounds = new Set(
      DEMO_CONTENT_PACKAGES.flatMap((item) => [item.targetSound, item.contrastSound]),
    );
    const pairs = new Set(
      DEMO_CONTENT_PACKAGES.filter((item) => item.soundPair).map(
        (item) => `${item.soundPair?.primary}/${item.soundPair?.contrast}`,
      ),
    );
    const themes = new Set(DEMO_CONTENT_PACKAGES.map((item) => item.theme));
    const difficulties = new Set(DEMO_CONTENT_PACKAGES.map((item) => item.difficulty));

    for (const sound of ['R', 'L', 'S', 'Š', 'Z', 'Ž', 'C', 'Č', 'Ć'])
      expect(sounds.has(sound)).toBe(true);
    for (const pair of ['S/Š', 'Z/Ž', 'L/R', 'C/Č', 'Č/Ć']) expect(pairs.has(pair)).toBe(true);
    for (const theme of [
      'životinje',
      'hrana',
      'kuća',
      'priroda',
      'prijevoz',
      'odjeća',
      'škola',
      'igračke',
    ])
      expect(themes.has(theme)).toBe(true);
    expect(difficulties).toEqual(new Set(['EASY', 'MEDIUM', 'HARD']));
  });

  it('contains at least four questions in every demonstration package', () => {
    for (const contentPackage of DEMO_CONTENT_PACKAGES) {
      expect(contentPackage.questions.length).toBeGreaterThanOrEqual(4);
    }
  });

  it('passes reusable content validation', () => {
    expect(validateContentPackages(DEMO_CONTENT_PACKAGES)).toEqual([]);
  });
});
