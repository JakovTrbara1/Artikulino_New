import {
  ContentPackage,
  ProfessionalReview,
  ScoringRules,
  SUPPORTED_SOUND_PAIRS,
  SUPPORTED_TARGET_SOUNDS,
} from './content-package.model';

export type ContentValidationIssueCode =
  | 'unsupported-schema-version'
  | 'duplicate-package-id'
  | 'duplicate-question-id'
  | 'duplicate-answer-id'
  | 'required-text'
  | 'missing-questions'
  | 'insufficient-answers'
  | 'missing-correct-answer'
  | 'unknown-correct-answer'
  | 'unsupported-sound'
  | 'invalid-sound-pair'
  | 'invalid-scoring'
  | 'missing-image-alt'
  | 'invalid-target-occurrence'
  | 'missing-professional-review'
  | 'invalid-review-status'
  | 'invalid-review-metadata';

export interface ContentValidationIssue {
  readonly code: ContentValidationIssueCode;
  readonly path: string;
  readonly message: string;
}

const supportedSounds = new Set<string>(SUPPORTED_TARGET_SOUNDS);
const supportedPairs = new Set<string>(SUPPORTED_SOUND_PAIRS);

export function validateContentPackages(
  packages: readonly ContentPackage[],
): readonly ContentValidationIssue[] {
  const issues: ContentValidationIssue[] = [];
  const packageIds = new Set<string>();
  const questionIds = new Set<string>();

  packages.forEach((contentPackage, packageIndex) => {
    const packagePath = `packages[${packageIndex}]`;

    if (contentPackage.schemaVersion !== 1) {
      addIssue(
        issues,
        'unsupported-schema-version',
        `${packagePath}.schemaVersion`,
        `Verzija sheme "${String(contentPackage.schemaVersion)}" nije podržana.`,
      );
    }

    validateRequiredText(issues, contentPackage.id, `${packagePath}.id`, 'ID paketa');
    validateRequiredText(issues, contentPackage.name, `${packagePath}.name`, 'Naziv paketa');
    validateRequiredText(
      issues,
      contentPackage.description,
      `${packagePath}.description`,
      'Opis paketa',
    );
    validateRequiredText(
      issues,
      contentPackage.objective,
      `${packagePath}.objective`,
      'Cilj paketa',
    );
    validateRequiredText(
      issues,
      contentPackage.targetSound,
      `${packagePath}.targetSound`,
      'Ciljni glas',
    );
    validateRequiredText(issues, contentPackage.theme, `${packagePath}.theme`, 'Tema paketa');

    if (contentPackage.id.trim()) {
      if (packageIds.has(contentPackage.id)) {
        addIssue(
          issues,
          'duplicate-package-id',
          `${packagePath}.id`,
          `ID paketa "${contentPackage.id}" već je upotrijebljen.`,
        );
      }
      packageIds.add(contentPackage.id);
    }

    validateSound(issues, contentPackage.targetSound, `${packagePath}.targetSound`);
    if (contentPackage.contrastSound !== undefined) {
      validateRequiredText(
        issues,
        contentPackage.contrastSound,
        `${packagePath}.contrastSound`,
        'Kontrastni glas',
      );
      validateSound(issues, contentPackage.contrastSound, `${packagePath}.contrastSound`);
    }
    validateSoundPair(issues, contentPackage, packagePath);
    validateScoring(issues, contentPackage.scoring, `${packagePath}.scoring`);
    validateProfessionalReview(
      issues,
      contentPackage.professionalReview,
      `${packagePath}.professionalReview`,
    );

    if (contentPackage.questions.length === 0) {
      addIssue(
        issues,
        'missing-questions',
        `${packagePath}.questions`,
        'Paket mora sadržavati najmanje jedno pitanje.',
      );
    }

    contentPackage.questions.forEach((question, questionIndex) => {
      const questionPath = `${packagePath}.questions[${questionIndex}]`;

      validateRequiredText(issues, question.id, `${questionPath}.id`, 'ID pitanja');
      validateRequiredText(issues, question.taskText, `${questionPath}.taskText`, 'Tekst zadatka');
      validateRequiredText(
        issues,
        question.spokenText,
        `${questionPath}.spokenText`,
        'Tekst za izgovor',
      );
      validateRequiredText(
        issues,
        question.explanation,
        `${questionPath}.explanation`,
        'Objašnjenje odgovora',
      );

      if (question.id.trim()) {
        if (questionIds.has(question.id)) {
          addIssue(
            issues,
            'duplicate-question-id',
            `${questionPath}.id`,
            `ID pitanja "${question.id}" već je upotrijebljen.`,
          );
        }
        questionIds.add(question.id);
      }

      if (question.targetSound !== undefined) {
        validateRequiredText(
          issues,
          question.targetSound,
          `${questionPath}.targetSound`,
          'Ciljni glas pitanja',
        );
        validateSound(issues, question.targetSound, `${questionPath}.targetSound`);
      }

      if (question.image && !question.image.alt.trim()) {
        addIssue(
          issues,
          'missing-image-alt',
          `${questionPath}.image.alt`,
          'Slika pitanja mora imati smislen alternativni opis.',
        );
      }

      if (question.answers.length < 2) {
        addIssue(
          issues,
          'insufficient-answers',
          `${questionPath}.answers`,
          'Pitanje mora sadržavati najmanje dva ponuđena odgovora.',
        );
      }

      const answerIds = new Set<string>();
      question.answers.forEach((answer, answerIndex) => {
        const answerPath = `${questionPath}.answers[${answerIndex}]`;
        validateRequiredText(issues, answer.id, `${answerPath}.id`, 'ID odgovora');
        validateRequiredText(issues, answer.label, `${answerPath}.label`, 'Oznaka odgovora');

        if (answer.id.trim()) {
          if (answerIds.has(answer.id)) {
            addIssue(
              issues,
              'duplicate-answer-id',
              `${answerPath}.id`,
              `ID odgovora "${answer.id}" već postoji u ovom pitanju.`,
            );
          }
          answerIds.add(answer.id);
        }
      });

      if (question.correctAnswerIds.length === 0) {
        addIssue(
          issues,
          'missing-correct-answer',
          `${questionPath}.correctAnswerIds`,
          'Pitanje mora imati najmanje jedan točan odgovor.',
        );
      }

      question.correctAnswerIds.forEach((answerId, answerIndex) => {
        if (!answerIds.has(answerId)) {
          addIssue(
            issues,
            'unknown-correct-answer',
            `${questionPath}.correctAnswerIds[${answerIndex}]`,
            `Točan odgovor "${answerId}" ne postoji među ponuđenim odgovorima.`,
          );
        }
      });

      if (contentPackage.gameType === 'sound-position' && question.spokenText.trim()) {
        validateTargetOccurrence(
          issues,
          question.spokenText,
          question.targetSound ?? contentPackage.targetSound,
          questionPath,
        );
      }
    });
  });

  return issues;
}

function validateRequiredText(
  issues: ContentValidationIssue[],
  value: string,
  path: string,
  label: string,
): void {
  if (!value.trim()) {
    addIssue(issues, 'required-text', path, `Polje "${label}" ne smije biti prazno.`);
  }
}

function validateSound(issues: ContentValidationIssue[], sound: string, path: string): void {
  if (sound.trim() && !supportedSounds.has(sound)) {
    addIssue(issues, 'unsupported-sound', path, `Glas "${sound}" nije podržan.`);
  }
}

function validateSoundPair(
  issues: ContentValidationIssue[],
  contentPackage: ContentPackage,
  packagePath: string,
): void {
  if (!contentPackage.soundPair) {
    return;
  }

  const pair = `${contentPackage.soundPair.primary}/${contentPackage.soundPair.contrast}`;
  const isConsistent =
    supportedPairs.has(pair) &&
    contentPackage.soundPair.primary === contentPackage.targetSound &&
    contentPackage.soundPair.contrast === contentPackage.contrastSound;

  if (!isConsistent) {
    addIssue(
      issues,
      'invalid-sound-pair',
      `${packagePath}.soundPair`,
      `Par glasova "${pair}" nije podržan ili nije usklađen s ciljnim i kontrastnim glasom paketa.`,
    );
  }
}

function validateScoring(
  issues: ContentValidationIssue[],
  scoring: ScoringRules,
  scoringPath: string,
): void {
  validateScoringValue(
    issues,
    Number.isFinite(scoring.basePoints) && scoring.basePoints > 0,
    `${scoringPath}.basePoints`,
    'Osnovni bodovi moraju biti konačan broj veći od nule.',
  );
  validateScoringValue(
    issues,
    Number.isFinite(scoring.secondAttemptMultiplier) &&
      scoring.secondAttemptMultiplier >= 0 &&
      scoring.secondAttemptMultiplier <= 1,
    `${scoringPath}.secondAttemptMultiplier`,
    'Množitelj drugog pokušaja mora biti konačan broj između 0 i 1.',
  );
  validateScoringValue(
    issues,
    Number.isInteger(scoring.streakLength) && scoring.streakLength > 0,
    `${scoringPath}.streakLength`,
    'Duljina niza mora biti pozitivan cijeli broj.',
  );
  validateScoringValue(
    issues,
    Number.isFinite(scoring.streakBonus) && scoring.streakBonus >= 0,
    `${scoringPath}.streakBonus`,
    'Bonus za niz mora biti konačan nenegativan broj.',
  );
  validateScoringValue(
    issues,
    Number.isFinite(scoring.replayPenalty) && scoring.replayPenalty >= 0,
    `${scoringPath}.replayPenalty`,
    'Kazna za ponovno slušanje mora biti konačan nenegativan broj.',
  );
  validateScoringValue(
    issues,
    Number.isInteger(scoring.maxAttempts) && scoring.maxAttempts > 0,
    `${scoringPath}.maxAttempts`,
    'Najveći broj pokušaja mora biti pozitivan cijeli broj.',
  );
}

function validateProfessionalReview(
  issues: ContentValidationIssue[],
  review: ProfessionalReview | undefined,
  reviewPath: string,
): void {
  if (!review) {
    addIssue(
      issues,
      'missing-professional-review',
      reviewPath,
      'Paket mora imati zabilježen status stručne provjere.',
    );
    return;
  }

  if (review.status === 'NOT_REVIEWED') {
    if (review.reviewerName !== undefined || review.reviewedAt !== undefined) {
      addIssue(
        issues,
        'invalid-review-metadata',
        reviewPath,
        'Paket bez stručne provjere ne smije sadržavati podatke o provjeri.',
      );
    }
    return;
  }

  if (review.status !== 'PROFESSIONALLY_REVIEWED') {
    addIssue(
      issues,
      'invalid-review-status',
      `${reviewPath}.status`,
      `Status stručne provjere "${String(review.status)}" nije podržan.`,
    );
    return;
  }

  if (!review.reviewerName?.trim()) {
    addIssue(
      issues,
      'invalid-review-metadata',
      `${reviewPath}.reviewerName`,
      'Stručno pregledan paket mora sadržavati ime pregledavatelja.',
    );
  }

  if (!isIsoDate(review.reviewedAt)) {
    addIssue(
      issues,
      'invalid-review-metadata',
      `${reviewPath}.reviewedAt`,
      'Stručno pregledan paket mora sadržavati valjani datum u obliku GGGG-MM-DD.',
    );
  }
}

function isIsoDate(value: string | undefined): boolean {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }

  const parsedDate = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(parsedDate.valueOf()) && parsedDate.toISOString().slice(0, 10) === value;
}

function validateScoringValue(
  issues: ContentValidationIssue[],
  isValid: boolean,
  path: string,
  message: string,
): void {
  if (!isValid) {
    addIssue(issues, 'invalid-scoring', path, message);
  }
}

function validateTargetOccurrence(
  issues: ContentValidationIssue[],
  spokenText: string,
  targetSound: string,
  questionPath: string,
): void {
  if (!supportedSounds.has(targetSound)) {
    return;
  }

  const normalizedTarget = targetSound.toLocaleLowerCase('hr-HR');
  const occurrences = [...spokenText.toLocaleLowerCase('hr-HR')].filter(
    (character) => character === normalizedTarget,
  ).length;

  if (occurrences !== 1) {
    addIssue(
      issues,
      'invalid-target-occurrence',
      `${questionPath}.spokenText`,
      `Tekst za igru položaja mora sadržavati glas ${targetSound} točno jednom; pronađeno: ${occurrences}.`,
    );
  }
}

function addIssue(
  issues: ContentValidationIssue[],
  code: ContentValidationIssueCode,
  path: string,
  message: string,
): void {
  issues.push({ code, path, message });
}
