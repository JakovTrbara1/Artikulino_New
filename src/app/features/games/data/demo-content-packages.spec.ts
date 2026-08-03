import { DEMO_CONTENT_PACKAGES } from './demo-content-packages';
import { validateContentPackages } from '../models/content-package.validation';

describe('demonstration content packages', () => {
  it('covers the requested sounds, pairs, themes and difficulty levels', () => {
    const sounds = new Set(
      DEMO_CONTENT_PACKAGES.flatMap((item) =>
        [item.targetSound, item.contrastSound].filter(
          (sound): sound is string => sound !== undefined,
        ),
      ),
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

  it('marks every demonstration package as not professionally reviewed', () => {
    for (const contentPackage of DEMO_CONTENT_PACKAGES) {
      expect(contentPackage.professionalReview).toEqual({ status: 'NOT_REVIEWED' });
    }
  });

  it('keeps listening packages independent from target-sound metadata', () => {
    const listeningPackages = DEMO_CONTENT_PACKAGES.filter(
      (contentPackage) => contentPackage.gameType === 'listen-and-decide',
    );

    expect(listeningPackages).not.toHaveLength(0);
    for (const contentPackage of listeningPackages) {
      expect(contentPackage.targetSound).toBeUndefined();
      expect(contentPackage.contrastSound).toBeUndefined();
      expect(contentPackage.soundPair).toBeUndefined();
    }
  });

  it('classifies every sound-recognition package as detection or discrimination', () => {
    const recognitionPackages = DEMO_CONTENT_PACKAGES.filter(
      (contentPackage) => contentPackage.gameType === 'catch-the-sound',
    );

    for (const contentPackage of recognitionPackages) {
      expect(['DETECT', 'DISCRIMINATE']).toContain(contentPackage.recognitionMode);
    }
  });

  it('offers isolated-sound and whole-word pronunciation practice for every supported sound', () => {
    const pronunciationPackages = DEMO_CONTENT_PACKAGES.filter(
      (contentPackage) => contentPackage.gameType === 'pronunciation-practice',
    );

    expect(pronunciationPackages).toHaveLength(18);
    for (const sound of ['R', 'L', 'S', 'Z', 'Š', 'Ž', 'C', 'Č', 'Ć']) {
      const packagesForSound = pronunciationPackages.filter(
        (contentPackage) => contentPackage.targetSound === sound,
      );
      expect(packagesForSound.map((contentPackage) => contentPackage.practiceMode).sort()).toEqual([
        'SOUND',
        'WORD',
      ]);
    }

    for (const contentPackage of pronunciationPackages) {
      expect(contentPackage.questions).toHaveLength(4);
      expect(contentPackage.questions.every((question) => question.answers.length === 0)).toBe(
        true,
      );
      expect(
        contentPackage.questions.every((question) => question.correctAnswerIds.length === 0),
      ).toBe(true);
    }
  });

  it('uses the optimized catalog illustration for every supported theme', () => {
    const expectedSources = new Map([
      ['hrana', '/assets/games/themes/food.webp'],
      ['kuća', '/assets/games/themes/home.webp'],
      ['priroda', '/assets/games/themes/nature.webp'],
      ['životinje', '/assets/games/themes/animals.webp'],
      ['prijevoz', '/assets/games/themes/transport.webp'],
      ['odjeća', '/assets/games/themes/clothing.webp'],
      ['škola', '/assets/games/themes/school.webp'],
      ['igračke', '/assets/games/themes/toys.webp'],
    ]);

    for (const contentPackage of DEMO_CONTENT_PACKAGES) {
      expect(contentPackage.catalogImage?.src).toBe(expectedSources.get(contentPackage.theme));
      expect(contentPackage.catalogImage?.alt.trim()).toBeTruthy();
    }
  });

  it('uses optimized local images with emoji fallbacks for the priority food package', () => {
    const foodPackage = DEMO_CONTENT_PACKAGES.find(
      (contentPackage) => contentPackage.id === 'slusaj-hrana-s-lagano',
    );

    expect(foodPackage?.questions.map((question) => question.image)).toEqual([
      {
        src: '/assets/games/food/apple.webp',
        emoji: '🍎',
        alt: 'Ilustracija za pojam Jabuka',
      },
      {
        src: '/assets/games/food/carrot.webp',
        emoji: '🥕',
        alt: 'Ilustracija za pojam Mrkva',
      },
      {
        src: '/assets/games/food/banana.webp',
        emoji: '🍌',
        alt: 'Ilustracija za pojam Banana',
      },
      {
        src: '/assets/games/food/potato.webp',
        emoji: '🥔',
        alt: 'Ilustracija za pojam Krumpir',
      },
    ]);
  });

  it('passes reusable content validation', () => {
    expect(validateContentPackages(DEMO_CONTENT_PACKAGES)).toEqual([]);
  });
});
