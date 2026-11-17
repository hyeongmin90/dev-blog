import katex from "katex";

export function Math({ expression, block = false }: { expression: string; block?: boolean }) {
  const html = katex.renderToString(expression, {
    displayMode: block,
    throwOnError: false,
    output: "htmlAndMathml",
  });
  if (block) return <div className="n-equation" dangerouslySetInnerHTML={{ __html: html }} />;
  return <span dangerouslySetInnerHTML={{ __html: html }} />;
}
