export const site = {
  name: "박형민",
  /** 헤더에 쓰는 영문 이름 */
  nameEn: "Park Hyeongmin",
  role: "Backend + AI Engineer",
  url: "https://blog.hyeongmin.dev",
  // blog.hyeongmin.dev는 블로그가 루트이고, 포트폴리오는 /portfolio에 있다.
  routes: { blog: "/", portfolio: "/portfolio" },
  // 예전 도메인으로 된 절대 링크를 사이트 내부 링크로 바꿀 때 사용한다.
  hosts: ["blog.hyeongmin.dev", "www.blog.hyeongmin.dev"],
  email: "nsby9000@gmail.com",
  github: "https://github.com/hyeongmin90",
  repo: "https://github.com/hyeongmin90/dev-blog",
  portfolio: {
    title: "박형민 포트폴리오",
    description: "왜?를 먼저 묻고 답을 만드는 백엔드 엔지니어 박형민의 포트폴리오입니다.",
    // 히어로 헤드라인(영문). 한 줄씩 나눠 둬야 줄마다 등장 연출이 걸린다.
    headline: ["Ask why.", "Build the answer."],
    lede: "스스로 질문하고 고민하며, 더 나은 해결책을 찾습니다.",
  },
  blog: {
    /** 브라우저 탭 제목에 쓰는 블로그 이름 */
    tabTitle: "DevBlog",
    title: "개발 로그",
    description: "백엔드와 AI 시스템을 만들며 배운 것을 기록합니다.",
  },
} as const;
