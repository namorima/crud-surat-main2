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

/**
 * Tetapan writes scoped to a unit: needs tetapan:edit, and a user without
 * tetapan:manage_all_units may only touch their own unit (their role).
 */
export async function requireUnitEdit(request: Request, units: string[]): Promise<Guard> {
  const guard = await requirePermission(request, { resource: "tetapan", action: "edit" }, ["semua", "Super Admin"])
  if (guard.denied) return guard
  const { session } = guard
  const permissions = session.roleId ? await getUserPermissions(session.uid) : []
  const allUnits =
    permissions.length > 0
      ? hasPermission(permissions, { resource: "tetapan", action: "manage_all_units" })
      : ["semua", "Super Admin"].includes(session.role)
  if (!allUnits && units.some((unit) => unit.toUpperCase() !== session.role.toUpperCase())) {
    return { denied: NextResponse.json({ error: "Anda hanya boleh mengurus locker unit anda sendiri" }, { status: 403 }) }
  }
  return guard
}
