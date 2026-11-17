import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  // Notion 데이터 캐시 수명. 노션에서 고친 내용은 최대 10분 안에 반영되고,
  // /api/revalidate를 호출하면 즉시 반영된다.
  cacheLife: {
    notion: {
      stale: 300,
      revalidate: 600,
      expire: 60 * 60 * 24 * 7,
    },
  },
  async redirects() {
    // 예전 사이트의 /portfolio 링크는 이제 홈(포트폴리오)으로 보낸다.
    return [{ source: "/portfolio", destination: "/", permanent: true }];
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
