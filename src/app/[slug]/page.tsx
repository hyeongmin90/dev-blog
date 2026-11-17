import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { BlogArticle } from "@/components/blog/BlogArticle";
import { ProjectArticle } from "@/components/portfolio/ProjectArticle";
import { SiteHeader } from "@/components/SiteHeader";
import { getBlocks } from "@/lib/notion/blocks";
import { getAllPosts, isBlogPost, worldOf } from "@/lib/notion/posts";
import { makeCtx } from "@/lib/render-ctx";

// 미리 생성하지 않은 slug도 완성된 결과를 기다렸다가 응답한다.
// 앱 셸을 먼저 보내면 없는 글이 404 대신 200(소프트 404)으로 나가기 때문이다.
export const ensureStatic = "navigation";

export async function generateStaticParams() {
  const posts = await getAllPosts();
  return posts.filter((p) => p.slug !== "portfolio").map((p) => ({ slug: p.slug }));
}

async function findPost(params: PageProps<"/[slug]">["params"]) {
  const { slug } = await params;
  const decoded = decodeURIComponent(slug);
  if (decoded === "portfolio") return null;
  const posts = await getAllPosts();
  const post = posts.find((p) => p.slug === decoded) ?? null;
  return post ? { post, posts } : null;
}

export async function generateMetadata({ params }: PageProps<"/[slug]">): Promise<Metadata> {
  const found = await findPost(params);
  if (!found) return {};
  const { post } = found;
  return {
    title: post.title,
    description: post.summary || undefined,
    openGraph: { title: post.title, description: post.summary || undefined, type: "article" },
  };
}

export default async function PostPage({ params }: PageProps<"/[slug]">) {
  const found = await findPost(params);
  if (!found) notFound();
  const { post, posts } = found;
  const blocks = await getBlocks(post.id);
  const world = worldOf(post);
  const ctx = makeCtx(world, posts, blocks);

  if (world === "portfolio") {
    return (
      <>
        <SiteHeader world="portfolio" />
        <main className="world-portfolio">
          <ProjectArticle post={post} blocks={blocks} ctx={ctx} />
        </main>
      </>
    );
  }

  // 이전/다음 글은 목록에 나오는 블로그 글 사이에서만 고른다.
  const list = posts.filter(isBlogPost);
  const i = list.findIndex((p) => p.id === post.id);
  const newer = i > 0 ? list[i - 1] : null;
  const older = i >= 0 && i < list.length - 1 ? list[i + 1] : null;

  return (
    <>
      <SiteHeader world="blog" />
      <main className="world-blog">
        <BlogArticle post={post} blocks={blocks} ctx={ctx} newer={newer} older={older} />
      </main>
    </>
  );
}
