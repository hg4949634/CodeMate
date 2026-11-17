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
  const [analyzingId, setAnalyzingId] = useState(null);
  const [analysisError, setAnalysisError] = useState('');
  const [analysisNotice, setAnalysisNotice] = useState('');
  const [lastSavedId, setLastSavedId] = useState(null);
  // 4주차: 저장된 분석 기록으로 구성하는 로컬 학습 대시보드
  const [insights, setInsights] = useState(null);
  const [loadingInsights, setLoadingInsights] = useState(true);
  const [insightsError, setInsightsError] = useState('');

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

  // 이미 저장된 분석 기록을 집계합니다. 이 요청으로 OpenAI API를 호출하지 않습니다.
  const refreshInsights = useCallback(async () => {
    setInsightsError('');
    try {
      const data = await fetch('/api/insights').then(readResponse);
      setInsights(data.insights);
    } catch (e) {
      setInsightsError(`학습 분석 현황을 불러오지 못했습니다. ${e.message}`);
    } finally {
      setLoadingInsights(false);
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
    refreshInsights();
  }, [refreshHistory, refreshInsights]);

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
    setLastSavedId(null);
    setAnalysisNotice('');
    setAnalysisError('');
  }

  // 제출 버튼을 누르면 React → Express → SQLite 순서로 데이터가 이동합니다.
  async function submitCode() {
    if (!selectedProblem || saving) return;
    setSaveMessage('');
    setSaveError('');
    setAnalysisNotice('');
    setAnalysisError('');
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
      setLastSavedId(data.submission.id);
      await Promise.all([refreshHistory(), refreshInsights()]);
    } catch (e) {
      setSaveError(`제출하지 못했습니다. ${e.message}`);
    } finally {
      setSaving(false);
    }
  }

  // AI 분석은 서버의 저장된 제출 코드를 기반으로 수행합니다.
  // 이미 분석한 기록은 서버에서 저장된 결과를 반환하므로 다시 과금되지 않습니다.
  async function requestAnalysis(id) {
    if (analyzingId !== null) return;
    setAnalysisError('');
    setAnalysisNotice('');
    setAnalyzingId(id);
    try {
      const data = await fetch(`/api/submissions/${id}/analyze`, { method: 'POST' }).then(readResponse);
      await Promise.all([refreshHistory(), refreshInsights()]);
      setAnalysisNotice(`제출 #${id}: ${data.cached ? '저장된 AI 분석을 불러왔습니다.' : 'AI 분석을 완료했습니다.'}`);
      setLastSavedId(null);
      document.getElementById('history')?.scrollIntoView({ behavior: 'smooth' });
    } catch (e) {
      setAnalysisError(`제출 #${id} 분석 실패: ${e.message}`);
    } finally {
      setAnalyzingId(null);
    }
  }

  // 추천된 문제는 기존에 준비된 문제 목록에서 불러옵니다. AI가 새 문제를 생성하지 않습니다.
  function openRecommendation(problemId) {
    const problem = problems.find((p) => p.id === problemId);
    if (!problem) return;
    if (selectedProblem && code !== selectedProblem.starterCode &&
        !window.confirm('현재 편집기에서 작성한 미제출 코드가 사라질 수 있습니다. 추천 문제를 여시겠습니까?')) return;
    selectProblem(problem);
    window.scrollTo({ top: 0, behavior: 'smooth' });
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
        <a className="nav-link" href="#insights">▥ &nbsp; 취약 개념 대시보드</a>
        <a className="nav-link" href="#history">◷ &nbsp; 나의 제출 기록</a>
        <div className="sidebar-foot">WEEK 04 · 누적 분석 및 복습 추천<br/>코드 실행·자동 채점은 제공하지 않음</div>
      </aside>

      <main className="main">
        <div className="topline"><span>CODING LEARNING ASSISTANT</span><span className="status">● 4주차 개발</span></div>
        <h1>반복되는 실수를 <em>학습의 기회</em>로.</h1>
        <p className="lead">C언어 코드를 제출하고 AI 피드백을 받아보세요. 누적된 기록으로 개념별 복습 신호를 확인하고 필요한 문제를 다시 연습할 수 있습니다.</p>

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
                {lastSavedId && <button type="button" className="analysis-top-button" disabled={analyzingId !== null} onClick={() => requestAnalysis(lastSavedId)}>
                  {analyzingId === lastSavedId ? 'AI 분석 중...' : `방금 제출한 #${lastSavedId} AI로 분석하기`}
                </button>}
                <div className="editor-bottom">
                  <span>저장 후 AI 분석 가능 · 코드 실행 및 채점은 하지 않음</span>
                  <button type="button" disabled={saving} onClick={submitCode}>
                    {saving ? '저장 중...' : '코드 제출 · 기록 저장'}
                  </button>
                </div>
              </>
            ) : <p className="notice">문제를 선택하면 코드 편집기가 나타납니다.</p>}
          </section>
        </div>

        {/* 4주차: 기존 SQLite 기록에서 계산한 누적 학습 정보 */}
        <section className="insights-panel" id="insights">
          <div className="history-header">
            <div>
              <h2>나의 취약 개념 분석</h2>
              <p>AI의 오류 가능성 판단과 직접 선택한 복습 표시를 누적해 보여 줍니다. 실제 채점 결과나 실력 점수는 아닙니다.</p>
            </div>
            <button type="button" className="secondary-button" onClick={refreshInsights}>현황 새로고침</button>
          </div>

          {loadingInsights && <p className="notice">학습 기록을 분석하고 있습니다...</p>}
          {insightsError && <p className="error" role="alert">{insightsError}</p>}
          {insights && <>
            <div className="insights-overview">
              <div><span>AI 분석 완료</span><b>{insights.totals.analyzedSubmissions}</b><small>회</small></div>
              <div><span>AI 오류 가능성</span><b>{insights.totals.potentialErrorCount}</b><small>회 · 미확정</small></div>
              <div><span>직접 복습 표시</span><b>{insights.totals.manualReviewCount}</b><small>회</small></div>
              <div><span>개념 보완 제안</span><b>{insights.totals.improvementCount}</b><small>회</small></div>
            </div>

            <div className="insights-grid">
              <div className="insights-card">
                <h3>개념별 복습 신호</h3>
                <p className="insights-help">수치가 클수록 기존 기록에서 복습할 이유가 자주 나타났다는 뜻입니다.</p>
                {insights.totals.analyzedSubmissions === 0 && insights.totals.manualReviewCount === 0 &&
                  <p className="notice">아직 분석 기록이나 복습 표시가 없습니다. 코드를 제출해 분석해 보세요.</p>}
                <div className="concept-list">
                  {insights.concepts.map((item) => {
                    const max = Math.max(1, ...insights.concepts.map((c) => c.reviewSignal));
                    return <div className="concept-row" key={item.concept}>
                      <div className="concept-row-top"><b>{item.concept}</b><span>복습 신호 {item.reviewSignal}</span></div>
                      <div className="concept-track"><div className="concept-fill" style={{ width: `${(item.reviewSignal / max) * 100}%` }} /></div>
                      <div className="concept-meta">AI 오류 가능성 {item.potentialErrorCount}회 · 개념 보완 {item.improvementCount}회 · 직접 복습 {item.manualReviewCount}회</div>
                    </div>;
                  })}
                </div>
              </div>
              <div className="insights-card">
                <h3>맞춤형 복습 문제 추천</h3>
                <p className="insights-help">누적된 복습 신호를 기준으로 기존 C언어 문제 4개 중에서 추천합니다.</p>
                {insights.recommendations.length === 0 ?
                  <div className="empty-recommendation">현재 추천할 복습 문제가 없습니다. 분석 결과가 쌓이면 여기에 표시돼요.</div> :
                  <div className="recommendation-list">{insights.recommendations.map((item, i) =>
                    <div key={item.problemId} className="recommendation-item">
                      <div className="recommendation-title"><span className="recommendation-rank">{i + 1}</span><strong>{item.problemTitle}</strong><span className="chip">{item.concept}</span></div>
                      <p>{item.reason}</p>
                      <button type="button" className="restore-button" onClick={() => openRecommendation(item.problemId)}>이 문제 복습하기</button>
                    </div>
                  )}</div>
                }
              </div>
            </div>
          </>}
          <p className="ai-disclaimer">※ 복습 신호 = AI 오류 가능성 × 2 + 직접 복습 표시 + 개념 보완. 정답률·실력 점수가 아니며, 같은 제출에서 신호가 중복 반영될 수 있습니다. 이전에 저장된 결과만 읽으므로 이 대시보드 조회에는 GPT API 비용이 들지 않습니다.</p>
        </section>

        <section className="history-panel" id="history">
          <div className="history-header">
            <div><h2>나의 제출 기록</h2><p>최근 50개의 제출 코드를 확인하고, 원하는 제출에 대해 AI 분석을 요청할 수 있습니다.</p></div>
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
          {analysisError && <p className="error" role="alert">{analysisError}</p>}
          {analysisNotice && <p className="success" role="status">{analysisNotice}</p>}
          <p className="ai-disclaimer">※ AI 분석은 코드를 컴파일하거나 실행한 결과가 아닌 추정 피드백입니다. 정답 판정이 아닙니다.</p>
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
                <div className="history-item-actions">
                  <button type="button" className="restore-button" onClick={() => restoreCode(item)}>이 코드를 편집기로 불러오기</button>
                  {!item.analysis && <button type="button" className="ai-button" disabled={analyzingId !== null} onClick={() => requestAnalysis(item.id)}>
                    {analyzingId === item.id ? 'AI 분석 중...' : 'AI로 오류 분석하기'}
                  </button>}
                  {item.analysis && <span className="ai-done-badge">AI 분석 완료 · 저장됨</span>}
                </div>
                {item.analysis && <div className="analysis-result">
                  <div className="analysis-heading"><strong>AI 분석 결과</strong><span>{item.analysisModel} · {item.analysis.confidence} 신뢰도 추정</span></div>
                  <div className="analysis-tags"><span>{item.analysis.category}</span><span>관련 개념: {item.analysis.concept}</span></div>
                  <h3>{item.analysis.summary}</h3>
                  <p>{item.analysis.explanation}</p>
                  <div className="hint-list"><b>단계별 힌트</b>
                    <ol><li>{item.analysis.hint1}</li><li>{item.analysis.hint2}</li><li>{item.analysis.hint3}</li></ol>
                  </div>
                </div>}
              </article>
            ))}
          </div>
        </section>
        <footer>CodeMate AI · 4주차 · AI의 분석은 추정 피드백이며 실제 코드를 컴파일하거나 채점하지 않습니다.</footer>
      </main>
    </div>
  );
}
