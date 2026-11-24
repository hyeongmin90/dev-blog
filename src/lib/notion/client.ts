import { Client } from "@notionhq/client";

let client: Client | null = null;

// Notion API 한도는 통합당 평균 초당 3회다. 한 프로세스 안에서 요청 시작 간격을 벌려
// 홈처럼 여러 글을 한꺼번에 읽는 렌더가 몰려도 한도를 넘지 않게 한다.
const MIN_GAP_MS = 340;
let nextSlot = 0;

const throttledFetch: typeof fetch = async (input, init) => {
  const now = Date.now();
  const wait = Math.max(0, nextSlot - now);
  nextSlot = Math.max(now, nextSlot) + MIN_GAP_MS;
  if (wait > 0) await new Promise((r) => setTimeout(r, wait));
  return fetch(input, init);
};

export function notion(): Client {
  const auth = process.env.NOTION_TOKEN;
  if (!auth) {
    throw new Error(
      "NOTION_TOKEN이 설정되지 않았습니다. .env.local에 Notion integration 토큰을 넣어주세요.",
    );
  }
  // SDK가 429와 일시적 오류를 자동으로 재시도한다.
  client ??= new Client({ auth, retry: { maxRetries: 4 }, fetch: throttledFetch });
  return client;
}

export function dataSourceId(): string {
  const id = process.env.NOTION_DATA_SOURCE_ID;
  if (!id) {
    throw new Error(
      "NOTION_DATA_SOURCE_ID가 설정되지 않았습니다. .env.local에 Developer Log 데이터 소스 ID를 넣어주세요.",
    );
  }
  return id;
}

/** 대시가 있든 없든 Notion ID를 하이픈 없는 32자 소문자로 맞춘다. */
export function normalizeId(id: string): string {
  return id.replace(/-/g, "").toLowerCase();
}

export const NOTION_ID = /^[0-9a-f]{32}$/;
