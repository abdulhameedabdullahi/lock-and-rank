import {
  SLOT_COUNT,
  isRecord,
  isSlot,
  type ArchiveListItem,
  type ArchiveRound,
  type GameState,
  type HintResponse,
  type HintState,
  type HomeResponse,
  type InitResponse,
  type PlaceRequest,
  type PlaceResponse,
  type PlayerStats,
  type PreferencesResponse,
  type RoundSummary,
  type ShareResponse,
  type TopicDailySummary,
} from '../../shared/game';
import { CATEGORIES, isSelectableCategoryId, isTopicId, MIX_ID } from '../../shared/categories';
import { getRoundForDay } from '../../shared/rounds';
import { GameError } from './errors';
import {
  archiveRoundForIndex,
  archiveRoundList,
  findItem,
  presentationOrder,
  roundForDate,
  rounds,
  scorePlacements,
  toPublicItem,
  toPublicPlacement,
  trueRankById,
  utcDateString,
} from './rounds';
import {
  addToLeaderboard,
  checkShareRateLimit,
  clearAllPlays,
  clearPlay,
  currentPlayerId,
  getLeaderboard,
  incrPlayersToday,
  isFreezeAvailable,
  readCrowdData,
  readPlay,
  readPlayersToday,
  readPreferences,
  readScoreDistribution,
  readShareLock,
  readStats,
  recordCrowdPlacement,
  recordScoreDistribution,
  recordSharePost,
  updateStats,
  writePlay,
  writePreferences,
  writeShareLock,
  type StoredPlay,
} from './store';
import { context, reddit } from '@devvit/web/server';
import { buildResultLine, sanitizeCaption } from './sanitize';
import { getOpenSlots, hintIsAvailable, selectEliminatedSlots } from './hint';

function summaryFor(date: string, roundNumber: number, category: string, rule: string, unit: string, difficulty: RoundSummary['difficulty']): RoundSummary {
  return { date, roundNumber, category, rule, unit, difficulty };
}

function isPermutation(order: string[], ids: string[]): boolean {
  if (order.length !== ids.length) return false;
  const seen = new Set(order);
  if (seen.size !== order.length) return false;
  return ids.every((id) => seen.has(id));
}

function assertPlay(play: StoredPlay, round: ReturnType<typeof roundForDate>['round']): void {
  const ids = round.items.map((item) => item.id);
  if (!isPermutation(play.order, ids)) {
    throw new GameError("Saved play does not match today's round. Reset today's play.", 409);
  }
  if (play.completed !== (play.placements.length === SLOT_COUNT)) {
    throw new GameError("Saved play could not be read. Reset today's play.", 500);
  }
  const slots = new Set<number>();
  for (let index = 0; index < play.placements.length; index += 1) {
    const placement = play.placements[index];
    if (!placement || play.order[index] !== placement.itemId || slots.has(placement.slot)) {
      throw new GameError("Saved play could not be read. Reset today's play.", 500);
    }
    slots.add(placement.slot);
  }
}

async function stateFromPlay(
  date: string,
  roundNumber: number,
  round: ReturnType<typeof roundForDate>['round'],
  play: StoredPlay | null,
  order: string[]
): Promise<GameState> {
  const summary = summaryFor(date, roundNumber, round.category, round.rule, round.unit, round.difficulty);
  const placements = (play?.placements ?? []).map((placement) => toPublicPlacement(round, placement));
  if (play?.completed) {
    const scored = scorePlacements(round, order, play.placements, play.hintUsed);
    const ranks = trueRankById(round);
    const crowdItems = round.items.map((item) => ({ id: item.id, trueRank: ranks.get(item.id) ?? 0 }));
    const crowdData = await readCrowdData(date, round.topicId, crowdItems);
    const hintState: HintState | null = play.hintUsed
      ? { itemIndex: play.hintItemIndex, eliminatedSlots: play.hintEliminatedSlots }
      : null;
    return {
      summary,
      phase: 'complete',
      placements,
      currentItem: null,
      score: scored.score,
      rawScore: scored.rawScore,
      hintPenalty: scored.hintPenalty,
      results: scored.results,
      crowdData,
      hintState,
      hintAvailable: false,
    };
  }
  const nextId = order[placements.length];
  if (!nextId) throw new GameError("Today's round is missing an item.", 500);
  const openSlots = getOpenSlots(play?.placements ?? []);
  const hintState: HintState | null = play?.hintUsed
    ? { itemIndex: play.hintItemIndex, eliminatedSlots: play.hintEliminatedSlots }
    : null;
  const hintAvailable = !play?.hintUsed && hintIsAvailable(openSlots);
  return {
    summary,
    phase: placements.length === 0 ? 'ready' : 'playing',
    placements,
    currentItem: toPublicItem(round, nextId),
    score: null,
    rawScore: null,
    hintPenalty: null,
    results: null,
    crowdData: null,
    hintState,
    hintAvailable,
  };
}

async function loadPlay(topicId: string, now = new Date()): Promise<{
  playerId: string;
  date: string;
  roundNumber: number;
  round: ReturnType<typeof roundForDate>['round'];
  play: StoredPlay | null;
  order: string[];
}> {
  const playerId = currentPlayerId();
  const date = utcDateString(now);
  const { round, roundNumber } = roundForDate(topicId, date);
  const play = await readPlay(playerId, date, topicId);
  if (play && (play.date !== date || play.roundNumber !== roundNumber)) {
    throw new GameError("Saved play does not match today's round. Reset today's play.", 409);
  }
  if (play) assertPlay(play, round);
  const order = play?.order ?? presentationOrder(round, date);
  return { playerId, date, roundNumber, round, play, order };
}

export async function getInit(topicId: string = MIX_ID): Promise<InitResponse> {
  if (!isTopicId(topicId)) throw new GameError('Unknown topic.', 400);
  const { playerId, date, roundNumber, round, play, order } = await loadPlay(topicId);
  const stats = await readStats(playerId);
  const state = await stateFromPlay(date, roundNumber, round, play, order);
  return { type: 'init', ...state, streak: stats.streak, subredditName: context.subredditName };
}

export function parsePlaceRequest(value: unknown): PlaceRequest {
  if (!isRecord(value)) {
    throw new GameError('Send the current item and a slot from 1 to 5.', 400);
  }
  const { itemId, slot } = value;
  if (typeof itemId !== 'string' || itemId.length === 0 || itemId.length > 64 || !isSlot(slot)) {
    throw new GameError('Send the current item and a slot from 1 to 5.', 400);
  }
  return { itemId, slot };
}

export async function placeItem(request: PlaceRequest, topicId: string = MIX_ID): Promise<PlaceResponse> {
  if (!isTopicId(topicId)) throw new GameError('Unknown topic.', 400);
  const loaded = await loadPlay(topicId);
  const { playerId, date, roundNumber, round, play, order } = loaded;
  if (play?.completed) {
    throw new GameError("You already finished today's round.", 409);
  }
  const placedCount = play?.placements.length ?? 0;
  if (placedCount >= SLOT_COUNT) {
    throw new GameError("You already finished today's round.", 409);
  }
  const expectedId = order[placedCount];
  if (expectedId !== request.itemId) {
    throw new GameError('Lock the current item before the next one appears.', 400);
  }
  if (!findItem(round, request.itemId)) {
    throw new GameError("That item is not in today's round.", 400);
  }
  if (play?.placements.some((placement) => placement.slot === request.slot)) {
    throw new GameError('That slot is already taken.', 400);
  }
  const placements = [...(play?.placements ?? []), { itemId: request.itemId, slot: request.slot }];
  const completed = placements.length === SLOT_COUNT;
  const next: StoredPlay = {
    date,
    roundNumber,
    order,
    placements,
    completed,
    hintUsed: play?.hintUsed ?? false,
    hintItemIndex: play?.hintItemIndex ?? -1,
    hintEliminatedSlots: play?.hintEliminatedSlots ?? [],
  };
  await writePlay(playerId, play, next, topicId);
  const isHintedItem = play?.hintUsed === true && play.hintItemIndex === placedCount;
  if (!isHintedItem) {
    void recordCrowdPlacement(date, topicId, request.itemId, request.slot);
  }
  if (completed) {
    const scored = scorePlacements(round, order, placements, next.hintUsed);
    void updateStats(playerId, date, scored.score);
    void addToLeaderboard(date, topicId, playerId, context.username ?? playerId, scored.score, Date.now());
    void recordScoreDistribution(date, topicId, scored.score);
    void incrPlayersToday(date);
  }
  const state = await stateFromPlay(date, roundNumber, round, next, order);
  return { type: 'placed', ...state };
}

export async function resetToday(): Promise<void> {
  const playerId = currentPlayerId();
  const date = utcDateString(new Date());
  await clearAllPlays(playerId, date);
}

/** Clear today's play for one topic only — does not touch other topics or preferences. */
export async function resetTodayForTopic(topicId: string): Promise<void> {
  if (!isTopicId(topicId)) throw new GameError('Unknown topic.', 400);
  const playerId = currentPlayerId();
  const date = utcDateString(new Date());
  await clearPlay(playerId, date, topicId);
}

export async function getStats(): Promise<PlayerStats> {
  const playerId = currentPlayerId();
  const date = utcDateString(new Date());
  const [stored, freezeAvailable] = await Promise.all([
    readStats(playerId),
    isFreezeAvailable(playerId, date),
  ]);
  const averageScore =
    stored.gamesPlayed > 0 ? Math.round(stored.totalScore / stored.gamesPlayed) : 0;
  return {
    gamesPlayed: stored.gamesPlayed,
    averageScore,
    bestScore: stored.bestScore,
    streak: stored.streak,
    longestStreak: stored.longestStreak,
    freezeAvailable,
  };
}

export async function getDailyLeaderboard(topicId: string = MIX_ID, date?: string) {
  if (!isTopicId(topicId)) throw new GameError('Unknown topic.', 400);
  const d = date ?? utcDateString(new Date());
  const [entries, dist] = await Promise.all([
    getLeaderboard(d, topicId),
    readScoreDistribution(d, topicId),
  ]);
  return { entries, distribution: dist.buckets, distributionTotal: dist.total };
}

async function topicSummary(
  playerId: string,
  date: string,
  topicId: string,
  label: string,
  emoji: string
): Promise<TopicDailySummary | null> {
  const round = getRoundForDay(topicId, date, rounds);
  if (!round) return null;
  const play = await readPlay(playerId, date, topicId);
  const completed = play?.completed ?? false;
  let score: number | null = null;
  if (completed && play) {
    const order = play.order;
    const scored = scorePlacements(round, order, play.placements, play.hintUsed);
    score = scored.score;
  }
  return {
    topicId,
    label,
    emoji,
    roundTitle: round.category,
    rule: round.rule,
    difficulty: round.difficulty,
    completed,
    score,
  };
}

export async function getHomeData(): Promise<HomeResponse> {
  const playerId = currentPlayerId();
  const date = utcDateString(new Date());
  const [stats, prefs, playersToday] = await Promise.all([
    readStats(playerId),
    readPreferences(playerId),
    readPlayersToday(date),
  ]);

  const mix = await topicSummary(playerId, date, MIX_ID, 'Daily Mix', '🎲');
  if (!mix) throw new GameError('No Daily Mix round for today.', 500);

  const topicResults = await Promise.all(
    CATEGORIES.map((cat) => topicSummary(playerId, date, cat.id, cat.label, cat.emoji))
  );
  const topics = topicResults.filter((t): t is TopicDailySummary => t !== null);

  return {
    type: 'home',
    date,
    streak: stats.streak,
    preferences: prefs,
    mix,
    topics,
    playersToday,
  };
}

export async function getPreferences(): Promise<PreferencesResponse> {
  const playerId = currentPlayerId();
  const categories = await readPreferences(playerId);
  return { type: 'preferences', categories };
}

export async function setPreferences(categoryIds: unknown): Promise<PreferencesResponse> {
  if (!Array.isArray(categoryIds) || !categoryIds.every(isSelectableCategoryId)) {
    throw new GameError('Send an array of valid category ids.', 400);
  }
  if (categoryIds.length > CATEGORIES.length) {
    throw new GameError('Too many categories selected.', 400);
  }
  const unique = [...new Set<string>(categoryIds)];
  const playerId = currentPlayerId();
  await writePreferences(playerId, unique);
  return { type: 'preferences', categories: unique };
}

export async function useHint(topicId: string = MIX_ID): Promise<HintResponse> {
  if (!isTopicId(topicId)) throw new GameError('Unknown topic.', 400);
  const { playerId, date, roundNumber, round, play, order } = await loadPlay(topicId);

  if (play?.completed) {
    throw new GameError('The round is already finished.', 409);
  }

  const placedCount = play?.placements.length ?? 0;

  if (play?.hintUsed) {
    if (play.hintItemIndex === placedCount) {
      const hintState: HintState = { itemIndex: play.hintItemIndex, eliminatedSlots: play.hintEliminatedSlots };
      return { type: 'hint', eliminatedSlots: play.hintEliminatedSlots, hintState };
    }
    throw new GameError('You have already used your hint for this round.', 409);
  }

  const openSlots = getOpenSlots(play?.placements ?? []);
  if (!hintIsAvailable(openSlots)) {
    throw new GameError('Hint is not available when fewer than 4 slots are open.', 400);
  }

  const currentItemId = order[placedCount];
  if (!currentItemId) throw new GameError("Today's round is in an invalid state.", 500);

  const ranks = trueRankById(round);
  const trueSlot = ranks.get(currentItemId);
  if (trueSlot === undefined) throw new GameError("Today's round is in an invalid state.", 500);

  const eliminatedSlots = selectEliminatedSlots(openSlots, trueSlot, playerId, topicId, date, placedCount);

  const nextPlay: StoredPlay = {
    date,
    roundNumber,
    order,
    placements: play?.placements ?? [],
    completed: false,
    hintUsed: true,
    hintItemIndex: placedCount,
    hintEliminatedSlots: eliminatedSlots,
  };

  await writePlay(playerId, play, nextPlay, topicId);

  const hintState: HintState = { itemIndex: placedCount, eliminatedSlots };
  return { type: 'hint', eliminatedSlots, hintState };
}

export function listArchiveRounds(): ArchiveListItem[] {
  return archiveRoundList();
}

export async function shareResult(topicId: string = MIX_ID, caption: string): Promise<ShareResponse> {
  if (!isTopicId(topicId)) throw new GameError('Unknown topic.', 400);
  const { playerId, date, round, play, order } = await loadPlay(topicId);

  if (!play?.completed) throw new GameError('Finish the round before sharing.', 409);

  const existing = await readShareLock(playerId, date, topicId);
  if (existing) throw new GameError('You have already shared this round.', 409);

  // Server-side rate limits: 60s cooldown + 3 posts per day across all topics
  await checkShareRateLimit(playerId, date);

  const postId = context.postId;
  if (!postId) throw new GameError('No post context — cannot share.', 400);

  // Caption is required; sanitize first so length check is on the clean text
  const sanitized = sanitizeCaption(caption);
  if (sanitized.length < 10) throw new GameError('Your comment must be at least 10 characters.', 400);

  const scored = scorePlacements(round, order, play.placements, play.hintUsed);
  const marks = scored.results.map((r) => r.mark);
  const resultLine = buildResultLine(scored.score, marks, play.hintUsed);
  const commentText = `${sanitized}\n\n${resultLine}`;

  const comment = await reddit.submitComment({ id: postId, text: commentText, runAs: 'USER' });

  await Promise.all([
    writeShareLock(playerId, date, topicId, comment.id),
    recordSharePost(playerId, date),
  ]);

  return { type: 'shared', permalink: comment.permalink, commentUrl: comment.url };
}

export async function subscribeToSub(): Promise<void> {
  if (!context.username) throw new GameError('Must be logged in to subscribe.', 400);
  await reddit.subscribeToCurrentSubreddit();
}

export function getArchiveRound(index: number): ArchiveRound {
  const { round, roundNumber } = archiveRoundForIndex(index);
  const date = `archive-${String(index).padStart(3, '0')}`;
  const order = presentationOrder(round, date);
  const ranks = trueRankById(round);
  const items = order.map((id) => {
    const item = round.items.find((it) => it.id === id);
    if (!item) throw new GameError('Archive round data is invalid.', 500);
    return {
      id: item.id,
      name: item.name,
      emoji: item.emoji,
      value: item.value,
      unit: round.unit,
      trueRank: ranks.get(item.id) ?? 0,
    };
  });
  return { date, roundNumber, category: round.category, rule: round.rule, unit: round.unit, difficulty: round.difficulty, order, items };
}
