import test from 'node:test';
import assert from 'node:assert/strict';
import { validateAnalysis } from '../ai.js';

test('AI 결과 검증: 올바른 JSON 필드', () => {
  const result = validateAnalysis({
    category: '논리 오류 가능성', concept: '배열', confidence: '높음',
    summary: '배열 범위', explanation: '인덱스가 초과될 수 있음',
    hint1: '배열 크기를 확인해 보세요.', hint2: '마지막 인덱스를 계산해 보세요.', hint3: '반복문의 조건을 점검해 보세요.',
  });
  assert.equal(result.concept, '배열');
});

test('AI 결과 검증: 분류 값 오류 시 거절', () => {
  assert.throws(() => validateAnalysis({
    category: '무한대 오류', concept: '배열', confidence: '높음',
    summary: 'x', explanation: 'x', hint1: 'x', hint2: 'x', hint3: 'x',
  }));
});
