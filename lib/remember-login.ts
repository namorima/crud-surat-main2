/**
 * "Ingat log masuk di pelayar ini" on the login page (ticked by default).
 *
 * The ID is kept in localStorage. The password is never written to
 * localStorage: it goes to the browser's own password manager through the
 * Credential Management API (Chrome, Edge, Android), which fills it back in on
 * the next visit. Browsers without that API (Safari / iOS) still offer to save
 * and fill it from their password manager / Keychain, because the fields carry
 * autocomplete="username" / "current-password".
 */

const KEY = "auth:remember"

type Remembered = { on: boolean; id: string }

export function readRemembered(): Remembered {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return { on: true, id: "" }
    const value = JSON.parse(raw) as Partial<Remembered>
    return { on: value.on !== false, id: typeof value.id === "string" ? value.id : "" }
  } catch {
    return { on: true, id: "" }
  }
}

type PasswordCredentialLike = Credential & { id: string; password?: string }
type PasswordCredentialCtor = new (data: { id: string; password: string; name?: string }) => Credential

const passwordCredential = (): PasswordCredentialCtor | null =>
  typeof window !== "undefined" && "PasswordCredential" in window && navigator.credentials
    ? ((window as unknown as { PasswordCredential: PasswordCredentialCtor }).PasswordCredential)
    : null

/** After a successful login: remember (or forget) this ID and password. */
export async function rememberLogin(on: boolean, id: string, password: string, name?: string) {
  try {
    localStorage.setItem(KEY, JSON.stringify({ on, id: on ? id : "" }))
  } catch {
    // storage blocked
  }
  const Ctor = passwordCredential()
  if (!Ctor) return
  try {
    if (on) await navigator.credentials.store(new Ctor({ id, password, name: name || id }))
    else await navigator.credentials.preventSilentAccess()
  } catch {
    // the browser refused or the user dismissed its prompt
  }
}

/** The saved ID and, where the browser can hand it over without asking, the password. */
export async function recallLogin(): Promise<{ on: boolean; id: string; password: string }> {
  const saved = readRemembered()
  if (!saved.on) return { on: false, id: "", password: "" }
  const Ctor = passwordCredential()
  if (!Ctor) return { ...saved, password: "" }
  try {
    const cred = (await navigator.credentials.get({ password: true, mediation: "silent" } as CredentialRequestOptions)) as PasswordCredentialLike | null
    if (cred?.password && (!saved.id || cred.id === saved.id)) return { on: true, id: cred.id, password: cred.password }
  } catch {
    // not available
  }
  return { ...saved, password: "" }
}
