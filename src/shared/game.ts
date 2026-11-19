export const SLOT_COUNT = 5;
export const HINT_COST = 5;

export type Difficulty = 'easy' | 'medium' | 'hard';

export type Phase = 'ready' | 'playing' | 'complete';

export type ShareMark = 'check' | 'diamond' | 'triangle' | 'cross';

export type RoundItem = {
  id: string;
  name: string;
  emoji: string;
  value: number;
  source: string;
};

export type Round = {
  /** Topic id this round belongs to (e.g. "mix", "tech", "soccer"). */
  topicId: string;
  /** Display title of the round (e.g. "Mountain height"). */
  category: string;
  rule: string;
  unit: string;
  difficulty: Difficulty;
  items: RoundItem[];
};

export type PublicItem = {
  id: string;
  name: string;
  emoji: string;
};

export type PublicPlacement = {
  itemId: string;
  name: string;
  emoji: string;
  slot: number;
};

export type ItemResult = {
  itemId: string;
  name: string;
  emoji: string;
  value: number;
  unit: string;
  chosenSlot: number;
  trueRank: number;
  distance: number;
  points: number;
  mark: ShareMark;
};

export type RoundSummary = {
  date: string;
  roundNumber: number;
  category: string;
  rule: string;
  unit: string;
  difficulty: Difficulty;
};

export type CrowdItem = {
  avgSlot: number;
  pctCorrect: number;
};

/** Placements and results never include true ranks until phase is complete. */
export type GameState = {
  summary: RoundSummary;
  phase: Phase;
  placements: PublicPlacement[];
  currentItem: PublicItem | null;
  /** Final score after hint penalty. Present only when phase is complete. */
  score: number | null;
  /** Raw score before hint penalty. Present only when phase is complete. */
  rawScore: number | null;
  /** Hint penalty applied (5 if hint used, 0 otherwise). Present only when phase is complete. */
  hintPenalty: number | null;
  /** Present only when phase is complete, in the order items were shown. */
  results: ItemResult[] | null;
  /** Present only when phase is complete. */
  crowdData: Record<string, CrowdItem> | null;
  /** Which item was hinted and which slots are crossed out. Null if unused. */
  hintState: HintState | null;
  /** True when a hint can still be requested (round active, not yet used, ≥4 slots open). */
  hintAvailable: boolean;
};

export type InitResponse = GameState & {
  type: 'init';
  streak: number;
  subredditName?: string;
};

export type ShareResponse = {
  type: 'shared';
  permalink: string;
  commentUrl: string;
};

export type PlayerStats = {
  gamesPlayed: number;
  averageScore: number;
  bestScore: number;
  streak: number;
  longestStreak: number;
};

export type StatsResponse = {
  type: 'stats';
  stats: PlayerStats;
};

export type ArchiveRoundItem = {
  id: string;
  name: string;
  emoji: string;
  value: number;
  unit: string;
  trueRank: number;
};

export type ArchiveRound = {
  date: string;
  roundNumber: number;
  category: string;
  rule: string;
  unit: string;
  difficulty: Difficulty;
  order: string[];
  items: ArchiveRoundItem[];
};

export type ArchiveRoundResponse = {
  type: 'archive-round';
  round: ArchiveRound;
};

export type ArchiveListItem = {
  index: number;
  roundNumber: number;
  category: string;
  rule: string;
  difficulty: Difficulty;
};

export type ArchiveListResponse = {
  type: 'archive-list';
  rounds: ArchiveListItem[];
};

export type PlaceRequest = {
  itemId: string;
  slot: number;
};

export type PlaceResponse = GameState & {
  type: 'placed';
};

export type ErrorResponse = {
  status: 'error';
  message: string;
};

export type HintState = {
  itemIndex: number;
  eliminatedSlots: number[];
};

export type HintResponse = {
  type: 'hint';
  eliminatedSlots: number[];
  hintState: HintState;
};

export const MARK_SYMBOL: Record<ShareMark, string> = {
  check: '✓',
  diamond: '◆',
  triangle: '▲',
  cross: '✕',
};

export const MARK_LABEL: Record<ShareMark, string> = {
  check: 'exact',
  diamond: '1 off',
  triangle: '2 off',
  cross: '3 or more off',
};

export function pointsForDistance(distance: number): number {
  if (distance === 0) return 20;
  if (distance === 1) return 12;
  if (distance === 2) return 6;
  if (distance === 3) return 2;
  return 0;
}

export function markForDistance(distance: number): ShareMark {
  if (distance <= 0) return 'check';
  if (distance === 1) return 'diamond';
  if (distance === 2) return 'triangle';
  return 'cross';
}

export function difficultyLabel(difficulty: Difficulty): string {
  if (difficulty === 'easy') return 'Easy';
  if (difficulty === 'medium') return 'Medium';
  return 'Hard';
}

export function formatUtcDate(isoDate: string): string {
  const parts = isoDate.split('-');
  const year = Number(parts[0]);
  const month = Number(parts[1]);
  const day = Number(parts[2]);
  if (!Number.isInteger(year) || !Number.isInteger(month) || !Number.isInteger(day)) {
    return isoDate;
  }
  return new Intl.DateTimeFormat('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(Date.UTC(year, month - 1, day)));
}

export function formatValue(value: number, unit: string): string {
  if (unit === 'year') return String(Math.trunc(value));
  const formatted = new Intl.NumberFormat('en-US', {
    maximumFractionDigits: 0,
  }).format(value);
  if (unit.length === 0) return formatted;
  return `${formatted} ${unit}`;
}

export function buildShareText(input: {
  date: string;
  roundNumber: number;
  category: string;
  score: number;
  marks: ShareMark[];
  hintUsed?: boolean;
}): string {
  const symbols = input.marks.map((mark) => MARK_SYMBOL[mark]).join(' ');
  const emojiLine = input.hintUsed === true ? `${symbols} 💡` : symbols;
  return [
    `Lock & Rank #${input.roundNumber}`,
    `${formatUtcDate(input.date)} · ${input.category}`,
    `${input.score}/100`,
    '',
    emojiLine,
    '',
    '✓ exact · ◆ 1 off · ▲ 2 off · ✕ 3+',
  ].join('\n');
}

/** Summary of one topic's daily round for the home view (no item values). */
export type TopicDailySummary = {
  topicId: string;
  label: string;
  emoji: string;
  /** Display title of the round (e.g. "Mountain height"). */
  roundTitle: string;
  rule: string;
  difficulty: Difficulty;
  completed: boolean;
  score: number | null;
};

/** Response from GET /api/home — overview of today's rounds. */
export type HomeResponse = {
  type: 'home';
  date: string;
  streak: number;
  preferences: string[];
  mix: TopicDailySummary;
  topics: TopicDailySummary[];
};

/** Response from GET /api/preferences. */
export type PreferencesResponse = {
  type: 'preferences';
  categories: string[];
};

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function isSlot(value: unknown): value is number {
  return typeof value === 'number' && Number.isInteger(value) && value >= 1 && value <= SLOT_COUNT;
}
