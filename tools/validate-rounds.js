// Validates rounds.json for structural correctness.
// Run: node tools/validate-rounds.js
'use strict';
const path = require('path');
const rounds = require(path.join(__dirname, '../src/server/data/rounds.json'));

const VALID_TOPIC_IDS = new Set(['mix', 'tech', 'anime', 'movies', 'games', 'soccer', 'music', 'science', 'geography']);
const VALID_DIFFICULTIES = new Set(['easy', 'medium', 'hard']);
const ROUND_FIELDS = ['topicId', 'category', 'rule', 'unit', 'difficulty', 'items'];
const ITEM_FIELDS = ['id', 'name', 'emoji', 'value', 'source'];

let errors = 0;
function fail(msg) { console.error('FAIL:', msg); errors++; }

rounds.forEach((round, i) => {
  const label = `Round ${i + 1} [${round.topicId || '?'}] "${round.category || '?'}"`;

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
  if (!Array.isArray(round.items)) {
    fail(`${label}: items is not an array`);
    return;
  }
  if (round.items.length !== 5) {
    fail(`${label}: has ${round.items.length} items, expected exactly 5`);
  }

  const values = new Set();
  const ids = new Set();
  round.items.forEach((item, j) => {
    const ilabel = `${label} item ${j + 1} (id="${item.id || '?'}")`;
    for (const f of ITEM_FIELDS) {
      if (item[f] === undefined || item[f] === null || item[f] === '') {
        fail(`${ilabel}: missing or empty field "${f}"`);
      }
    }
    if (typeof item.value !== 'number' || !Number.isFinite(item.value)) {
      fail(`${ilabel}: value is not a finite number`);
    } else {
      if (values.has(item.value)) fail(`${label}: duplicate value ${item.value}`);
      values.add(item.value);
    }
    if (ids.has(item.id)) fail(`${label}: duplicate item id "${item.id}"`);
    ids.add(item.id);
  });
});

// Count per topicId
const counts = {};
rounds.forEach(r => { counts[r.topicId] = (counts[r.topicId] || 0) + 1; });
console.log('Rounds per topicId:', JSON.stringify(counts));

if (errors === 0) {
  console.log(`✓ All ${rounds.length} rounds passed validation.`);
} else {
  console.error(`✗ ${errors} error(s). Fix before deploying.`);
  process.exit(1);
}
