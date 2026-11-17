# CodeMate AI — Week 3 (OpenAI API 분석)

기존 1~2주차의 React + Express + SQLite 구조에 **AI 코드 오류 가능성 분석 및 단계별 힌트**를 연결한 업데이트입니다.

## 설치 전 확인

- Node.js 24.15 이상 권장 (`node -v`)
- GitHub 저장소에서 2주차까지 변경 사항 커밋 권장
- `server/data/codemate.sqlite`는 기존 기록이 담겨 있으니 **삭제하거나 덮어쓰지 마세요**.

## 덮어쓰기 방식

`CodeMate-AI/` 폴더가 이미 있다면 업데이트 ZIP의 `client/`, `server/`, `.gitignore`, `README.md` 파일만 병합하세요.
`node_modules/`, `codemate.sqlite`, `.env`는 **업데이트 ZIP에 포함하지 않았습니다**.

## 1. API 키 발급

1. https://platform.openai.com/api-keys 에서 API 키를 생성합니다.
2. https://platform.openai.com/settings/organization/billing 에서 크레딧/결제 여부를 확인합니다. ChatGPT 구독과 API 요금은 별개입니다.
3. `server/.env.example`을 **복사**해 `server/.env` 파일을 만듭니다.
4. 아래처럼 설정합니다. 키는 절대 캡처하거나 채팅, GitHub에 올리지 마세요.

```env
PORT=3001
OPENAI_API_KEY=실제_API_키_값
OPENAI_MODEL=gpt-5-mini
```

`.gitignore`가 `.env`를 제외하는지 반드시 확인하세요. 키는 서버에만 저장합니다.

## 2. 서버 실행

CodeMate-AI 폴더 기준 VS Code 터미널 1:

```powershell
cd server
npm install
npm run dev
```

다른 터미널 2:

```powershell
cd client
npm install
npm run dev
```

브라우저에서 http://127.0.0.1:5173 열기. 서버 확인: http://127.0.0.1:3001/api/health

## 3. AI 분석 테스트

1. 2번 '배열 원소의 합' 문제를 선택합니다.
2. 아래처럼 인덱스 범위 오류 가능성이 있는 코드를 작성합니다.

```c
#include <stdio.h>
int main(void) {
    int arr[5] = {1,2,3,4,5};
    int sum = 0;
    for (int i = 0; i <= 5; i++) sum += arr[i];
    printf("%d\n", sum);
    return 0;
}
```

3. `코드 제출 · 기록 저장` 버튼으로 **먼저 저장**합니다.
4. `방금 제출한 #번호 AI로 분석하기` 또는 제출 기록의 `AI로 오류 분석하기`를 누릅니다.
5. 서버가 코드를 OpenAI API로 보내고 JSON 분석 결과를 받아 SQLite에 저장합니다.
6. 분석이 완료되면 `나의 제출 기록`에서 오류 유형, 설명, 3단계 힌트를 확인할 수 있습니다.
7. 같은 제출은 다시 요청해도 **기존 저장 결과**를 반환하여 추가 과금을 피합니다. 코드를 바꾸려면 새로 제출해야 합니다.

**주의:** 실제 컴파일/실행/정답 채점은 하지 않습니다. 분석은 추정 정보입니다. 모델이 잘못 답할 수 있습니다.

## 4. 테스트

```powershell
cd server
npm test
```

DB 저장과 응답 JSON 검증용 오프라인 테스트이며, 유료 API를 호출하지 않습니다. `node:sqlite`의 실험적 API 안내가 보일 수 있습니다.

## 5. 주요 변경 파일

| 경로 | 역할 |
|---|---|
| server/ai.js | OpenAI Responses API 호출 및 JSON 검증 |
| server/server.js | POST /api/submissions/:id/analyze 추가 |
| server/db.js | analyses 테이블 자동 추가 및 조회 |
| server/.env.example | API 키 설정 예시 (실제 키 아님) |
| server/package.json | `openai` SDK 의존성 추가 |
| client/src/App.jsx | 제출 기록별 AI 분석 요청 및 결과 표시 |
| client/src/style.css | 분석 카드 디자인 |
| server/test/* | 네트워크 없는 자동 테스트 |

## 6. 문제 해결

- `OPENAI_API_KEY` 에러: `server/.env` 존재 여부 및 서버 재시작 확인
- `401`: API 키 확인 (공유하지 마세요)
- `429`: API 사용량/요금/요청 한도 확인
- `Cannot find package 'openai'`: `server`에서 `npm install` 재실행
- `fetch failed`: 서버 실행 여부와 API 네트워크 연결 확인
- 코드 제출은 성공하지만 AI 분석 실패: 저장 기록은 그대로 유지되고, 다시 분석 버튼을 눌러 재시도할 수 있음

## 7. 설계상 한계 및 4주차 개선 과제

- AI는 코드를 **직접 실행하지 않음**. 테스트가 없는 분석을 정답 판정처럼 표현하지 않습니다.
- 인증 기능이 없는 **단일 사용자 로컬 프로토타입**. 서버를 외부 인터넷에 공개하지 마세요.
- 이미 저장된 제출은 한 번만 분석합니다. 수정한 코드는 새 제출이 필요합니다.
- 4주차에 개념별 분석 통계와 복습 추천, 모델 평가 케이스를 추가합니다.
