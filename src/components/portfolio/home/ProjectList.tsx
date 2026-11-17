import Link from "next/link";
import { splitProjectTitle, type Post } from "@/lib/notion/posts";
import { MetricDelta } from "../MetricDelta";

export function ProjectList({ projects }: { projects: Post[] }) {
  if (projects.length === 0) {
    return <p className="pf-empty">노션 Developer Log에서 프로젝트 행의 order를 채우면 여기에 나타납니다.</p>;
  }
  return (
    <div className="proj-list">
      {projects.map((p) => {
        const { name, tagline } = splitProjectTitle(p.title);
        return (
          <Link key={p.id} href={`/${p.slug}`} className="proj">
            <div className="proj-name">
              {name}
              {tagline ? <span>{tagline}</span> : null}
            </div>
            <div className="proj-meta">
              {p.period ? <b>{p.period}</b> : null}
              {p.team}
            </div>
            {p.metrics.length ? (
              <div className="proj-metrics">
                {p.metrics.map((m) => (
                  <MetricDelta key={m.label} metric={m} />
                ))}
              </div>
            ) : null}
            {p.stack.length ? (
              <div className="proj-stack">
                {p.stack.map((s) => (
                  <span key={s}>{s}</span>
                ))}
              </div>
            ) : null}
            <span className="proj-go">케이스 스터디 보기</span>
          </Link>
        );
      })}
    </div>
  );
}
