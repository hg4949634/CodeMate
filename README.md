# CodeMate AI · 2주차 개발 완성본

**개발 목표:** 기존 React + Vite + Express 프로젝트에 C언어 코드 제출 기능, SQLite 저장, 제출 기록 조회, 복습 필요 표시를 추가합니다.

**아직 구현되지 않은 기능:** 자동 컴파일, 코드 실행, 정답 채점, AI 오류 분석. 저장 성공은 정답 판정이 아닙니다.

## 1. 1주차 프로젝트를 유지하면서 업데이트하기

현재 GitHub 폴더에 이미 `CodeMate-AI` 프로젝트가 있는 경우:

1. VS Code에서 기존 `CodeMate-AI` 폴더를 엽니다.
2. 가능하면 먼저 1주차 완성본을 GitHub Desktop에서 커밋해 백업합니다.
3. **`CodeMate_AI_Week2_Update_Only.zip`**의 내용물을 **기존 `CodeMate-AI` 폴더 안에** 압축 해제해 같은 이름의 파일을 덮어씁니다.
4. 기존 `client/` 및 `server/` 폴더를 삭제하지 않습니다. 기존 `package-lock.json`과 설치된 `node_modules`도 그대로 둘 수 있습니다.
5. 기존 `client/src/App.jsx`, `client/src/style.css`, `server/server.js`는 교체되고, `server/db.js` 및 테스트 파일이 추가됩니다.

> 전체 ZIP(`CodeMate_AI_Week2_Full_Project.zip`)은 처음부터 새 폴더에 설치할 때 사용합니다. GitHub에서 관리 중인 기존 폴더가 있다면 **업데이트 전용 ZIP**을 추천합니다.

## 2. 요구 환경

- Windows / VS Code / PowerShell
- Node.js **24.15.0** 기준 (다른 일부 Node 22+ 버전에서도 동작할 수 있음)
- npm: 현재 설치된 버전 사용 가능
- Express / React / Vite: 1주차 package.json 버전 유지

SQLite는 Node.js에 내장된 `node:sqlite`의 `DatabaseSync`를 사용합니다. 별도의 sqlite3 패키지를 설치하지 않습니다.

## 3. 실행하기

VS Code에서 `CodeMate-AI` 폴더를 연 다음 두 터미널을 사용합니다.

**터미널 1: Express**

```powershell
cd server
npm install
npm run dev
```

**터미널 2: React** (새 터미널을 프로젝트 루트에서 시작했다는 기준)

```powershell
cd client
npm install
npm run dev
```

브라우저에서 `http://127.0.0.1:5173` 접속.

이미 의존성을 설치했다면 `npm install`은 생략할 수 있습니다. VS Code에서 새 터미널이 이전 실행 폴더에서 시작했다면 `pwd`로 위치를 확인하고 경로를 조정하세요.

## 4. 테스트해 보기

1. 문제 목록 중 **배열 원소의 합**을 선택합니다.
2. 코드 편집기에 C언어 코드를 입력하거나 기존 코드를 수정합니다.
3. **이 문제는 복습이 필요해요** 체크박스를 선택합니다. (직접 판단)
4. 메모에 `반복문의 종료 조건을 확인해야 함`을 입력합니다.
5. **코드 제출 · 기록 저장**을 누릅니다.
6. 성공 메시지와 제출 번호가 표시되는지 확인합니다.
7. 페이지 아래 **나의 제출 기록**에 문제 제목, 메모, 복습 표시가 나오는지 확인합니다.
8. 저장된 코드 보기를 열고 **이 코드를 편집기로 불러오기**를 눌러 확인합니다.
9. Express 서버를 종료 후 다시 실행하고 브라우저를 새로고침합니다. 기록이 여전히 남아 있어야 합니다.

## 5. API 명세

| HTTP | 주소 | 역할 |
| --- | --- | --- |
| GET | `/api/health` | 서버 연결 확인 |
| GET | `/api/problems` | 문제 4개 조회 |
| GET | `/api/problems/:id` | 단일 문제 조회 |
| POST | `/api/submissions` | 제출 기록 1개 저장 |
| GET | `/api/submissions` | 최신 제출 기록 최대 50개 조회 |
| GET | `/api/submissions?problemId=2` | 해당 문제의 최신 제출 기록 조회 |
| GET | `/api/stats` | 총 제출 수, 수동 복습 표시 수, 시도 문제 수 |

제출 예시 (`POST /api/submissions`의 JSON):

```json
{
  "problemId": 2,
  "code": "int main(void) { return 0; }",
  "needsReview": true,
  "note": "배열 범위 다시 공부하기"
}
```

`needsReview`는 **사용자가 직접 선택한 복습 표시**이며, AI가 판정한 오답이 아닙니다.

## 6. 저장 구조

파일: `server/data/codemate.sqlite` (처음 제출할 때가 아닌 서버가 처음 시작할 때 자동 생성)

테이블: `submissions`

| 컬럼 | 의미 |
| --- | --- |
| `id` | 자동 생성 제출 번호 |
| `problem_id` | 문제 번호 |
| `code` | 제출한 C언어 코드 원문 |
| `needs_review` | 복습 필요 1 / 아니면 0 |
| `note` | 사용자가 작성한 메모 |
| `created_at` | 제출 시각(ISO 8601, UTC) |

**중요:** SQLite 파일은 로컬 데이터이므로 `.gitignore`에 의해 GitHub에 업로드되지 않습니다. 프로젝트 파일을 다른 PC로 옮기더라도 SQLite 파일을 옮기지 않으면 제출 기록은 이동하지 않습니다.

## 7. 코드 구조 이해하기

- `client/src/App.jsx`
  - `submitCode()`: React에서 Express로 `fetch(POST)` 요청
  - `refreshHistory()`: 제출 목록과 통계 다시 가져오기
  - `restoreCode()`: 과거 코드 내용을 편집기에 불러오기
- `server/server.js`
  - 입력 검증과 API 주소(라우트) 처리
  - `GET /api/submissions`, `POST /api/submissions`, `GET /api/stats` 제공
- `server/db.js`
  - 테이블 생성, SQL INSERT/SELECT 실행, 통계 집계
- `server/data/problems.js`
  - 기존 4개의 C언어 문제 (변경 없음)
- `client/src/style.css`
  - 기존 다크 네이비 UI 유지 + 제출 기록 스타일 추가

## 8. DB 자동 테스트

서버 폴더에서:

```powershell
npm test
```

임시 데이터베이스를 만들어 저장/조회/통계를 검증하고 테스트 후 삭제합니다. 실제 `server/data/codemate.sqlite`는 건드리지 않습니다.

## 9. 보안·개발상 주의

- 제출 코드는 **문자열로 저장**할 뿐 실행하거나 채점하지 않습니다.
- 코드 입력 길이 20,000자, 메모 240자, JSON 요청 64KB 한도를 적용합니다.
- SQL 쿼리에는 준비된 SQL 문(`?`)을 사용해 입력값을 처리합니다.
- 현재는 **로컬 단일 사용자 시연용**이며 로그인/인증, 사용자별 데이터 분리는 구현되어 있지 않습니다. Express 서버를 인터넷에 공개하기 전에 인증·접근 제한·사용자별 데이터 분리가 필요합니다.
- `.gitignore`에는 `.env`, SQLite DB, `node_modules`, `dist`를 포함했습니다. GitHub Desktop에서 파일 목록을 확인하고 커밋하세요.
- OpenAI API 키는 **3주차** 서버 환경변수에만 저장하며, React 코드에는 넣지 않습니다.
- 문제를 변경하면 편집 중인 코드가 초기화됩니다. 제출할 코드는 먼저 저장하세요.

## 10. 3주차 준비

- Express에 AI API 연동 엔드포인트 추가
- 코드 + 문제 설명 + 제출 이력을 바탕으로 오류 원인과 힌트 생성
- AI 판단은 추정일 수 있으므로 저장 상태/정답 여부와 구분
