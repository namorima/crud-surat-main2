-- Enable Row Level Security on every app table (no policies).
--
-- The app reaches Supabase only from API routes with the service-role key,
-- which bypasses RLS. With RLS on and no policies, the anon key can no
-- longer read or change these tables through the Supabase REST API.
--
-- ORDER MATTERS: run this only AFTER the version that switches
-- lib/supabase-rbac.ts to the service-role client is deployed to every
-- environment that uses this database (production included). Older builds
-- read roles/permissions/users with the anon key and would lose permissions.

ALTER TABLE public.users            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.roles            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.permissions      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bayaran          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_bayaran    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.surat            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fail             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kontrak          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kontraktor       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.unit_pic         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.status_config    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.share_links      ENABLE ROW LEVEL SECURITY;

-- Verify: every row should show rls = true
SELECT c.relname AS table, c.relrowsecurity AS rls
FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public' AND c.relkind = 'r'
ORDER BY 1;
