# CodeMate AI - 1주차 시작 프로젝트

목표: React와 Express 서버를 연결해 C언어 문제 목록을 표시하고, 코드를 편집하는 기본 화면 구축.
**현재 AI 분석, 채점, 저장 기능은 구현되어 있지 않습니다.**

## 0. 준비
- Node.js LTS (Node 22.12+ 또는 요구 조건을 충족하는 버전)
- Windows PowerShell 또는 VS Code 터미널
- 압축 파일을 `C:\Projects\CodeMate-AI` 같은 경로에 압축 해제

## 1. Express 서버 실행 - 터미널 1
```powershell
cd server
npm install
npm run dev
```
성공: `CodeMate AI server: http://127.0.0.1:3001`

브라우저에서 http://127.0.0.1:3001/api/health 또는 http://127.0.0.1:3001/api/problems 열기.

## 2. React 웹사이트 실행 - 터미널 2
```powershell
cd client
npm install
npm run dev
```
브라우저에서 http://127.0.0.1:5173 열기.

> 경로가 다르면 자신의 실제 압축 해제 폴더로 변경합니다.
> `npm.ps1` 실행 제한 오류가 나면 `npm.cmd install`, `npm.cmd run dev`처럼 사용합니다.

## 3. 폴더 설명
```
CodeMate-AI/
├── client/
│   ├── src/
│   │   ├── App.jsx       # 메인 화면 및 서버 데이터 요청
│   │   ├── main.jsx      # React 시작점
│   │   └── style.css     # 화면 디자인
│   ├── index.html
│   ├── vite.config.js    # /api 요청을 Express로 전달
│   └── package.json
├── server/
│   ├── data/
│   │   └── problems.js  # C언어 예제 문제 4개
│   ├── .env.example
│   ├── server.js         # Express API
│   └── package.json
├── .gitignore
└── README.md
```

## 4. 작동 원리
1. React `App.jsx`는 `/api/problems`를 호출합니다.
2. Vite 개발 서버가 이 경로를 Express의 `http://127.0.0.1:3001/api/problems`로 전달합니다.
3. Express는 `data/problems.js`의 문제를 JSON으로 돌려줍니다.
4. React가 JSON의 문제 목록을 화면에 그립니다.

## 5. 향후 개발
- 2주차: 코드 제출 / 오답 기록 저장 (SQLite)
- 3주차: 서버에서 외부 AI API를 호출해 오류 분석 및 단계별 힌트 제공
- 4주차: 통합 테스트 / 결과 평가

## 안전 주의
- OpenAI API 키를 React 코드 또는 `VITE_` 환경변수에 넣지 마세요.
- 3주차에는 서버의 `.env`에 저장하고 `.gitignore`로 업로드를 막습니다.
- 제출 코드를 실제 실행할 경우 별도 격리 실행 환경이 필요합니다. 현재는 실행하지 않습니다.
