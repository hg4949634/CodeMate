import test from 'node:test';
import assert from 'node:assert/strict';
import { buildLearningInsights } from '../insights.js';
import problems from '../data/problems.js';

const analysis = (category, concept) => ({ category, concept });

test('4주차: 빈 기록은 추천 없이 문제 개념만 표시한다', () => {
  const info = buildLearningInsights([], problems);
  assert.equal(info.totals.totalSubmissions, 0);
  assert.equal(info.totals.analyzedSubmissions, 0);
  assert.equal(info.recommendations.length, 0);
  assert.equal(info.concepts.length, 4);
  assert.ok(info.concepts.every((c) => c.reviewSignal === 0));
});

test('4주차: AI 오류 가능성과 직접 복습 표시는 구분하여 집계된다', () => {
  const records = [
    { problemId: 2, needsReview: true, analysis: analysis('실행 오류 가능성', '배열') },
    { problemId: 2, needsReview: false, analysis: analysis('명확한 오류 없음', '배열') },
    { problemId: 1, needsReview: true, analysis: analysis('개념 보완', '반복문') },
    { problemId: 4, needsReview: false, analysis: null },
  ];
  const info = buildLearningInsights(records, problems);
  assert.deepEqual(info.totals, {
    totalSubmissions: 4,
    analyzedSubmissions: 3,
    potentialErrorCount: 1,
    improvementCount: 1,
    noClearErrorCount: 1,
    manualReviewCount: 2,
  });
  const array = info.concepts.find((c) => c.concept === '배열');
  const loop = info.concepts.find((c) => c.concept === '반복문');
  assert.equal(array.reviewSignal, 3); // AI 오류 가능성 x2 + 직접 복습 1
  assert.equal(array.noClearErrorCount, 1); // 정답 판정이 아닌 '오류 미발견'으로 집계
  assert.equal(loop.reviewSignal, 2); // 개념 보완 1 + 직접 복습 1
  assert.deepEqual(info.recommendations.map((r) => r.problemId), [2, 1]);
  assert.match(info.recommendations[0].reason, /AI가 오류 가능성/);
});

test('4주차: 분석된 개념과 문제 원래 개념이 다르면 각각의 출처대로 집계한다', () => {
  const info = buildLearningInsights([
    { problemId: 1, needsReview: true, analysis: analysis('논리 오류 가능성', '배열') },
  ], problems);
  const array = info.concepts.find((c) => c.concept === '배열');
  const loop = info.concepts.find((c) => c.concept === '반복문');
  assert.equal(array.potentialErrorCount, 1);
  assert.equal(array.manualReviewCount, 0);
  assert.equal(loop.potentialErrorCount, 0);
  assert.equal(loop.manualReviewCount, 1);
  assert.deepEqual(info.recommendations.map((r) => r.problemId), [2, 1]);
});

test('4주차: 새 OpenAI API 호출 없이 같은 기록에서 같은 통계를 얻는다', () => {
  const records = [{ problemId: 4, needsReview: true, analysis: null }];
  const one = buildLearningInsights(records, problems);
  const two = buildLearningInsights(records, problems);
  assert.deepEqual(one, two);
  assert.equal(one.totals.analyzedSubmissions, 0);
  assert.equal(one.recommendations[0].problemId, 4);
});
