/**
 * Email self-service reset is switched off until a sending domain is verified
 * in Resend. Turn it on with NEXT_PUBLIC_PASSWORD_RESET="on" (also shows the
 * "Lupa Kata Laluan?" link on the login page; needs a rebuild).
 */
export const PASSWORD_RESET_ENABLED = process.env.NEXT_PUBLIC_PASSWORD_RESET === "on"

export const RESET_DISABLED_MESSAGE = "Fungsi lupa kata laluan belum diaktifkan. Sila hubungi pentadbir untuk reset kata laluan."
