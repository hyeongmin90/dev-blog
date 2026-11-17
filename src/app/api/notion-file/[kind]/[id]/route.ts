import { isFullBlock, isFullPage } from "@notionhq/client";
import type { BlockObjectResponse, PageObjectResponse } from "@notionhq/client";
import { NOTION_ID, notion } from "@/lib/notion/client";

// Vercel 함수 응답 본문 한도(4.5MB)보다 작은 파일만 직접 전달하고, 큰 파일은 리다이렉트한다.
const MAX_PROXY_BYTES = 4 * 1024 * 1024;

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

export async function GET(_req: Request, { params }: { params: Promise<{ kind: string; id: string }> }) {
  const { kind, id } = await params;
  if (!NOTION_ID.test(id) || (kind !== "block" && kind !== "page")) return notFound();

  let url: string | null = null;
  try {
    if (kind === "block") {
      const block = await notion().blocks.retrieve({ block_id: id });
      if (isFullBlock(block)) url = blockFileUrl(block);
    } else {
      const page = await notion().pages.retrieve({ page_id: id });
      if (isFullPage(page)) url = thumbnailUrl(page);
    }
  } catch {
    return notFound();
  }
  if (!url) return notFound();

  const upstream = await fetch(url);
  const size = Number(upstream.headers.get("content-length") ?? "0");
  if (!upstream.ok || !upstream.body) {
    return new Response("원본 파일을 가져오지 못했습니다.", { status: 502 });
  }

  if (size > MAX_PROXY_BYTES || size === 0) {
    // 서명 URL은 1시간 뒤 만료되므로 리다이렉트는 30분만 캐시한다.
    await upstream.body.cancel();
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
