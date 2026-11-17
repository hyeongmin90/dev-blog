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
