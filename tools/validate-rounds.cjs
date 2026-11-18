// Validates rounds.json for structural correctness.
// Run: node tools/validate-rounds.cjs
'use strict';
const path = require('path');
const rounds = require(path.join(__dirname, '../src/server/data/rounds.json'));

const SELECTABLE_IDS = new Set(['tech', 'anime', 'movies', 'games', 'soccer', 'music', 'science', 'geography', 'basketball', 'wildfacts']);
const VALID_TOPIC_IDS = new Set(['mix', ...SELECTABLE_IDS]);
const VALID_DIFFICULTIES = new Set(['easy', 'medium', 'hard']);
const ROUND_FIELDS = ['topicId', 'category', 'rule', 'unit', 'difficulty', 'items'];
const ITEM_FIELDS = ['id', 'name', 'emoji', 'value', 'source'];

let errors = 0;
let warnings = 0;
function fail(msg) { console.error('FAIL:', msg); errors++; }
function warn(msg) { console.warn('WARN:', msg); warnings++; }

function isYearUnit(unit, values) {
  if (typeof unit === 'string' && unit.toLowerCase().includes('year')) return true;
  return values.length > 0 && values.every(v => typeof v === 'number' && v >= 1000 && v <= 2100);
}

const seenTitles = new Set();
const allItemIds = new Set();

rounds.forEach((round, i) => {
  const label = `Round ${i + 1} [${round.topicId || '?'}] "${round.category || '?'}"`;

  // Required fields
  for (const f of ROUND_FIELDS) {
    if (round[f] === undefined || round[f] === null || round[f] === '') {
      fail(`${label}: missing or empty field "${f}"`);
    }
  }
  if (typeof round.topicId === 'string' && !VALID_TOPIC_IDS.has(round.topicId)) {
    fail(`${label}: unknown topicId "${round.topicId}"`);
  }
  if (typeof round.difficulty === 'string' && !VALID_DIFFICULTIES.has(round.difficulty)) {
    fail(`${label}: unknown difficulty "${round.difficulty}"`);
  }

  // Length limits
  if (typeof round.category === 'string' && round.category.length > 40) {
    fail(`${label}: category title too long (${round.category.length} chars, max 40)`);
  }
  if (typeof round.rule === 'string' && round.rule.length > 60) {
    fail(`${label}: rule too long (${round.rule.length} chars, max 60)`);
  }

  // Duplicate titles (globally)
  const titleKey = `${round.topicId}::${round.category}`;
  if (seenTitles.has(titleKey)) {
    fail(`${label}: duplicate title within topicId "${round.topicId}"`);
  }
  seenTitles.add(titleKey);

  if (!Array.isArray(round.items)) {
    fail(`${label}: items is not an array`);
    return;
  }
  if (round.items.length !== 5) {
    fail(`${label}: has ${round.items.length} items, expected exactly 5`);
  }

  const values = [];
  const ids = new Set();
  round.items.forEach((item, j) => {
    const ilabel = `${label} item ${j + 1} (id="${item.id || '?'}")`;
    for (const f of ITEM_FIELDS) {
      if (item[f] === undefined || item[f] === null || item[f] === '') {
        fail(`${ilabel}: missing or empty field "${f}"`);
      }
    }
    if (typeof item.name === 'string' && item.name.length > 24) {
      fail(`${ilabel}: name too long (${item.name.length} chars, max 24)`);
    }
    if (typeof item.value !== 'number' || !Number.isFinite(item.value)) {
      fail(`${ilabel}: value is not a finite number`);
    } else {
      values.push(item.value);
    }
    if (ids.has(item.id)) fail(`${label}: duplicate item id "${item.id}"`);
    ids.add(item.id);
    if (allItemIds.has(item.id)) warn(`Global duplicate item id "${item.id}" in ${label}`);
    allItemIds.add(item.id);
  });

  if (values.length === 5) {
    // Duplicate values check
    const valSet = new Set(values);
    if (valSet.size !== values.length) {
      fail(`${label}: duplicate value(s) found`);
    }

    // 8% gap check on sorted values
    const sorted = [...values].sort((a, b) => a - b);
    const yearMode = isYearUnit(round.unit, sorted);
    for (let k = 1; k < sorted.length; k++) {
      const prev = sorted[k - 1];
      const curr = sorted[k];
      if (prev === 0) continue; // skip 0-based gaps
      const gap = (curr - prev) / Math.abs(prev);
      if (gap < 0.08) {
        if (yearMode) {
          warn(`${label}: consecutive values ${prev}→${curr} gap ${(gap * 100).toFixed(1)}% < 8% (year unit — warn only)`);
        } else {
          fail(`${label}: consecutive values ${prev}→${curr} gap ${(gap * 100).toFixed(1)}% < 8% (must be ≥ 8%)`);
        }
      }
    }

    // Sorted-order detection
    const asc = sorted.every((v, k) => k === 0 || v >= sorted[k - 1]);
    const origAsc = values.every((v, k) => k === 0 || v >= values[k - 1]);
    const origDesc = values.every((v, k) => k === 0 || v <= values[k - 1]);
    if (asc && (origAsc || origDesc)) {
      warn(`${label}: items are listed in sorted order in JSON — scramble for variety`);
    }
  }
});

// Count per topicId
const counts = {};
const diffCounts = {};
rounds.forEach(r => {
  counts[r.topicId] = (counts[r.topicId] || 0) + 1;
  const key = `${r.topicId}:${r.difficulty}`;
  diffCounts[key] = (diffCounts[key] || 0) + 1;
});
console.log('\nRounds per topicId:');
Object.entries(counts).sort((a, b) => a[0].localeCompare(b[0])).forEach(([id, n]) => {
  const e = diffCounts[`${id}:easy`] || 0;
  const m = diffCounts[`${id}:medium`] || 0;
  const h = diffCounts[`${id}:hard`] || 0;
  const target = id === 'mix' ? '—' : `target 10 (4E/4M/2H)`;
  const status = id === 'mix' ? '' : (n === 10 && e === 4 && m === 4 && h === 2 ? ' ✓' : ` ← ${n} total (${e}E ${m}M ${h}H)`);
  console.log(`  ${id.padEnd(14)} ${String(n).padStart(3)} rounds  ${target}${status}`);
});

console.log('');
if (errors === 0 && warnings === 0) {
  console.log(`✓ All ${rounds.length} rounds passed validation (no warnings).`);
} else if (errors === 0) {
  console.log(`✓ All ${rounds.length} rounds passed (${warnings} warning(s)).`);
} else {
  console.error(`✗ ${errors} error(s), ${warnings} warning(s). Fix errors before deploying.`);
  process.exit(1);
}
