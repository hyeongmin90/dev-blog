import { Client } from "@notionhq/client";

let client: Client | null = null;

export function notion(): Client {
  const auth = process.env.NOTION_TOKEN;
  if (!auth) {
    throw new Error(
      "NOTION_TOKEN이 설정되지 않았습니다. .env.local에 Notion integration 토큰을 넣어주세요.",
    );
  }
  // SDK가 429와 일시적 오류를 자동으로 재시도한다.
  client ??= new Client({ auth, retry: { maxRetries: 4 } });
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
