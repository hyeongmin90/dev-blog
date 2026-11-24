/**
 * Notion 데이터 캐시 태그. 모든 항목에 `all`을 함께 달아서
 * /api/revalidate로 한 번에 비울 수 있게 하고, 웹훅은 바뀐 부분만 비운다.
 */
export const tags = {
  all: "notion",
  posts: "notion:posts",
  items: "notion:items",
  cover: "notion:cover",
  page: (id: string) => `notion:page:${id.replace(/-/g, "").toLowerCase()}`,
};
