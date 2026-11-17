import { useCallback, useEffect, useState } from 'react';

// API 응답이 실패했다면 서버가 보내 준 한국어 오류 문구를 표시합니다.
async function readResponse(response) {
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || `HTTP ${response.status}`);
  return data;
}

function formatDate(iso) {
  return new Date(iso).toLocaleString('ko-KR', { dateStyle: 'medium', timeStyle: 'short' });
}

export default function App() {
  const [problems, setProblems] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [code, setCode] = useState('');
  const [needsReview, setNeedsReview] = useState(false);
  const [note, setNote] = useState('');
  const [problemsError, setProblemsError] = useState('');
  const [loadingProblems, setLoadingProblems] = useState(true);

  const [submissions, setSubmissions] = useState([]);
  const [stats, setStats] = useState({ total: 0, reviewCount: 0, attemptedProblems: 0 });
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [historyError, setHistoryError] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');
  const [saveError, setSaveError] = useState('');
  const [historyFilter, setHistoryFilter] = useState('all');

  const refreshHistory = useCallback(async () => {
    setHistoryError('');
    try {
      const [historyData, statsData] = await Promise.all([
        fetch('/api/submissions').then(readResponse),
        fetch('/api/stats').then(readResponse),
      ]);
      setSubmissions(historyData.submissions);
      setStats(statsData.stats);
    } catch (e) {
      setHistoryError(`제출 기록을 불러오지 못했습니다. ${e.message}`);
    } finally {
      setLoadingHistory(false);
    }
  }, []);

  // 최초 화면 진입 시 서버에서 문제 목록을 읽습니다.
  useEffect(() => {
    async function loadProblems() {
      try {
        const data = await fetch('/api/problems').then(readResponse);
        setProblems(data.problems);
        if (data.problems.length) {
          setSelectedId(data.problems[0].id);
          setCode(data.problems[0].starterCode);
        }
      } catch (e) {
        setProblemsError(`문제를 불러오지 못했습니다. ${e.message}`);
      } finally {
        setLoadingProblems(false);
      }
    }
    loadProblems();
    refreshHistory();
  }, [refreshHistory]);

  const selectedProblem = problems.find((p) => p.id === selectedId);
  const visibleSubmissions = submissions.filter((item) =>
    historyFilter === 'all' || item.problemId === Number(historyFilter)
  );

  function selectProblem(problem) {
    setSelectedId(problem.id);
    setCode(problem.starterCode);
    setNeedsReview(false);
    setNote('');
    setSaveMessage('');
    setSaveError('');
  }

  // 제출 버튼을 누르면 React → Express → SQLite 순서로 데이터가 이동합니다.
  async function submitCode() {
    if (!selectedProblem || saving) return;
    setSaveMessage('');
    setSaveError('');
    if (!code.trim()) {
      setSaveError('코드를 입력한 후 제출해 주세요.');
      return;
    }

    setSaving(true);
    try {
      const data = await fetch('/api/submissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          problemId: selectedProblem.id,
          code,
          needsReview,
          note,
        }),
      }).then(readResponse);
      setSaveMessage(`${data.message} 제출 번호 #${data.submission.id}`);
      await refreshHistory();
    } catch (e) {
      setSaveError(`제출하지 못했습니다. ${e.message}`);
    } finally {
      setSaving(false);
    }
  }

  // 지난 제출 기록의 코드를 현재 편집기로 가져옵니다. (기존 기록은 수정하지 않음)
  function restoreCode(submission) {
    const problem = problems.find((p) => p.id === submission.problemId);
    if (!problem) return;
    setSelectedId(problem.id);
    setCode(submission.code);
    setNeedsReview(submission.needsReview);
    setNote(submission.note);
    setSaveMessage(`제출 #${submission.id}의 코드를 편집기로 불러왔습니다. 저장하려면 다시 제출해 주세요.`);
    setSaveError('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  return (
    <div className="app">
      <aside className="sidebar">
        <div className="brand"><div className="logo">{'</>'}</div><span>CodeMate <b>AI</b></span></div>
        <div className="nav-label">LEARNING SPACE</div>
        <div className="nav-current">▣ &nbsp; C언어 기초 문제</div>
        <a className="nav-link" href="#history">◷ &nbsp; 나의 제출 기록</a>
        <div className="sidebar-foot">WEEK 02 · 코드 제출 및 기록<br/>AI 오류 분석은 3주차에 연결</div>
      </aside>

      <main className="main">
        <div className="topline"><span>CODING LEARNING ASSISTANT</span><span className="status">● 2주차 개발</span></div>
        <h1>반복되는 실수를 <em>학습의 기회</em>로.</h1>
        <p className="lead">C언어 문제를 선택하고 코드를 제출해 보세요. 제출 기록이 자동 저장되며, 복습이 필요한 문제를 직접 표시할 수 있습니다.</p>

        <div className="stats">
          <div className="stat"><span>준비된 문제</span><strong>{problems.length}</strong></div>
          <div className="stat"><span>누적 제출</span><strong>{stats.total}</strong></div>
          <div className="stat"><span>복습 필요 (직접 표시)</span><strong className="soon">{stats.reviewCount}</strong></div>
        </div>

        <div className="workspace">
          <section className="problem-panel">
            <div className="section-header"><h2>문제 목록</h2><span>{problems.length} problems</span></div>
            {loadingProblems && <p className="notice">문제를 불러오는 중입니다...</p>}
            {problemsError && <p className="error" role="alert">{problemsError}</p>}
            <div className="problem-list">
              {problems.map((problem) => (
                <button
                  key={problem.id}
                  type="button"
                  className={`problem-item ${selectedId === problem.id ? 'active' : ''}`}
                  onClick={() => selectProblem(problem)}
                >
                  <span className="number">{String(problem.id).padStart(2, '0')}</span>
                  <span><b>{problem.title}</b><small>{problem.concept} · {problem.difficulty}</small></span>
                </button>
              ))}
            </div>
          </section>

          <section className="editor-panel">
            {selectedProblem ? (
              <>
                <div className="editor-top"><span className="chip">{selectedProblem.concept}</span><span className="chip secondary">C language</span></div>
                <h2>{selectedProblem.title}</h2>
                <p className="description">{selectedProblem.description}</p>
                <label className="editor-label" htmlFor="code">코드 편집기 <span>직접 수정하여 제출할 수 있습니다.</span></label>
                <textarea
                  id="code"
                  spellCheck={false}
                  value={code}
                  maxLength={20000}
                  onChange={(e) => setCode(e.target.value)}
                  aria-label="C언어 코드 입력"
                />
                <div className="submission-options">
                  <label className="review-check">
                    <input
                      type="checkbox"
                      checked={needsReview}
                      onChange={(e) => setNeedsReview(e.target.checked)}
                    />
                    <span>이 문제는 복습이 필요해요 (직접 선택)</span>
                  </label>
                  <label className="note-label" htmlFor="note">메모 (선택)</label>
                  <input
                    id="note"
                    className="note-input"
                    type="text"
                    placeholder="예: 반복문 종료 조건을 자꾸 실수함"
                    value={note}
                    maxLength={240}
                    onChange={(e) => setNote(e.target.value)}
                  />
                </div>
                {saveMessage && <p className="success" role="status">{saveMessage}</p>}
                {saveError && <p className="error" role="alert">{saveError}</p>}
                <div className="editor-bottom">
                  <span>이번 주: 저장만 가능 · 코드 실행/채점/AI 분석 없음</span>
                  <button type="button" disabled={saving} onClick={submitCode}>
                    {saving ? '저장 중...' : '코드 제출 · 기록 저장'}
                  </button>
                </div>
              </>
            ) : <p className="notice">문제를 선택하면 코드 편집기가 나타납니다.</p>}
          </section>
        </div>

        <section className="history-panel" id="history">
          <div className="history-header">
            <div><h2>나의 제출 기록</h2><p>최근 50개의 저장된 코드를 확인하고 다시 불러올 수 있습니다.</p></div>
            <div className="history-actions">
              <label htmlFor="history-filter">문제 선택</label>
              <select id="history-filter" value={historyFilter} onChange={(e) => setHistoryFilter(e.target.value)}>
                <option value="all">전체 문제</option>
                {problems.map((p) => <option value={p.id} key={p.id}>{p.title}</option>)}
              </select>
              <button type="button" className="secondary-button" onClick={refreshHistory}>새로고침</button>
            </div>
          </div>
          {loadingHistory && <p className="notice">제출 기록을 불러오는 중입니다...</p>}
          {historyError && <p className="error" role="alert">{historyError}</p>}
          {!loadingHistory && visibleSubmissions.length === 0 && !historyError && (
            <div className="empty-history">아직 저장된 제출 기록이 없습니다. 위에서 코드를 작성하고 제출해 보세요.</div>
          )}
          <div className="history-list">
            {visibleSubmissions.map((item) => (
              <article className="history-item" key={item.id}>
                <div className="history-item-top">
                  <div>
                    <span className="history-number">#{item.id}</span>
                    <strong>{item.problemTitle}</strong>
                    <span className={item.needsReview ? 'review-badge' : 'saved-badge'}>
                      {item.needsReview ? '복습 필요 · 직접 표시' : '저장됨 · 미채점'}
                    </span>
                  </div>
                  <time dateTime={item.createdAt}>{formatDate(item.createdAt)}</time>
                </div>
                {item.note && <p className="history-note">메모: {item.note}</p>}
                <details className="code-details"><summary>저장된 코드 보기</summary><pre>{item.code}</pre></details>
                <button type="button" className="restore-button" onClick={() => restoreCode(item)}>이 코드를 편집기로 불러오기</button>
              </article>
            ))}
          </div>
        </section>
        <footer>CodeMate AI · 2주차 · 현재는 코드를 컴파일하거나 AI로 정답을 판정하지 않습니다.</footer>
      </main>
    </div>
  );
}
