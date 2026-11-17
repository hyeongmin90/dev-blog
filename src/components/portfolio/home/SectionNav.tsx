"use client";

import { useEffect, useState } from "react";

export type NavSection = { id: string; label: string };

/**
 * 왼쪽 목차. 화면 가운데를 지나는 섹션을 활성으로 표시한다.
 * 마지막 섹션(연락)은 짧아서 가운데까지 올라오지 못하므로, 페이지 끝에 닿으면 마지막 섹션을 활성으로 본다.
 */
export function SectionNav({ sections }: { sections: NavSection[] }) {
  const [active, setActive] = useState(sections[0]?.id);

  useEffect(() => {
    const last = sections[sections.length - 1]?.id;
    const atBottom = () => window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4;

    const io = new IntersectionObserver(
      (entries) => {
        if (atBottom()) return;
        for (const e of entries) if (e.isIntersecting) setActive(e.target.id);
      },
      { rootMargin: "-40% 0px -55% 0px" },
    );
    for (const s of sections) {
      const el = document.getElementById(s.id);
      if (el) io.observe(el);
    }

    let frame = 0;
    const onScroll = () => {
      if (frame) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        if (atBottom() && last) setActive(last);
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      io.disconnect();
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(frame);
    };
  }, [sections]);

  return (
    <nav className="pf-toc" aria-label="포트폴리오 섹션">
      {sections.map((s) => (
        <a key={s.id} href={`#${s.id}`} className={active === s.id ? "on" : undefined} aria-current={active === s.id ? "true" : undefined}>
          {s.label}
        </a>
      ))}
    </nav>
  );
}
