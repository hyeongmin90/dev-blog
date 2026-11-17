import { collectPaginatedAPI, isFullPage } from "@notionhq/client";
import type { PageObjectResponse } from "@notionhq/client";
import { cacheLife, cacheTag } from "next/cache";
import { notion } from "./client";

export type ItemKind = "활동" | "자격" | "수상" | "기술";

export type PortfolioItem = {
  id: string;
  name: string;
  kind: ItemKind;
  period: string | null;
  detail: string | null;
  order: number;
};

type Property = PageObjectResponse["properties"][string];
const KINDS: ItemKind[] = ["활동", "자격", "수상", "기술"];

function plain(prop: Property | undefined): string {
  if (prop?.type === "title") return prop.title.map((t) => t.plain_text).join("").trim();
  if (prop?.type === "rich_text") return prop.rich_text.map((t) => t.plain_text).join("").trim();
  return "";
}

function itemsId(): string {
  const id = process.env.NOTION_PORTFOLIO_ITEMS_ID;
  if (!id) {
    throw new Error(
      "NOTION_PORTFOLIO_ITEMS_ID가 설정되지 않았습니다. .env.local에 Portfolio Items 데이터 소스 ID를 넣어주세요.",
    );
  }
  return id;
}

/** 경력·활동, 자격, 수상, 기술 그룹. order 오름차순. */
export async function getPortfolioItems(): Promise<PortfolioItem[]> {
  "use cache";
  cacheLife("notion");
  cacheTag("notion");

  const rows = await collectPaginatedAPI(notion().dataSources.query, { data_source_id: itemsId() });
  return rows
    .filter(isFullPage)
    .map((page): PortfolioItem | null => {
      const p = page.properties;
      const kind = p.kind?.type === "select" ? p.kind.select?.name : undefined;
      const name = plain(p.name);
      if (!name || !KINDS.includes(kind as ItemKind)) return null;
      return {
        id: page.id,
        name,
        kind: kind as ItemKind,
        period: plain(p.period) || null,
        detail: plain(p.detail) || null,
        order: p.order?.type === "number" && p.order.number !== null ? p.order.number : 999,
      };
    })
    .filter((i): i is PortfolioItem => i !== null)
    .sort((a, b) => a.order - b.order);
}
