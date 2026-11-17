export const site = {
  name: "박형민",
  role: "Backend + AI Engineer",
  url: "https://blog.hyeongmin.dev",
  // 예전 도메인으로 된 절대 링크를 사이트 내부 링크로 바꿀 때 사용한다.
  hosts: ["blog.hyeongmin.dev", "www.blog.hyeongmin.dev"],
  email: "nsby9000@gmail.com",
  github: "https://github.com/hyeongmin90",
  portfolio: {
    title: "박형민 포트폴리오",
    description: "AI 기능이 서비스로 돌아가게 만드는 백엔드 엔지니어 박형민의 포트폴리오입니다.",
    // 히어로 헤드라인. 한 줄씩 나눠 둬야 줄마다 등장 연출이 걸린다.
    headline: ["AI 기능이 서비스로", "돌아가게 만드는", "백엔드 엔지니어"],
    lede: "RAG 파이프라인을 검색, 재정렬, 평가까지 확장하고 Spring Boot와 FastAPI 서비스로 운영합니다. 바꾼 것은 수치로 확인합니다.",
  },
  blog: {
    title: "개발 로그",
    description: "백엔드와 AI 시스템을 만들며 배운 것을 기록합니다.",
  },
} as const;
