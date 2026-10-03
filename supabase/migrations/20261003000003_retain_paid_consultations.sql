-- ========================================================
-- Migration: keep paid consultation records when an account is deleted
-- ========================================================
-- consultations.user_id was ON DELETE CASCADE, so deleting an account also
-- deleted paid consultations - accounting records the privacy policy says
-- are kept for 8 years (DPDP s.8(7) allows retention required by law).
-- Switch to SET NULL, matching orders. eraseUserData() deletes unpaid
-- consultations and strips birth details/phone from paid ones before the
-- profile row goes; purge_expired_personal_data() removes them after 8 years.

DO $$
DECLARE
  v_constraint TEXT;
BEGIN
  SELECT con.conname INTO v_constraint
  FROM pg_constraint con
  JOIN pg_attribute att ON att.attrelid = con.conrelid AND att.attnum = ANY (con.conkey)
  WHERE con.conrelid = 'public.consultations'::regclass
    AND con.contype = 'f'
    AND con.confrelid = 'public.profiles'::regclass
    AND att.attname = 'user_id';

  IF v_constraint IS NULL THEN
    RAISE EXCEPTION 'consultations.user_id foreign key to profiles not found';
  END IF;

  EXECUTE format('ALTER TABLE public.consultations DROP CONSTRAINT %I', v_constraint);
END;
$$;

ALTER TABLE public.consultations
  ADD CONSTRAINT consultations_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE SET NULL;
