"use client";

import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";

export type PaletteItem = { title: string; kind: string; href: string };

function matches(item: PaletteItem, q: string): boolean {
  const hay = `${item.title} ${item.kind}`.toLowerCase();
  return q
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)
    .every((w) => hay.includes(w));
}

/** ⌘K / Ctrl+K 빠른 이동. 모달 dialog라 포커스 가두기와 Esc 닫기는 브라우저가 처리한다. */
export function CommandPalette({ items }: { items: PaletteItem[] }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const input = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const [sel, setSel] = useState(0);
  const router = useRouter();
  const pathname = usePathname();
  const listId = useId();

  const shown = useMemo(() => items.filter((it) => matches(it, query.trim())), [items, query]);

  const open = useCallback(() => {
    setQuery("");
    setSel(0);
    dialog.current?.showModal();
    input.current?.focus();
  }, []);
  const close = useCallback(() => dialog.current?.close(), []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        if (dialog.current?.open) close();
        else open();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, close]);

  const go = (item: PaletteItem) => {
    close();
    const [path, hash] = item.href.split("#");
    if (hash && (path || "/") === pathname) {
      document.getElementById(hash)?.scrollIntoView({ behavior: "smooth" });
      history.replaceState(null, "", `#${hash}`);
    } else {
      router.push(item.href);
    }
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSel((s) => Math.min(s + 1, shown.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSel((s) => Math.max(s - 1, 0));
    } else if (e.key === "Enter" && shown[sel]) {
      e.preventDefault();
      go(shown[sel]);
    }
  };

  return (
    <>
      <button type="button" className="kbd-btn" onClick={open} aria-label="빠른 이동 열기" aria-keyshortcuts="Meta+K Control+K">
        <kbd>⌘K</kbd>
        <span>빠른 이동</span>
      </button>
      <dialog ref={dialog} className="palette" aria-label="빠른 이동" onClick={(e) => e.target === dialog.current && close()}>
        <input
          ref={input}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setSel(0);
          }}
          onKeyDown={onKeyDown}
          placeholder="프로젝트, 섹션, 글 찾기"
          role="combobox"
          aria-expanded="true"
          aria-controls={listId}
          aria-activedescendant={shown[sel] ? `${listId}-${sel}` : undefined}
          autoComplete="off"
        />
        <ul id={listId} role="listbox">
          {shown.length === 0 ? (
            <li className="palette-empty">찾는 항목이 없습니다. 다른 단어로 검색해 보세요.</li>
          ) : (
            shown.map((it, i) => (
              <li
                key={it.href + it.title}
                id={`${listId}-${i}`}
                role="option"
                aria-selected={i === sel}
                onMouseEnter={() => setSel(i)}
                onClick={() => go(it)}
              >
                <span>{it.title}</span>
                <small>{it.kind}</small>
              </li>
            ))
          )}
        </ul>
      </dialog>
    </>
  );
}
