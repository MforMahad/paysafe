-- Migration 1: Multi-Tenant Auth Architecture (Hardened Security)
-- Description: Creates public.businesses, public.users, public.memberships, triggers, helper functions, RPCs, and RLS policies.

BEGIN;

-- -----------------------------------------------------------------------------
-- 1. UTILITY FUNCTIONS & TRIGGERS
-- -----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- -----------------------------------------------------------------------------
-- 2. TABLE CREATION
-- -----------------------------------------------------------------------------

-- 1. businesses
CREATE TABLE IF NOT EXISTS public.businesses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  legal_name TEXT NOT NULL,
  display_name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT chk_businesses_legal_name_not_empty CHECK (length(trim(legal_name)) > 0),
  CONSTRAINT chk_businesses_display_name_not_empty CHECK (length(trim(display_name)) > 0),
  CONSTRAINT chk_businesses_slug_lowercase CHECK (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$')
);

-- 2. users
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT NULL,
  avatar_url TEXT NULL,
  last_accessed_business_id UUID NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Deferred FK for circular reference
ALTER TABLE public.users
  ADD CONSTRAINT fk_users_last_accessed_business
  FOREIGN KEY (last_accessed_business_id)
  REFERENCES public.businesses(id)
  ON DELETE SET NULL;

-- 3. memberships
CREATE TABLE IF NOT EXISTS public.memberships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'staff',
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT chk_memberships_role CHECK (role IN ('admin', 'staff')),
  CONSTRAINT chk_memberships_status CHECK (status IN ('active', 'pending')),
  CONSTRAINT uq_memberships_user_business UNIQUE (user_id, business_id)
);

-- -----------------------------------------------------------------------------
-- 3. INDEXES
-- -----------------------------------------------------------------------------

CREATE INDEX IF NOT EXISTS idx_memberships_user_id 
  ON public.memberships(user_id);

CREATE INDEX IF NOT EXISTS idx_memberships_business_id 
  ON public.memberships(business_id);

CREATE INDEX IF NOT EXISTS idx_memberships_active_user_business 
  ON public.memberships(user_id, business_id) 
  WHERE status = 'active';

CREATE INDEX IF NOT EXISTS idx_users_last_accessed_business_id 
  ON public.users(last_accessed_business_id) 
  WHERE last_accessed_business_id IS NOT NULL;

-- -----------------------------------------------------------------------------
-- 4. UPDATED_AT TRIGGERS
-- -----------------------------------------------------------------------------

CREATE TRIGGER trg_businesses_updated_at
  BEFORE UPDATE ON public.businesses
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER trg_users_updated_at
  BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER trg_memberships_updated_at
  BEFORE UPDATE ON public.memberships
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- -----------------------------------------------------------------------------
-- 5. AUTH PROFILE TRIGGER
-- -----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.users (id, email, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'avatar_url'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- -----------------------------------------------------------------------------
-- 6. HARDENED RLS HELPER FUNCTIONS
-- -----------------------------------------------------------------------------

-- Checks if the calling user (auth.uid()) is an active member of the specified business.
CREATE OR REPLACE FUNCTION public.is_active_business_member(_business_id UUID)
RETURNS BOOLEAN
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN FALSE;
  END IF;

  RETURN EXISTS (
    SELECT 1 
    FROM public.memberships
    WHERE user_id = auth.uid()
      AND business_id = _business_id 
      AND status = 'active'
  );
END;
$$ LANGUAGE plpgsql;

-- Checks if the calling user (auth.uid()) is an active admin of the specified business.
CREATE OR REPLACE FUNCTION public.is_business_admin(_business_id UUID)
RETURNS BOOLEAN
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN FALSE;
  END IF;

  RETURN EXISTS (
    SELECT 1 
    FROM public.memberships
    WHERE user_id = auth.uid()
      AND business_id = _business_id 
      AND role = 'admin'
      AND status = 'active'
  );
END;
$$ LANGUAGE plpgsql;

REVOKE EXECUTE ON FUNCTION public.is_active_business_member(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_active_business_member(UUID) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.is_business_admin(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_business_admin(UUID) TO authenticated;

-- -----------------------------------------------------------------------------
-- 7. SECURE RPC FOR INVITATION ACCEPTANCE
-- -----------------------------------------------------------------------------

-- Securely accepts a pending invitation for the authenticated user without trusting client mutation parameters.
CREATE OR REPLACE FUNCTION public.accept_business_invitation(_membership_id UUID)
RETURNS public.memberships
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_membership public.memberships;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required.';
  END IF;

  SELECT * INTO v_membership
  FROM public.memberships
  WHERE id = _membership_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Membership invitation not found.';
  END IF;

  IF v_membership.user_id <> auth.uid() THEN
    RAISE EXCEPTION 'Unauthorized: Invitation belongs to another user.';
  END IF;

  IF v_membership.status <> 'pending' THEN
    RAISE EXCEPTION 'Invalid operation: Membership is not in pending status.';
  END IF;

  UPDATE public.memberships
  SET status = 'active',
      updated_at = now()
  WHERE id = _membership_id
  RETURNING * INTO v_membership;

  RETURN v_membership;
END;
$$ LANGUAGE plpgsql;

REVOKE EXECUTE ON FUNCTION public.accept_business_invitation(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.accept_business_invitation(UUID) TO authenticated;

-- -----------------------------------------------------------------------------
-- 8. ROW LEVEL SECURITY (RLS) POLICIES
-- -----------------------------------------------------------------------------

ALTER TABLE public.businesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.memberships ENABLE ROW LEVEL SECURITY;

-- --- PUBLIC.USERS POLICIES ---

CREATE POLICY users_select_self_or_co_members ON public.users
  FOR SELECT TO authenticated
  USING (
    id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.memberships m1
      JOIN public.memberships m2 ON m1.business_id = m2.business_id
      WHERE m1.user_id = auth.uid()
        AND m1.status = 'active'
        AND m2.user_id = public.users.id
        AND m2.status = 'active'
    )
  );

CREATE POLICY users_update_own_profile ON public.users
  FOR UPDATE TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- --- PUBLIC.BUSINESSES POLICIES ---

CREATE POLICY businesses_select_active_members ON public.businesses
  FOR SELECT TO authenticated
  USING (
    public.is_active_business_member(id)
  );

CREATE POLICY businesses_insert_onboarding ON public.businesses
  FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE POLICY businesses_update_admins ON public.businesses
  FOR UPDATE TO authenticated
  USING (
    public.is_business_admin(id)
  )
  WITH CHECK (
    public.is_business_admin(id)
  );

-- --- PUBLIC.MEMBERSHIPS POLICIES ---

CREATE POLICY memberships_select_self_or_active_members ON public.memberships
  FOR SELECT TO authenticated
  USING (
    user_id = auth.uid()
    OR public.is_active_business_member(business_id)
  );

CREATE POLICY memberships_insert_initial_admin_or_invite ON public.memberships
  FOR INSERT TO authenticated
  WITH CHECK (
    -- Onboarding: user adding themselves as active admin
    (user_id = auth.uid() AND role = 'admin' AND status = 'active')
    -- Admin invitation: active admin adding another user as pending
    OR (public.is_business_admin(business_id) AND status = 'pending')
  );

CREATE POLICY memberships_update_admin_only ON public.memberships
  FOR UPDATE TO authenticated
  USING (
    public.is_business_admin(business_id)
  )
  WITH CHECK (
    public.is_business_admin(business_id)
  );

CREATE POLICY memberships_delete_admin_or_self_leave ON public.memberships
  FOR DELETE TO authenticated
  USING (
    public.is_business_admin(business_id)
    OR user_id = auth.uid()
  );

COMMIT;