import type { World } from "@/lib/notion/posts";
import { normalizeId } from "@/lib/notion/client";
import { site } from "@/lib/site";

/** 렌더러 전체에 넘겨주는 값. 서버 컴포넌트라 React context 대신 prop으로 전달한다. */
export type RenderCtx = {
  world: World;
  /** 노션 페이지 ID(하이픈 없음) → slug */
  slugs: Record<string, string>;
  /** 페이지에 heading_1이 있으면 제목 단계를 하나씩 내린다(h1은 페이지 제목 전용). */
  shiftHeadings: boolean;
};

const NOTION_PAGE_ID = /([0-9a-f]{32})(?:[?#].*)?$/i;

/**
 * 노션 내부 링크와 예전 블로그 도메인의 절대 링크를 사이트 경로로 바꾼다.
 * 매칭되지 않으면 원래 URL을 그대로 돌려준다.
 */
export function resolveHref(href: string, ctx: RenderCtx): string {
  try {
    const isRelative = href.startsWith("/");
    const url = new URL(href, "https://www.notion.so");
    if (site.hosts.includes(url.hostname as (typeof site.hosts)[number])) {
      return url.pathname + url.search + url.hash || "/";
    }
    if (isRelative || /(^|\.)notion\.(so|site|com)$/.test(url.hostname)) {
      const m = url.pathname.replace(/-/g, "").match(NOTION_PAGE_ID);
      const slug = m ? ctx.slugs[normalizeId(m[1])] : undefined;
      if (slug) return `/${slug}`;
    }
  } catch {
    // 잘못된 URL은 그대로 둔다.
  }
  return href;
}

export function pageHref(pageId: string, ctx: RenderCtx): string | null {
  const slug = ctx.slugs[normalizeId(pageId)];
  if (!slug) return null;
  return `/${slug}`;
}

export function isExternal(href: string): boolean {
  return /^https?:\/\//.test(href);
}
