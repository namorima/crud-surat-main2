export interface Kontraktor {
  id: string
  namaKontraktor: string
  noVendor: string
  namaAkaun: string
  nomborAkaun: string
  jenisBank: string
}

export type KontraktorInput = Omit<Kontraktor, "id">
