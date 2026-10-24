import { clsx, type ClassValue } from "clsx"
import { cx } from "@/utils/cx"

// Uses BoardUI's tailwind-merge config so composite type styles
// (text-body-medium, text-title-2-medium, ...) survive next to text colours.
export function cn(...inputs: ClassValue[]) {
  return cx(clsx(inputs))
}
