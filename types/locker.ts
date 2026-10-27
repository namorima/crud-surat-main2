/** A Part and No. Locker a unit files into (Tetapan → Setup Locker). */
export interface Locker {
  id: string
  unit: string
  part: string
  noLocker: string
  /** Part badge colour, #rrggbb */
  warna: string
}

export type LockerInput = Omit<Locker, "id">
