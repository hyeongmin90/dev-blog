"use client";

import { useEffect, useRef, useState } from "react";

export type NavSection = { id: string; label: string };

// 평소에는 화면 위에서 30% 지점을 지난 마지막 섹션이 활성이다.
const BASE_LINE = 0.3;

/**
 * 판정선 위치(문서 좌표). 페이지 끝까지 남은 거리가 화면의 (1 - BASE_LINE)보다 짧아지면
 * 판정선을 화면 아래쪽으로 미끄러뜨린다. 그래서 끝부분의 짧은 섹션(기술, 연락)도
 * 건너뛰지 않고 순서대로 활성이 되고, 맨 끝에서는 마지막 섹션이 활성이 된다.
 */
function readLine(): number {
  const vh = window.innerHeight;
  const maxScroll = document.documentElement.scrollHeight - vh;
  const remaining = Math.max(0, maxScroll - window.scrollY);
  const slide = vh * (1 - BASE_LINE);
  const t = remaining >= slide ? 0 : 1 - remaining / slide;
  return window.scrollY + vh * (BASE_LINE + (1 - BASE_LINE) * t) - 1;
}

/** 왼쪽 목차. 읽는 위치를 따라가고, 누른 항목은 직접 스크롤하기 전까지 유지한다. */
export function SectionNav({ sections }: { sections: NavSection[] }) {
  const [active, setActive] = useState(sections[0]?.id);
  // 목차를 눌러 이동한 경우, 이동 중이나 끝에 닿아 더 못 내려가도 누른 항목을 유지한다.
  const pinned = useRef<string | null>(null);

  useEffect(() => {
    let frame = 0;
    const update = () => {
      frame = 0;
      if (pinned.current) return;
      const line = readLine();
      let current = sections[0]?.id;
      for (const s of sections) {
        const el = document.getElementById(s.id);
        if (el && el.getBoundingClientRect().top + window.scrollY <= line) current = s.id;
      }
      setActive(current);
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    // 사용자가 직접 스크롤을 시작하면 고정을 푼다.
    const unpin = () => {
      if (pinned.current) {
        pinned.current = null;
        onScroll();
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (["ArrowUp", "ArrowDown", "PageUp", "PageDown", "Home", "End", " "].includes(e.key)) unpin();
    };

    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    window.addEventListener("wheel", unpin, { passive: true });
    window.addEventListener("touchstart", unpin, { passive: true });
    window.addEventListener("keydown", onKey);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      window.removeEventListener("wheel", unpin);
      window.removeEventListener("touchstart", unpin);
      window.removeEventListener("keydown", onKey);
    };
  }, [sections]);

  return (
    <nav className="pf-toc" aria-label="포트폴리오 섹션">
      {sections.map((s) => (
        <a
          key={s.id}
          href={`#${s.id}`}
          className={active === s.id ? "on" : undefined}
          aria-current={active === s.id ? "true" : undefined}
          onClick={() => {
            pinned.current = s.id;
            setActive(s.id);
          }}
        >
          {s.label}
        </a>
      ))}
    </nav>
  );
}
