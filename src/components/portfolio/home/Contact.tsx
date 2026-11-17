"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { site } from "@/lib/site";

const LABEL = { idle: "주소 복사", done: "복사됨", fail: "복사하지 못했습니다" } as const;

export function Contact() {
  const [state, setState] = useState<keyof typeof LABEL>("idle");
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  useEffect(() => () => clearTimeout(timer.current), []);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(site.email);
      setState("done");
    } catch {
      setState("fail");
    }
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setState("idle"), 1600);
  };

  return (
    <div className="contact">
      <a className="contact-mail" href={`mailto:${site.email}`}>
        {site.email}
      </a>
      <button type="button" className="contact-copy" onClick={copy} aria-live="polite">
        {LABEL[state]}
      </button>
      <a href={site.github} target="_blank" rel="noreferrer">
        GitHub
      </a>
      <Link href={site.routes.blog}>블로그</Link>
    </div>
  );
}
