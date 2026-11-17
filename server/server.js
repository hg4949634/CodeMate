import express from 'express';
import cors from 'cors';
import 'dotenv/config';
import problems from './data/problems.js';
import { createSubmission, getSubmissions, getSubmissionStats } from './db.js';

const app = express();
const port = Number(process.env.PORT || 3001);

// VS Code에서 실행하는 로컬 프로젝트를 위한 설정입니다.
app.use(cors({ origin: 'http://127.0.0.1:5173' }));
app.use(express.json({ limit: '64kb' }));

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'CodeMate AI 서버가 정상 동작 중입니다.' });
});

app.get('/api/problems', (req, res) => {
  res.json({ problems });
});

app.get('/api/problems/:id', (req, res) => {
  const id = Number(req.params.id);
  const problem = problems.find((item) => item.id === id);
  if (!problem) return res.status(404).json({ error: '문제를 찾을 수 없습니다.' });
  res.json({ problem });
});

// 2주차 핵심 기능 1: 작성한 코드를 데이터베이스에 저장합니다.
app.post('/api/submissions', (req, res) => {
  const { problemId, code, needsReview = false, note = '' } = req.body ?? {};

  // 없는 문제, 빈 코드, 지나치게 긴 입력을 저장하지 않습니다.
  if (!Number.isInteger(problemId) || !problems.some((p) => p.id === problemId)) {
    return res.status(400).json({ error: '유효한 문제 번호가 필요합니다.' });
  }
  if (typeof code !== 'string' || !code.trim()) {
    return res.status(400).json({ error: '제출할 C언어 코드를 입력해 주세요.' });
  }
  if (code.length > 20000) {
    return res.status(400).json({ error: '코드는 최대 20,000자까지 저장할 수 있습니다.' });
  }
  if (typeof needsReview !== 'boolean') {
    return res.status(400).json({ error: '복습 여부의 형식이 올바르지 않습니다.' });
  }
  if (typeof note !== 'string' || note.length > 240) {
    return res.status(400).json({ error: '메모는 최대 240자까지 입력할 수 있습니다.' });
  }

  const submission = createSubmission({ problemId, code, needsReview, note });
  res.status(201).json({
    message: '제출 기록이 저장되었습니다. (코드 실행·채점은 수행하지 않았습니다.)',
    submission,
  });
});

// 2주차 핵심 기능 2: 최근 제출 내역을 불러옵니다.
app.get('/api/submissions', (req, res) => {
  let problemId = null;
  if (req.query.problemId !== undefined) {
    const parsed = Number(req.query.problemId);
    if (!Number.isInteger(parsed) || !problems.some((p) => p.id === parsed)) {
      return res.status(400).json({ error: '올바른 문제 번호를 입력해 주세요.' });
    }
    problemId = parsed;
  }
  const submissions = getSubmissions(problemId, 50).map((item) => ({
    ...item,
    problemTitle: problems.find((p) => p.id === item.problemId)?.title ?? '알 수 없는 문제',
  }));
  res.json({ submissions });
});

// 2주차 핵심 기능 3: 대시보드에 보여 줄 숫자를 계산합니다.
app.get('/api/stats', (req, res) => {
  res.json({ stats: getSubmissionStats() });
});

// JSON 요청이 잘못되었거나, 내부 서버 오류가 발생할 때 처리합니다.
app.use((err, req, res, next) => {
  if (err.status === 413 || err.status === 400 && err.type === 'entity.parse.failed') {
    return res.status(err.status).json({ error: '요청 데이터가 너무 크거나 JSON 형식이 올바르지 않습니다.' });
  }
  console.error(err);
  res.status(500).json({ error: '서버에서 문제가 발생했습니다.' });
});

// 3주차에는 이 서버에 외부 AI API 호출 기능을 추가할 예정입니다.
// 현재 저장 기능은 제출된 코드를 실제로 실행하거나 채점하지 않습니다.
app.listen(port, '127.0.0.1', () => {
  console.log(`CodeMate AI server: http://127.0.0.1:${port}`);
});
