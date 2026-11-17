// SQLite에 제출 기록을 저장하고 읽어오는 함수 모음입니다.
// Node.js 24.15.0의 내장 node:sqlite를 사용하므로 sqlite3 설치가 필요 없습니다.
import { DatabaseSync } from 'node:sqlite';
import { mkdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const dbPath = process.env.CODEMATE_DB_PATH
  ? resolve(process.env.CODEMATE_DB_PATH)
  : join(here, 'data', 'codemate.sqlite');

// 처음 실행할 때 데이터 폴더와 데이터베이스 파일을 자동으로 만듭니다.
mkdirSync(dirname(dbPath), { recursive: true });
const db = new DatabaseSync(dbPath);

// 테이블이 이미 있다면 삭제하거나 초기화하지 않습니다.
// 따라서 서버를 종료하고 다시 실행해도 저장한 기록은 남아 있습니다.
db.exec(`
  CREATE TABLE IF NOT EXISTS submissions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    problem_id INTEGER NOT NULL,
    code TEXT NOT NULL,
    needs_review INTEGER NOT NULL DEFAULT 0 CHECK (needs_review IN (0, 1)),
    note TEXT NOT NULL DEFAULT '',
    created_at TEXT NOT NULL
  );

  CREATE INDEX IF NOT EXISTS idx_submissions_problem_id
    ON submissions (problem_id);
`);

// 물음표(?)에 값을 별도로 전달하는 준비된 SQL 문을 사용합니다.
const insertStatement = db.prepare(`
  INSERT INTO submissions (problem_id, code, needs_review, note, created_at)
  VALUES (?, ?, ?, ?, ?)
`);

const findStatement = db.prepare(`
  SELECT id, problem_id, code, needs_review, note, created_at
  FROM submissions WHERE id = ?
`);

// SQLite는 컬럼을 snake_case로 저장하므로 프론트엔드에서 읽기 편하게 변환합니다.
function toSubmission(row) {
  return {
    id: row.id,
    problemId: row.problem_id,
    code: row.code,
    needsReview: row.needs_review === 1,
    note: row.note,
    createdAt: row.created_at,
  };
}

export function createSubmission({ problemId, code, needsReview, note }) {
  const createdAt = new Date().toISOString();
  const result = insertStatement.run(problemId, code, needsReview ? 1 : 0, note, createdAt);
  return toSubmission(findStatement.get(Number(result.lastInsertRowid)));
}

export function getSubmissions(problemId = null, limit = 50) {
  if (problemId === null) {
    const rows = db.prepare(`
      SELECT id, problem_id, code, needs_review, note, created_at
      FROM submissions ORDER BY id DESC LIMIT ?
    `).all(limit);
    return rows.map(toSubmission);
  }

  const rows = db.prepare(`
    SELECT id, problem_id, code, needs_review, note, created_at
    FROM submissions WHERE problem_id = ? ORDER BY id DESC LIMIT ?
  `).all(problemId, limit);
  return rows.map(toSubmission);
}

export function getSubmissionStats() {
  const row = db.prepare(`
    SELECT COUNT(*) AS total,
           COALESCE(SUM(needs_review), 0) AS reviewCount,
           COUNT(DISTINCT problem_id) AS attemptedProblems
    FROM submissions
  `).get();

  return {
    total: row.total,
    reviewCount: row.reviewCount,
    attemptedProblems: row.attemptedProblems,
  };
}

// 테스트 전용으로 연결을 닫을 때만 사용합니다.
export function closeDatabase() {
  db.close();
}
