// node --test 로 실행하는 데이터베이스 자동 테스트
import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

const temporaryDirectory = mkdtempSync(join(tmpdir(), 'codemate-week2-'));
process.env.CODEMATE_DB_PATH = join(temporaryDirectory, 'test.sqlite');
const db = await import('../db.js');

test('제출 기록을 저장하고 읽어올 수 있다', () => {
  assert.deepEqual(db.getSubmissionStats(), { total: 0, reviewCount: 0, attemptedProblems: 0 });
  const saved = db.createSubmission({
    problemId: 2,
    code: 'int main(void) { return 0; }',
    needsReview: true,
    note: '배열 반복문 복습',
  });
  assert.equal(saved.id, 1);
  assert.equal(saved.problemId, 2);
  assert.equal(saved.needsReview, true);
  assert.equal(saved.note, '배열 반복문 복습');
  assert.equal(db.getSubmissions()[0].code, 'int main(void) { return 0; }');
  assert.equal(db.getSubmissions(1).length, 0);
  assert.equal(db.getSubmissions(2).length, 1);
  assert.deepEqual(db.getSubmissionStats(), { total: 1, reviewCount: 1, attemptedProblems: 1 });
});

test('서버를 끄지 않고 다른 문제 기록도 추가된다', () => {
  db.createSubmission({ problemId: 1, code: 'printf("hello");', needsReview: false, note: '' });
  assert.deepEqual(db.getSubmissionStats(), { total: 2, reviewCount: 1, attemptedProblems: 2 });
  assert.deepEqual(db.getSubmissions().map((r) => r.problemId), [1, 2]);
});

test('3주차: 분석 결과를 저장하고 기존 기록에 연결한다', () => {
  const feedback = {
    category: '논리 오류 가능성', concept: '반복문', confidence: '보통',
    summary: '반복문 조건 확인', explanation: '종료 조건을 확인해 보세요.',
    hint1: '반복 횟수를 세어 보세요.', hint2: '상한값을 비교해 보세요.', hint3: '마지막 반복 값을 계산해 보세요.',
  };
  const saved = db.saveAnalysis({ submissionId: 1, analysis: feedback, model: 'test-model' });
  assert.equal(saved.analysis.summary, '반복문 조건 확인');
  assert.equal(db.getSubmissions(2)[0].analysis.category, '논리 오류 가능성');
  // 중복 요청은 기존 분석을 덮어쓰지 않습니다.
  const unchanged = db.saveAnalysis({ submissionId: 1, analysis: { ...feedback, summary: '덮어쓰기 시도' }, model: 'other' });
  assert.equal(unchanged.analysis.summary, '반복문 조건 확인');
  assert.equal(db.getSubmissionById(99999), null);
});

test('테스트 임시 데이터베이스 정리', () => {
  db.closeDatabase();
  rmSync(temporaryDirectory, { recursive: true, force: true });
});
