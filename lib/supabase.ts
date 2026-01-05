import { createClient } from "@supabase/supabase-js"

// Get environment variables with fallback
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ""
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ""
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""

// Validate required environment variables
if (!supabaseUrl || !supabaseServiceKey) {
  console.error("Missing Supabase environment variables!")
  console.error("NEXT_PUBLIC_SUPABASE_URL:", supabaseUrl ? "✓" : "✗")
  console.error("SUPABASE_SERVICE_ROLE_KEY:", supabaseServiceKey ? "✓" : "✗")
  throw new Error("Missing required Supabase environment variables. Please check your .env.local file.")
}

// Supabase client for server-side operations (with service role key)
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
)

// Supabase client for client-side operations (with anon key)
export const supabase = createClient(supabaseUrl, supabaseAnonKey || supabaseServiceKey)

// Database types for type safety
export type Database = {
  public: {
    Tables: {
      surat: {
        Row: {
          id: string
          bil: number
          daripada_kepada: string
          tarikh: string
          perkara: string
          kategori: string
          unit: string
          fail: string | null
          tindakan_pic: string | null
          status: string
          tarikh_selesai: string | null
          nota: string | null
          komen: string | null
          reference: string | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database["public"]["Tables"]["surat"]["Row"], "id" | "created_at" | "updated_at">
        Update: Partial<Database["public"]["Tables"]["surat"]["Insert"]>
      }
      bayaran: {
        Row: {
          id: string
          daripada: string
          tarikh_terima: string
          perkara: string
          nilai_bayaran: string
          bayaran_ke: string | null
          kategori: string | null
          no_kontrak: string | null
          nama_kontraktor: string | null
          tarikh_memo_ladang: string | null
          status_ladang: string | null
          tarikh_hantar: string | null
          tarikh_ppnp: string | null
          tarikh_pn: string | null
          penerima: string | null
          status_bayaran: string | null
          tarikh_bayar: string | null
          nombor_baucer: string | null
          nota_kaki: string | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database["public"]["Tables"]["bayaran"]["Row"], "id" | "created_at" | "updated_at">
        Update: Partial<Database["public"]["Tables"]["bayaran"]["Insert"]>
      }
      fail: {
        Row: {
          id: string
          part: string
          no_locker: string | null
          no_fail: string
          pecahan: string | null
          pecahan_kecil: string | null
          unit: string
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database["public"]["Tables"]["fail"]["Row"], "id" | "created_at" | "updated_at">
        Update: Partial<Database["public"]["Tables"]["fail"]["Insert"]>
      }
      users: {
        Row: {
          id: string
          username: string
          password: string
          name: string
          role: string
          type: string | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database["public"]["Tables"]["users"]["Row"], "id" | "created_at" | "updated_at">
        Update: Partial<Database["public"]["Tables"]["users"]["Insert"]>
      }
      audit_bayaran: {
        Row: {
          id: string
          bayaran_id: string | null
          user_name: string
          action: string
          details: string | null
          created_at: string
        }
        Insert: Omit<Database["public"]["Tables"]["audit_bayaran"]["Row"], "id" | "created_at">
        Update: Partial<Database["public"]["Tables"]["audit_bayaran"]["Insert"]>
      }
      unit_pic: {
        Row: {
          id: string
          unit: string
          pic: string
          created_at: string
        }
        Insert: Omit<Database["public"]["Tables"]["unit_pic"]["Row"], "id" | "created_at">
        Update: Partial<Database["public"]["Tables"]["unit_pic"]["Insert"]>
      }
      kontrak: {
        Row: {
          id: string
          kawasan: string
          no_kontrak: string
          kategori: string | null
          nama_kontraktor: string | null
          created_at: string
        }
        Insert: Omit<Database["public"]["Tables"]["kontrak"]["Row"], "id" | "created_at">
        Update: Partial<Database["public"]["Tables"]["kontrak"]["Insert"]>
      }
      status_config: {
        Row: {
          id: string
          status: string
          color_hex: string
          kategori: string
          created_at: string
        }
        Insert: Omit<Database["public"]["Tables"]["status_config"]["Row"], "id" | "created_at">
        Update: Partial<Database["public"]["Tables"]["status_config"]["Insert"]>
      }
      share_links: {
        Row: {
          id: string
          link_id: string
          filter_json: any
          created_by: string
          expires_at: string | null
          description: string | null
          access_count: number
          created_at: string
        }
        Insert: Omit<Database["public"]["Tables"]["share_links"]["Row"], "id" | "created_at">
        Update: Partial<Database["public"]["Tables"]["share_links"]["Insert"]>
      }
    }
  }
}
