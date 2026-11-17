import Link from "next/link";
import type { Post } from "@/lib/notion/posts";

/** "Vantage | AI 지식 큐레이션 플랫폼" → 이름과 한 줄 설명 */
export function splitProjectTitle(title: string): { name: string; tagline: string } {
  const [name, ...rest] = title.split(/\s*\|\s*/);
  return { name: name.trim(), tagline: rest.join(" | ").trim() };
}

export function ProjectRows({ projects }: { projects: Post[] }) {
  return (
    <ul className="projects">
      {projects.map((p) => {
        const { name, tagline } = splitProjectTitle(p.title);
        return (
          <li key={p.id}>
            <Link href={`/${p.slug}`} className="project">
              <span className="project-name">{name}</span>
              {tagline ? <span className="project-tagline">{tagline}</span> : null}
              {p.tags.length ? (
                <span className="project-tags">
                  {p.tags.map((t) => (
                    <span key={t}>{t}</span>
                  ))}
                </span>
              ) : null}
              {p.highlight ? <span className="project-highlight">{p.highlight}</span> : null}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
