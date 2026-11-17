import type { RenderCtx } from "@/components/notion/context";
import { hasHeading1, type NBlock } from "./notion/blocks";
import { isProject, slugMap, type Post, type World } from "./notion/posts";

export function makeCtx(world: World, posts: Post[], blocks: NBlock[]): RenderCtx {
  return {
    world,
    slugs: slugMap(posts),
    projects: Object.fromEntries(posts.filter(isProject).map((p) => [p.slug, p])),
    shiftHeadings: hasHeading1(blocks),
  };
}
