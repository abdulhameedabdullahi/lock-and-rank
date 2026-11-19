import {
  SLOT_COUNT,
  isRecord,
  isSlot,
  type ArchiveListItem,
  type ArchiveRound,
  type ArchiveRoundItem,
  type CrowdItem,
  type Difficulty,
  type GameState,
  type HintResponse,
  type HintState,
  type HomeResponse,
  type InitResponse,
  type ItemResult,
  type LeaderboardEntry,
  type Phase,
  type PlaceResponse,
  type PlayerStats,
  type PreferencesResponse,
  type PublicItem,
  type PublicPlacement,
  type RoundSummary,
  type ShareMark,
  type ShareResponse,
  type TopicDailySummary,
} from '../shared/game';

export type LeaderboardData = {
  entries: LeaderboardEntry[];
  distribution: number[];
  distributionTotal: number;
};

function messageFrom(value: unknown): string | null {
  if (!isRecord(value) || value.status !== 'error' || typeof value.message !== 'string') return null;
  if (value.message.length === 0 || value.message.length > 180) return null;
  return value.message;
}

function readText(record: Record<string, unknown>, key: string, max: number): string | null {
  const value = record[key];
  if (typeof value !== 'string') return null;
  const text = value.trim();
  if (text.length === 0 || text.length > max) return null;
  return text;
}

function isDifficulty(value: unknown): value is Difficulty {
  return value === 'easy' || value === 'medium' || value === 'hard';
}

function isPhase(value: unknown): value is Phase {
  return value === 'ready' || value === 'playing' || value === 'complete';
}

function isShareMark(value: unknown): value is ShareMark {
  return value === 'check' || value === 'diamond' || value === 'triangle' || value === 'cross';
}

function parseSummary(value: unknown): RoundSummary | null {
  if (!isRecord(value)) return null;
  const date = readText(value, 'date', 10);
  const category = readText(value, 'category', 60);
  const rule = readText(value, 'rule', 60);
  const unit = readText(value, 'unit', 20);
  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date) || !category || !rule || !unit) return null;
  if (!isDifficulty(value.difficulty)) return null;
  if (typeof value.roundNumber !== 'number' || !Number.isInteger(value.roundNumber)) return null;
  if (value.roundNumber < 1 || value.roundNumber > 100000) return null;
  return {
    date,
    roundNumber: value.roundNumber,
    category,
    rule,
    unit,
    difficulty: value.difficulty,
  };
}

function parsePublicItem(value: unknown): PublicItem | null {
  if (!isRecord(value)) return null;
  const id = readText(value, 'id', 64);
  const name = readText(value, 'name', 60);
  const emoji = readText(value, 'emoji', 16);
  if (!id || !name || !emoji) return null;
  return { id, name, emoji };
}

function parsePlacement(value: unknown): PublicPlacement | null {
  if (!isRecord(value) || !isSlot(value.slot)) return null;
  const itemId = readText(value, 'itemId', 64);
  const name = readText(value, 'name', 60);
  const emoji = readText(value, 'emoji', 16);
  if (!itemId || !name || !emoji) return null;
  return { itemId, name, emoji, slot: value.slot };
}

function parseResult(value: unknown, unit: string): ItemResult | null {
  if (!isRecord(value)) return null;
  const itemId = readText(value, 'itemId', 64);
  const name = readText(value, 'name', 60);
  const emoji = readText(value, 'emoji', 16);
  if (!itemId || !name || !emoji) return null;
  if (typeof value.value !== 'number' || !Number.isFinite(value.value)) return null;
  if (!isSlot(value.chosenSlot) || !isSlot(value.trueRank)) return null;
  if (typeof value.distance !== 'number' || !Number.isInteger(value.distance)) return null;
  if (value.distance < 0 || value.distance > SLOT_COUNT - 1) return null;
  if (typeof value.points !== 'number' || !Number.isInteger(value.points)) return null;
  if (value.points < 0 || value.points > 20) return null;
  if (!isShareMark(value.mark)) return null;
  if (value.unit !== unit) return null;
  return {
    itemId,
    name,
    emoji,
    value: value.value,
    unit,
    chosenSlot: value.chosenSlot,
    trueRank: value.trueRank,
    distance: value.distance,
    points: value.points,
    mark: value.mark,
  };
}

function parseHintState(value: unknown): HintState | null {
  if (value === null || value === undefined) return null;
  if (!isRecord(value)) return null;
  if (typeof value.itemIndex !== 'number' || !Number.isInteger(value.itemIndex)) return null;
  if (!Array.isArray(value.eliminatedSlots)) return null;
  const eliminatedSlots = (value.eliminatedSlots as unknown[]).filter(
    (s): s is number => typeof s === 'number' && Number.isInteger(s) && s >= 1 && s <= SLOT_COUNT
  );
  return { itemIndex: value.itemIndex, eliminatedSlots };
}

function parseCrowdData(value: unknown): Record<string, CrowdItem> | null {
  if (value === null || value === undefined) return null;
  if (!isRecord(value)) return null;
  const result: Record<string, CrowdItem> = {};
  for (const [key, entry] of Object.entries(value)) {
    if (!isRecord(entry)) return null;
    const avgSlot = entry.avgSlot;
    const pctCorrect = entry.pctCorrect;
    if (typeof avgSlot !== 'number' || !Number.isFinite(avgSlot)) return null;
    if (typeof pctCorrect !== 'number' || !Number.isInteger(pctCorrect)) return null;
    result[key] = { avgSlot, pctCorrect };
  }
  return result;
}

export function parseGameState(value: unknown): GameState | null {
  if (!isRecord(value)) return null;
  const summary = parseSummary(value.summary);
  if (!summary || !isPhase(value.phase) || !Array.isArray(value.placements)) return null;
  const placements: PublicPlacement[] = [];
  for (const entry of value.placements) {
    const placement = parsePlacement(entry);
    if (!placement) return null;
    placements.push(placement);
  }
  const currentItem = value.currentItem === null ? null : parsePublicItem(value.currentItem);
  if (value.currentItem !== null && !currentItem) return null;
  const score = value.score === null ? null : value.score;
  if (score !== null && (typeof score !== 'number' || !Number.isInteger(score) || score < 0 || score > 100)) {
    return null;
  }
  let results: ItemResult[] | null = null;
  if (value.results !== null) {
    if (!Array.isArray(value.results) || value.results.length !== SLOT_COUNT) return null;
    const parsed: ItemResult[] = [];
    for (const entry of value.results) {
      const result = parseResult(entry, summary.unit);
      if (!result) return null;
      parsed.push(result);
    }
    results = parsed;
  }
  const crowdData = value.phase === 'complete' ? parseCrowdData(value.crowdData) : null;
  const hintState = parseHintState(value.hintState);
  const hintAvailable = typeof value.hintAvailable === 'boolean' ? value.hintAvailable : false;
  const rawScore =
    typeof value.rawScore === 'number' && Number.isInteger(value.rawScore) && value.rawScore >= 0
      ? value.rawScore
      : null;
  const hintPenalty =
    typeof value.hintPenalty === 'number' && Number.isInteger(value.hintPenalty) && value.hintPenalty >= 0
      ? value.hintPenalty
      : null;
  if (value.phase === 'ready' && placements.length !== 0) return null;
  if (value.phase === 'playing' && (placements.length < 1 || placements.length >= SLOT_COUNT)) return null;
  if (value.phase === 'complete' && placements.length !== SLOT_COUNT) return null;
  if (value.phase === 'complete' && (results === null || score === null || currentItem !== null)) return null;
  if (value.phase !== 'complete' && (results !== null || score !== null || currentItem === null)) return null;
  return { summary, phase: value.phase, placements, currentItem, score, rawScore, hintPenalty, results, crowdData, hintState, hintAvailable };
}

async function readPayload(response: Response): Promise<unknown> {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

export async function requestInit(topicId = 'mix'): Promise<InitResponse> {
  const response = await fetch(`/api/init?category=${encodeURIComponent(topicId)}`);
  const payload = await readPayload(response);
  if (!response.ok) {
    throw new Error(messageFrom(payload) ?? 'Could not load today\'s round.');
  }
  if (!isRecord(payload) || payload.type !== 'init') {
    throw new Error('Could not read today\'s round.');
  }
  const state = parseGameState(payload);
  if (!state) throw new Error('Could not read today\'s round.');
  const streak = typeof payload.streak === 'number' && Number.isInteger(payload.streak) ? payload.streak : 0;
  const subredditName = typeof payload.subredditName === 'string' && payload.subredditName.length > 0
    ? payload.subredditName
    : undefined;
  return { type: 'init', ...state, streak, subredditName };
}

export async function requestPlace(itemId: string, slot: number, topicId = 'mix'): Promise<PlaceResponse> {
  const response = await fetch(`/api/place?category=${encodeURIComponent(topicId)}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ itemId, slot }),
  });
  const payload = await readPayload(response);
  if (!response.ok) {
    throw new Error(messageFrom(payload) ?? 'Could not lock that slot.');
  }
  if (!isRecord(payload) || payload.type !== 'placed') {
    throw new Error('Could not read that lock.');
  }
  const state = parseGameState(payload);
  if (!state) throw new Error('Could not read that lock.');
  return { type: 'placed', ...state };
}

export async function requestStats(): Promise<PlayerStats> {
  const response = await fetch('/api/stats');
  const payload = await readPayload(response);
  if (!response.ok) {
    throw new Error(messageFrom(payload) ?? 'Could not load stats.');
  }
  if (!isRecord(payload) || payload.type !== 'stats' || !isRecord(payload.stats)) {
    throw new Error('Could not read stats.');
  }
  const s = payload.stats;
  return {
    gamesPlayed: typeof s.gamesPlayed === 'number' ? Math.max(0, Math.trunc(s.gamesPlayed)) : 0,
    averageScore: typeof s.averageScore === 'number' ? Math.max(0, Math.trunc(s.averageScore)) : 0,
    bestScore: typeof s.bestScore === 'number' ? Math.max(0, Math.trunc(s.bestScore)) : 0,
    streak: typeof s.streak === 'number' ? Math.max(0, Math.trunc(s.streak)) : 0,
    longestStreak: typeof s.longestStreak === 'number' ? Math.max(0, Math.trunc(s.longestStreak)) : 0,
    freezeAvailable: typeof s.freezeAvailable === 'boolean' ? s.freezeAvailable : false,
  };
}

export async function requestArchiveList(): Promise<ArchiveListItem[]> {
  const response = await fetch('/api/archive/list');
  const payload = await readPayload(response);
  if (!response.ok) {
    throw new Error(messageFrom(payload) ?? 'Could not load archive.');
  }
  if (!isRecord(payload) || payload.type !== 'archive-list' || !Array.isArray(payload.rounds)) {
    throw new Error('Could not read archive list.');
  }
  const rounds: ArchiveListItem[] = [];
  for (const entry of payload.rounds) {
    if (!isRecord(entry)) continue;
    const category = readText(entry, 'category', 60);
    const rule = readText(entry, 'rule', 60);
    if (!category || !rule || !isDifficulty(entry.difficulty)) continue;
    if (typeof entry.index !== 'number' || typeof entry.roundNumber !== 'number') continue;
    rounds.push({ index: entry.index, roundNumber: entry.roundNumber, category, rule, difficulty: entry.difficulty });
  }
  return rounds;
}

function parseArchiveRoundItem(value: unknown, unit: string): ArchiveRoundItem | null {
  if (!isRecord(value)) return null;
  const id = readText(value, 'id', 64);
  const name = readText(value, 'name', 60);
  const emoji = readText(value, 'emoji', 16);
  if (!id || !name || !emoji) return null;
  if (typeof value.value !== 'number' || !Number.isFinite(value.value)) return null;
  if (!isSlot(value.trueRank)) return null;
  if (value.unit !== unit) return null;
  return { id, name, emoji, value: value.value, unit, trueRank: value.trueRank };
}

export async function requestArchiveRound(index: number): Promise<ArchiveRound> {
  const response = await fetch(`/api/archive/round?index=${index}`);
  const payload = await readPayload(response);
  if (!response.ok) {
    throw new Error(messageFrom(payload) ?? 'Could not load archive round.');
  }
  if (!isRecord(payload) || payload.type !== 'archive-round' || !isRecord(payload.round)) {
    throw new Error('Could not read archive round.');
  }
  const r = payload.round;
  const category = readText(r, 'category', 60);
  const rule = readText(r, 'rule', 60);
  const unit = readText(r, 'unit', 20);
  const date = readText(r, 'date', 20);
  if (!category || !rule || !unit || !date || !isDifficulty(r.difficulty)) {
    throw new Error('Could not read archive round.');
  }
  if (typeof r.roundNumber !== 'number' || !Array.isArray(r.order) || !Array.isArray(r.items)) {
    throw new Error('Could not read archive round.');
  }
  const order = (r.order as unknown[]).filter((id): id is string => typeof id === 'string');
  const items: ArchiveRoundItem[] = [];
  for (const entry of r.items) {
    const item = parseArchiveRoundItem(entry, unit);
    if (!item) throw new Error('Could not read archive round item.');
    items.push(item);
  }
  return { date, roundNumber: r.roundNumber, category, rule, unit, difficulty: r.difficulty, order, items };
}

export async function requestHint(topicId = 'mix'): Promise<HintResponse> {
  const response = await fetch(`/api/hint?category=${encodeURIComponent(topicId)}`, { method: 'POST' });
  const payload = await readPayload(response);
  if (!response.ok) {
    throw new Error(messageFrom(payload) ?? 'Could not use hint.');
  }
  if (!isRecord(payload) || payload.type !== 'hint') {
    throw new Error('Could not read hint response.');
  }
  const hintState = parseHintState(payload.hintState);
  if (!hintState) throw new Error('Could not read hint state.');
  const eliminatedSlots = Array.isArray(payload.eliminatedSlots)
    ? (payload.eliminatedSlots as unknown[]).filter((s): s is number => typeof s === 'number' && Number.isInteger(s))
    : [];
  return { type: 'hint', eliminatedSlots, hintState };
}

export async function requestReset(topicId?: string): Promise<void> {
  const url = topicId ? `/api/reset?category=${encodeURIComponent(topicId)}` : '/api/reset';
  const response = await fetch(url, { method: 'POST' });
  if (!response.ok) {
    const payload = await readPayload(response);
    throw new Error(messageFrom(payload) ?? 'Could not reset play.');
  }
}

function parseTopicSummary(value: unknown): TopicDailySummary | null {
  if (!isRecord(value)) return null;
  const topicId = readText(value, 'topicId', 32);
  const label = readText(value, 'label', 60);
  const emoji = readText(value, 'emoji', 16);
  const roundTitle = readText(value, 'roundTitle', 80);
  const rule = readText(value, 'rule', 80);
  if (!topicId || !label || !emoji || !roundTitle || !rule) return null;
  if (!isDifficulty(value.difficulty)) return null;
  if (typeof value.completed !== 'boolean') return null;
  const score = value.score === null ? null : typeof value.score === 'number' ? value.score : null;
  return { topicId, label, emoji, roundTitle, rule, difficulty: value.difficulty, completed: value.completed, score };
}

export async function requestHome(): Promise<HomeResponse> {
  const response = await fetch('/api/home');
  const payload = await readPayload(response);
  if (!response.ok) {
    throw new Error(messageFrom(payload) ?? 'Could not load home data.');
  }
  if (!isRecord(payload) || payload.type !== 'home') {
    throw new Error('Could not read home data.');
  }
  const date = readText(payload, 'date', 10) ?? '';
  const streak = typeof payload.streak === 'number' ? Math.max(0, Math.trunc(payload.streak)) : 0;
  const preferences = Array.isArray(payload.preferences)
    ? (payload.preferences as unknown[]).filter((v): v is string => typeof v === 'string')
    : [];
  const mix = parseTopicSummary(payload.mix);
  if (!mix) throw new Error('Could not read home data.');
  const topics: TopicDailySummary[] = [];
  if (Array.isArray(payload.topics)) {
    for (const entry of payload.topics) {
      const topic = parseTopicSummary(entry);
      if (topic) topics.push(topic);
    }
  }
  const playersToday = typeof payload.playersToday === 'number' ? payload.playersToday : undefined;
  return { type: 'home', date, streak, preferences, mix, topics, playersToday };
}

export async function requestPreferences(): Promise<PreferencesResponse> {
  const response = await fetch('/api/preferences');
  const payload = await readPayload(response);
  if (!response.ok) {
    throw new Error(messageFrom(payload) ?? 'Could not load preferences.');
  }
  if (!isRecord(payload) || payload.type !== 'preferences') {
    throw new Error('Could not read preferences.');
  }
  const categories = Array.isArray(payload.categories)
    ? (payload.categories as unknown[]).filter((v): v is string => typeof v === 'string')
    : [];
  return { type: 'preferences', categories };
}

export async function requestSetPreferences(categoryIds: string[]): Promise<PreferencesResponse> {
  const response = await fetch('/api/preferences', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ categories: categoryIds }),
  });
  const payload = await readPayload(response);
  if (!response.ok) {
    throw new Error(messageFrom(payload) ?? 'Could not save preferences.');
  }
  if (!isRecord(payload) || payload.type !== 'preferences') {
    throw new Error('Could not read saved preferences.');
  }
  const categories = Array.isArray(payload.categories)
    ? (payload.categories as unknown[]).filter((v): v is string => typeof v === 'string')
    : [];
  return { type: 'preferences', categories };
}

export async function requestLeaderboard(topicId: string, date: string): Promise<LeaderboardData> {
  const response = await fetch(
    `/api/leaderboard?category=${encodeURIComponent(topicId)}&date=${encodeURIComponent(date)}`
  );
  const payload = await readPayload(response);
  if (!response.ok) {
    throw new Error(messageFrom(payload) ?? 'Could not load leaderboard.');
  }
  if (!isRecord(payload) || payload.type !== 'leaderboard') {
    throw new Error('Could not read leaderboard.');
  }
  const entries: LeaderboardEntry[] = Array.isArray(payload.entries)
    ? (payload.entries as unknown[]).flatMap((e) => {
        if (!isRecord(e)) return [];
        const username = readText(e, 'username', 60);
        if (!username || typeof e.rank !== 'number' || typeof e.score !== 'number') return [];
        return [{ rank: Math.trunc(e.rank), username, score: Math.trunc(e.score) }];
      })
    : [];
  const distribution: number[] = Array.isArray(payload.distribution)
    ? (payload.distribution as unknown[]).map((v) => (typeof v === 'number' ? Math.max(0, Math.trunc(v)) : 0))
    : Array(10).fill(0) as number[];
  const distributionTotal = typeof payload.distributionTotal === 'number'
    ? Math.max(0, Math.trunc(payload.distributionTotal))
    : 0;
  return { entries, distribution, distributionTotal };
}

export async function requestShare(topicId: string, caption: string): Promise<ShareResponse> {
  const response = await fetch(`/api/share?category=${encodeURIComponent(topicId)}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ caption }),
  });
  const payload = await readPayload(response);
  if (!response.ok) {
    throw new Error(messageFrom(payload) ?? 'Could not share result.');
  }
  if (!isRecord(payload) || payload.type !== 'shared') {
    throw new Error('Could not read share response.');
  }
  const permalink = typeof payload.permalink === 'string' ? payload.permalink : '';
  const commentUrl = typeof payload.commentUrl === 'string' ? payload.commentUrl : '';
  return { type: 'shared', permalink, commentUrl };
}

export async function requestSubscribe(): Promise<void> {
  const response = await fetch('/api/subscribe', { method: 'POST' });
  if (!response.ok) {
    const payload = await readPayload(response);
    throw new Error(messageFrom(payload) ?? 'Could not subscribe.');
  }
}

export function readError(error: unknown, fallback: string): string {
  if (error instanceof Error && error.message.length > 0) return error.message;
  return fallback;
}
