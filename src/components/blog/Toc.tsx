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

/**
 * "읽는 중" 기준선(화면 위에서부터의 거리). 평소엔 화면 가운데이고,
 * 글 끝에 가까워지면 화면 아래로 내려가서 끝까지 스크롤하면 화면에 보이는
 * 마지막 제목까지 잡힌다. 그래야 짧은 마지막 섹션들도 하이라이트된다.
 */
function readLine(): number {
  const vh = window.innerHeight;
  const remaining = document.documentElement.scrollHeight - (window.scrollY + vh);
  return vh / 2 + Math.max(0, vh / 2 - remaining);
}

/**
 * 글 목차. 지금 읽는 h2 아래의 h3만 펼쳐서 목차가 길어지지 않게 하고,
 * 항목은 줄 전체가 클릭 영역이다.
 */
export function Toc({ items }: { items: TocItem[] }) {
  const groups = useMemo(() => group(items), [items]);
  const [active, setActive] = useState(items[0]?.id);
  const nav = useRef<HTMLElement>(null);
  // 목차를 눌러 이동하는 동안에는 누른 항목을 그대로 유지한다.
  const pinned = useRef(false);
  const release = useRef(0);

  useEffect(() => {
    const heads = items.map((it) => document.getElementById(it.id)).filter((el): el is HTMLElement => el !== null);
    let frame = 0;
    const update = () => {
      frame = 0;
      const line = readLine();
      let current = heads[0]?.id;
      for (const el of heads) {
        if (el.getBoundingClientRect().top <= line) current = el.id;
        else break;
      }
      setActive(current);
    };
    const onScroll = () => {
      if (pinned.current) {
        // 이동 스크롤이 멈추면 고정을 푼다. 다음 스크롤부터 다시 위치로 계산한다.
        clearTimeout(release.current);
        release.current = window.setTimeout(() => (pinned.current = false), 150);
        return;
      }
      if (!frame) frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      cancelAnimationFrame(frame);
      clearTimeout(release.current);
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

  const pick = (id: string) => {
    pinned.current = true;
    clearTimeout(release.current);
    // 스크롤이 일어나지 않는 경우(이미 글 끝)에도 고정이 풀리도록 한다.
    release.current = window.setTimeout(() => (pinned.current = false), 150);
    setActive(id);
  };

  const openGroup = groups.find((g) => g.head.id === active || g.children.some((c) => c.id === active));

  return (
    <nav className="toc" aria-label="목차" ref={nav}>
      <p className="toc-title">목차</p>
      <ol>
        {groups.map((g) => (
          <li key={g.head.id}>
            <a
              href={`#${g.head.id}`}
              data-id={g.head.id}
              aria-current={active === g.head.id ? "location" : undefined}
              onClick={() => pick(g.head.id)}
            >
              {g.head.text}
            </a>
            {g.children.length && g === openGroup ? (
              <ol>
                {g.children.map((c) => (
                  <li key={c.id}>
                    <a
                      href={`#${c.id}`}
                      data-id={c.id}
                      className="toc-sub"
                      aria-current={active === c.id ? "location" : undefined}
                      onClick={() => pick(c.id)}
                    >
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
