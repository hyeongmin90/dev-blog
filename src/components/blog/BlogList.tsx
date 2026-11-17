"use client";

import Link from "next/link";
import { useDeferredValue, useMemo, useState } from "react";
import { formatDate } from "@/lib/format";

export type ListItem = {
  slug: string;
  title: string;
  summary: string;
  date: string | null;
  category: string | null;
  tags: string[];
};

const ALL = "전체";

function matches(item: ListItem, q: string): boolean {
  if (!q) return true;
  const hay = [item.title, item.summary, item.category ?? "", ...item.tags].join(" ").toLowerCase();
  return q
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)
    .every((word) => hay.includes(word));
}

export function BlogList({ items, categories }: { items: ListItem[]; categories: string[] }) {
  const [category, setCategory] = useState(ALL);
  const [tag, setTag] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const q = useDeferredValue(query.trim());

  const shown = useMemo(
    () =>
      items.filter(
        (it) => (category === ALL || it.category === category) && (!tag || it.tags.includes(tag)) && matches(it, q),
      ),
    [items, category, tag, q],
  );

  return (
    <>
      <div className="blog-controls">
        <div className="blog-tabs" role="tablist" aria-label="카테고리">
          {[ALL, ...categories].map((c) => (
            <button key={c} type="button" role="tab" aria-selected={category === c} onClick={() => setCategory(c)}>
              {c}
            </button>
          ))}
        </div>
        <label className="blog-search">
          <span className="sr-only">글 검색</span>
          <input type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="제목, 요약, 태그로 검색" />
        </label>
      </div>

      {tag ? (
        <p className="blog-tagfilter">
          태그 <strong>{tag}</strong>로 거른 글
          <button type="button" onClick={() => setTag(null)}>
            태그 필터 지우기
          </button>
        </p>
      ) : null}

      {shown.length === 0 ? (
        <p className="blog-empty">
          조건에 맞는 글이 없습니다. 검색어를 줄이거나 카테고리를 전체로 바꿔보세요.
        </p>
      ) : (
        <ul className="post-list">
          {shown.map((it) => (
            <li key={it.slug} className="post-item">
              <div className="post-meta">
                {it.category ? <span className="post-cat">{it.category}</span> : null}
                <time dateTime={it.date ?? undefined}>{formatDate(it.date)}</time>
              </div>
              <h2>
                <Link href={`/${it.slug}`}>{it.title}</Link>
              </h2>
              {it.summary ? <p>{it.summary}</p> : null}
              {it.tags.length ? (
                <div className="post-tags">
                  {it.tags.map((t) => (
                    <button key={t} type="button" aria-pressed={tag === t} onClick={() => setTag(tag === t ? null : t)}>
                      #{t}
                    </button>
                  ))}
                </div>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
