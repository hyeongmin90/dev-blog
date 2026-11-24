import { createHmac, timingSafeEqual } from "node:crypto";
import { revalidateTag } from "next/cache";
import { tags } from "@/lib/notion/tags";

/**
 * Notion 통합(integration) 웹훅. 글을 고치거나 추가하면 Notion이 이 주소로 이벤트를 보내고,
 * 바뀐 부분의 캐시만 비운다.
 *
 * 설정: Notion 통합 설정 → Webhooks → 구독 만들기 → URL에 https://<도메인>/api/notion-webhook
 * 1. Notion이 verification_token을 보내면 서버 로그에 찍힌다.
 * 2. 그 값을 NOTION_WEBHOOK_SECRET 환경 변수에 넣고 다시 배포한 뒤, Notion 화면에도 붙여 넣어 인증한다.
 */

type NotionEvent = {
  type?: string;
  entity?: { id?: string; type?: string };
  verification_token?: string;
};

function validSignature(body: string, header: string | null, secret: string): boolean {
  if (!header) return false;
  const expected = `sha256=${createHmac("sha256", secret).update(body).digest("hex")}`;
  const a = Buffer.from(header);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

/** 이벤트 종류별로 비울 태그. 빈 배열이면 무시한다. */
function tagsFor(event: NotionEvent): string[] {
  const type = event.type ?? "";
  const id = event.entity?.id;

  // 본문만 바뀜 → 그 글의 블록만. 목록 카드의 본문 첫머리도 같은 캐시를 쓴다.
  if (type === "page.content_updated") return id ? [tags.page(id)] : [];

  // 새 글, 속성(제목·slug·status 등) 변경, 삭제·복구·이동 → 글 목록과 그 글.
  // 이벤트가 어느 DB에서 왔는지 가리지 않고 두 목록을 다 비운다. 조회 한 번씩이라 싸다.
  if (type.startsWith("page.")) return [tags.posts, tags.items, ...(id ? [tags.page(id)] : [])];

  // DB 자체(커버, 스키마 등) 변경 → 전부.
  if (type.startsWith("database.") || type.startsWith("data_source.")) return [tags.all];

  // 댓글 등은 사이트에 나오지 않는다.
  return [];
}

export async function POST(req: Request) {
  const body = await req.text();
  let event: NotionEvent;
  try {
    event = JSON.parse(body);
  } catch {
    return Response.json({ ok: false, error: "JSON이 아닙니다." }, { status: 400 });
  }

  // 구독을 만들 때 한 번 오는 인증 요청. 토큰을 로그로 남겨 환경 변수에 넣을 수 있게 한다.
  if (event.verification_token && !event.type) {
    console.log(`[notion-webhook] verification_token: ${event.verification_token}`);
    return Response.json({ ok: true });
  }

  const secret = process.env.NOTION_WEBHOOK_SECRET;
  if (!secret) {
    return Response.json({ ok: false, error: "NOTION_WEBHOOK_SECRET이 설정되지 않았습니다." }, { status: 503 });
  }
  if (!validSignature(body, req.headers.get("x-notion-signature"), secret)) {
    return Response.json({ ok: false, error: "서명이 올바르지 않습니다." }, { status: 401 });
  }

  const revalidated = tagsFor(event);
  // expire: 0 → 다음 방문자는 옛 캐시 대신 새 내용을 받는다.
  for (const tag of revalidated) revalidateTag(tag, { expire: 0 });
  return Response.json({ ok: true, type: event.type, revalidated });
}
