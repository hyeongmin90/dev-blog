import Link from "next/link";
import { SiteHeader } from "@/components/SiteHeader";
import { site } from "@/lib/site";

export default function NotFound() {
  return (
    <>
      <SiteHeader world="blog" />
      <main className="world-blog">
        <div className="container not-found">
          <h1>페이지를 찾을 수 없습니다</h1>
          <p>주소가 바뀌었거나 비공개로 전환된 글일 수 있습니다.</p>
          <p>
            <Link href={site.routes.blog}>블로그 글 목록 보기</Link>
            <Link href={site.routes.portfolio}>포트폴리오 보기</Link>
          </p>
        </div>
      </main>
    </>
  );
}
