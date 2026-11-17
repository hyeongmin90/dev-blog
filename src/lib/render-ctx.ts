import type { RenderCtx } from "@/components/notion/context";
import { hasHeading1, type NBlock } from "./notion/blocks";
import { slugMap, type Post, type World } from "./notion/posts";

export function makeCtx(world: World, posts: Post[], blocks: NBlock[]): RenderCtx {
  return {
    world,
    slugs: slugMap(posts),
    shiftHeadings: hasHeading1(blocks),
  };
}
