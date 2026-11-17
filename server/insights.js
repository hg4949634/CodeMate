// 4주차: 로컬 SQLite에 이미 저장된 제출/분석 기록에서 학습 대시보드를 구성합니다.
// GPT API는 호출하지 않습니다. '오류 가능성'은 실제 컴파일/채점 결과가 아닙니다.

const ERROR_CATEGORIES = new Set([
  '문법 오류 가능성',
  '실행 오류 가능성',
  '논리 오류 가능성',
]);

// record: { problemId, needsReview, analysis|null }
// problems: [{ id, title, concept, ... }]
export function buildLearningInsights(records, problems) {
  const problemById = new Map(problems.map((p) => [p.id, p]));
  const concepts = new Map();

  function ensureConcept(name) {
    const concept = name || '기타';
    if (!concepts.has(concept)) {
      concepts.set(concept, {
        concept,
        analyzedCount: 0,
        potentialErrorCount: 0,
        improvementCount: 0,
        noClearErrorCount: 0,
        manualReviewCount: 0,
      });
    }
    return concepts.get(concept);
  }

  // 아직 제출한 기록이 없어도 준비된 문제의 개념은 차트에 나타납니다.
  problems.forEach((problem) => ensureConcept(problem.concept));

  const totals = {
    totalSubmissions: records.length,
    analyzedSubmissions: 0,
    potentialErrorCount: 0,
    improvementCount: 0,
    noClearErrorCount: 0,
    manualReviewCount: 0,
  };

  for (const record of records) {
    const problemConcept = problemById.get(record.problemId)?.concept || '기타';
    // 직접 표시한 복습 여부는 원래 문제의 개념으로 집계합니다.
    if (record.needsReview) {
      ensureConcept(problemConcept).manualReviewCount += 1;
      totals.manualReviewCount += 1;
    }

    if (!record.analysis) continue;
    totals.analyzedSubmissions += 1;
    // AI가 분류한 관련 개념이 원래 문제 개념과 다를 수 있으므로 따로 집계합니다.
    const target = ensureConcept(record.analysis.concept || problemConcept);
    target.analyzedCount += 1;
    if (ERROR_CATEGORIES.has(record.analysis.category)) {
      target.potentialErrorCount += 1;
      totals.potentialErrorCount += 1;
    } else if (record.analysis.category === '개념 보완') {
      target.improvementCount += 1;
      totals.improvementCount += 1;
    } else if (record.analysis.category === '명확한 오류 없음') {
      target.noClearErrorCount += 1;
      totals.noClearErrorCount += 1;
    }
  }

  // 오류 가능성 및 수동 복습 표시를 '복습 신호'로 환산합니다.
  // 이는 검증된 취약도 점수나 정답률이 아니라 정렬용 간단한 우선순위 값입니다.
  const rows = [...concepts.values()].map((row) => ({
    ...row,
    reviewSignal: row.potentialErrorCount * 2 + row.manualReviewCount + row.improvementCount,
  }));
  const byConcept = new Map(rows.map((row) => [row.concept, row]));

  const recommendations = problems
    .map((problem) => {
      const row = byConcept.get(problem.concept);
      if (!row || row.reviewSignal === 0) return null;
      const notes = [];
      if (row.potentialErrorCount) notes.push(`AI가 오류 가능성을 ${row.potentialErrorCount}회 표시`);
      if (row.manualReviewCount) notes.push(`직접 복습 필요 ${row.manualReviewCount}회 표시`);
      if (row.improvementCount) notes.push(`개념 보완 ${row.improvementCount}회 표시`);
      return {
        problemId: problem.id,
        problemTitle: problem.title,
        concept: problem.concept,
        reviewSignal: row.reviewSignal,
        reason: notes.join(' · '),
      };
    })
    .filter(Boolean)
    .sort((a, b) => b.reviewSignal - a.reviewSignal || a.problemId - b.problemId)
    .slice(0, 4);

  rows.sort((a, b) => b.reviewSignal - a.reviewSignal || a.concept.localeCompare(b.concept, 'ko'));

  return { totals, concepts: rows, recommendations };
}
