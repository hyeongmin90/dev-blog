import Link from "next/link";
import { Blocks } from "@/components/notion/Blocks";
import type { RenderCtx } from "@/components/notion/context";
import type { NBlock } from "@/lib/notion/blocks";
import type { Post } from "@/lib/notion/posts";
import { splitProjectTitle } from "./ProjectRows";

/** 프로젝트 상세(케이스 스터디). 본문의 문제/해결/결과 목록과 수치는 렌더러가 포트폴리오 스타일로 바꾼다. */
export function ProjectArticle({ post, blocks, ctx }: { post: Post; blocks: NBlock[]; ctx: RenderCtx }) {
  const { name, tagline } = splitProjectTitle(post.title);
  return (
    <article className="container project-article">
      <Link href="/" className="pf-back">
        포트폴리오로 돌아가기
      </Link>
      <header className="project-head">
        <h1>{name}</h1>
        {tagline ? <p className="project-head-tagline">{tagline}</p> : null}
        {post.tags.length ? (
          <p className="project-tags">
            {post.tags.map((t) => (
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
