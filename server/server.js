import express from 'express';
import cors from 'cors';
import 'dotenv/config';
import problems from './data/problems.js';

const app = express();
const port = Number(process.env.PORT || 3001);

// 개발 단계에서는 내 PC의 React 개발 서버만 직접 접근하도록 허용한다.
app.use(cors({ origin: 'http://127.0.0.1:5173' }));
// 향후 코드를 JSON으로 제출할 때 필요하다.
app.use(express.json({ limit: '100kb' }));

// 서버가 정상적으로 켜져 있는지 확인하는 주소
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'CodeMate AI 서버가 정상 동작 중입니다.' });
});

// 전체 문제 목록을 React에 JSON으로 전달
app.get('/api/problems', (req, res) => {
  res.json({ problems });
});

// 나중에 선택한 문제의 상세 정보를 요청할 때 사용 가능
app.get('/api/problems/:id', (req, res) => {
  const id = Number(req.params.id);
  const problem = problems.find((item) => item.id === id);
  if (!problem) return res.status(404).json({ error: '문제를 찾을 수 없습니다.' });
  res.json({ problem });
});

// AI 호출 기능은 3주차에 서버에서만 구현한다.
// 실제 API 키를 React 파일 또는 클라이언트 코드에 넣으면 안 된다.

app.listen(port, '127.0.0.1', () => {
  console.log(`CodeMate AI server: http://127.0.0.1:${port}`);
});
