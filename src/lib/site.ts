export const site = {
  name: "박형민",
  url: "https://blog.hyeongmin.dev",
  // 예전 도메인으로 된 절대 링크를 사이트 내부 링크로 바꿀 때 사용한다.
  hosts: ["blog.hyeongmin.dev", "www.blog.hyeongmin.dev"],
  portfolio: {
    title: "박형민 포트폴리오",
    description: "백엔드 역량으로 AI 기능이 안정적으로 서비스되게 만드는 엔지니어 박형민의 포트폴리오입니다.",
  },
  blog: {
    title: "개발 로그",
    description: "백엔드와 AI 시스템을 만들며 배운 것을 기록합니다.",
  },
  github: "https://github.com/hyeongmin90",
} as const;
