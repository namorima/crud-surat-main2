import type { Bayaran } from "@/types/bayaran"
import type { Surat } from "@/types/surat"

/**
 * Stand-in records that skullet (`<Skeleton>`) lays out unseen while the real
 * data loads, so the skeleton takes the shape of the real table / dashboard.
 * Their text is never shown: every line becomes a bar. Dates are relative to
 * today so the Dashboard's period filters keep them.
 */

const pad = (n: number) => String(n).padStart(2, "0")
const daysAgo = (days: number) => {
  const d = new Date()
  d.setDate(d.getDate() - days)
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`
}

const KAWASAN = ["LADANG ARING", "LADANG BUKIT TANDAK", "LADANG TUMBI RAPAT"]
const KATEGORI = ["KONTRAK", "PERTANIAN AM", "ANGKUT BTS"]
const STATUS_BAYARAN = ["SELESAI", "DALAM PROSES", "HANTAR KEWANGAN", "SELESAI", "BELUM HANTAR"]
const PERKARA_BAYARAN = [
  "Bayaran kemajuan kerja meracun lalang blok 12",
  "Bayaran kerja membaja pokok muda",
  "Angkut buah tandan segar bulan lepas",
  "Bayaran kerja menebas dan membersih parit utama kawasan timur",
  "Kerja penyelenggaraan jalan ladang",
]

export const SAMPLE_BAYARAN: Bayaran[] = Array.from({ length: 12 }, (_, i) => {
  const terima = 8 + i * 27
  const paid = STATUS_BAYARAN[i % STATUS_BAYARAN.length] === "SELESAI"
  return {
    id: `sample-${i}`,
    ids: 1000 + i,
    daripada: KAWASAN[i % KAWASAN.length],
    tarikhTerima: daysAgo(terima),
    jenisBayaran: "KEMAJUAN",
    perkara: PERKARA_BAYARAN[i % PERKARA_BAYARAN.length],
    nilaiBayaran: String(4200 + ((i * 3719) % 18000)),
    bayaranKe: String((i % 4) + 1),
    wangTahanan: "",
    bayaranAkhir: false,
    suratBil: null,
    kategori: KATEGORI[i % KATEGORI.length],
    noKontrak: `K${pad(i % 5)}/26`,
    namaKontraktor: ["SYARIKAT MAJU JAYA", "PERUSAHAAN SINAR TANI", "KONTRAKTOR HIJAU ENTERPRISE"][i % 3],
    tarikhMemoLadang: daysAgo(terima - 2),
    statusLadang: "SELESAI",
    tarikhHantar: daysAgo(terima - 4),
    tarikhPpnP: "",
    tarikhPn: "",
    penerima: "",
    statusBayaran: STATUS_BAYARAN[i % STATUS_BAYARAN.length],
    tarikhBayar: paid ? daysAgo(Math.max(terima - 20, 0)) : "",
    nomborBaucer: "",
    notaKaki: "",
  }
})

const STATUS_SURAT: Surat["status"][] = ["SELESAI", "DALAM TINDAKAN", "BELUM PROSES", "SELESAI", "HOLD / KIV"]
const PERKARA_SURAT = [
  "Permohonan kelulusan kerja penyelenggaraan jalan ladang",
  "Makluman jadual mesyuarat pengurusan bulanan",
  "Laporan pengeluaran hasil bulan lepas",
  "Tuntutan bayaran kerja membaja kawasan baru",
  "Pekeliling garis panduan keselamatan pekerja",
]

export const SAMPLE_SURAT: Surat[] = Array.from({ length: 12 }, (_, i) => {
  const status = STATUS_SURAT[i % STATUS_SURAT.length]
  return {
    id: `sample-${i}`,
    bil: 900 - i,
    daripadaKepada: ["IBU PEJABAT", "LADANG ARING", "PEJABAT WILAYAH"][i % 3],
    tarikh: daysAgo(3 + i * 23),
    perkara: PERKARA_SURAT[i % PERKARA_SURAT.length],
    kategori: i % 3 === 2 ? "KELUAR" : "MASUK",
    unit: ["PENTADBIRAN", "PERLADANGAN", "KEWANGAN"][i % 3],
    fail: "A1 100/2",
    tindakanPic: ["AHMAD", "SITI", "RAHMAN"][i % 3],
    status,
    tarikhSelesai: status === "SELESAI" ? daysAgo(i * 23) : null,
    nota: "",
    komen: "",
    reference: "",
    kaedah: "MELALUI EMEL",
    untukMakluman: false,
    komenCount: 0,
    komenTerakhir: null,
    komenTags: [],
    bayaranRefs: [],
  }
})
