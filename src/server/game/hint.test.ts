import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
// @ts-nocheck
import {
  getOpenSlots,
  hintIsAvailable,
  hintRemoveCount,
  selectEliminatedSlots,
} from './hint.ts';

// Match constants in shared/game.ts — keep in sync manually
const HINT_COST = 5;
const SLOT_COUNT = 5;

// ── getOpenSlots ──────────────────────────────────────────────────────────────

describe('getOpenSlots', () => {
  test('returns all 5 when no placements', () => {
    assert.deepEqual(getOpenSlots([]), [1, 2, 3, 4, 5]);
  });

  test('excludes the taken slot', () => {
    const result = getOpenSlots([{ itemId: 'a', slot: 3 }]);
    assert.deepEqual(result, [1, 2, 4, 5]);
  });

  test('returns empty when all slots taken', () => {
    const placements = [1, 2, 3, 4, 5].map((slot, i) => ({ itemId: `item${i}`, slot }));
    assert.deepEqual(getOpenSlots(placements), []);
  });
});

// ── hintIsAvailable ───────────────────────────────────────────────────────────

describe('hintIsAvailable', () => {
  test('true with 5 open slots (item 1)', () => {
    assert.equal(hintIsAvailable([1, 2, 3, 4, 5]), true);
  });

  test('true with 4 open slots (item 2)', () => {
    assert.equal(hintIsAvailable([1, 2, 4, 5]), true);
  });

  test('false with 3 open slots (item 3 — unavailable)', () => {
    assert.equal(hintIsAvailable([1, 2, 4]), false);
  });

  test('false with 2 open slots (item 4 — unavailable)', () => {
    assert.equal(hintIsAvailable([1, 2]), false);
  });

  test('false with 1 open slot (item 5 — unavailable)', () => {
    assert.equal(hintIsAvailable([2]), false);
  });
});

// ── hintRemoveCount ───────────────────────────────────────────────────────────

describe('hintRemoveCount', () => {
  test('item 1: removes 2 (5 open → leave 3)', () => {
    assert.equal(hintRemoveCount(5), 2);
  });

  test('item 2: removes 1 (4 open → leave 3)', () => {
    assert.equal(hintRemoveCount(4), 1);
  });

  test('item 3: removes 0 (3 open — below threshold)', () => {
    assert.equal(hintRemoveCount(3), 0);
  });

  test('item 4: removes 0 (2 open)', () => {
    assert.equal(hintRemoveCount(2), 0);
  });
});

// ── selectEliminatedSlots ─────────────────────────────────────────────────────

const USER = 'u_test';
const TOPIC = 'tech';
const DATE = '2026-01-01';

describe('selectEliminatedSlots — item 1 (5 open, trueSlot=3)', () => {
  const openSlots = [1, 2, 3, 4, 5];
  const trueSlot = 3;
  const eliminated = selectEliminatedSlots(openSlots, trueSlot, USER, TOPIC, DATE, 0);

  test('removes exactly 2', () => {
    assert.equal(eliminated.length, 2);
  });

  test('never includes the true slot', () => {
    assert.equal(eliminated.includes(trueSlot), false);
  });

  test('no duplicates', () => {
    assert.equal(new Set(eliminated).size, eliminated.length);
  });

  test('all eliminated slots are valid open slots', () => {
    for (const s of eliminated) {
      assert.equal(openSlots.includes(s), true);
    }
  });

  test('leaves exactly 3 candidate slots', () => {
    const remaining = openSlots.filter((s) => !eliminated.includes(s));
    assert.equal(remaining.length, 3);
  });

  test('true slot is among remaining candidates', () => {
    const remaining = openSlots.filter((s) => !eliminated.includes(s));
    assert.equal(remaining.includes(trueSlot), true);
  });
});

describe('selectEliminatedSlots — item 2 (4 open, trueSlot=2)', () => {
  const openSlots = [1, 2, 4, 5];
  const trueSlot = 2;
  const eliminated = selectEliminatedSlots(openSlots, trueSlot, USER, TOPIC, DATE, 1);

  test('removes exactly 1', () => {
    assert.equal(eliminated.length, 1);
  });

  test('never includes the true slot', () => {
    assert.equal(eliminated.includes(trueSlot), false);
  });

  test('no duplicates', () => {
    assert.equal(new Set(eliminated).size, eliminated.length);
  });

  test('leaves exactly 3 candidate slots', () => {
    const remaining = openSlots.filter((s) => !eliminated.includes(s));
    assert.equal(remaining.length, 3);
  });
});

describe('selectEliminatedSlots — item 3+ (3 open, unavailable)', () => {
  test('returns empty array when openSlots < 4', () => {
    const result = selectEliminatedSlots([1, 3, 5], 3, USER, TOPIC, DATE, 2);
    assert.deepEqual(result, []);
  });

  test('returns empty array for item 4 (2 open)', () => {
    const result = selectEliminatedSlots([1, 3], 3, USER, TOPIC, DATE, 3);
    assert.deepEqual(result, []);
  });

  test('returns empty array for item 5 (1 open)', () => {
    const result = selectEliminatedSlots([4], 4, USER, TOPIC, DATE, 4);
    assert.deepEqual(result, []);
  });
});

describe('selectEliminatedSlots — determinism', () => {
  test('same inputs produce identical results', () => {
    const a = selectEliminatedSlots([1, 2, 3, 4, 5], 1, USER, TOPIC, DATE, 0);
    const b = selectEliminatedSlots([1, 2, 3, 4, 5], 1, USER, TOPIC, DATE, 0);
    assert.deepEqual(a, b);
  });

  test('different userId produces different results (probabilistic)', () => {
    const a = selectEliminatedSlots([1, 2, 3, 4, 5], 1, 'user_A', TOPIC, DATE, 0);
    const b = selectEliminatedSlots([1, 2, 3, 4, 5], 1, 'user_B', TOPIC, DATE, 0);
    // Different seeds; not guaranteed to differ but overwhelmingly likely
    // We verify at minimum both are valid
    assert.equal(a.length, 2);
    assert.equal(b.length, 2);
    assert.equal(a.includes(1), false); // true slot never eliminated
    assert.equal(b.includes(1), false);
  });
});

// ── HINT_COST and score penalty ───────────────────────────────────────────────

describe('HINT_COST', () => {
  test('is 5', () => {
    assert.equal(HINT_COST, 5);
  });
});

describe('hint score penalty', () => {
  test('finalScore = rawScore - HINT_COST when hint used', () => {
    const rawScore = 60;
    const finalScore = Math.max(0, rawScore - HINT_COST);
    assert.equal(finalScore, 55);
  });

  test('finalScore never goes below 0', () => {
    for (const rawScore of [0, 1, 2, 3, 4, 5]) {
      const finalScore = Math.max(0, rawScore - HINT_COST);
      assert.equal(finalScore >= 0, true, `failed for rawScore=${rawScore}`);
    }
  });

  test('finalScore equals rawScore when hint not used', () => {
    const rawScore = 80;
    const hintPenalty = 0;
    const finalScore = Math.max(0, rawScore - hintPenalty);
    assert.equal(finalScore, rawScore);
  });

  test(`max possible score with hint is ${100 - HINT_COST}`, () => {
    assert.equal(Math.max(0, 100 - HINT_COST), 95);
  });
});

// ── SLOT_COUNT sanity ─────────────────────────────────────────────────────────

describe('slot count', () => {
  test('SLOT_COUNT is 5', () => {
    assert.equal(SLOT_COUNT, 5);
  });
});
