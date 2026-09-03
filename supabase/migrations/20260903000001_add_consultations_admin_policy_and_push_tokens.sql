-- --------------------------------------------------------
-- Push notification tokens (one row per admin device)
-- --------------------------------------------------------
CREATE TABLE public.push_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  token TEXT UNIQUE NOT NULL,
  platform TEXT NOT NULL DEFAULT 'android',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_push_tokens_user ON public.push_tokens(user_id);

ALTER TABLE public.push_tokens ENABLE ROW LEVEL SECURITY;

-- Only admins register/hold device tokens (the admin app is the only push
-- receiver for now) — service-role callers (the Next.js send-push helper)
-- bypass RLS entirely, so this only gates the admin app's own client calls.
CREATE POLICY "Admins manage own push tokens" ON public.push_tokens
  FOR ALL USING (public.is_admin() AND (auth.jwt() ->> 'sub') = user_id)
  WITH CHECK (public.is_admin() AND (auth.jwt() ->> 'sub') = user_id);
