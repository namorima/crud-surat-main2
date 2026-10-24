-- One-time password reset tokens for "Lupa Kata Laluan".
-- Only a SHA-256 hash of the token is stored; the token itself is only in the email link.
-- RLS on with no policies: only the service role (API routes) can read or write.

CREATE TABLE IF NOT EXISTS public.password_reset_tokens (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  token_hash  TEXT NOT NULL UNIQUE,
  expires_at  TIMESTAMPTZ NOT NULL,
  used_at     TIMESTAMPTZ,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_user ON public.password_reset_tokens (user_id, created_at DESC);

ALTER TABLE public.password_reset_tokens ENABLE ROW LEVEL SECURITY;
