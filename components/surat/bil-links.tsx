"use client"

import { LinkedText } from "@/components/shared/linked-text"

/**
 * Note / komen text where "#123" opens surat 123 and "#tag" filters the Surat
 * list by that tag. Everything else is plain text, so markup typed into a note never runs.
 */
export function TextWithBilLinks({ text, onBilClick }: { text: string; onBilClick: (bil: string) => void }) {
  return <LinkedText text={text} onNumber={onBilClick} />
}
