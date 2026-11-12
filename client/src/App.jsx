import { useEffect, useState } from 'react';

export default function App() {
  const [problems, setProblems] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  // 컴포넌트가 화면에 처음 나타날 때 서버에 문제 목록을 요청한다.
  useEffect(() => {
    async function loadProblems() {
      try {
        const response = await fetch('/api/problems');
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const data = await response.json();
        setProblems(data.problems);
        if (data.problems.length) {
          setSelectedId(data.problems[0].id);
          setCode(data.problems[0].starterCode);
        }
      } catch (e) {
        setError('Express 서버에서 문제를 불러오지 못했습니다. 서버 실행 상태를 확인하세요.');
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    loadProblems();
  }, []);

  const selectedProblem = problems.find((p) => p.id === selectedId);
  function selectProblem(problem) {
    setSelectedId(problem.id);
    setCode(problem.starterCode);
  }

  return (
    <div className="app">
      <aside className="sidebar">
        <div className="brand"><div className="logo">{'</>'}</div><span>CodeMate <b>AI</b></span></div>
        <div className="nav-label">LEARNING SPACE</div>
        <div className="nav-current">▣ &nbsp; C언어 기초 문제</div>
        <div className="sidebar-foot">WEEK 01 · 기본 웹 화면<br/>AI 분석 기능은 3주차에 연동</div>
      </aside>

      <main className="main">
        <div className="topline"><span>CODING LEARNING ASSISTANT</span><span className="status">● 1주차 개발</span></div>
        <h1>반복되는 실수를 <em>학습의 기회</em>로.</h1>
        <p className="lead">C언어 문제를 선택하고 코드를 작성해 보세요. 다음 단계에서 AI 오류 분석과 오답 기록 기능을 연결합니다.</p>

        <div className="stats">
          <div className="stat"><span>준비된 문제</span><strong>{problems.length}</strong></div>
          <div className="stat"><span>지원 언어</span><strong>C</strong></div>
          <div className="stat"><span>AI 분석</span><strong className="soon">개발 예정</strong></div>
        </div>

        <div className="workspace">
          <section className="problem-panel">
            <div className="section-header"><h2>문제 목록</h2><span>{problems.length} problems</span></div>
            {loading && <p className="notice">문제를 불러오는 중입니다...</p>}
            {error && <p className="error" role="alert">{error}</p>}
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
                <label className="editor-label" htmlFor="code">코드 편집기 <span>직접 수정해 볼 수 있습니다.</span></label>
                <textarea
                  id="code"
                  spellCheck={false}
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  aria-label="C언어 코드 입력"
                />
                <div className="editor-bottom">
                  <span>현재 단계: 코드 입력 화면</span>
                  <button type="button" disabled title="3주차에 AI API와 연결합니다">AI 오류 분석 · 3주차 예정</button>
                </div>
              </>
            ) : <p className="notice">문제를 선택하면 코드 편집기가 나타납니다.</p>}
          </section>
        </div>
        <footer>CodeMate AI · 1주차 기초 프로젝트 · 현재는 코드를 컴파일하거나 AI로 분석하지 않습니다.</footer>
      </main>
    </div>
  );
}
