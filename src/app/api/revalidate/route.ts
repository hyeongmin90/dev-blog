import { revalidateTag } from "next/cache";
import { tags } from "@/lib/notion/tags";

/**
 * Notion 캐시를 전부 비운다. 평소에는 웹훅(/api/notion-webhook)이 바뀐 부분만 비우므로
 * 웹훅이 동작하지 않을 때 쓰는 비상용이다.
 *   curl -X POST "https://blog.hyeongmin.dev/api/revalidate?secret=..."
 */
export async function POST(req: Request) {
  const secret = process.env.REVALIDATE_SECRET;
  const given = new URL(req.url).searchParams.get("secret") ?? req.headers.get("x-revalidate-secret");
  if (!secret || given !== secret) {
    return Response.json({ ok: false, error: "secret이 올바르지 않습니다." }, { status: 401 });
  }
  // expire: 0 → 다음 요청은 옛 캐시를 쓰지 않고 새로 받아온다.
  revalidateTag(tags.all, { expire: 0 });
  return Response.json({ ok: true, revalidatedAt: new Date().toISOString() });
}
