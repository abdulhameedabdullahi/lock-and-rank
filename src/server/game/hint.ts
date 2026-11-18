import type { StoredPlacement } from './store';

// Must stay in sync with SLOT_COUNT in shared/game.ts
const TOTAL_SLOTS = 5;

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

export function getOpenSlots(placements: StoredPlacement[]): number[] {
  const taken = new Set(placements.map((p) => p.slot));
  const open: number[] = [];
  for (let s = 1; s <= TOTAL_SLOTS; s++) {
    if (!taken.has(s)) open.push(s);
  }
  return open;
}

export function hintIsAvailable(openSlots: number[]): boolean {
  return openSlots.length >= 4;
}

export function hintRemoveCount(openSlotCount: number): number {
  return Math.max(0, openSlotCount - 3);
}

/**
 * Deterministically selects slots to eliminate for a hint.
 * Never includes the trueSlot. Seed is derived from userId+topicId+date+itemIndex
 * so it is stable across refreshes and repeat calls with the same arguments.
 */
export function selectEliminatedSlots(
  openSlots: number[],
  trueSlot: number,
  userId: string,
  topicId: string,
  date: string,
  itemIndex: number
): number[] {
  const wrongSlots = openSlots.filter((s) => s !== trueSlot);
  const removeCount = openSlots.length - 3;
  if (removeCount <= 0 || removeCount > wrongSlots.length) return [];

  const seed = hashString(`hint:${userId}:${topicId}:${date}:${itemIndex}`);
  const copy = [...wrongSlots];
  const random = mulberry32(seed);
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    const a = copy[i];
    const b = copy[j];
    if (a === undefined || b === undefined) continue;
    copy[i] = b;
    copy[j] = a;
  }
  return copy.slice(0, removeCount).sort((a, b) => a - b);
}
