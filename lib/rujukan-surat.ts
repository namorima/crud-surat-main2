/**
 * A surat's full reference: its No Bilangan Surat inside its fail's No Rujukan
 * Fail, written "(5) dlm FELCRA/PJ/100-2/3". Either part may be missing.
 */
export function rujukanSurat(noBilangan?: string | null, noRujukanFail?: string | null): string {
  const bil = (noBilangan || "").trim()
  const fail = (noRujukanFail || "").trim().replace(/^dlm\s+/i, "")
  if (bil && fail) return `(${bil}) dlm ${fail}`
  return bil || fail
}

/** Keeps the digits only: No Bilangan Surat is a number ("5"). */
export const onlyDigits = (value: string) => value.replace(/\D/g, "")
