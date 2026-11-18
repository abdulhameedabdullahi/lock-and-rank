import rawRounds from '../data/rounds.json';
import {
  SLOT_COUNT,
  isRecord,
  markForDistance,
  pointsForDistance,
  type Difficulty,
  type ItemResult,
  type PublicItem,
  type PublicPlacement,
  type Round,
  type RoundItem,
} from '../../shared/game';
import { getRoundForDay, dayNumberForDate } from '../../shared/rounds';
import { GameError } from './errors';

const LOW_FIRST = ['earliest', 'smallest', 'shortest', 'fewest', 'lowest', 'oldest', 'lightest'];

function readString(record: Record<string, unknown>, key: string, label: string): string {
  const value = record[key];
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new Error(`${label} is missing ${key}`);
  }
  return value.trim();
}

function readNumber(record: Record<string, unknown>, key: string, label: string): number {
  const value = record[key];
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    throw new Error(`${label} is missing a numeric ${key}`);
  }
  return value;
}

function readDifficulty(value: unknown, label: string): Difficulty {
  if (value === 'easy' || value === 'medium' || value === 'hard') return value;
  throw new Error(`${label} has an unknown difficulty`);
}

function parseItem(value: unknown, label: string): RoundItem {
  if (!isRecord(value)) throw new Error(`${label} is not an item`);
  return {
    id: readString(value, 'id', label),
    name: readString(value, 'name', label),
    emoji: readString(value, 'emoji', label),
    value: readNumber(value, 'value', label),
    source: readString(value, 'source', label),
  };
}

function parseRound(value: unknown, index: number): Round {
  const label = `Round ${index + 1}`;
  if (!isRecord(value)) throw new Error(`${label} is not an object`);
  if (!Array.isArray(value.items)) throw new Error(`${label} is missing items`);
  const items = value.items.map((item, itemIndex) => parseItem(item, `${label} item ${itemIndex + 1}`));
  if (items.length !== SLOT_COUNT) {
    throw new Error(`${label} must have ${SLOT_COUNT} items`);
  }
  const ids = new Set(items.map((item) => item.id));
  const values = new Set(items.map((item) => item.value));
  if (ids.size !== items.length) throw new Error(`${label} has duplicate ids`);
  if (values.size !== items.length) throw new Error(`${label} has tied values`);
  const topicId = readString(value, 'topicId', label);
  return {
    topicId,
    category: readString(value, 'category', label),
    rule: readString(value, 'rule', label),
    unit: readString(value, 'unit', label),
    difficulty: readDifficulty(value.difficulty, label),
    items,
  };
}

export function parseRounds(value: unknown): Round[] {
  if (!Array.isArray(value) || value.length === 0) {
    throw new Error('rounds.json must be a non-empty array');
  }
  return value.map((entry, index) => parseRound(entry, index));
}

export const rounds = parseRounds(rawRounds);

export function utcDateString(now: Date): string {
  return now.toISOString().slice(0, 10);
}

/**
 * Returns the round to play for a given topicId and UTC date.
 * Throws if no rounds exist for that topicId.
 */
export function roundForDate(topicId: string, date: string): { round: Round; roundNumber: number } {
  const round = getRoundForDay(topicId, date, rounds);
  if (!round) throw new GameError(`No round is seeded for topic "${topicId}".`, 500);
  const roundNumber = dayNumberForDate(date);
  return { round, roundNumber };
}

function topRankIsHighestValue(rule: string): boolean {
  const head = (rule.toLowerCase().split(' to ')[0] ?? rule.toLowerCase()).trim();
  return !LOW_FIRST.some((word) => head.includes(word));
}

export function trueRankById(round: Round): Map<string, number> {
  const direction = topRankIsHighestValue(round.rule) ? -1 : 1;
  const sorted = [...round.items].sort((a, b) => {
    if (a.value !== b.value) return (a.value - b.value) * direction;
    if (a.id < b.id) return -1;
    if (a.id > b.id) return 1;
    return 0;
  });
  const ranks = new Map<string, number>();
  sorted.forEach((item, index) => {
    ranks.set(item.id, index + 1);
  });
  return ranks;
}

function hashString(value: string): number {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function mulberry32(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = Math.imul(state ^ (state >>> 15), state | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), state | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Same sequence for every player on a given UTC date + topicId. Not the true rank order. */
export function presentationOrder(round: Round, date: string): string[] {
  const ids = round.items.map((item) => item.id);
  const random = mulberry32(hashString(`lockrank:${date}:${round.topicId}:${round.category}`));
  for (let index = ids.length - 1; index > 0; index -= 1) {
    const swap = Math.floor(random() * (index + 1));
    const current = ids[index];
    const other = ids[swap];
    if (current === undefined || other === undefined) continue;
    ids[index] = other;
    ids[swap] = current;
  }
  return ids;
}

export function archiveRoundList(): Array<{ index: number; roundNumber: number; topicId: string; category: string; rule: string; difficulty: Difficulty }> {
  return rounds.map((round, index) => ({
    index,
    roundNumber: index + 1,
    topicId: round.topicId,
    category: round.category,
    rule: round.rule,
    difficulty: round.difficulty,
  }));
}

export function archiveRoundForIndex(index: number): { round: Round; roundNumber: number } {
  const round = rounds[index];
  if (!round) throw new GameError('Archive round not found.', 400);
  return { round, roundNumber: index + 1 };
}

export function findItem(round: Round, itemId: string): RoundItem | undefined {
  return round.items.find((item) => item.id === itemId);
}

export function toPublicItem(round: Round, itemId: string): PublicItem {
  const item = findItem(round, itemId);
  if (!item) throw new GameError("That item is not in today's round.", 400);
  return { id: item.id, name: item.name, emoji: item.emoji };
}

export function toPublicPlacement(
  round: Round,
  placement: { itemId: string; slot: number }
): PublicPlacement {
  const item = toPublicItem(round, placement.itemId);
  return { itemId: item.id, name: item.name, emoji: item.emoji, slot: placement.slot };
}

export function scorePlacements(
  round: Round,
  order: string[],
  placements: { itemId: string; slot: number }[]
): { score: number; results: ItemResult[] } {
  const ranks = trueRankById(round);
  const results = order.map((itemId) => {
    const item = findItem(round, itemId);
    const placement = placements.find((entry) => entry.itemId === itemId);
    const trueRank = ranks.get(itemId);
    if (!item || !placement || trueRank === undefined) {
      throw new GameError("Today's saved play is incomplete.", 500);
    }
    const distance = Math.abs(placement.slot - trueRank);
    return {
      itemId: item.id,
      name: item.name,
      emoji: item.emoji,
      value: item.value,
      unit: round.unit,
      chosenSlot: placement.slot,
      trueRank,
      distance,
      points: pointsForDistance(distance),
      mark: markForDistance(distance),
    };
  });
  const score = results.reduce((total, result) => total + result.points, 0);
  return { score, results };
}
