export interface Fail {
  id: string
  part: string // HASIL, PERTANIAN AM, KONTRAK
  noLocker: string
  noFail: string
  pecahan: string
  pecahanKecil: string
  unit: string
  /** false: disabled, not offered in the Surat form (old surat keep their fail text) */
  isActive: boolean
}

export type FailPart = "HASIL" | "PERTANIAN AM" | "KONTRAK"
