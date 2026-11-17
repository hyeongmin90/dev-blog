import Link from "next/link";
import { Blocks } from "@/components/notion/Blocks";
import type { RenderCtx } from "@/components/notion/context";
import type { NBlock } from "@/lib/notion/blocks";
import { splitProjectTitle, type Post } from "@/lib/notion/posts";
import { MetricDelta } from "./MetricDelta";

/** 프로젝트 상세(케이스 스터디). 머리말은 DB 속성으로, 본문은 노션 블록으로 그린다. */
export function ProjectArticle({ post, blocks, ctx }: { post: Post; blocks: NBlock[]; ctx: RenderCtx }) {
  const { name, tagline } = splitProjectTitle(post.title);
  return (
    <article className="container project-article">
      <Link href="/#work" className="pf-back">
        포트폴리오로 돌아가기
      </Link>
      <header className="project-head">
        <h1>{name}</h1>
        {tagline ? <p className="project-head-tagline">{tagline}</p> : null}
        {post.period || post.team ? (
          <p className="project-head-meta">
            {post.period ? <b>{post.period}</b> : null}
            {post.team ? <span>{post.team}</span> : null}
          </p>
        ) : null}
        {post.metrics.length ? (
          <div className="proj-metrics">
            {post.metrics.map((m) => (
              <MetricDelta key={m.label} metric={m} />
            ))}
          </div>
        ) : null}
        {(post.stack.length ? post.stack : post.tags).length ? (
          <p className="proj-stack">
            {(post.stack.length ? post.stack : post.tags).map((t) => (
              <span key={t}>{t}</span>
            ))}
          </p>
        ) : null}
      </header>
      <div className="prose prose-portfolio">
        <Blocks blocks={blocks} ctx={ctx} />
      </div>
    </article>
  );
}
