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

export async function Code({ code, language, caption }: { code: string; language: string; caption?: string }) {
  const html = await codeToHtml(code, {
    lang: toLang(language),
    themes: { light: "github-light", dark: "github-dark-dimmed" },
    defaultColor: false,
  });
  return (
    <figure className="n-code">
      <div dangerouslySetInnerHTML={{ __html: html }} />
      {caption ? <figcaption>{caption}</figcaption> : null}
    </figure>
  );
}
