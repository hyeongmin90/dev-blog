import { cacheLife } from "next/cache";
import { bundledLanguages, codeToHtml } from "shiki";

// 노션 코드 블록 언어 이름 → shiki 언어 ID
const ALIASES: Record<string, string> = {
  "plain text": "text",
  "c++": "cpp",
  "c#": "csharp",
  "f#": "fsharp",
  shell: "bash",
  docker: "dockerfile",
  markup: "html",
  "java/c/c++/c#": "java",
  "visual basic": "vb",
  "objective-c": "objc",
};

function toLang(notionLang: string): string {
  const lang = ALIASES[notionLang] ?? notionLang;
  return lang in bundledLanguages ? lang : "text";
}

// 같은 코드·언어면 결과가 항상 같으므로 오래 캐시한다.
// 캐시하지 않으면 cacheComponents 프리렌더가 shiki의 비동기 로딩을 미완료 작업으로 보고 실패한다.
async function highlight(code: string, lang: string): Promise<string> {
  "use cache";
  cacheLife("max");
  return codeToHtml(code, {
    lang,
    themes: { light: "github-light", dark: "github-dark-dimmed" },
    defaultColor: false,
  });
}

export async function Code({ code, language, caption }: { code: string; language: string; caption?: string }) {
  const html = await highlight(code, toLang(language));
  // 노션 API는 코드 블록의 줄바꿈 설정을 주지 않는다.
  // 그래서 plain text(로그·설명문)만 줄바꿈하고, 코드 언어는 가로 스크롤로 들여쓰기 구조를 지킨다.
  const wrap = language === "plain text";
  return (
    <figure className={wrap ? "n-code n-code-wrap" : "n-code"}>
      <div dangerouslySetInnerHTML={{ __html: html }} />
      {caption ? <figcaption>{caption}</figcaption> : null}
    </figure>
  );
}
