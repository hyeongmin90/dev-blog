import { notFound } from "next/navigation";
import { SiteHeader } from "@/components/SiteHeader";
import { PortfolioDocument } from "@/components/portfolio/PortfolioDocument";
import { getBlocks } from "@/lib/notion/blocks";
import { getAllPosts } from "@/lib/notion/posts";
import { makeCtx } from "@/lib/render-ctx";
import { site } from "@/lib/site";

// 포트폴리오 홈: 노션 slug `portfolio` 페이지를 문서형 이력으로 렌더링한다.
export default async function PortfolioHome() {
  const posts = await getAllPosts();
  const page = posts.find((p) => p.slug === "portfolio");
  if (!page) notFound();
  const blocks = await getBlocks(page.id);

  return (
    <>
      <SiteHeader world="portfolio" />
      <main className="world-portfolio">
        <div className="container">
          <h1 className="pf-name">{site.name}</h1>
          <PortfolioDocument blocks={blocks} ctx={makeCtx("portfolio", posts, blocks)} />
        </div>
      </main>
    </>
  );
}
