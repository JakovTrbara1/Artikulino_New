import {
  ContentImage,
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
  | 'invalid-answer-count'
  | 'missing-correct-answer'
  | 'unknown-correct-answer'
  | 'unsupported-sound'
  | 'invalid-sound-pair'
  | 'missing-game-mode'
  | 'unexpected-game-mode'
  | 'invalid-sound-classification'
  | 'invalid-scoring'
  | 'missing-image-source'
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
    validateRequiredText(issues, contentPackage.theme, `${packagePath}.theme`, 'Tema paketa');
    if (contentPackage.catalogImage) {
      validateImage(
        issues,
        contentPackage.catalogImage,
        `${packagePath}.catalogImage`,
        'Ilustracija kataloga',
      );
    }

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

    if (contentPackage.targetSound !== undefined) {
      validateRequiredText(
        issues,
        contentPackage.targetSound,
        `${packagePath}.targetSound`,
        'Ciljni glas',
      );
      validateSound(issues, contentPackage.targetSound, `${packagePath}.targetSound`);
    }
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
    validateGameConfiguration(issues, contentPackage, packagePath);
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

      if (question.image) {
        validateImage(issues, question.image, `${questionPath}.image`, 'Slika pitanja');
      }

      if (contentPackage.gameType !== 'pronunciation-practice' && question.answers.length < 2) {
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

      if (
        contentPackage.gameType !== 'pronunciation-practice' &&
        question.correctAnswerIds.length === 0
      ) {
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

      validateQuestionContract(issues, contentPackage, questionIndex, questionPath);
    });
  });

  return issues;
}

function validateImage(
  issues: ContentValidationIssue[],
  image: ContentImage,
  imagePath: string,
  label: string,
): void {
  if (!image.src?.trim() && !image.emoji?.trim()) {
    addIssue(
      issues,
      'missing-image-source',
      imagePath,
      `${label} mora sadržavati putanju ili zamjenski emoji.`,
    );
  }

  if (!image.alt.trim()) {
    addIssue(
      issues,
      'missing-image-alt',
      `${imagePath}.alt`,
      `${label} mora imati smislen alternativni opis.`,
    );
  }
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

function validateGameConfiguration(
  issues: ContentValidationIssue[],
  contentPackage: ContentPackage,
  packagePath: string,
): void {
  const hasRecognitionMode = contentPackage.recognitionMode !== undefined;
  const hasPracticeMode = contentPackage.practiceMode !== undefined;

  if (contentPackage.gameType === 'catch-the-sound') {
    requireTargetSound(issues, contentPackage, packagePath);
    if (!hasRecognitionMode) {
      addIssue(
        issues,
        'missing-game-mode',
        `${packagePath}.recognitionMode`,
        'Igra prepoznavanja mora odrediti hvata li jedan glas ili razlikuje dva glasa.',
      );
    }
    if (hasPracticeMode) {
      addIssue(
        issues,
        'unexpected-game-mode',
        `${packagePath}.practiceMode`,
        'Način vježbanja izgovora dopušten je samo u igri izgovora.',
      );
    }

    if (
      contentPackage.recognitionMode === 'DETECT' &&
      (contentPackage.contrastSound !== undefined || contentPackage.soundPair !== undefined)
    ) {
      addIssue(
        issues,
        'unexpected-game-mode',
        `${packagePath}.recognitionMode`,
        'Igra hvatanja jednog glasa ne smije imati kontrastni par.',
      );
    }
    if (
      contentPackage.recognitionMode === 'DISCRIMINATE' &&
      (!contentPackage.contrastSound || !contentPackage.soundPair)
    ) {
      addIssue(
        issues,
        'missing-game-mode',
        `${packagePath}.soundPair`,
        'Igra razlikovanja mora imati ciljni i kontrastni glas te usklađen par.',
      );
    }
    return;
  }

  if (contentPackage.gameType === 'pronunciation-practice') {
    requireTargetSound(issues, contentPackage, packagePath);
    if (!hasPracticeMode) {
      addIssue(
        issues,
        'missing-game-mode',
        `${packagePath}.practiceMode`,
        'Igra izgovora mora odrediti vježba li se glas ili cijela riječ.',
      );
    }
    if (hasRecognitionMode) {
      addIssue(
        issues,
        'unexpected-game-mode',
        `${packagePath}.recognitionMode`,
        'Način prepoznavanja nije dopušten u igri izgovora.',
      );
    }
    return;
  }

  if (hasRecognitionMode) {
    addIssue(
      issues,
      'unexpected-game-mode',
      `${packagePath}.recognitionMode`,
      'Način prepoznavanja dopušten je samo u igri Uhvati glas.',
    );
  }
  if (hasPracticeMode) {
    addIssue(
      issues,
      'unexpected-game-mode',
      `${packagePath}.practiceMode`,
      'Način vježbanja izgovora dopušten je samo u igri izgovora.',
    );
  }
  if (contentPackage.gameType === 'sound-position') {
    requireTargetSound(issues, contentPackage, packagePath);
  }
}

function requireTargetSound(
  issues: ContentValidationIssue[],
  contentPackage: ContentPackage,
  packagePath: string,
): void {
  if (!contentPackage.targetSound?.trim()) {
    addIssue(
      issues,
      'required-text',
      `${packagePath}.targetSound`,
      'Polje "Ciljni glas" obvezno je za ovu vrstu igre.',
    );
  }
}

function validateQuestionContract(
  issues: ContentValidationIssue[],
  contentPackage: ContentPackage,
  questionIndex: number,
  questionPath: string,
): void {
  const question = contentPackage.questions[questionIndex];
  if (!question) {
    return;
  }

  if (
    (contentPackage.gameType === 'listen-and-decide' ||
      contentPackage.gameType === 'catch-the-sound') &&
    question.answers.length !== 2
  ) {
    addIssue(
      issues,
      'invalid-answer-count',
      `${questionPath}.answers`,
      'Ova vrsta pitanja mora imati točno dva smislena odgovora.',
    );
  }

  if (contentPackage.gameType === 'sound-position' && ![2, 3].includes(question.answers.length)) {
    addIssue(
      issues,
      'invalid-answer-count',
      `${questionPath}.answers`,
      'Igra položaja mora imati dvije ili tri ponuđene pozicije.',
    );
  }

  if (contentPackage.gameType === 'pronunciation-practice') {
    if (question.answers.length !== 0 || question.correctAnswerIds.length !== 0) {
      addIssue(
        issues,
        'invalid-answer-count',
        `${questionPath}.answers`,
        'Igra izgovora nema ponuđene ni točne odgovore.',
      );
    }
    validatePronunciationPrompt(issues, contentPackage, question.spokenText, questionPath);
    return;
  }

  if (contentPackage.gameType === 'sound-position' && question.spokenText.trim()) {
    const targetSound = question.targetSound ?? contentPackage.targetSound;
    if (targetSound) {
      validateTargetOccurrence(issues, question.spokenText, targetSound, questionPath);
    }
  }

  if (contentPackage.gameType !== 'catch-the-sound' || !contentPackage.targetSound) {
    return;
  }

  if (contentPackage.recognitionMode === 'DETECT') {
    const containsTarget = containsSound(question.spokenText, contentPackage.targetSound);
    const expectedAnswer = containsTarget ? 'yes' : 'no';
    if (question.correctAnswerIds.length !== 1 || question.correctAnswerIds[0] !== expectedAnswer) {
      addIssue(
        issues,
        'invalid-sound-classification',
        `${questionPath}.correctAnswerIds`,
        `Točan odgovor mora odgovarati tome čuje li se glas ${contentPackage.targetSound} u tekstu.`,
      );
    }
  }

  if (contentPackage.recognitionMode === 'DISCRIMINATE' && contentPackage.contrastSound) {
    const hasTarget = containsSound(question.spokenText, contentPackage.targetSound);
    const hasContrast = containsSound(question.spokenText, contentPackage.contrastSound);
    if (hasTarget === hasContrast) {
      addIssue(
        issues,
        'invalid-sound-classification',
        `${questionPath}.spokenText`,
        `Tekst mora sadržavati točno jedan glas iz para ${contentPackage.targetSound}/${contentPackage.contrastSound}.`,
      );
      return;
    }

    const expectedAnswer = hasTarget ? contentPackage.targetSound : contentPackage.contrastSound;
    if (question.correctAnswerIds.length !== 1 || question.correctAnswerIds[0] !== expectedAnswer) {
      addIssue(
        issues,
        'invalid-sound-classification',
        `${questionPath}.correctAnswerIds`,
        `Točan odgovor mora odgovarati glasu koji se čuje u tekstu.`,
      );
    }
  }
}

function validatePronunciationPrompt(
  issues: ContentValidationIssue[],
  contentPackage: ContentPackage,
  spokenText: string,
  questionPath: string,
): void {
  const targetSound = contentPackage.targetSound;
  if (!targetSound || !supportedSounds.has(targetSound) || !spokenText.trim()) {
    return;
  }

  if (
    contentPackage.practiceMode === 'SOUND' &&
    spokenText.toLocaleLowerCase('hr-HR').trim() !== targetSound.toLocaleLowerCase('hr-HR')
  ) {
    addIssue(
      issues,
      'invalid-target-occurrence',
      `${questionPath}.spokenText`,
      `Vježba pojedinog glasa mora izgovarati samo glas ${targetSound}.`,
    );
  }

  if (contentPackage.practiceMode === 'WORD' && !containsSound(spokenText, targetSound)) {
    addIssue(
      issues,
      'invalid-target-occurrence',
      `${questionPath}.spokenText`,
      `Riječ za vježbu izgovora mora sadržavati glas ${targetSound}.`,
    );
  }
}

function containsSound(text: string, sound: string): boolean {
  return text.toLocaleLowerCase('hr-HR').includes(sound.toLocaleLowerCase('hr-HR'));
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
