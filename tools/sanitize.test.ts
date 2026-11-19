import assert from 'node:assert/strict';
import { test } from 'node:test';
import { sanitizeCaption } from '../src/server/game/sanitize.ts';

test('trims whitespace', () => {
  assert.equal(sanitizeCaption('  hello  '), 'hello');
});

test('strips http URLs', () => {
  assert.equal(sanitizeCaption('check https://example.com out'), 'check out');
});

test('strips https URLs', () => {
  assert.equal(sanitizeCaption('see https://reddit.com/r/test'), 'see');
});

test('strips @mentions', () => {
  assert.equal(sanitizeCaption('hi @user great'), 'hi great');
});

test('strips u/ user references', () => {
  assert.equal(sanitizeCaption('thanks u/someone'), 'thanks');
});

test('strips r/ subreddit references', () => {
  assert.equal(sanitizeCaption('post in r/gaming now'), 'post in now');
});

test('collapses extra spaces after stripping', () => {
  assert.equal(sanitizeCaption('hello   @user   world'), 'hello world');
});

test('truncates to 140 chars', () => {
  const long = 'a'.repeat(200);
  assert.equal(sanitizeCaption(long).length, 140);
});

test('preserves normal text', () => {
  assert.equal(sanitizeCaption('Great round today!'), 'Great round today!');
});

test('handles empty string', () => {
  assert.equal(sanitizeCaption(''), '');
});

test('handles only whitespace', () => {
  assert.equal(sanitizeCaption('   '), '');
});

test('handles only stripped content', () => {
  assert.equal(sanitizeCaption('https://example.com'), '');
});
