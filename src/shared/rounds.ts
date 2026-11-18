import type { Round } from './game';

/** All day numbers are measured from this UTC date. */
const ROUNDS_EPOCH = '2025-01-01';

function utcDayNumber(date: string): number {
  const parts = date.split('-');
  const year = Number(parts[0]);
  const month = Number(parts[1]);
  const day = Number(parts[2]);
  return Math.floor(Date.UTC(year, month - 1, day) / 86_400_000);
}

/**
 * Pure function: given a topicId and a UTC date string, return the round to play.
 * Rotates through the pool for that topicId by (dayNumber mod pool.length), so there
 * are no repeats until the pool is exhausted.
 * Returns undefined if the category has no rounds.
 */
export function getRoundForDay(topicId: string, date: string, allRounds: Round[]): Round | undefined {
  const pool = allRounds.filter((r) => r.topicId === topicId);
  if (pool.length === 0) return undefined;
  const dayNum = utcDayNumber(date) - utcDayNumber(ROUNDS_EPOCH);
  const index = ((dayNum % pool.length) + pool.length) % pool.length;
  return pool[index];
}

/**
 * Returns the global day number for a UTC date string (days since ROUNDS_EPOCH).
 * Used as the round number displayed to players.
 */
export function dayNumberForDate(date: string): number {
  return utcDayNumber(date) - utcDayNumber(ROUNDS_EPOCH) + 1;
}
