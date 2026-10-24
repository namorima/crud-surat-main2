import { createHash, randomBytes } from "crypto"
import { supabaseAdmin } from "@/lib/supabase"

/** How long a reset link stays valid. */
export const RESET_TOKEN_TTL_MS = 60 * 60 * 1000
/** Minimum gap between two reset emails for the same user. */
const RESET_COOLDOWN_MS = 60 * 1000

export function hashResetToken(token: string): string {
  return createHash("sha256").update(token).digest("hex")
}

/** Same rules as the change-password page. */
export function validateNewPassword(password: unknown): string | null {
  if (typeof password !== "string" || password.length < 8) return "Kata laluan mesti sekurang-kurangnya 8 aksara"
  if (!/[A-Z]/.test(password) || !/[a-z]/.test(password) || !/[0-9]/.test(password)) {
    return "Kata laluan mesti ada huruf besar, huruf kecil dan nombor"
  }
  return null
}

/**
 * Creates a one-time token for the user and returns it, or null when a link
 * was sent less than a minute ago. Older unused tokens are invalidated.
 */
export async function issueResetToken(userId: string): Promise<string | null> {
  const { data: recent } = await supabaseAdmin
    .from("password_reset_tokens")
    .select("created_at")
    .eq("user_id", userId)
    .gte("created_at", new Date(Date.now() - RESET_COOLDOWN_MS).toISOString())
    .limit(1)
  if (recent && recent.length > 0) return null

  const now = new Date().toISOString()
  await supabaseAdmin
    .from("password_reset_tokens")
    .update({ used_at: now })
    .eq("user_id", userId)
    .is("used_at", null)

  const token = randomBytes(32).toString("base64url")
  const { error } = await supabaseAdmin.from("password_reset_tokens").insert({
    user_id: userId,
    token_hash: hashResetToken(token),
    expires_at: new Date(Date.now() + RESET_TOKEN_TTL_MS).toISOString(),
  })
  if (error) throw error
  return token
}

/**
 * Marks the token used and returns its user id, or null if it is unknown,
 * expired or already used. The single conditional update makes it one-time
 * even when two requests race.
 */
export async function consumeResetToken(token: string): Promise<string | null> {
  const now = new Date().toISOString()
  const { data, error } = await supabaseAdmin
    .from("password_reset_tokens")
    .update({ used_at: now })
    .eq("token_hash", hashResetToken(token))
    .is("used_at", null)
    .gt("expires_at", now)
    .select("user_id")
  if (error) throw error
  return data && data.length > 0 ? data[0].user_id : null
}

/** Sends the reset link through the Resend REST API. */
export async function sendResetEmail(to: string, name: string, link: string): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) throw new Error("RESEND_API_KEY is not set")

  const from = process.env.RESEND_FROM || "Sistem Surat & Bayaran <onboarding@resend.dev>"
  const safeName = name.replace(/[<>&"]/g, "")
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from,
      to: [to],
      subject: "Reset kata laluan",
      text: `Salam ${safeName},\n\nBuka pautan ini untuk menetapkan kata laluan baharu (sah selama 1 jam, sekali guna):\n${link}\n\nJika anda tidak meminta reset, abaikan emel ini.`,
      html: `<p>Salam ${safeName},</p>
<p>Klik butang di bawah untuk menetapkan kata laluan baharu. Pautan ini sah selama 1 jam dan hanya boleh digunakan sekali.</p>
<p><a href="${link}" style="display:inline-block;padding:10px 18px;background:#2563eb;color:#fff;border-radius:8px;text-decoration:none">Tetapkan kata laluan baharu</a></p>
<p style="color:#666;font-size:13px">Jika anda tidak meminta reset, abaikan emel ini.</p>`,
    }),
  })
  if (!res.ok) {
    throw new Error(`Resend ${res.status}: ${(await res.text()).slice(0, 200)}`)
  }
}
