import { DEMO_CONTENT_PACKAGES } from './demo-content-packages';

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

  it('contains valid configurable questions and scoring for every package', () => {
    for (const contentPackage of DEMO_CONTENT_PACKAGES) {
      expect(contentPackage.schemaVersion).toBe(1);
      expect(contentPackage.questions.length).toBeGreaterThanOrEqual(4);
      expect(contentPackage.scoring.basePoints).toBeGreaterThan(0);
      expect(contentPackage.scoring.maxAttempts).toBeGreaterThan(0);

      for (const question of contentPackage.questions) {
        expect(question.spokenText.length).toBeGreaterThan(0);
        expect(question.answers.length).toBeGreaterThanOrEqual(2);
        expect(question.correctAnswerIds.length).toBeGreaterThan(0);
        expect(
          question.correctAnswerIds.every((id) =>
            question.answers.some((answer) => answer.id === id),
          ),
        ).toBe(true);
      }
    }
  });

  it('avoids repeated target sounds in position-game demo words', () => {
    const positionPackages = DEMO_CONTENT_PACKAGES.filter(
      (item) => item.gameType === 'sound-position',
    );

    for (const contentPackage of positionPackages) {
      for (const question of contentPackage.questions) {
        const target = (question.targetSound ?? contentPackage.targetSound).toLocaleLowerCase(
          'hr-HR',
        );
        const occurrences = question.spokenText
          .toLocaleLowerCase('hr-HR')
          .split('')
          .filter((character) => character === target).length;
        expect(occurrences, `${question.spokenText} treba sadržavati jedan glas ${target}`).toBe(1);
      }
    }
  });
});
