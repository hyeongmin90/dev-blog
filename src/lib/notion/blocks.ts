import { collectPaginatedAPI, isFullBlock } from "@notionhq/client";
import type { BlockObjectResponse } from "@notionhq/client";
import { cacheLife, cacheTag } from "next/cache";
import { notion } from "./client";
import { tags } from "./tags";

export type NBlock = BlockObjectResponse & { children?: NBlock[] };

// 하위 페이지와 DB는 별도 문서라서 본문에 펼치지 않는다.
const SKIP_CHILDREN = new Set(["child_page", "child_database"]);

// Notion API 평균 한도(초당 3회)를 넘지 않도록 하위 블록 조회를 몇 개씩만 동시에 한다.
const CONCURRENCY = 3;

async function fetchChildren(blockId: string): Promise<NBlock[]> {
  const list = await collectPaginatedAPI(notion().blocks.children.list, { block_id: blockId });
  const blocks: NBlock[] = list.filter(isFullBlock);

  const parents = blocks.filter((b) => b.has_children && !SKIP_CHILDREN.has(b.type));
  for (let i = 0; i < parents.length; i += CONCURRENCY) {
    await Promise.all(
      parents.slice(i, i + CONCURRENCY).map(async (b) => {
        b.children = await fetchChildren(b.id);
      }),
    );
  }
  return blocks;
}

/** 페이지 본문 블록 트리 전체. */
export async function getBlocks(pageId: string): Promise<NBlock[]> {
  "use cache";
  cacheLife("notion");
  cacheTag(tags.all, tags.page(pageId));
  return fetchChildren(pageId);
}

export function plainText(rich: { plain_text: string }[]): string {
  return rich.map((t) => t.plain_text).join("");
}

/**
 * 목록 카드에 보여줄 본문 첫머리. 최상위 문단만 이어 붙인다(제목, 코드, 목록은 건너뜀).
 */
export function excerptOf(blocks: NBlock[], max = 220): string {
  let text = "";
  for (const b of blocks) {
    if (b.type !== "paragraph") continue;
    const t = plainText(b.paragraph.rich_text).replace(/\s+/g, " ").trim();
    if (!t) continue;
    text = text ? `${text} ${t}` : t;
    if (text.length >= max) break;
  }
  return text.length > max ? `${text.slice(0, max).trimEnd()}…` : text;
}

export type TocItem = { id: string; text: string; level: 2 | 3 };

export function hasHeading1(blocks: NBlock[]): boolean {
  return blocks.some((b) => b.type === "heading_1");
}

/**
 * 목차용 h2·h3. 렌더러와 같은 규칙을 쓴다: 페이지에 heading_1이 있으면
 * heading_1→h2, heading_2→h3이고, 없으면 heading_2→h2, heading_3→h3이다.
 */
export function collectToc(blocks: NBlock[]): TocItem[] {
  const shift = hasHeading1(blocks);
  const items: TocItem[] = [];
  for (const b of blocks) {
    let rich: { plain_text: string }[] | null = null;
    let level = 0;
    if (b.type === "heading_1") [rich, level] = [b.heading_1.rich_text, 1];
    else if (b.type === "heading_2") [rich, level] = [b.heading_2.rich_text, 2];
    else if (b.type === "heading_3") [rich, level] = [b.heading_3.rich_text, 3];
    if (!rich) continue;
    const out = shift ? level + 1 : level;
    if (out === 2 || out === 3) items.push({ id: anchorId(b.id), text: plainText(rich), level: out });
  }
  return items;
}

// 블록 id 전체를 쓴다. 최근 Notion id는 앞자리가 같은 페이지 안에서 겹치기 때문에
// 앞부분만 잘라 쓰면 제목들이 같은 id를 갖게 된다.
export function anchorId(blockId: string): string {
  return `h-${blockId.replace(/-/g, "")}`;
}
