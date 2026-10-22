-- ==============================================================================
-- FIXMATE: FUNCTIONS & TRIGGERS
-- ==============================================================================

-- 1. Automatic Timestamp updater
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_profiles_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER trg_provider_profiles_updated_at
BEFORE UPDATE ON public.provider_profiles
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER trg_bookings_updated_at
BEFORE UPDATE ON public.bookings
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER trg_issue_reports_updated_at
BEFORE UPDATE ON public.issue_reports
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 2. Auth user creation to Profile sync
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, display_name, phone, role, account_status)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)),
        NEW.raw_user_meta_data->>'phone',
        COALESCE(NEW.raw_user_meta_data->>'role', 'customer'),
        'active'
    )
    ON CONFLICT (id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger on auth.users (if deployed in Supabase)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 3. Review Rating Sync trigger
CREATE OR REPLACE FUNCTION public.sync_provider_rating()
RETURNS TRIGGER AS $$
DECLARE
    avg_rate NUMERIC(3, 2);
    review_cnt INTEGER;
BEGIN
    SELECT COALESCE(AVG(rating), 5.0), COUNT(*)
    INTO avg_rate, review_cnt
    FROM public.reviews
    WHERE provider_id = NEW.provider_id AND moderation_status = 'published';

    UPDATE public.provider_profiles
    SET average_rating = avg_rate,
        total_reviews = review_cnt
    WHERE id = NEW.provider_id;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_sync_provider_rating
AFTER INSERT OR UPDATE ON public.reviews
FOR EACH ROW EXECUTE FUNCTION public.sync_provider_rating();
