import Link from "next/link";
import { Blocks } from "@/components/notion/Blocks";
import type { RenderCtx } from "@/components/notion/context";
import { collectToc, type NBlock } from "@/lib/notion/blocks";
import type { Post } from "@/lib/notion/posts";
import { formatDate } from "@/lib/format";
import { Toc } from "./Toc";

type Props = { post: Post; blocks: NBlock[]; ctx: RenderCtx; newer: Post | null; older: Post | null };

export function BlogArticle({ post, blocks, ctx, newer, older }: Props) {
  const toc = collectToc(blocks);

  return (
    <div className={toc.length >= 3 ? "article-layout has-toc" : "article-layout"}>
      <article className="article">
        <header className="article-head">
          <div className="post-meta">
            {post.category ? <span className="post-cat">{post.category}</span> : null}
            {post.date ? <time dateTime={post.date}>{formatDate(post.date)}</time> : null}
            {post.tags.map((t) => (
              <span key={t} className="post-tag">
                #{t}
              </span>
            ))}
          </div>
          <h1>{post.title}</h1>
          {post.summary ? <p className="article-summary">{post.summary}</p> : null}
        </header>
        {post.thumbnail ? (
          <figure className="article-cover">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={post.thumbnail} alt="" />
          </figure>
        ) : null}
        <div className="prose">
          <Blocks blocks={blocks} ctx={ctx} />
        </div>

        {newer || older ? (
          <nav className="article-pager" aria-label="다른 글">
            {older ? (
              <Link href={`/${older.slug}`} className="pager-older">
                <span>이전 글</span>
                {older.title}
              </Link>
            ) : (
              <span />
            )}
            {newer ? (
              <Link href={`/${newer.slug}`} className="pager-newer">
                <span>다음 글</span>
                {newer.title}
              </Link>
            ) : null}
          </nav>
        ) : null}
      </article>

      {toc.length >= 3 ? <Toc items={toc} /> : null}
    </div>
  );
}
