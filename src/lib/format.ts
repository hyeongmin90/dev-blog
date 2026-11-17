/** "2026-11-04" → "2026.11.04" */
export function formatDate(iso: string | null): string {
  if (!iso) return "";
  return iso.slice(0, 10).replace(/-/g, ".");
}
