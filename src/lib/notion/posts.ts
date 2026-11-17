import { collectPaginatedAPI, isFullPage } from "@notionhq/client";
import type { PageObjectResponse } from "@notionhq/client";
import { cacheLife, cacheTag } from "next/cache";
import { parseMetrics, type Metric } from "@/lib/delta";
import { dataSourceId, normalizeId, notion } from "./client";

export type Status = "Public" | "PublicOnDetail";
export type World = "portfolio" | "blog";

export type Post = {
  id: string;
  slug: string;
  title: string;
  summary: string;
  date: string | null;
  category: string | null;
  tags: string[];
  status: Status;
  type: string | null;
  thumbnail: string | null;
  updatedAt: string;
  // ↓ 포트폴리오 프로젝트에서만 쓰는 속성. 블로그 글에서는 비어 있다.
  period: string | null;
  team: string | null;
  metrics: Metric[];
  stack: string[];
  /** 값이 있으면 포트폴리오 홈에 이 순서로 나온다. */
  order: number | null;
};

type Property = PageObjectResponse["properties"][string];

function text(prop: Property | undefined): string {
  if (!prop) return "";
  if (prop.type === "title") return prop.title.map((t) => t.plain_text).join("");
  if (prop.type === "rich_text") return prop.rich_text.map((t) => t.plain_text).join("");
  return "";
}

function select(prop: Property | undefined): string | null {
  return prop?.type === "select" ? (prop.select?.name ?? null) : null;
}

function multiSelect(prop: Property | undefined): string[] {
  return prop?.type === "multi_select" ? prop.multi_select.map((o) => o.name) : [];
}

function num(prop: Property | undefined): number | null {
  return prop?.type === "number" ? prop.number : null;
}

function date(prop: Property | undefined): string | null {
  return prop?.type === "date" ? (prop.date?.start ?? null) : null;
}

function thumbnail(page: PageObjectResponse): string | null {
  const prop = page.properties.thumbnail;
  if (prop?.type !== "files" || prop.files.length === 0) return null;
  const file = prop.files[0];
  if (file.type === "external") return file.external.url;
  // Notion 업로드 파일 URL은 1시간 뒤 만료되므로 프록시 경로로 바꾼다.
  return `/api/notion-file/page/${normalizeId(page.id)}?v=${encodeURIComponent(page.last_edited_time)}`;
}

function toPost(page: PageObjectResponse): Post | null {
  const p = page.properties;
  const slug = text(p.slug).trim();
  const status = select(p.status);
  if (!slug || (status !== "Public" && status !== "PublicOnDetail")) return null;
  return {
    id: normalizeId(page.id),
    slug,
    title: text(p.title).trim() || slug,
    summary: text(p.summary).trim(),
    date: date(p.date),
    category: select(p.category),
    tags: multiSelect(p.tags).filter((t) => t !== "Pinned"),
    status,
    type: select(p.type),
    thumbnail: thumbnail(page),
    updatedAt: page.last_edited_time,
    period: text(p.period).trim() || null,
    team: text(p.team).trim() || null,
    metrics: parseMetrics(text(p.metrics)),
    stack: multiSelect(p.stack),
    order: num(p.order),
  };
}

/** 공개(Public, PublicOnDetail) 상태인 모든 행. 날짜 내림차순. */
export async function getAllPosts(): Promise<Post[]> {
  "use cache";
  cacheLife("notion");
  cacheTag("notion");

  const rows = await collectPaginatedAPI(notion().dataSources.query, {
    data_source_id: dataSourceId(),
    filter: {
      or: [
        { property: "status", select: { equals: "Public" } },
        { property: "status", select: { equals: "PublicOnDetail" } },
      ],
    },
  });

  return rows
    .filter(isFullPage)
    .map(toPost)
    .filter((p): p is Post => p !== null)
    .sort((a, b) => (b.date ?? "").localeCompare(a.date ?? ""));
}

export async function getPostBySlug(slug: string): Promise<Post | null> {
  const posts = await getAllPosts();
  return posts.find((p) => p.slug === slug) ?? null;
}

export function worldOf(post: Post): World {
  return post.category === "Portfolio" ? "portfolio" : "blog";
}

/** 블로그 목록에 나오는 글: Public인 Post 중 포트폴리오가 아닌 것. */
export function isBlogPost(post: Post): boolean {
  return post.status === "Public" && post.type === "Post" && worldOf(post) === "blog";
}

export function isProject(post: Post): boolean {
  return worldOf(post) === "portfolio" && post.slug.startsWith("portfolio-");
}

/** 포트폴리오 홈에 나올 프로젝트: order가 있는 프로젝트 글, order 오름차순. */
export function projectsForHome(posts: Post[]): Post[] {
  return posts
    .filter((p) => isProject(p) && p.order !== null)
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
}

/** "Vantage | AI 지식 큐레이션 플랫폼" → 이름과 한 줄 설명 */
export function splitProjectTitle(title: string): { name: string; tagline: string } {
  const [name, ...rest] = title.split(/\s*\|\s*/);
  return { name: name.trim(), tagline: rest.join(" | ").trim() };
}

/** 노션 페이지 ID → slug. 본문 속 페이지 링크와 멘션을 사이트 경로로 바꿀 때 쓴다. */
export function slugMap(posts: Post[]): Record<string, string> {
  return Object.fromEntries(posts.map((p) => [p.id, p.slug]));
}
