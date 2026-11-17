// 썸네일이 없는 글의 자동 커버: slug로 정해지는 "코드 미니맵" 무늬.
// 같은 slug면 항상 같은 그림이 나오도록 시드 기반 난수를 쓴다.

export type CoverBar = { x: number; y: number; w: number; hot: boolean };

function hash(s: string): number {
  let h = 2166136261;
  for (const c of s) {
    h ^= c.charCodeAt(0);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function rng(seed: number): () => number {
  return () => {
    seed = Math.imul(seed ^ (seed >>> 15), seed | 1);
    seed ^= seed + Math.imul(seed ^ (seed >>> 7), seed | 61);
    return ((seed ^ (seed >>> 14)) >>> 0) / 4294967296;
  };
}

export const COVER_VIEWBOX = { w: 200, h: 150 };

/** 들여쓰기와 길이가 제각각인 코드 줄. hot은 키워드처럼 진하게 칠한다. */
export function coverBars(slug: string): CoverBar[] {
  const r = rng(hash(slug));
  const bars: CoverBar[] = [];
  let indent = 0;
  for (let row = 0, y = 22; row < 10; row++, y += 11) {
    indent = Math.max(0, Math.min(3, indent + (r() < 0.35 ? 1 : r() < 0.3 ? -1 : 0)));
    let x = 22 + indent * 14;
    const count = 1 + Math.floor(r() * 3);
    for (let k = 0; k < count && x < COVER_VIEWBOX.w - 30; k++) {
      const w = Math.min(10 + Math.floor(r() * 48), COVER_VIEWBOX.w - 20 - x);
      bars.push({ x, y, w, hot: r() < 0.22 });
      x += w + 6;
    }
  }
  return bars;
}

// 카테고리 → CSS 색 변수. 모르는 카테고리는 강조색을 쓴다.
const CATEGORY_COLOR: Record<string, string> = {
  AI: "var(--c-ai)",
  Backend: "var(--c-backend)",
  Infra: "var(--c-infra)",
  "Computer Science": "var(--c-cs)",
  Frontend: "var(--c-frontend)",
  Docs: "var(--c-docs)",
};

export function categoryColor(category: string | null): string {
  return (category && CATEGORY_COLOR[category]) || "var(--accent)";
}

const SHORT: Record<string, string> = { "Computer Science": "CS" };
export function categoryLabel(category: string): string {
  return SHORT[category] ?? category;
}
