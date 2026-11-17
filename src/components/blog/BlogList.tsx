"use client";

import Link from "next/link";
import { useDeferredValue, useMemo, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { COVER_VIEWBOX, categoryColor, categoryLabel, coverBars } from "@/lib/cover";
import { formatDate } from "@/lib/format";

export type ListItem = {
  slug: string;
  title: string;
  /** 본문 첫머리(없으면 요약) */
  excerpt: string;
  date: string | null;
  category: string | null;
  tags: string[];
  thumbnail: string | null;
};

type Category = { name: string; count: number };

const ALL = "전체";

function matches(item: ListItem, q: string): boolean {
  if (!q) return true;
  const hay = [item.title, item.excerpt, item.category ?? "", ...item.tags].join(" ").toLowerCase();
  return q
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)
    .every((word) => hay.includes(word));
}

function AutoCover({ slug }: { slug: string }) {
  return (
    <svg viewBox={`0 0 ${COVER_VIEWBOX.w} ${COVER_VIEWBOX.h}`} preserveAspectRatio="xMidYMid slice" aria-hidden>
      {coverBars(slug).map((b, i) => (
        <rect key={i} x={b.x} y={b.y} width={b.w} height={6} rx={3} className={b.hot ? "hot" : undefined} />
      ))}
    </svg>
  );
}

export function BlogList({ items, categories, mast }: { items: ListItem[]; categories: Category[]; mast: ReactNode }) {
  const [category, setCategory] = useState(ALL);
  const [tag, setTag] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const q = useDeferredValue(query.trim());
  const controls = useRef<HTMLDivElement>(null);
  const max = Math.max(1, ...categories.map((c) => c.count));

  const shown = useMemo(
    () =>
      items.filter(
        (it) => (category === ALL || it.category === category) && (!tag || it.tags.includes(tag)) && matches(it, q),
      ),
    [items, category, tag, q],
  );

  const pickFromMap = (name: string) => {
    setCategory((c) => (c === name ? ALL : name));
    controls.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <>
      <section className="blog-mast">
        {mast}
        <nav className="cat-map" aria-label="카테고리별 글 수">
          {categories.map((c) => (
            <button
              key={c.name}
              type="button"
              className="cat-row"
              aria-pressed={category === c.name}
              style={{ "--c": categoryColor(c.name) } as CSSProperties}
              onClick={() => pickFromMap(c.name)}
            >
              <span className="cat-name">{categoryLabel(c.name)}</span>
              <span className="cat-bar">
                <i style={{ width: `${(c.count / max) * 100}%` }} />
              </span>
              <span className="cat-n">{c.count}</span>
            </button>
          ))}
        </nav>
      </section>

      <div className="blog-controls" ref={controls}>
        <div className="blog-tabs" role="tablist" aria-label="카테고리">
          {[ALL, ...categories.map((c) => c.name)].map((c) => (
            <button key={c} type="button" role="tab" aria-selected={category === c} onClick={() => setCategory(c)}>
              {c === ALL ? c : categoryLabel(c)}
            </button>
          ))}
        </div>
        <label className="blog-search">
          <span className="sr-only">글 검색</span>
          <input type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="제목, 본문, 태그로 검색" />
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
        <p className="blog-empty">조건에 맞는 글이 없습니다. 검색어를 줄이거나 카테고리를 전체로 바꿔보세요.</p>
      ) : (
        <ul className="post-cards">
          {shown.map((it) => (
            <li key={it.slug} className="post-card" style={{ "--c": categoryColor(it.category) } as CSSProperties}>
              {/* 카드 전체를 누를 수 있게 제목 링크를 카드 위로 늘린다(태그 버튼은 그 위에 따로 놓임). */}
              <div className="post-cover">
                {it.thumbnail ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={it.thumbnail} alt="" loading="lazy" />
                ) : (
                  <AutoCover slug={it.slug} />
                )}
              </div>
              <div className="post-body">
                <div className="post-meta">
                  {it.category ? <span className="post-cat">{categoryLabel(it.category)}</span> : null}
                  <time dateTime={it.date ?? undefined}>{formatDate(it.date)}</time>
                </div>
                <h2>
                  <Link href={`/${it.slug}`} className="post-link">
                    {it.title}
                  </Link>
                </h2>
                {it.excerpt ? <p className="post-excerpt">{it.excerpt}</p> : null}
                {it.tags.length ? (
                  <div className="post-tags">
                    {it.tags.map((t) => (
                      <button key={t} type="button" aria-pressed={tag === t} onClick={() => setTag(tag === t ? null : t)}>
                        #{t}
                      </button>
                    ))}
                  </div>
                ) : null}
              </div>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
