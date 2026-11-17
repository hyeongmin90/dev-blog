import { SiteHeader, PORTFOLIO_SECTIONS } from "@/components/SiteHeader";
import { Contact } from "@/components/portfolio/home/Contact";
import { Hero } from "@/components/portfolio/home/Hero";
import { CareerList, SkillList } from "@/components/portfolio/home/ItemLists";
import { ProjectList } from "@/components/portfolio/home/ProjectList";
import { SectionNav } from "@/components/portfolio/home/SectionNav";
import { getPortfolioItems } from "@/lib/notion/portfolio-items";
import { getAllPosts, projectsForHome } from "@/lib/notion/posts";

// 포트폴리오 홈. 프로젝트는 Developer Log의 order 속성, 나머지는 Portfolio Items DB에서 온다.
export default async function PortfolioHome() {
  const [posts, items] = await Promise.all([getAllPosts(), getPortfolioItems()]);
  const projects = projectsForHome(posts);
  const career = items.filter((i) => i.kind !== "기술");
  const skills = items.filter((i) => i.kind === "기술");
  const label = (id: string) => PORTFOLIO_SECTIONS.find((s) => s.id === id)?.label;

  return (
    <>
      <SiteHeader world="portfolio" />
      <main className="world-portfolio pf-home">
        <div className="pf-frame">
          <Hero />
          <div className="pf-body">
            <SectionNav sections={PORTFOLIO_SECTIONS} />
            <div>
              <section id="work" aria-labelledby="h-work">
                <h2 id="h-work">{label("work")}</h2>
                <ProjectList projects={projects} />
              </section>
              <section id="career" aria-labelledby="h-career">
                <h2 id="h-career">{label("career")}</h2>
                <CareerList items={career} />
              </section>
              <section id="skills" aria-labelledby="h-skills">
                <h2 id="h-skills">{label("skills")}</h2>
                <SkillList items={skills} />
              </section>
              <section id="contact" aria-labelledby="h-contact">
                <h2 id="h-contact">{label("contact")}</h2>
                <Contact />
              </section>
            </div>
          </div>
          <footer className="pf-foot">노션에서 고친 내용은 10분 안에 이 페이지에 반영됩니다.</footer>
        </div>
      </main>
    </>
  );
}
