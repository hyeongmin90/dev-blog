import type { RichTextItemResponse } from "@notionhq/client";
import Link from "next/link";
import type { ReactNode } from "react";
import { Math as TeX } from "./Math";
import { DELTA } from "@/lib/delta";
import { isExternal, pageHref, resolveHref, type RenderCtx } from "./context";

function withDeltas(text: string, key: string): ReactNode {
  const out: ReactNode[] = [];
  let last = 0;
  for (const m of text.matchAll(DELTA)) {
    const i = m.index ?? 0;
    if (i > last) out.push(text.slice(last, i));
    out.push(
      <span className="delta" key={`${key}-${i}`}>
        <span className="delta-before">{m[1]}</span>
        {m[2].includes("에서") ? m[2] : " → "}
        <strong className="delta-after">{m[3]}</strong>
        {m[4] ?? ""}
      </span>,
    );
    last = i + m[0].length;
  }
  if (last === 0) return text;
  if (last < text.length) out.push(text.slice(last));
  return out;
}

function colorClass(color: string): string | undefined {
  if (color === "default") return undefined;
  return color.endsWith("_background") ? `nc-bg-${color.replace("_background", "")}` : `nc-${color}`;
}

function Item({ item, ctx, k }: { item: RichTextItemResponse; ctx: RenderCtx; k: string }) {
  const a = item.annotations;
  let node: ReactNode;
  let href: string | null = item.href ? resolveHref(item.href, ctx) : null;

  if (item.type === "equation") {
    node = <TeX expression={item.equation.expression} />;
  } else if (item.type === "mention" && item.mention.type === "page") {
    href = pageHref(item.mention.page.id, ctx) ?? href;
    node = item.plain_text;
  } else if (item.type === "mention" && item.mention.type === "date") {
    node = item.plain_text.replace(/^@/, "");
  } else {
    node = ctx.world === "portfolio" ? withDeltas(item.plain_text, k) : item.plain_text;
  }

  if (a.code) node = <code>{node}</code>;
  if (a.bold) node = <strong>{node}</strong>;
  if (a.italic) node = <em>{node}</em>;
  if (a.strikethrough) node = <s>{node}</s>;
  if (a.underline) node = <u>{node}</u>;
  const cls = colorClass(a.color);
  if (cls) node = <span className={cls}>{node}</span>;

  if (href) {
    node = isExternal(href) ? (
      <a href={href} target="_blank" rel="noreferrer">
        {node}
      </a>
    ) : (
      <Link href={href}>{node}</Link>
    );
  }
  return <>{node}</>;
}

export function RichText({ rich, ctx }: { rich: RichTextItemResponse[]; ctx: RenderCtx }) {
  return (
    <>
      {rich.map((item, i) => (
        <Item key={i} k={String(i)} item={item} ctx={ctx} />
      ))}
    </>
  );
}

/** 앞에서부터 n글자를 잘라낸 rich text. "문제:" 같은 라벨을 떼어낼 때 쓴다. */
export function dropChars(rich: RichTextItemResponse[], n: number): RichTextItemResponse[] {
  const out: RichTextItemResponse[] = [];
  let left = n;
  for (const item of rich) {
    if (left <= 0) {
      out.push(item);
      continue;
    }
    const len = item.plain_text.length;
    if (len <= left) {
      left -= len;
      continue;
    }
    const rest = item.plain_text.slice(left);
    left = 0;
    if (item.type === "text") {
      out.push({ ...item, plain_text: rest, text: { ...item.text, content: rest } });
    } else {
      out.push({ ...item, plain_text: rest });
    }
  }
  // 라벨 뒤 공백 정리
  if (out[0]) out[0] = { ...out[0], plain_text: out[0].plain_text.replace(/^\s+/, "") };
  return out;
}
