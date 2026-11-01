/**
 * Supabase (PostgREST) returns at most 1000 rows per request, so a plain
 * select("*") of a big table silently drops the rest. selectAll() asks for
 * the rows a page at a time until a short page comes back. The query must have
 * a stable order (e.g. a unique column) so pages do not overlap or skip rows.
 */
const PAGE_SIZE = 1000

type PageResult<T> = { data: T[] | null; error: unknown }

export async function selectAll<T>(page: (from: number, to: number) => PromiseLike<PageResult<T>>): Promise<T[]> {
  const rows: T[] = []
  for (let from = 0; ; from += PAGE_SIZE) {
    const { data, error } = await page(from, from + PAGE_SIZE - 1)
    if (error) throw error
    rows.push(...(data ?? []))
    if (!data || data.length < PAGE_SIZE) return rows
  }
}
