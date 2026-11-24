import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  // Notion 데이터 캐시 수명. 변경은 Notion 웹훅(/api/notion-webhook)이 바로 무효화하므로
  // 시간 기반 갱신은 웹훅을 놓쳤을 때를 대비한 하루 한 번으로 둔다.
  // 수동으로 전부 비우려면 /api/revalidate를 호출한다.
  cacheLife: {
    notion: {
      stale: 300,
      revalidate: 60 * 60 * 24,
      expire: 60 * 60 * 24 * 30,
    },
  },
  async redirects() {
    // 블로그는 루트(/)로 옮겼다. 예전 /blog 링크는 루트로 보낸다.
    return [{ source: "/blog", destination: "/", permanent: true }];
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
