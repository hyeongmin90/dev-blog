import { plainText, type NBlock } from "@/lib/notion/blocks";
import { Blocks } from "@/components/notion/Blocks";
import type { RenderCtx } from "@/components/notion/context";

type Section = { id: string; label: string; blocks: NBlock[] };

/**
 * 포트폴리오 노션 페이지를 문서형 이력으로 그린다.
 * 첫 heading_1 앞의 블록은 소개 문단이 되고, heading_1마다 "라벨 열 + 내용" 섹션이 된다.
 * 섹션 사이 구분선은 레이아웃이 대신하므로 divider 블록은 버린다.
 */
export function PortfolioDocument({ blocks, ctx }: { blocks: NBlock[]; ctx: RenderCtx }) {
  const lede: NBlock[] = [];
  const sections: Section[] = [];
  for (const b of blocks) {
    if (b.type === "divider") continue;
    if (b.type === "heading_1") {
      sections.push({ id: b.id, label: plainText(b.heading_1.rich_text), blocks: [] });
    } else if (sections.length) {
      sections[sections.length - 1].blocks.push(b);
    } else {
      lede.push(b);
    }
  }
  // 섹션 안의 소제목은 h3부터 시작하도록 한 단계 내린다.
  const inner: RenderCtx = { ...ctx, shiftHeadings: true };

  return (
    <div className="pf-doc">
      {lede.length ? (
        <div className="pf-lede">
          <Blocks blocks={lede} ctx={ctx} />
        </div>
      ) : null}
      {sections.map((s) => (
        <section key={s.id} className="pf-section" aria-labelledby={`sec-${s.id}`}>
          <h2 id={`sec-${s.id}`} className="pf-label">
            {s.label}
          </h2>
          <div className="pf-body">
            <Blocks blocks={s.blocks} ctx={inner} />
          </div>
        </section>
      ))}
    </div>
  );
}
