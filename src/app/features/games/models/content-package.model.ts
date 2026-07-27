export type GameType = 'listen-and-decide' | 'catch-the-sound' | 'sound-position';

export type Difficulty = 'EASY' | 'MEDIUM' | 'HARD';

export const SUPPORTED_TARGET_SOUNDS = ['R', 'L', 'S', 'Z', 'Š', 'Ž', 'C', 'Č', 'Ć'] as const;

export const SUPPORTED_SOUND_PAIRS = ['S/Š', 'Z/Ž', 'L/R', 'C/Č', 'Č/Ć'] as const;

export interface SoundPair {
  readonly primary: string;
  readonly contrast: string;
}

export interface ContentImage {
  readonly src?: string;
  readonly emoji?: string;
  readonly alt: string;
}

export interface AnswerOption {
  readonly id: string;
  readonly label: string;
  readonly description?: string;
}

export interface ContentQuestion {
  readonly id: string;
  readonly taskText: string;
  readonly spokenText: string;
  readonly displayText?: string;
  readonly targetSound?: string;
  readonly audioSrc?: string;
  readonly image?: ContentImage;
  readonly answers: readonly AnswerOption[];
  readonly correctAnswerIds: readonly string[];
  readonly explanation: string;
}

export interface ScoringRules {
  readonly basePoints: number;
  readonly secondAttemptMultiplier: number;
  readonly streakLength: number;
  readonly streakBonus: number;
  readonly replayPenalty: number;
  readonly maxAttempts: number;
}

export type ProfessionalReviewStatus = 'NOT_REVIEWED' | 'PROFESSIONALLY_REVIEWED';

export interface ProfessionalReview {
  readonly status: ProfessionalReviewStatus;
  readonly reviewerName?: string;
  readonly reviewedAt?: string;
}

export interface ContentPackage {
  readonly schemaVersion: 1;
  readonly id: string;
  readonly gameType: GameType;
  readonly name: string;
  readonly description: string;
  readonly objective: string;
  readonly catalogImage?: ContentImage;
  readonly targetSound: string;
  readonly contrastSound?: string;
  readonly soundPair?: SoundPair;
  readonly theme: string;
  readonly difficulty: Difficulty;
  readonly scoring: ScoringRules;
  readonly professionalReview?: ProfessionalReview;
  readonly questions: readonly ContentQuestion[];
}

export interface GameSessionResult {
  readonly id: string;
  readonly packageId: string;
  readonly packageName: string;
  readonly gameType: GameType;
  readonly targetSound: string;
  readonly theme: string;
  readonly difficulty: Difficulty;
  readonly questionCount: number;
  readonly correctAnswers: number;
  readonly attempts: number;
  readonly replays: number;
  readonly currentStreak: number;
  readonly longestStreak: number;
  readonly totalPoints: number;
  readonly durationSeconds: number;
  readonly completedAt: string;
}

export const DIFFICULTY_LABELS: Readonly<Record<Difficulty, string>> = {
  EASY: 'Lagano',
  MEDIUM: 'Srednje',
  HARD: 'Izazovno',
};

export const GAME_TYPE_LABELS: Readonly<Record<GameType, string>> = {
  'listen-and-decide': 'Slušaj i odluči',
  'catch-the-sound': 'Uhvati glas',
  'sound-position': 'Gdje je glas?',
};

export const GAME_TYPE_DESCRIPTIONS: Readonly<Record<GameType, string>> = {
  'listen-and-decide': 'Poslušaj pojam ili rečenicu i svrsti je u odgovarajuću kategoriju.',
  'catch-the-sound': 'Prepoznaj ciljni glas ili razlikuj dva akustički slična glasa.',
  'sound-position': 'Odredi nalazi li se glas na početku, u sredini ili na kraju riječi.',
};
