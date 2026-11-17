// 포트폴리오 히어로의 Vantage 파이프라인 다이어그램.
// 시스템 구조는 디자인 요소라서 코드에 둔다. 수치는 Vantage 케이스 스터디 본문과 같아야 한다.

export type PipelineNode = {
  id: string;
  x: number;
  y: number;
  w?: number;
  label: string;
  sub: string;
  title: string;
  desc: string;
  metric?: { label: string; before: string; after: string };
};

export const CASE_STUDY_HREF = "/portfolio-vantage";
export const VIEWBOX = { w: 680, h: 330 };
export const NODE_W = 140;
export const NODE_H = 48;
export const DEFAULT_NODE = "gate";

export const NODES: PipelineNode[] = [
  {
    id: "crawler", x: 80, y: 55, label: "수집기", sub: "RSS · 브라우저", title: "소스별 주기 수집",
    desc: "아티클, 기술블로그 등을 수집합니다.",
  },
  { id: "mq", x: 260, y: 55, label: "RabbitMQ", sub: "Command / Event", title: "Command와 Event 분리", desc: "Outbox·Inbox와 멱등성 키로 메시지 유실과 중복 처리를 막았습니다." },
  { id: "summ", x: 450, y: 55, label: "요약·클러스터링", sub: "LLM", title: "요약과 클러스터링", desc: "같은 사건의 기사를 묶어 대표 기사만 검색 결과에 올립니다." },
  {
    id: "db", x: 260, y: 165, label: "ParadeDB", sub: "BM25 + 벡터", title: "하이브리드 리트리버",
    desc: "143문항으로 벡터, FTS, BM25, 하이브리드를 비교해 BM25 hybrid 5:5를 골랐습니다.",
    metric: { label: "recall@5", before: "0.916", after: "0.979" },
  },
  {
    id: "graph", x: 450, y: 165, label: "사건 그래프", sub: "임베딩 트리 + LLM", title: "사건 단위 지식 베이스",
    desc: "기사를 사건으로 묶고 시간순 흐름을 연결해 장기 사건을 추적합니다.",
    metric: { label: "retrieval recall, 15문항", before: "0.90", after: "0.98" },
  },
  { id: "agent", x: 260, y: 275, label: "RAG 에이전트", sub: "LangChain", title: "에이전틱 RAG", desc: "대표 기사로 먼저 찾고, 필요할 때만 연관 기사 확장 도구로 근거를 더 읽습니다." },
  {
    id: "gate", x: 450, y: 275, label: "충분성 게이트", sub: "Sufficient Context", title: "근거가 부족하면 답하지 않기",
    desc: "답변 전에 검색 근거가 충분한지 검증해, 무관한 수치를 인용하는 환각을 줄였습니다.",
    metric: { label: "correctness, 47문항", before: "0.811", after: "0.944" },
  },
  {
    id: "answer", x: 610, y: 275, w: 100, label: "답변", sub: "검증된 인용", title: "읽은 기사만 인용",
    desc: "검증된 결과를 바탕으로 에이전트가 답변합니다.",
  },
];

export const EDGES: [string, string][] = [
  ["crawler", "mq"], ["mq", "summ"], ["summ", "db"], ["summ", "graph"],
  ["db", "agent"], ["graph", "agent"], ["agent", "gate"], ["gate", "answer"],
];

/** 같은 줄이면 직선, 아래 줄이면 위아래를 잇는 곡선 */
export function edgePath(a: PipelineNode, b: PipelineNode): string {
  const wa = (a.w ?? NODE_W) / 2;
  const wb = (b.w ?? NODE_W) / 2;
  if (a.y === b.y) return `M${a.x + wa},${a.y} L${b.x - wb},${b.y}`;
  const y1 = a.y + NODE_H / 2;
  const y2 = b.y - NODE_H / 2;
  const my = (y1 + y2) / 2;
  return `M${a.x},${y1} C${a.x},${my} ${b.x},${my} ${b.x},${y2}`;
}
