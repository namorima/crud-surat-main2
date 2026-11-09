export interface Fail {
  id: string
  part: string // HASIL, PERTANIAN AM, KONTRAK
  noLocker: string
  noFail: string
  /** No Rujukan Fail (e.g. "FELCRA/PJ/100-2/3"); "" when not set */
  noRujukanFail: string
  pecahan: string
  pecahanKecil: string
  unit: string
  /** false: disabled, not offered in the Surat form (old surat keep their fail text) */
  isActive: boolean
}

export type FailPart = "HASIL" | "PERTANIAN AM" | "KONTRAK"
