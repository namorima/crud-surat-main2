import { NextResponse } from "next/server"
import { getSession, type SessionPayload } from "@/lib/session"
import { getUserPermissions } from "@/lib/supabase-rbac"
import { hasPermission } from "@/lib/rbac"
import type { PermissionCheck } from "@/types/rbac"

type Guard = { session: SessionPayload; denied?: undefined } | { session?: undefined; denied: NextResponse }

/**
 * Server-side twin of the UI permission checks (all given checks must pass): RBAC permissions when the
 * user's role has any, otherwise the legacy role list. middleware.ts already
 * guarantees a session on non-public /api routes; this adds the role check.
 */
export async function requirePermission(
  request: Request,
  check: PermissionCheck | PermissionCheck[],
  legacyRoles: string[],
): Promise<Guard> {
  const session = await getSession(request)
  if (!session) {
    return { denied: NextResponse.json({ error: "Sila log masuk semula" }, { status: 401 }) }
  }
  const permissions = session.roleId ? await getUserPermissions(session.uid) : []
  const checks = Array.isArray(check) ? check : [check]
  const allowed =
    permissions.length > 0 ? checks.every((c) => hasPermission(permissions, c)) : legacyRoles.includes(session.role)
  if (!allowed) {
    return { denied: NextResponse.json({ error: "Anda tiada kebenaran untuk tindakan ini" }, { status: 403 }) }
  }
  return { session }
}

/** Legacy roles with full access (CLAUDE.md "Legacy Role Access Matrix"). */
export const ADMIN_ROLES = ["semua", "Super Admin", "admin"]
