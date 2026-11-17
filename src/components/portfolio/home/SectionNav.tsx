"use client";

import { useEffect, useState } from "react";

export type NavSection = { id: string; label: string };

/** 왼쪽 목차. 화면 가운데를 지나는 섹션을 활성으로 표시한다. */
export function SectionNav({ sections }: { sections: NavSection[] }) {
  const [active, setActive] = useState(sections[0]?.id);

  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) if (e.isIntersecting) setActive(e.target.id);
      },
      { rootMargin: "-40% 0px -55% 0px" },
    );
    for (const s of sections) {
      const el = document.getElementById(s.id);
      if (el) io.observe(el);
    }
    return () => io.disconnect();
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
