"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { TocItem } from "@/lib/notion/blocks";

type Group = { head: TocItem; children: TocItem[] };

/** h2마다 그 아래 h3를 묶는다. 첫 h2보다 앞에 있는 h3는 각자 하나의 묶음이 된다. */
function group(items: TocItem[]): Group[] {
  const groups: Group[] = [];
  for (const it of items) {
    if (it.level === 2 || groups.length === 0) groups.push({ head: it, children: [] });
    else groups[groups.length - 1].children.push(it);
  }
  return groups;
}

// 헤더(56px) 아래 이 정도 지점을 지난 마지막 제목을 "읽는 중"으로 본다.
const READ_LINE = 120;

/**
 * 글 목차. 지금 읽는 h2 아래의 h3만 펼쳐서 목차가 길어지지 않게 하고,
 * 항목은 줄 전체가 클릭 영역이다.
 */
export function Toc({ items }: { items: TocItem[] }) {
  const groups = useMemo(() => group(items), [items]);
  const [active, setActive] = useState(items[0]?.id);
  const nav = useRef<HTMLElement>(null);

  useEffect(() => {
    const heads = items.map((it) => document.getElementById(it.id)).filter((el): el is HTMLElement => el !== null);
    let frame = 0;
    const update = () => {
      frame = 0;
      let current = heads[0]?.id;
      for (const el of heads) {
        if (el.getBoundingClientRect().top <= READ_LINE) current = el.id;
        else break;
      }
      setActive(current);
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      cancelAnimationFrame(frame);
    };
  }, [items]);

  // 목차가 화면보다 길면, 현재 항목이 목차 안에서 보이도록 목차만 스크롤한다(페이지는 건드리지 않음).
  useEffect(() => {
    const box = nav.current;
    const link = box?.querySelector<HTMLElement>(`[data-id="${active}"]`);
    if (!box || !link) return;
    const top = link.offsetTop - box.clientHeight / 3;
    box.scrollTo({ top: Math.max(0, top), behavior: "smooth" });
  }, [active]);

  const openGroup = groups.find((g) => g.head.id === active || g.children.some((c) => c.id === active));

  return (
    <nav className="toc" aria-label="목차" ref={nav}>
      <p className="toc-title">목차</p>
      <ol>
        {groups.map((g) => (
          <li key={g.head.id}>
            <a href={`#${g.head.id}`} data-id={g.head.id} aria-current={active === g.head.id ? "location" : undefined}>
              {g.head.text}
            </a>
            {g.children.length && g === openGroup ? (
              <ol>
                {g.children.map((c) => (
                  <li key={c.id}>
                    <a href={`#${c.id}`} data-id={c.id} className="toc-sub" aria-current={active === c.id ? "location" : undefined}>
                      {c.text}
                    </a>
                  </li>
                ))}
              </ol>
            ) : null}
          </li>
        ))}
      </ol>
    </nav>
  );
}
