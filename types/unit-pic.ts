export type UnitPic = {
  id: string
  unit: string
  pic: string
  /** false: disabled, not offered as Tindakan PIC in the Surat form (set for every unit of the PIC) */
  is_active?: boolean
  created_at?: string
}

export type UnitPicInput = {
  unit: string
  pic: string
}
