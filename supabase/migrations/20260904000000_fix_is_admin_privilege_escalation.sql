-- SECURITY FIX: is_admin() trusted the profiles.role DB column, which any
-- signed-in user could set on their own row — "Users update own profile"
-- had no WITH CHECK restricting which columns could change, only that
-- id stayed the same. Any self-registered customer could therefore:
--   PATCH /rest/v1/profiles?id=eq.<own_id>  { "role": "admin" }
-- and immediately pass every is_admin() check in the app. Combined with the
-- "Admins update orders"/"Admins update consultations" policies, this was a
-- real payment-bypass path (rewrite any order's status/amount/payment id to
-- fake a paid, delivered order), not just profile vanity data.
--
-- Fix: redefine is_admin() to trust the Clerk-issued JWT's `metadata.role`
-- claim instead of the DB column. That claim comes from Clerk's
-- public_metadata, which is only writable via Clerk's backend API — never
-- by the end user. This is the exact same claim the r2-presign and
-- razorpay-refund Edge Functions already trust (see their `payload.metadata`
-- checks), so this also makes every admin check in the app consistent with
-- one non-forgeable source of truth instead of two independent ones.
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
  SELECT COALESCE((auth.jwt() -> 'metadata' ->> 'role') = 'admin', false);
$$ LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, pg_temp;

-- Defense in depth: even though is_admin() no longer reads profiles.role,
-- lock it from client self-writes so a future change can't reintroduce the
-- same escalation path by accident.
DROP POLICY "Users update own profile" ON public.profiles;
CREATE POLICY "Users update own profile" ON public.profiles
  FOR UPDATE USING ((auth.jwt() ->> 'sub') = id)
  WITH CHECK (
    (auth.jwt() ->> 'sub') = id
    AND role = (SELECT p.role FROM public.profiles p WHERE p.id = profiles.id)
  );
