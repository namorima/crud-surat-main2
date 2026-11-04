/**
 * Tags in Nota / Nota Kaki / Komen: "#insentif" (a # then a letter, no space).
 * "#123" stays a record link and "#S123" (Nota Kaki) a surat link, so neither is a tag.
 * Clicking a tag puts "#insentif" in the page's search box, which then lists only
 * the records whose notes or komen carry it.
 */
export const TAG_EVENT = "tag:pilih"

/** One token of linked note text: a tag, a "#123" number, a "#S123" surat link */
export const LINK_TOKEN = /(#S\d+\b|#\d+|#[A-Za-z][A-Za-z0-9_-]*[A-Za-z0-9])/g

const TAG_ONLY = /^#([A-Za-z][A-Za-z0-9_-]*[A-Za-z0-9])$/
const SURAT_LINK = /^#S\d+$/

/** "#Insentif" → "insentif"; null when the token is not a tag (numbers, #S123). */
export function tagOf(token: string): string | null {
  if (SURAT_LINK.test(token)) return null
  const m = token.match(TAG_ONLY)
  return m ? m[1].toLowerCase() : null
}

/** Every tag in a text, lower case, once each. */
export function tagsIn(text: string | null | undefined): string[] {
  if (!text) return []
  const found = new Set<string>()
  for (const token of text.match(/#[A-Za-z][A-Za-z0-9_-]*/g) ?? []) {
    const tag = tagOf(token.replace(/[-_]+$/, ""))
    if (tag) found.add(tag)
  }
  return [...found]
}

/** The search box holds a tag ("#insentif") → "insentif"; otherwise null. */
export function tagQuery(query: string): string | null {
  const q = query.trim()
  return q.startsWith("#") ? tagOf(q.replace(/[-_]+$/, "")) : null
}

/** Asks the open page (Surat or Rekod Bayaran) to filter by a tag. */
export function pickTag(tag: string) {
  if (typeof window !== "undefined") window.dispatchEvent(new CustomEvent(TAG_EVENT, { detail: { tag } }))
}
