import type { PortfolioItem } from "@/lib/notion/portfolio-items";

/** 활동·수상·자격을 order 순서 그대로 한 목록에 보여준다. */
export function CareerList({ items }: { items: PortfolioItem[] }) {
  return (
    <div className="career">
      {items.map((it) => (
        <div key={it.id} className="career-row">
          <span className="career-period">{it.period}</span>
          <div>
            <b>{it.name}</b>
            {it.kind !== "활동" ? <span className="career-kind">{it.kind}</span> : null}
            {it.detail ? <p>{it.detail}</p> : null}
          </div>
        </div>
      ))}
    </div>
  );
}

export function SkillList({ items }: { items: PortfolioItem[] }) {
  return (
    <dl className="skills">
      {items.map((it) => (
        <div key={it.id} className="skills-row">
          <dt>{it.name}</dt>
          <dd>
            {(it.detail ?? "")
              .split(",")
              .map((s) => s.trim())
              .filter(Boolean)
              .map((s) => (
                <span key={s}>{s}</span>
              ))}
          </dd>
        </div>
      ))}
    </dl>
  );
}
