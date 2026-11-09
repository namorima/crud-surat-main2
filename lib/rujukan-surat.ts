/**
 * A surat's full reference: its fail's No Rujukan Fail, then its No Bilangan
 * Surat, written "dlm FELCRA/PJ/100-2/3 (5)". Either part may be missing.
 */
export function rujukanSurat(noBilangan?: string | null, noRujukanFail?: string | null): string {
  const bil = (noBilangan || "").trim()
  const fail = (noRujukanFail || "").trim().replace(/^dlm\s+/i, "")
  if (bil && fail) return `dlm ${fail} (${bil})`
  if (fail) return `dlm ${fail}`
  return bil
}

/** Keeps the digits only: No Bilangan Surat is a number ("5"). */
export const onlyDigits = (value: string) => value.replace(/\D/g, "")
