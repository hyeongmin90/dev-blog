import { site } from "@/lib/site";
import { PipelineDiagram } from "./PipelineDiagram";

export function Hero() {
  return (
    <div className="hero">
      <div>
        <p className="hero-who">
          <b>{site.name}</b>, {site.role}
        </p>
        <h1 className="hero-title" lang="en">
          {site.portfolio.headline.map((line) => (
            <span key={line} className="hero-line">
              {line}
            </span>
          ))}
        </h1>
        <p className="hero-lede">{site.portfolio.lede}</p>
        <div className="hero-links">
          <a href="#work">프로젝트 보기</a>
          <a href={site.github} target="_blank" rel="noreferrer">
            GitHub
          </a>
          <a href="#contact">연락하기</a>
        </div>
      </div>
      <PipelineDiagram />
    </div>
  );
}
