export interface Fail {
  id: string
  part: string // HASIL, PERTANIAN AM, KONTRAK
  noLocker: string
  noFail: string
  pecahan: string
  pecahanKecil: string
  unit: string
}

export type FailPart = "HASIL" | "PERTANIAN AM" | "KONTRAK"
