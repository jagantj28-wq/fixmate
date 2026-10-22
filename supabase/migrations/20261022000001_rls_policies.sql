-- ==============================================================================
-- FIXMATE: DATABASE SECURITY & ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.provider_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.provider_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.provider_availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.booking_status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.booking_bills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bill_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.provider_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.issue_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Helper function to check if authenticated user is admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role = 'admin' AND account_status = 'active'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 1. PROFILES POLICIES
-- Anyone authenticated can view profiles (needed for display names, provider details)
CREATE POLICY "Profiles readable by authenticated users"
ON public.profiles FOR SELECT
TO authenticated
USING (true);

-- Users can only update their own profile, but CANNOT update their role or account_status directly
CREATE POLICY "Users can update own profile"
ON public.profiles FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (
    auth.uid() = id 
    AND role = (SELECT role FROM public.profiles WHERE id = auth.uid())
    AND account_status = (SELECT account_status FROM public.profiles WHERE id = auth.uid())
);

-- Admin can manage all profiles
CREATE POLICY "Admin can update all profiles"
ON public.profiles FOR ALL
TO authenticated
USING (public.is_admin());

-- 2. PROVIDER PROFILES POLICIES
-- Approved providers are visible to all authenticated users; providers can see own profile regardless of status
CREATE POLICY "Provider profiles select policy"
ON public.provider_profiles FOR SELECT
TO authenticated
USING (
    verification_status = 'approved' 
    OR user_id = auth.uid() 
    OR public.is_admin()
);

-- Providers can update their own profile (except verification_status)
CREATE POLICY "Providers can update own profile"
ON public.provider_profiles FOR UPDATE
TO authenticated
USING (user_id = auth.uid() OR public.is_admin())
WITH CHECK (
    (user_id = auth.uid() AND verification_status = (SELECT verification_status FROM public.provider_profiles WHERE user_id = auth.uid()))
    OR public.is_admin()
);

CREATE POLICY "Providers can insert own profile"
ON public.provider_profiles FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

-- 3. SERVICE CATEGORIES POLICIES
-- Active categories readable by all authenticated users
CREATE POLICY "Service categories readable by all"
ON public.service_categories FOR SELECT
TO authenticated
USING (active = true OR public.is_admin());

-- Only admins can insert/update/delete categories
CREATE POLICY "Admin manages service categories"
ON public.service_categories FOR ALL
TO authenticated
USING (public.is_admin());

-- 4. PROVIDER SERVICES POLICIES
CREATE POLICY "Provider services readable by all"
ON public.provider_services FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Providers manage their own services"
ON public.provider_services FOR ALL
TO authenticated
USING (
    provider_id IN (SELECT id FROM public.provider_profiles WHERE user_id = auth.uid())
    OR public.is_admin()
);

-- 5. PROVIDER AVAILABILITY POLICIES
CREATE POLICY "Provider availability readable by all"
ON public.provider_availability FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Providers manage their availability"
ON public.provider_availability FOR ALL
TO authenticated
USING (
    provider_id IN (SELECT id FROM public.provider_profiles WHERE user_id = auth.uid())
    OR public.is_admin()
);

-- 6. CUSTOMER ADDRESSES POLICIES
CREATE POLICY "Customers manage own addresses"
ON public.customer_addresses FOR ALL
TO authenticated
USING (customer_id = auth.uid() OR public.is_admin())
WITH CHECK (customer_id = auth.uid() OR public.is_admin());

-- 7. BOOKINGS POLICIES
-- Customer views own bookings; Assigned Provider views their bookings; Admin views all
CREATE POLICY "Bookings viewable by participants"
ON public.bookings FOR SELECT
TO authenticated
USING (
    customer_id = auth.uid()
    OR provider_id IN (SELECT id FROM public.provider_profiles WHERE user_id = auth.uid())
    OR public.is_admin()
);

-- Customers can insert bookings for themselves
CREATE POLICY "Customers can create bookings"
ON public.bookings FOR INSERT
TO authenticated
WITH CHECK (customer_id = auth.uid());

-- Update policy: Customer can cancel; Provider can update status (handled securely with transition logic); Admin can manage
CREATE POLICY "Participants can update booking"
ON public.bookings FOR UPDATE
TO authenticated
USING (
    customer_id = auth.uid()
    OR provider_id IN (SELECT id FROM public.provider_profiles WHERE user_id = auth.uid())
    OR public.is_admin()
);

-- 8. BOOKING STATUS HISTORY POLICIES
CREATE POLICY "Booking status history readable by participants"
ON public.booking_status_history FOR SELECT
TO authenticated
USING (
    booking_id IN (
        SELECT id FROM public.bookings
        WHERE customer_id = auth.uid()
        OR provider_id IN (SELECT id FROM public.provider_profiles WHERE user_id = auth.uid())
    )
    OR public.is_admin()
);

CREATE POLICY "Participants can append booking status history"
ON public.booking_status_history FOR INSERT
TO authenticated
WITH CHECK (
    actor_user_id = auth.uid()
    OR public.is_admin()
);

-- 9. BOOKING BILLS & BILL ITEMS POLICIES
CREATE POLICY "Bills readable by booking participants"
ON public.booking_bills FOR SELECT
TO authenticated
USING (
    booking_id IN (
        SELECT id FROM public.bookings
        WHERE customer_id = auth.uid()
        OR provider_id IN (SELECT id FROM public.provider_profiles WHERE user_id = auth.uid())
    )
    OR public.is_admin()
);

CREATE POLICY "Assigned provider can create/update bill"
ON public.booking_bills FOR ALL
TO authenticated
USING (
    booking_id IN (
        SELECT b.id FROM public.bookings b
        JOIN public.provider_profiles p ON b.provider_id = p.id
        WHERE p.user_id = auth.uid()
    )
    OR public.is_admin()
);

CREATE POLICY "Bill items readable by booking participants"
ON public.bill_items FOR SELECT
TO authenticated
USING (
    bill_id IN (
        SELECT b.id FROM public.booking_bills b
        JOIN public.bookings bk ON b.booking_id = bk.id
        WHERE bk.customer_id = auth.uid()
        OR bk.provider_id IN (SELECT id FROM public.provider_profiles WHERE user_id = auth.uid())
    )
    OR public.is_admin()
);

CREATE POLICY "Provider can manage bill items"
ON public.bill_items FOR ALL
TO authenticated
USING (
    bill_id IN (
        SELECT b.id FROM public.booking_bills b
        JOIN public.bookings bk ON b.booking_id = bk.id
        JOIN public.provider_profiles p ON bk.provider_id = p.id
        WHERE p.user_id = auth.uid()
    )
    OR public.is_admin()
);

-- 10. REVIEWS POLICIES
CREATE POLICY "Reviews viewable by authenticated users"
ON public.reviews FOR SELECT
TO authenticated
USING (moderation_status = 'published' OR customer_id = auth.uid() OR public.is_admin());

CREATE POLICY "Customers create review for completed booking"
ON public.reviews FOR INSERT
TO authenticated
WITH CHECK (
    customer_id = auth.uid()
    AND EXISTS (
        SELECT 1 FROM public.bookings
        WHERE id = booking_id
        AND customer_id = auth.uid()
        AND status = 'completed'
    )
);

-- 11. NOTIFICATIONS POLICIES
CREATE POLICY "Users view own notifications"
ON public.notifications FOR SELECT
TO authenticated
USING (recipient_user_id = auth.uid());

CREATE POLICY "Users update own notifications"
ON public.notifications FOR UPDATE
TO authenticated
USING (recipient_user_id = auth.uid());

-- 12. PROVIDER DOCUMENTS POLICIES
CREATE POLICY "Provider documents private"
ON public.provider_documents FOR ALL
TO authenticated
USING (
    provider_id IN (SELECT id FROM public.provider_profiles WHERE user_id = auth.uid())
    OR public.is_admin()
);

-- 13. ISSUE REPORTS POLICIES
CREATE POLICY "Issue reports readable by reporter and admin"
ON public.issue_reports FOR SELECT
TO authenticated
USING (reporter_user_id = auth.uid() OR public.is_admin());

CREATE POLICY "Users can create issue reports for their bookings"
ON public.issue_reports FOR INSERT
TO authenticated
WITH CHECK (reporter_user_id = auth.uid());

CREATE POLICY "Admin can update issue reports"
ON public.issue_reports FOR UPDATE
TO authenticated
USING (public.is_admin());

-- 14. AUDIT LOGS POLICIES
CREATE POLICY "Admin only can view audit logs"
ON public.audit_logs FOR SELECT
TO authenticated
USING (public.is_admin());

CREATE POLICY "System and authenticated users can insert audit logs"
ON public.audit_logs FOR INSERT
TO authenticated
WITH CHECK (true);
