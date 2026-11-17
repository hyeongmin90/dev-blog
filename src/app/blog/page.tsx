import type { Metadata } from "next";
import { BlogList, type ListItem } from "@/components/blog/BlogList";
import { SiteHeader } from "@/components/SiteHeader";
import { getAllPosts, isBlogPost } from "@/lib/notion/posts";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: site.blog.title,
  description: site.blog.description,
};

export default async function BlogPage() {
  const posts = (await getAllPosts()).filter(isBlogPost);
  const items: ListItem[] = posts.map(({ slug, title, summary, date, category, tags }) => ({
    slug,
    title,
    summary,
    date,
    category,
    tags,
  }));

  // 글이 많은 카테고리부터 탭에 놓는다.
  const counts = new Map<string, number>();
  for (const p of posts) if (p.category) counts.set(p.category, (counts.get(p.category) ?? 0) + 1);
  const categories = [...counts.entries()].sort((a, b) => b[1] - a[1]).map(([c]) => c);

  return (
    <>
      <SiteHeader world="blog" />
      <main className="world-blog">
        <div className="container">
          <header className="blog-mast">
            <h1>{site.blog.title}</h1>
            <p>
              {site.blog.description} 글 {posts.length}편
            </p>
          </header>
          <BlogList items={items} categories={categories} />
        </div>
      </main>
    </>
  );
}
