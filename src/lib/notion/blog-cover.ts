import { cacheLife, cacheTag } from "next/cache";
import { dataSourceId, normalizeId, notion } from "./client";
import { tags } from "./tags";

/**
 * 블로그 목록 상단 커버. Developer Log DB에 걸린 커버 이미지를 쓴다.
 * 노션에 업로드한 파일은 URL이 만료되므로 프록시 경로로 바꾸고, 외부 이미지는 그대로 쓴다.
 */
export async function getBlogCover(): Promise<string | null> {
  "use cache";
  cacheLife("notion");
  cacheTag(tags.all, tags.cover);

  const ds = await notion().dataSources.retrieve({ data_source_id: dataSourceId() });
  if (!("parent" in ds) || ds.parent.type !== "database_id") return null;
  const db = await notion().databases.retrieve({ database_id: ds.parent.database_id });
  if (!("cover" in db) || !db.cover) return null;

  if (db.cover.type === "external") {
    const url = db.cover.external.url;
    // 노션 기본 커버는 "/images/page-cover/..." 같은 상대 경로로 올 수 있다.
    return url.startsWith("/") ? `https://www.notion.so${url}` : url;
  }
  if (db.cover.type === "file") {
    const version = "last_edited_time" in db ? db.last_edited_time : "";
    return `/api/notion-file/database/${normalizeId(db.id)}?v=${encodeURIComponent(version)}`;
  }
  return null;
}
