"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { CASE_STUDY_HREF, DEFAULT_NODE, EDGES, NODE_H, NODE_W, NODES, VIEWBOX, edgePath } from "./pipeline";

const byId = Object.fromEntries(NODES.map((n) => [n.id, n]));

/** 실제 Vantage 구조를 메시지가 흐르는 다이어그램으로 보여준다. 노드를 고르면 그 부분의 문제 해결과 수치가 나온다. */
export function PipelineDiagram() {
  const [selected, setSelected] = useState(DEFAULT_NODE);
  const svgRef = useRef<SVGSVGElement>(null);

  // SMIL 애니메이션은 CSS 미디어 쿼리로 멈출 수 없어서, 움직임 줄이기 설정이면 직접 멈춘다.
  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const apply = () => (mq.matches ? svg.pauseAnimations() : svg.unpauseAnimations());
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);

  // 좁은 화면에서 다이어그램이 가로로 스크롤될 때, 선택한 노드가 카드 가운데 오도록 맞춘다.
  const canvasRef = useRef<HTMLDivElement>(null);
  const firstScroll = useRef(true);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || canvas.scrollWidth <= canvas.clientWidth) return;
    const target = (byId[selected].x / VIEWBOX.w) * canvas.scrollWidth - canvas.clientWidth / 2;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    canvas.scrollTo({ left: target, behavior: firstScroll.current || reduce ? "auto" : "smooth" });
    firstScroll.current = false;
  }, [selected]);

  const onKey = (id: string) => (e: KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      setSelected(id);
    }
  };

  return (
    <figure className="sys" aria-labelledby="sys-title">
      <figcaption className="sys-head">
        <span id="sys-title">
          <b>Vantage</b> 파이프라인, 노드를 눌러 보세요
        </span>
        <span className="sys-live">
          <i aria-hidden />
          운영 중
        </span>
      </figcaption>

      {/* 좁은 화면에서는 글자가 읽히는 크기를 지키고 카드 안에서 가로로 스크롤한다 */}
      <div className="sys-canvas" ref={canvasRef}>
      <svg ref={svgRef} viewBox={`0 0 ${VIEWBOX.w} ${VIEWBOX.h}`} role="group" aria-label="Vantage 시스템 구성도">
        <g>
          {EDGES.map(([a, b]) => (
            <path
              key={`${a}-${b}`}
              d={edgePath(byId[a], byId[b])}
              className={`sys-edge${a === selected || b === selected ? " on" : ""}`}
            />
          ))}
        </g>
        <g aria-hidden>
          {EDGES.map(([a, b], i) => {
            const begin = `${1.3 + i * 0.28}s`;
            return (
              <circle key={`m-${a}-${b}`} r={3.2} className="sys-msg" opacity={0}>
                <animateMotion dur="2.4s" repeatCount="indefinite" begin={begin} path={edgePath(byId[a], byId[b])} />
                <set attributeName="opacity" to="1" begin={begin} />
              </circle>
            );
          })}
        </g>
        <g>
          {NODES.map((n) => {
            const w = n.w ?? NODE_W;
            const on = n.id === selected;
            return (
              <g
                key={n.id}
                className={`sys-node${on ? " on" : ""}`}
                role="button"
                tabIndex={0}
                aria-pressed={on}
                aria-label={`${n.label}: ${n.title}`}
                onClick={() => setSelected(n.id)}
                onKeyDown={onKey(n.id)}
              >
                <rect x={n.x - w / 2} y={n.y - NODE_H / 2} width={w} height={NODE_H} rx={8} />
                <text x={n.x} y={n.y - 3} textAnchor="middle">
                  {n.label}
                </text>
                <text x={n.x} y={n.y + 13} textAnchor="middle" className="sub">
                  {n.sub}
                </text>
              </g>
            );
          })}
        </g>
      </svg>
      </div>

      {/* 모든 노드의 설명을 같은 칸에 겹쳐 두고 선택한 것만 보인다.
          패널 높이가 가장 긴 설명에 맞춰 고정되므로 노드를 바꿔도 아래 화면이 움직이지 않는다. */}
      <div className="sys-panels" aria-live="polite">
        {NODES.map((n) => (
          <div key={n.id} className="sys-panel" data-on={n.id === selected} aria-hidden={n.id !== selected}>
            <h3>{n.title}</h3>
            <p>{n.desc}</p>
            {n.metric ? (
              <p className="sys-metric">
                {n.metric.label} <span className="delta-before">{n.metric.before}</span> →{" "}
                <strong className="delta-after">{n.metric.after}</strong>
              </p>
            ) : null}
            <Link href={CASE_STUDY_HREF} tabIndex={n.id === selected ? undefined : -1}>
              Vantage 케이스 스터디에서 보기
            </Link>
          </div>
        ))}
      </div>
    </figure>
  );
}
