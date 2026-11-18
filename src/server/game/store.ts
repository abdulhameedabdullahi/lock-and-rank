import { context, redis } from '@devvit/web/server';
import { SLOT_COUNT, isRecord, isSlot, type CrowdItem } from '../../shared/game';
import { ALL_TOPIC_IDS, isSelectableCategoryId } from '../../shared/categories';
import { GameError } from './errors';

const PLAY_TTL_SECONDS = 60 * 60 * 72;

export type StoredPlacement = {
  itemId: string;
  slot: number;
};

export type StoredPlay = {
  date: string;
  roundNumber: number;
  order: string[];
  placements: StoredPlacement[];
  completed: boolean;
};

function playKey(playerId: string, date: string, topicId: string): string {
  return `lockrank:v1:play:${date}:${topicId}:${playerId}`;
}

export function currentPlayerId(): string {
  const id = context.userId ?? context.loid;
  if (!id) throw new GameError('Sign in to play Lock & Rank.', 400);
  return id;
}

function parseStoredPlay(raw: string): StoredPlay {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new GameError("Saved play could not be read. Reset today's play.", 500);
  }
  if (!isRecord(parsed) || !Array.isArray(parsed.order) || !Array.isArray(parsed.placements)) {
    throw new GameError("Saved play could not be read. Reset today's play.", 500);
  }
  if (typeof parsed.date !== 'string' || typeof parsed.roundNumber !== 'number') {
    throw new GameError("Saved play could not be read. Reset today's play.", 500);
  }
  if (typeof parsed.completed !== 'boolean' || !Number.isInteger(parsed.roundNumber)) {
    throw new GameError("Saved play could not be read. Reset today's play.", 500);
  }
  const order = parsed.order.filter((id): id is string => typeof id === 'string');
  if (order.length !== parsed.order.length || order.length !== SLOT_COUNT) {
    throw new GameError("Saved play could not be read. Reset today's play.", 500);
  }
  const placements: StoredPlacement[] = [];
  for (const entry of parsed.placements) {
    if (!isRecord(entry) || typeof entry.itemId !== 'string' || !isSlot(entry.slot)) {
      throw new GameError("Saved play could not be read. Reset today's play.", 500);
    }
    placements.push({ itemId: entry.itemId, slot: entry.slot });
  }
  return {
    date: parsed.date,
    roundNumber: parsed.roundNumber,
    order,
    placements,
    completed: parsed.completed,
  };
}

export async function readPlay(playerId: string, date: string, topicId: string): Promise<StoredPlay | null> {
  const raw = await redis.get(playKey(playerId, date, topicId));
  if (raw === undefined || raw.length === 0) return null;
  return parseStoredPlay(raw);
}

function samePlay(left: StoredPlay | null, right: StoredPlay | null): boolean {
  if (left === null || right === null) return left === right;
  if (left.date !== right.date || left.roundNumber !== right.roundNumber) return false;
  if (left.completed !== right.completed) return false;
  if (left.order.join('|') !== right.order.join('|')) return false;
  if (left.placements.length !== right.placements.length) return false;
  return left.placements.every((placement, index) => {
    const other = right.placements[index];
    return other !== undefined && other.itemId === placement.itemId && other.slot === placement.slot;
  });
}

export async function writePlay(playerId: string, previous: StoredPlay | null, next: StoredPlay, topicId: string): Promise<void> {
  const key = playKey(playerId, next.date, topicId);
  for (let attempt = 0; attempt < 4; attempt += 1) {
    const txn = await redis.watch(key);
    let queued = false;
    try {
      const current = await readPlay(playerId, next.date, topicId);
      if (!samePlay(current, previous)) {
        throw new GameError('That lock overlapped another tap. Try the current item again.', 409);
      }
      await txn.multi();
      queued = true;
      await txn.set(key, JSON.stringify(next));
      await txn.expire(key, PLAY_TTL_SECONDS);
      await txn.exec();
      queued = false;
    } catch (error) {
      try {
        if (queued) await txn.discard();
        else await txn.unwatch();
      } catch (closeError) {
        console.error('Lock & Rank could not close a save', closeError);
      }
      if (error instanceof GameError) throw error;
      continue;
    }
    const saved = await readPlay(playerId, next.date, topicId);
    if (samePlay(saved, next)) return;
  }
  throw new GameError('Could not save that lock. Try again.', 409);
}

/** Clear today's play for a single topicId. */
export async function clearPlay(playerId: string, date: string, topicId: string): Promise<boolean> {
  const key = playKey(playerId, date, topicId);
  const existing = await redis.get(key);
  await redis.del(key);
  return existing !== undefined && existing.length > 0;
}

/** Clear today's plays for ALL topics and also clear preferences. */
export async function clearAllPlays(playerId: string, date: string): Promise<void> {
  const keys = ALL_TOPIC_IDS.map((tid) => playKey(playerId, date, tid));
  await Promise.all(keys.map((k) => redis.del(k)));
  await redis.del(prefsKey(playerId));
}

// ── Preferences ───────────────────────────────────────────────────────────────

function prefsKey(playerId: string): string {
  return `lockrank:v1:prefs:${playerId}`;
}

/** Returns the saved category ids for a player. Empty array if none saved. */
export async function readPreferences(playerId: string): Promise<string[]> {
  try {
    const raw = await redis.get(prefsKey(playerId));
    if (!raw || raw.length === 0) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isSelectableCategoryId);
  } catch {
    return [];
  }
}

/** Persist the player's category selection. Must be validated before calling. */
export async function writePreferences(playerId: string, categoryIds: string[]): Promise<void> {
  await redis.set(prefsKey(playerId), JSON.stringify(categoryIds));
}

// ── Stats ────────────────────────────────────────────────────────────────────

export type StoredStats = {
  gamesPlayed: number;
  totalScore: number;
  bestScore: number;
  streak: number;
  longestStreak: number;
  lastPlayedDate: string | null;
};

function statsKey(playerId: string): string {
  return `lockrank:v1:stats:${playerId}`;
}

function prevUtcDate(date: string): string {
  const parts = date.split('-');
  const ms = Date.UTC(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2])) - 86_400_000;
  return new Date(ms).toISOString().slice(0, 10);
}

function emptyStats(): StoredStats {
  return { gamesPlayed: 0, totalScore: 0, bestScore: 0, streak: 0, longestStreak: 0, lastPlayedDate: null };
}

export async function readStats(playerId: string): Promise<StoredStats> {
  const raw = await redis.get(statsKey(playerId));
  if (!raw || raw.length === 0) return emptyStats();
  try {
    const parsed = JSON.parse(raw);
    if (!isRecord(parsed)) return emptyStats();
    return {
      gamesPlayed: typeof parsed.gamesPlayed === 'number' ? parsed.gamesPlayed : 0,
      totalScore: typeof parsed.totalScore === 'number' ? parsed.totalScore : 0,
      bestScore: typeof parsed.bestScore === 'number' ? parsed.bestScore : 0,
      streak: typeof parsed.streak === 'number' ? parsed.streak : 0,
      longestStreak: typeof parsed.longestStreak === 'number' ? parsed.longestStreak : 0,
      lastPlayedDate: typeof parsed.lastPlayedDate === 'string' ? parsed.lastPlayedDate : null,
    };
  } catch {
    return emptyStats();
  }
}

/** gamesPlayed/bestScore count every completed round; streak counts once per UTC day. */
export async function updateStats(playerId: string, date: string, score: number): Promise<StoredStats> {
  const stats = await readStats(playerId);
  const yesterday = prevUtcDate(date);
  const isNewDay = stats.lastPlayedDate !== date;
  const streak = isNewDay
    ? (stats.lastPlayedDate === yesterday ? stats.streak + 1 : 1)
    : stats.streak;
  const updated: StoredStats = {
    gamesPlayed: stats.gamesPlayed + 1,
    totalScore: stats.totalScore + score,
    bestScore: Math.max(stats.bestScore, score),
    streak,
    longestStreak: Math.max(stats.longestStreak, streak),
    lastPlayedDate: date,
  };
  await redis.set(statsKey(playerId), JSON.stringify(updated));
  return updated;
}

// ── Crowd comparison (scoped per topicId) ────────────────────────────────────

function crowdKey(date: string, topicId: string, itemId: string): string {
  return `lockrank:v1:crowd:${date}:${topicId}:${itemId}`;
}

export async function recordCrowdPlacement(date: string, topicId: string, itemId: string, slot: number): Promise<void> {
  try {
    await redis.hIncrBy(crowdKey(date, topicId, itemId), String(slot), 1);
  } catch {
    // crowd data is best-effort
  }
}

export async function readCrowdData(
  date: string,
  topicId: string,
  items: Array<{ id: string; trueRank: number }>
): Promise<Record<string, CrowdItem> | null> {
  try {
    const hashes = await Promise.all(
      items.map((item) => redis.hGetAll(crowdKey(date, topicId, item.id)))
    );
    const result: Record<string, CrowdItem> = {};
    for (let i = 0; i < items.length; i++) {
      const item = items[i]!;
      const hash = hashes[i]!;
      let total = 0;
      let weightedSum = 0;
      let exactCount = 0;
      for (let slot = 1; slot <= SLOT_COUNT; slot++) {
        const count = Number(hash[String(slot)] ?? 0);
        total += count;
        weightedSum += count * slot;
        if (slot === item.trueRank) exactCount += count;
      }
      if (total === 0) return null;
      result[item.id] = {
        avgSlot: Math.round((weightedSum / total) * 10) / 10,
        pctCorrect: Math.round((exactCount / total) * 100),
      };
    }
    return result;
  } catch {
    return null;
  }
}

// ── Leaderboard (scoped per topicId) ─────────────────────────────────────────

export type LeaderboardEntry = {
  rank: number;
  username: string;
  score: number;
};

function lbKey(date: string, topicId: string): string {
  return `lockrank:v1:lb:${date}:${topicId}`;
}

function lbScore(score: number, secondsFromMidnight: number): number {
  return score * 100000 + Math.max(0, 86400 - secondsFromMidnight);
}

export async function addToLeaderboard(
  date: string,
  topicId: string,
  userId: string,
  username: string,
  score: number,
  completionTime: number
): Promise<void> {
  try {
    const midnight = (() => {
      const parts = date.split('-');
      return Date.UTC(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
    })();
    const secondsFromMidnight = Math.floor((completionTime - midnight) / 1000);
    const member = `${username}:${userId}`;
    const existing = await redis.zScore(lbKey(date, topicId), member);
    if (existing !== undefined) return;
    await redis.zAdd(lbKey(date, topicId), { member, score: lbScore(score, secondsFromMidnight) });
  } catch {
    // leaderboard is best-effort
  }
}

export async function getLeaderboard(date: string, topicId: string, limit = 10): Promise<LeaderboardEntry[]> {
  try {
    const entries = await redis.zRange(lbKey(date, topicId), 0, limit - 1, { reverse: true, by: 'rank' });
    return entries.map((entry, index) => {
      const score = Math.floor(entry.score / 100000);
      const username = entry.member.split(':')[0] ?? entry.member;
      return { rank: index + 1, username, score };
    });
  } catch {
    return [];
  }
}
