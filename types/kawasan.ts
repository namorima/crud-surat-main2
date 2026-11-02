export interface Kawasan {
  id: string
  namaKawasan: string
  kodLokasi: string
}

export type KawasanInput = Omit<Kawasan, "id">
