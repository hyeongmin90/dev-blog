import type { Metadata } from "next";
import { BlogList, type ListItem } from "@/components/blog/BlogList";
import { SiteHeader } from "@/components/SiteHeader";
import { formatDate } from "@/lib/format";
import { getExcerpt } from "@/lib/notion/blocks";
import { getBlogCover } from "@/lib/notion/blog-cover";
import { getAllPosts, isBlogPost } from "@/lib/notion/posts";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: { absolute: site.blog.tabTitle },
  description: site.blog.description,
};

export default async function BlogPage() {
  const posts = (await getAllPosts()).filter(isBlogPost);
  const [cover, excerpts] = await Promise.all([getBlogCover(), Promise.all(posts.map((p) => getExcerpt(p.id)))]);

  const items: ListItem[] = posts.map((p, i) => ({
    slug: p.slug,
    title: p.title,
    excerpt: excerpts[i] || p.summary,
    date: p.date,
    category: p.category,
    tags: p.tags,
    thumbnail: p.thumbnail,
  }));

  // 글이 많은 카테고리부터
  const counts = new Map<string, number>();
  for (const p of posts) if (p.category) counts.set(p.category, (counts.get(p.category) ?? 0) + 1);
  const categories = [...counts.entries()].sort((a, b) => b[1] - a[1]).map(([name, count]) => ({ name, count }));

  return (
    <>
      <SiteHeader world="blog" />
      <main className="world-blog">
        <div className="blog-wrap">
          {cover ? (
            <figure className="blog-banner">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={cover} alt="" />
            </figure>
          ) : null}
          <BlogList
            items={items}
            categories={categories}
            mast={
              <div>
                <h1>{site.blog.title}</h1>
                <p>{site.blog.description}</p>
                <p className="blog-stat">
                  <span>
                    글 <b>{posts.length}</b>편
                  </span>
                  {posts[0]?.date ? (
                    <span>
                      최근 글 <b>{formatDate(posts[0].date)}</b>
                    </span>
                  ) : null}
                </p>
              </div>
            }
          />
        </div>
      </main>
    </>
  );
}
