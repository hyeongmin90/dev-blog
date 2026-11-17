import { cacheLife } from "next/cache";

/**
 * 저작권 표기용 올해 연도.
 * cacheComponents 프리렌더에서는 캐시 밖에서 new Date()를 쓸 수 없어서 캐시된 함수 안에서 계산한다.
 * 하루 단위로 다시 계산되므로 해가 바뀌면 자동으로 따라간다.
 */
export async function currentYear(): Promise<number> {
  "use cache";
  cacheLife("days");
  return new Date().getFullYear();
}
