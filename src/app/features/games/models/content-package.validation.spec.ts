import {
  AnswerOption,
  ContentPackage,
  ContentQuestion,
  ScoringRules,
} from './content-package.model';
import { validateContentPackages } from './content-package.validation';

const answers: readonly AnswerOption[] = [
  { id: 'yes', label: 'Da' },
  { id: 'no', label: 'Ne' },
];

const createQuestion = (overrides: Partial<ContentQuestion> = {}): ContentQuestion => ({
  id: 'question-1',
  taskText: 'Poslušaj i odaberi odgovor.',
  spokenText: 'sir',
  answers,
  correctAnswerIds: ['yes'],
  explanation: 'U riječi sir čujemo glas S.',
  ...overrides,
});

const defaultScoring: ScoringRules = {
  basePoints: 10,
  secondAttemptMultiplier: 0.6,
  streakLength: 3,
  streakBonus: 5,
  replayPenalty: 0,
  maxAttempts: 2,
};

const createPackage = (overrides: Partial<ContentPackage> = {}): ContentPackage => ({
  schemaVersion: 1,
  id: 'package-1',
  gameType: 'catch-the-sound',
  name: 'Uhvati glas S',
  description: 'Prepoznaj glas S.',
  objective: 'Slušno prepoznavanje glasa S.',
  targetSound: 'S',
  theme: 'hrana',
  difficulty: 'EASY',
  scoring: defaultScoring,
  professionalReview: { status: 'NOT_REVIEWED' },
  questions: [createQuestion()],
  ...overrides,
});

describe('content package validation', () => {
  it('returns no issues and does not mutate valid packages', () => {
    const packages = [createPackage()];
    const snapshot = JSON.stringify(packages);

    expect(validateContentPackages(packages)).toEqual([]);
    expect(JSON.stringify(packages)).toBe(snapshot);
  });

  it('reports an unsupported schema version', () => {
    const invalidPackage = {
      ...createPackage(),
      schemaVersion: 2,
    } as unknown as ContentPackage;

    expect(validateContentPackages([invalidPackage])).toContainEqual({
      code: 'unsupported-schema-version',
      path: 'packages[0].schemaVersion',
      message: 'Verzija sheme "2" nije podržana.',
    });
  });

  it('reports duplicate package, question and answer ids', () => {
    const duplicateAnswers: readonly AnswerOption[] = [
      { id: 'same', label: 'Prvi' },
      { id: 'same', label: 'Drugi' },
    ];
    const packages = [
      createPackage(),
      createPackage({
        questions: [
          createQuestion({
            answers: duplicateAnswers,
            correctAnswerIds: ['same'],
          }),
        ],
      }),
    ];

    const issues = validateContentPackages(packages);

    expect(issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          code: 'duplicate-package-id',
          path: 'packages[1].id',
        }),
        expect.objectContaining({
          code: 'duplicate-question-id',
          path: 'packages[1].questions[0].id',
        }),
        expect.objectContaining({
          code: 'duplicate-answer-id',
          path: 'packages[1].questions[0].answers[1].id',
        }),
      ]),
    );
  });

  it('reports missing text, questions, answers, correct answers and image alt text', () => {
    const incompleteQuestion = createQuestion({
      id: ' ',
      taskText: '',
      spokenText: ' ',
      explanation: '',
      targetSound: '',
      image: { emoji: '🍎', alt: ' ' },
      answers: [{ id: '', label: '' }],
      correctAnswerIds: ['missing'],
    });
    const noCorrectAnswer = createQuestion({
      id: 'question-2',
      correctAnswerIds: [],
    });
    const packages = [
      createPackage({
        id: '',
        name: ' ',
        description: '',
        objective: '',
        targetSound: '',
        contrastSound: '',
        theme: '',
        questions: [incompleteQuestion, noCorrectAnswer],
      }),
      createPackage({ id: 'package-2', questions: [] }),
    ];

    const issues = validateContentPackages(packages);
    const codes = issues.map((issue) => issue.code);

    expect(codes).toContain('required-text');
    expect(codes).toContain('missing-questions');
    expect(codes).toContain('insufficient-answers');
    expect(codes).toContain('missing-correct-answer');
    expect(codes).toContain('unknown-correct-answer');
    expect(codes).toContain('missing-image-alt');
    expect(issues).toContainEqual(
      expect.objectContaining({
        code: 'unknown-correct-answer',
        path: 'packages[0].questions[0].correctAnswerIds[0]',
      }),
    );
    expect(issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          code: 'required-text',
          path: 'packages[0].contrastSound',
        }),
        expect.objectContaining({
          code: 'required-text',
          path: 'packages[0].questions[0].targetSound',
        }),
      ]),
    );
  });

  it('reports unsupported sounds and inconsistent sound pairs', () => {
    const packages = [
      createPackage({
        targetSound: 'X',
        contrastSound: 'Y',
        soundPair: { primary: 'X', contrast: 'Y' },
        questions: [createQuestion({ targetSound: 'Q' })],
      }),
      createPackage({
        id: 'package-2',
        targetSound: 'S',
        contrastSound: 'Ž',
        soundPair: { primary: 'S', contrast: 'Š' },
        questions: [createQuestion({ id: 'question-2' })],
      }),
    ];

    const issues = validateContentPackages(packages);

    expect(issues.filter((issue) => issue.code === 'unsupported-sound')).toHaveLength(3);
    expect(issues.filter((issue) => issue.code === 'invalid-sound-pair')).toHaveLength(2);
  });

  it('reports every invalid scoring field', () => {
    const invalidScoring: ScoringRules = {
      basePoints: 0,
      secondAttemptMultiplier: 1.5,
      streakLength: 0,
      streakBonus: Number.NaN,
      replayPenalty: -1,
      maxAttempts: 1.5,
    };

    const issues = validateContentPackages([createPackage({ scoring: invalidScoring })]);
    const scoringIssues = issues.filter((issue) => issue.code === 'invalid-scoring');

    expect(scoringIssues).toHaveLength(6);
    expect(scoringIssues.map((issue) => issue.path)).toEqual([
      'packages[0].scoring.basePoints',
      'packages[0].scoring.secondAttemptMultiplier',
      'packages[0].scoring.streakLength',
      'packages[0].scoring.streakBonus',
      'packages[0].scoring.replayPenalty',
      'packages[0].scoring.maxAttempts',
    ]);
  });

  it('requires traceable professional review metadata', () => {
    const { professionalReview: _professionalReview, ...packageWithoutReview } = createPackage();
    const packages = [
      packageWithoutReview as ContentPackage,
      createPackage({
        id: 'package-2',
        professionalReview: {
          status: 'PROFESSIONALLY_REVIEWED',
        },
      }),
      createPackage({
        id: 'package-3',
        professionalReview: {
          status: 'NOT_REVIEWED',
          reviewerName: 'Primjer pregledavatelja',
        },
      }),
      createPackage({
        id: 'package-4',
        professionalReview: {
          status: 'UNKNOWN',
        } as unknown as ContentPackage['professionalReview'],
      }),
      createPackage({
        id: 'package-5',
        professionalReview: {
          status: 'PROFESSIONALLY_REVIEWED',
          reviewerName: 'Primjer pregledavatelja',
          reviewedAt: '2026-02-30',
        },
      }),
    ];

    const reviewIssues = validateContentPackages(packages).filter((issue) =>
      ['missing-professional-review', 'invalid-review-status', 'invalid-review-metadata'].includes(
        issue.code,
      ),
    );

    expect(reviewIssues).toEqual([
      expect.objectContaining({
        code: 'missing-professional-review',
        path: 'packages[0].professionalReview',
      }),
      expect.objectContaining({
        code: 'invalid-review-metadata',
        path: 'packages[1].professionalReview.reviewerName',
      }),
      expect.objectContaining({
        code: 'invalid-review-metadata',
        path: 'packages[1].professionalReview.reviewedAt',
      }),
      expect.objectContaining({
        code: 'invalid-review-metadata',
        path: 'packages[2].professionalReview',
      }),
      expect.objectContaining({
        code: 'invalid-review-status',
        path: 'packages[3].professionalReview.status',
      }),
      expect.objectContaining({
        code: 'invalid-review-metadata',
        path: 'packages[4].professionalReview.reviewedAt',
      }),
    ]);
  });

  it('accepts a professionally reviewed package with reviewer and ISO date', () => {
    const contentPackage = createPackage({
      professionalReview: {
        status: 'PROFESSIONALLY_REVIEWED',
        reviewerName: 'Primjer pregledavatelja',
        reviewedAt: '2026-07-23',
      },
    });

    expect(validateContentPackages([contentPackage])).toEqual([]);
  });

  it('reports missing and repeated target sounds in position questions', () => {
    const positionPackage = createPackage({
      gameType: 'sound-position',
      questions: [
        createQuestion({ id: 'missing-sound', spokenText: 'riba' }),
        createQuestion({ id: 'repeated-sound', spokenText: 'salsa' }),
        createQuestion({
          id: 'question-target',
          spokenText: 'žaba',
          targetSound: 'Ž',
        }),
      ],
    });

    const issues = validateContentPackages([positionPackage]);
    const positionIssues = issues.filter((issue) => issue.code === 'invalid-target-occurrence');

    expect(positionIssues).toHaveLength(2);
    expect(positionIssues.map((issue) => issue.path)).toEqual([
      'packages[0].questions[0].spokenText',
      'packages[0].questions[1].spokenText',
    ]);
  });
});
