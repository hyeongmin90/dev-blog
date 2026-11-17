import Link from "next/link";
import type { World } from "@/lib/notion/posts";
import { site } from "@/lib/site";
import { ThemeToggle } from "./ThemeToggle";

/** 두 세계(포트폴리오, 블로그)를 잇는 유일한 공통 요소. */
export function SiteHeader({ world }: { world: World }) {
  return (
    <header className="site-header">
      <div className="site-header-inner">
        <Link href="/" className="site-name">
          {site.name}
        </Link>
        <nav aria-label="주 메뉴">
          <Link href="/" aria-current={world === "portfolio" ? "page" : undefined}>
            포트폴리오
          </Link>
          <Link href="/blog" aria-current={world === "blog" ? "page" : undefined}>
            블로그
          </Link>
          <ThemeToggle />
        </nav>
      </div>
    </header>
  );
}
