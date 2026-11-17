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

test('테스트 임시 데이터베이스 정리', () => {
  db.closeDatabase();
  rmSync(temporaryDirectory, { recursive: true, force: true });
});
