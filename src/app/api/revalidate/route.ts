import { revalidateTag } from "next/cache";

/**
 * 노션에서 글을 고친 뒤 바로 반영하고 싶을 때 호출한다.
 *   curl -X POST "https://blog.hyeongmin.dev/api/revalidate?secret=..."
 * 호출하지 않아도 캐시는 10분마다 자동으로 갱신된다.
 */
export async function POST(req: Request) {
  const secret = process.env.REVALIDATE_SECRET;
  const given = new URL(req.url).searchParams.get("secret") ?? req.headers.get("x-revalidate-secret");
  if (!secret || given !== secret) {
    return Response.json({ ok: false, error: "secret이 올바르지 않습니다." }, { status: 401 });
  }
  // expire: 0 → 다음 요청은 옛 캐시를 쓰지 않고 새로 받아온다.
  revalidateTag("notion", { expire: 0 });
  return Response.json({ ok: true, revalidatedAt: new Date().toISOString() });
}
