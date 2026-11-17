import Link from "next/link";
import { getAllPosts, isBlogPost, projectsForHome, splitProjectTitle, type World } from "@/lib/notion/posts";
import { site } from "@/lib/site";
import { CommandPalette, type PaletteItem } from "./CommandPalette";
import { ThemeToggle } from "./ThemeToggle";

export const PORTFOLIO_SECTIONS = [
  { id: "work", label: "프로젝트" },
  { id: "career", label: "경력과 활동" },
  { id: "skills", label: "기술" },
  { id: "contact", label: "연락" },
];

async function paletteItems(): Promise<PaletteItem[]> {
  const posts = await getAllPosts();
  return [
    ...projectsForHome(posts).map((p) => {
      const { name, tagline } = splitProjectTitle(p.title);
      return { title: tagline ? `${name} ${tagline}` : name, kind: "프로젝트", href: `/${p.slug}` };
    }),
    ...PORTFOLIO_SECTIONS.map((s) => ({ title: s.label, kind: "포트폴리오", href: `/#${s.id}` })),
    { title: site.blog.title, kind: "블로그", href: "/blog" },
    ...posts.filter(isBlogPost).map((p) => ({ title: p.title, kind: "글", href: `/${p.slug}` })),
  ];
}

/** 두 세계(포트폴리오, 블로그)를 잇는 유일한 공통 요소. */
export async function SiteHeader({ world }: { world: World }) {
  const items = await paletteItems();
  return (
    <header className="site-header" data-world={world}>
      <div className="site-header-inner">
        <Link href="/" className="site-name" lang="en">
          {site.nameEn}
        </Link>
        <nav aria-label="주 메뉴">
          <Link href="/" aria-current={world === "portfolio" ? "page" : undefined}>
            포트폴리오
          </Link>
          <Link href="/blog" aria-current={world === "blog" ? "page" : undefined}>
            블로그
          </Link>
          <CommandPalette items={items} />
          <ThemeToggle />
        </nav>
      </div>
    </header>
  );
}
