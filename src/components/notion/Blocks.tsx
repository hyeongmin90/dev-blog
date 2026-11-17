import type { RichTextItemResponse } from "@notionhq/client";
import Link from "next/link";
import type { ReactNode } from "react";
import { anchorId, plainText, type NBlock } from "@/lib/notion/blocks";
import { normalizeId } from "@/lib/notion/client";
import { Code } from "./Code";
import { Math as TeX } from "./Math";
import { dropChars, RichText } from "./RichText";
import { isExternal, pageHref, resolveHref, type RenderCtx } from "./context";
import { ProjectRows } from "@/components/portfolio/ProjectRows";

type Props = { blocks: NBlock[]; ctx: RenderCtx };

/** 노션 블록 목록을 렌더링한다. 연속된 목록 항목은 하나의 ul/ol로 묶는다. */
export function Blocks({ blocks, ctx }: Props) {
  const out: ReactNode[] = [];
  for (let i = 0; i < blocks.length; ) {
    const b = blocks[i];
    if (b.type === "bulleted_list_item" || b.type === "numbered_list_item") {
      let j = i;
      while (j < blocks.length && blocks[j].type === b.type) j++;
      out.push(<List key={b.id} items={blocks.slice(i, j)} ordered={b.type === "numbered_list_item"} ctx={ctx} />);
      i = j;
    } else {
      out.push(<Block key={b.id} block={b} ctx={ctx} />);
      i++;
    }
  }
  return <>{out}</>;
}

function itemRich(b: NBlock): RichTextItemResponse[] {
  if (b.type === "bulleted_list_item") return b.bulleted_list_item.rich_text;
  if (b.type === "numbered_list_item") return b.numbered_list_item.rich_text;
  return [];
}

// ---- 케이스 스터디: 굵은 "문제 / 해결 / 결과"로 시작하는 목록 ----
const CASE_LABEL = /^\s*(문제|원인|해결|접근|결과|배경|개선)\s*[:：]?\s*/;

function caseLabel(b: NBlock): { label: string; length: number } | null {
  const rich = itemRich(b);
  if (!rich[0]?.annotations.bold) return null;
  const m = plainText(rich).match(CASE_LABEL);
  return m ? { label: m[1], length: m[0].length } : null;
}

// ---- 프로젝트 링크로만 된 목록 ----
function projectSlug(b: NBlock, ctx: RenderCtx): string | null {
  const rich = itemRich(b).filter((t) => t.plain_text.trim() !== "");
  if (rich.length === 0 || b.children?.length) return null;
  const hrefs = new Set(rich.map((t) => (t.href ? resolveHref(t.href, ctx) : null)));
  if (hrefs.size !== 1) return null;
  const [href] = hrefs;
  const slug = href?.startsWith("/") ? href.slice(1) : null;
  return slug && ctx.projects[slug] ? slug : null;
}

function List({ items, ordered, ctx }: { items: NBlock[]; ordered: boolean; ctx: RenderCtx }) {
  if (ctx.world === "portfolio" && !ordered) {
    const labels = items.map(caseLabel);
    if (items.length >= 2 && labels.every(Boolean)) {
      return (
        <dl className="case">
          {items.map((b, i) => {
            const l = labels[i]!;
            return (
              <div key={b.id} className="case-row">
                <dt>{l.label}</dt>
                <dd>
                  <RichText rich={dropChars(itemRich(b), l.length)} ctx={ctx} />
                  {b.children ? <Blocks blocks={b.children} ctx={ctx} /> : null}
                </dd>
              </div>
            );
          })}
        </dl>
      );
    }
    const slugs = items.map((b) => projectSlug(b, ctx));
    if (slugs.every(Boolean)) {
      return <ProjectRows projects={slugs.map((s) => ctx.projects[s!])} />;
    }
  }

  const Tag = ordered ? "ol" : "ul";
  return (
    <Tag className="n-list">
      {items.map((b) => (
        <li key={b.id}>
          <RichText rich={itemRich(b)} ctx={ctx} />
          {b.children ? <Blocks blocks={b.children} ctx={ctx} /> : null}
        </li>
      ))}
    </Tag>
  );
}

function fileUrl(blockId: string, file: { type: "external"; external: { url: string } } | { type: "file"; file: { url: string } } | { type: "file_upload" }, version: string): string {
  if (file.type === "external") return file.external.url;
  // 업로드 파일 URL은 만료되므로 프록시를 거친다. 블록이 바뀌면 v가 바뀌어 CDN 캐시도 새로 받는다.
  return `/api/notion-file/block/${normalizeId(blockId)}?v=${encodeURIComponent(version)}`;
}

function youtubeEmbed(url: string): string | null {
  const m = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([\w-]{11})/);
  return m ? `https://www.youtube-nocookie.com/embed/${m[1]}` : null;
}

function Heading({ level, rich, id, toggle, children, ctx }: { level: 1 | 2 | 3 | 4; rich: RichTextItemResponse[]; id: string; toggle: boolean; children?: NBlock[]; ctx: RenderCtx }) {
  const shifted = Math.min((ctx.shiftHeadings ? level + 1 : Math.max(level, 2)), 4) as 2 | 3 | 4;
  const Tag = `h${shifted}` as const;
  const heading = (
    <Tag id={anchorId(id)} className="n-heading">
      <RichText rich={rich} ctx={ctx} />
    </Tag>
  );
  if (!toggle) return heading;
  return (
    <details className="n-toggle">
      <summary>{heading}</summary>
      {children ? <Blocks blocks={children} ctx={ctx} /> : null}
    </details>
  );
}

const NUMERIC = /^[\s\d.,%+\-−→/x×~()]+$/;

function Table({ block, ctx }: { block: Extract<NBlock, { type: "table" }>; ctx: RenderCtx }) {
  const rows = (block.children ?? []).filter((r): r is Extract<NBlock, { type: "table_row" }> => r.type === "table_row");
  const { has_column_header: colHeader, has_row_header: rowHeader } = block.table;
  const body = colHeader ? rows.slice(1) : rows;
  const cellClass = (cell: RichTextItemResponse[]) => (NUMERIC.test(plainText(cell)) && plainText(cell).trim() ? "num" : undefined);
  const isBoldRow = (cells: RichTextItemResponse[][]) =>
    cells.every((c) => c.length > 0 && c.every((t) => t.annotations.bold || t.plain_text.trim() === ""));

  return (
    <div className="n-table">
      <table>
        {colHeader && rows[0] ? (
          <thead>
            <tr>
              {rows[0].table_row.cells.map((c, i) => (
                <th key={i} scope="col" className={i > 0 && body.every((r) => cellClass(r.table_row.cells[i] ?? []) === "num") ? "num" : undefined}>
                  <RichText rich={c} ctx={ctx} />
                </th>
              ))}
            </tr>
          </thead>
        ) : null}
        <tbody>
          {body.map((r) => (
            <tr key={r.id} className={isBoldRow(r.table_row.cells) ? "best" : undefined}>
              {r.table_row.cells.map((c, i) =>
                rowHeader && i === 0 ? (
                  <th key={i} scope="row">
                    <RichText rich={c} ctx={ctx} />
                  </th>
                ) : (
                  <td key={i} className={cellClass(c)}>
                    <RichText rich={c} ctx={ctx} />
                  </td>
                ),
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Caption({ rich, ctx }: { rich: RichTextItemResponse[]; ctx: RenderCtx }) {
  return rich.length ? (
    <figcaption>
      <RichText rich={rich} ctx={ctx} />
    </figcaption>
  ) : null;
}

function LinkCard({ url, caption, ctx }: { url: string; caption?: RichTextItemResponse[]; ctx: RenderCtx }) {
  const href = resolveHref(url, ctx);
  let host = href;
  try {
    host = new URL(href).hostname.replace(/^www\./, "");
  } catch {}
  const label = caption?.length ? plainText(caption) : href;
  return isExternal(href) ? (
    <a className="n-linkcard" href={href} target="_blank" rel="noreferrer">
      <span className="n-linkcard-title">{label}</span>
      <span className="n-linkcard-host">{host}</span>
    </a>
  ) : (
    <Link className="n-linkcard" href={href}>
      <span className="n-linkcard-title">{label}</span>
    </Link>
  );
}

function Block({ block: b, ctx }: { block: NBlock; ctx: RenderCtx }): ReactNode {
  const kids = b.children ? <Blocks blocks={b.children} ctx={ctx} /> : null;

  switch (b.type) {
    case "paragraph":
      if (b.paragraph.rich_text.length === 0 && !kids) return null;
      return (
        <>
          <p>
            <RichText rich={b.paragraph.rich_text} ctx={ctx} />
          </p>
          {kids ? <div className="n-indent">{kids}</div> : null}
        </>
      );
    case "heading_1":
      return <Heading level={1} id={b.id} rich={b.heading_1.rich_text} toggle={b.heading_1.is_toggleable} ctx={ctx}>{b.children}</Heading>;
    case "heading_2":
      return <Heading level={2} id={b.id} rich={b.heading_2.rich_text} toggle={b.heading_2.is_toggleable} ctx={ctx}>{b.children}</Heading>;
    case "heading_3":
      return <Heading level={3} id={b.id} rich={b.heading_3.rich_text} toggle={b.heading_3.is_toggleable} ctx={ctx}>{b.children}</Heading>;
    case "heading_4":
      return <Heading level={4} id={b.id} rich={b.heading_4.rich_text} toggle={b.heading_4.is_toggleable} ctx={ctx}>{b.children}</Heading>;
    case "quote":
      return (
        <blockquote className="n-quote">
          <RichText rich={b.quote.rich_text} ctx={ctx} />
          {kids}
        </blockquote>
      );
    case "callout": {
      const icon = b.callout.icon?.type === "emoji" ? b.callout.icon.emoji : null;
      return (
        <aside className="n-callout">
          {icon ? <span className="n-callout-icon" aria-hidden>{icon}</span> : null}
          <div>
            <RichText rich={b.callout.rich_text} ctx={ctx} />
            {kids}
          </div>
        </aside>
      );
    }
    case "to_do":
      return (
        <div className="n-todo">
          <input type="checkbox" checked={b.to_do.checked} readOnly disabled aria-label={b.to_do.checked ? "완료" : "미완료"} />
          <span className={b.to_do.checked ? "done" : undefined}>
            <RichText rich={b.to_do.rich_text} ctx={ctx} />
          </span>
          {kids}
        </div>
      );
    case "toggle":
      return (
        <details className="n-toggle">
          <summary>
            <RichText rich={b.toggle.rich_text} ctx={ctx} />
          </summary>
          {kids}
        </details>
      );
    case "divider":
      return <hr className="n-divider" />;
    case "code":
      return <Code code={plainText(b.code.rich_text)} language={b.code.language} caption={plainText(b.code.caption) || undefined} />;
    case "equation":
      return <TeX expression={b.equation.expression} block />;
    case "image": {
      const src = fileUrl(b.id, b.image, b.last_edited_time);
      const alt = plainText(b.image.caption);
      return (
        <figure className="n-image">
          {/* Vercel Hobby의 이미지 최적화 한도를 쓰지 않으려고 일반 img를 쓴다. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={src} alt={alt} loading="lazy" decoding="async" />
          <Caption rich={b.image.caption} ctx={ctx} />
        </figure>
      );
    }
    case "video": {
      const url = b.video.type === "external" ? b.video.external.url : null;
      const embed = url ? youtubeEmbed(url) : null;
      if (embed) {
        return (
          <figure className="n-video">
            <iframe src={embed} title={plainText(b.video.caption) || "동영상"} loading="lazy" allowFullScreen />
            <Caption rich={b.video.caption} ctx={ctx} />
          </figure>
        );
      }
      return (
        <figure className="n-video">
          <video src={fileUrl(b.id, b.video, b.last_edited_time)} controls preload="metadata" />
          <Caption rich={b.video.caption} ctx={ctx} />
        </figure>
      );
    }
    case "pdf":
    case "file": {
      const data = b.type === "pdf" ? b.pdf : b.file;
      const name = b.type === "file" ? b.file.name : "";
      return <LinkCard url={fileUrl(b.id, data, b.last_edited_time)} caption={data.caption.length ? data.caption : [{ plain_text: name || "첨부 파일" } as RichTextItemResponse]} ctx={ctx} />;
    }
    case "bookmark":
      return <LinkCard url={b.bookmark.url} caption={b.bookmark.caption} ctx={ctx} />;
    case "link_preview":
      return <LinkCard url={b.link_preview.url} ctx={ctx} />;
    case "embed": {
      const embed = youtubeEmbed(b.embed.url);
      if (embed) {
        return (
          <figure className="n-video">
            <iframe src={embed} title={plainText(b.embed.caption) || "동영상"} loading="lazy" allowFullScreen />
          </figure>
        );
      }
      return <LinkCard url={b.embed.url} caption={b.embed.caption} ctx={ctx} />;
    }
    case "link_to_page": {
      const id = b.link_to_page.type === "page_id" ? b.link_to_page.page_id : null;
      const href = id ? pageHref(id, ctx) : null;
      return href ? <LinkCard url={href} ctx={ctx} /> : null;
    }
    case "table":
      return <Table block={b} ctx={ctx} />;
    case "column_list": {
      const cols = (b.children ?? []).filter((c): c is Extract<NBlock, { type: "column" }> => c.type === "column");
      const template = cols.map((c) => `${c.column.width_ratio ?? 1}fr`).join(" ");
      return (
        <div className="n-columns" style={{ ["--cols" as string]: template }}>
          {cols.map((c) => (
            <div key={c.id} className="n-column">
              {c.children ? <Blocks blocks={c.children} ctx={ctx} /> : null}
            </div>
          ))}
        </div>
      );
    }
    case "synced_block":
      return kids;
    case "table_of_contents":
    case "breadcrumb":
    case "child_page":
    case "child_database":
      return null;
    default:
      if (process.env.NODE_ENV === "development") {
        return <p className="n-unsupported">지원하지 않는 블록: {b.type}</p>;
      }
      return null;
  }
}
