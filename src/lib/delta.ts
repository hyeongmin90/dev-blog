// "0.811 → 0.944", "8/14 -> 13/14", "70%대 → 80%대", "0.9 에서 0.98로" 같은 개선 수치.
// 노션 본문(RichText)과 프로젝트 metrics 속성이 같은 규칙을 쓴다.
const NUM = String.raw`\d+(?:\.\d+)?(?:\/\d+)?%?(?:대)?`;
export const DELTA = new RegExp(String.raw`(${NUM})(\s*(?:→|->|에서)\s*)(${NUM})(로|으로)?`, "g");

export type Metric = { label: string; before: string | null; after: string };

/**
 * metrics 속성의 한 줄을 해석한다.
 *   "답변 정확도(correctness, 47문항): 0.811 → 0.944" → { label, before: "0.811", after: "0.944" }
 *   "수상: 2025 오픈소스 개발자 대회 동상"            → { label: "수상", before: null, after: "2025 …" }
 */
export function parseMetric(line: string): Metric | null {
  const i = line.lastIndexOf(":");
  if (i <= 0) return null;
  const label = line.slice(0, i).trim();
  const value = line.slice(i + 1).trim();
  if (!label || !value) return null;
  const m = new RegExp(`^${DELTA.source}$`).exec(value);
  return m ? { label, before: m[1], after: m[3] } : { label, before: null, after: value };
}

export function parseMetrics(text: string): Metric[] {
  return text
    .split("\n")
    .map((l) => parseMetric(l))
    .filter((m): m is Metric => m !== null);
}
