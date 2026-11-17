import type { Metadata } from "next";
import { IBM_Plex_Mono, IBM_Plex_Sans_KR } from "next/font/google";
import "pretendard/dist/web/variable/pretendardvariable-dynamic-subset.css";
import "katex/dist/katex.min.css";
import "./globals.css";
import { Providers } from "@/components/Providers";
import { site } from "@/lib/site";

// 한글 글리프는 unicode-range로 나뉜 파일을 필요할 때만 받는다(preload는 라틴만).
const plex = IBM_Plex_Sans_KR({
  weight: ["400", "500", "600", "700"],
  subsets: ["latin"],
  variable: "--font-plex",
  display: "swap",
});

const plexMono = IBM_Plex_Mono({
  weight: ["400", "500"],
  subsets: ["latin"],
  variable: "--font-plex-mono",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  // 루트(blog.hyeongmin.dev)는 블로그다. 포트폴리오 페이지는 각자 제목을 따로 정한다.
  title: { default: site.blog.tabTitle, template: `%s | ${site.blog.tabTitle}` },
  description: site.blog.description,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ko" className={`${plex.variable} ${plexMono.variable}`} suppressHydrationWarning>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
