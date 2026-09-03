-- The orders table's SELECT policy already allows admins to read every
-- order, but there was never an UPDATE policy at all — meaning the admin
-- app's order status transitions (mark processing/shipped/delivered,
-- cancel, refund) have been silently rejected by RLS since the Orders
-- screen was first built.
CREATE POLICY "Admins update orders" ON public.orders
  FOR UPDATE USING (public.is_admin());
