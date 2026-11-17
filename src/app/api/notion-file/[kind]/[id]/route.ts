import sharp from "sharp";
import { isFullBlock, isFullPage } from "@notionhq/client";
import type { BlockObjectResponse, PageObjectResponse } from "@notionhq/client";
import { NOTION_ID, dataSourceId, normalizeId, notion } from "@/lib/notion/client";

// Vercel 함수 응답 본문 한도(4.5MB)보다 작은 파일만 직접 전달하고, 큰 파일은 리다이렉트한다.
const MAX_PROXY_BYTES = 4 * 1024 * 1024;

// 축소 요청(?w=)으로 받을 수 있는 폭. 캐시 변형이 무한히 늘지 않게 몇 가지로 제한한다.
const RESIZE_WIDTHS = new Set([400, 800, 1400]);
const RESIZABLE = /^image\/(png|jpe?g|webp|avif)/;
// 축소용으로 내려받을 원본 크기 상한
const MAX_RESIZE_INPUT_BYTES = 25 * 1024 * 1024;

type FileValue = { type: "external"; external: { url: string } } | { type: "file"; file: { url: string } } | { type: string };

function urlOf(file: FileValue | undefined): string | null {
  if (!file) return null;
  if (file.type === "external" && "external" in file) return file.external.url;
  if (file.type === "file" && "file" in file) return file.file.url;
  return null;
}

function blockFileUrl(b: BlockObjectResponse): string | null {
  switch (b.type) {
    case "image":
      return urlOf(b.image);
    case "video":
      return urlOf(b.video);
    case "pdf":
      return urlOf(b.pdf);
    case "file":
      return urlOf(b.file);
    case "audio":
      return urlOf(b.audio);
    default:
      return null;
  }
}

function thumbnailUrl(p: PageObjectResponse): string | null {
  const status = p.properties.status;
  const isPublic = status?.type === "select" && (status.select?.name === "Public" || status.select?.name === "PublicOnDetail");
  const thumb = p.properties.thumbnail;
  if (!isPublic || thumb?.type !== "files") return null;
  return urlOf(thumb.files[0] as FileValue | undefined);
}

const notFound = () => new Response("파일을 찾을 수 없습니다.", { status: 404 });

export async function GET(req: Request, { params }: { params: Promise<{ kind: string; id: string }> }) {
  const { kind, id } = await params;
  if (!NOTION_ID.test(id) || !["block", "page", "database"].includes(kind)) return notFound();

  let url: string | null = null;
  try {
    if (kind === "block") {
      const block = await notion().blocks.retrieve({ block_id: id });
      if (isFullBlock(block)) url = blockFileUrl(block);
    } else if (kind === "database") {
      // 블로그 DB(Developer Log)의 커버만 내보낸다.
      const db = await notion().databases.retrieve({ database_id: id });
      const ours = "data_sources" in db && db.data_sources.some((s) => normalizeId(s.id) === normalizeId(dataSourceId()));
      if (ours && "cover" in db) url = urlOf(db.cover as FileValue | undefined);
    } else {
      const page = await notion().pages.retrieve({ page_id: id });
      if (isFullPage(page)) url = thumbnailUrl(page);
    }
  } catch {
    return notFound();
  }
  if (!url) return notFound();

  // Next의 fetch 캐시는 본문을 복제(tee)하는데, 그러면 큰 파일에서 본문 취소가 끝나지 않는다.
  // 파일 캐시는 CDN 헤더로 처리하므로 Next 캐시는 쓰지 않는다.
  const upstream = await fetch(url, { cache: "no-store" });
  const size = Number(upstream.headers.get("content-length") ?? "0");
  if (!upstream.ok || !upstream.body) {
    return new Response("원본 파일을 가져오지 못했습니다.", { status: 502 });
  }

  // ?w= 가 있으면 그 폭으로 줄인 WebP를 돌려준다. 원본이 커도 결과는 수십 KB라 직접 응답할 수 있다.
  const width = Number(new URL(req.url).searchParams.get("w"));
  const type = upstream.headers.get("content-type") ?? "";
  if (RESIZE_WIDTHS.has(width) && RESIZABLE.test(type) && size <= MAX_RESIZE_INPUT_BYTES) {
    try {
      const input = Buffer.from(await upstream.arrayBuffer());
      const output = await sharp(input).resize({ width, withoutEnlargement: true }).webp({ quality: 78 }).toBuffer();
      return new Response(new Uint8Array(output), {
        headers: {
          "content-type": "image/webp",
          "content-length": String(output.length),
          "cache-control": "public, max-age=31536000, immutable",
        },
      });
    } catch {
      // 변환에 실패하면 아래의 원본 전달 경로로 넘어간다(본문을 이미 읽었으므로 리다이렉트).
      return new Response(null, {
        status: 307,
        headers: { location: url, "cache-control": "public, max-age=0, s-maxage=1800" },
      });
    }
  }

  if (size > MAX_PROXY_BYTES || size === 0) {
    // 서명 URL은 1시간 뒤 만료되므로 리다이렉트는 30분만 캐시한다.
    // 본문은 필요 없으니 연결만 끊는다. 취소가 끝나길 기다리지 않는다.
    upstream.body.cancel().catch(() => {});
    return new Response(null, {
      status: 307,
      headers: { location: url, "cache-control": "public, max-age=0, s-maxage=1800" },
    });
  }

  // URL의 ?v=(블록 수정 시각)가 바뀌지 않는 한 같은 파일이므로 CDN과 브라우저에 오래 캐시한다.
  return new Response(upstream.body, {
    headers: {
      "content-type": upstream.headers.get("content-type") ?? "application/octet-stream",
      "content-length": String(size),
      "cache-control": "public, max-age=31536000, immutable",
    },
  });
}
