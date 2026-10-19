import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeText, calculateSimilarity, compareWords, evaluateOfflineWriting, evaluateOfflineSpeaking } from './scoring.ts';

test('normalizeText handles punctuation and casing correctly', () => {
  assert.equal(normalizeText("Hello, world! It's a nice day."), 'hello world its a nice day');
  assert.equal(normalizeText('  I am 25 years old.  '), 'i am 25 years old');
});

test('calculateSimilarity returns 100 for identical strings after normalization', () => {
  assert.equal(calculateSimilarity('Hello, my name is Minh.', 'hello my name is minh'), 100);
});

test('calculateSimilarity handles typos with reasonable score', () => {
  const score = calculateSimilarity('Hello my nem is Minh', 'Hello, my name is Minh.');
  assert.ok(score >= 80, `Expected score >= 80, got ${score}`);
});

test('compareWords identifies matching, missing, and extra words', () => {
  const diffs = compareWords('I live Da Nang', 'I live in Da Nang');
  assert.ok(diffs.length > 0);
  assert.equal(diffs[0].status, 'correct'); // "I" matches "I"
});

test('evaluateOfflineWriting gives accurate grade and feedback', () => {
  const result = evaluateOfflineWriting('Hello, my name is Minh.', 'Hello, my name is Minh.');
  assert.equal(result.grade, 'excellent');
  assert.equal(result.score, 100);
});

test('evaluateOfflineSpeaking adds Vietnamese phonetic advice when relevant', () => {
  const result = evaluateOfflineSpeaking('She has brown eyes', 'She has brown eyes');
  assert.ok(result.score >= 90);
  assert.ok(result.pronunciationTips && result.pronunciationTips.length > 0);
});
