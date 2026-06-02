-- CANONICAL SETUP STEP 2 OF 2
-- Run after database_schema.sql. This is the production RLS policy set.

-- ========================================
-- PRODUCTION SECURITY HARDENING (RLS)
-- ========================================
-- This migration removes permissive public policies and enforces strict least-privilege access.

BEGIN;

-- Ensure RLS is enabled
ALTER TABLE IF EXISTS profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS institutions ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS students ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS credentials ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS verification_logs ENABLE ROW LEVEL SECURITY;

-- ========================================
-- Helper function: determine whether current user is admin
-- ========================================
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = auth.uid()
      AND role = 'admin'
  );
$$;

REVOKE ALL ON FUNCTION public.is_admin() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;

-- ========================================
-- Drop permissive/legacy policies
-- ========================================
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Profiles can view own profile" ON profiles;
DROP POLICY IF EXISTS "Profiles can update own profile" ON profiles;

DROP POLICY IF EXISTS "Institutions can view own data" ON institutions;
DROP POLICY IF EXISTS "Institutions can update own data" ON institutions;
DROP POLICY IF EXISTS "Anyone can insert institutions" ON institutions;
DROP POLICY IF EXISTS "Public can count institutions" ON institutions;
DROP POLICY IF EXISTS "Admin can view all institutions" ON institutions;
DROP POLICY IF EXISTS "Admin can update institutions" ON institutions;
DROP POLICY IF EXISTS "Institutions can insert own data" ON institutions;
DROP POLICY IF EXISTS "Authenticated users can read institution names" ON institutions;

DROP POLICY IF EXISTS "Students can view own data" ON students;
DROP POLICY IF EXISTS "Students can update own data" ON students;
DROP POLICY IF EXISTS "Anyone can insert students" ON students;
DROP POLICY IF EXISTS "Public can count students" ON students;
DROP POLICY IF EXISTS "Admin can view all students" ON students;
DROP POLICY IF EXISTS "Admin can update students" ON students;
DROP POLICY IF EXISTS "Students can insert own data" ON students;

DROP POLICY IF EXISTS "Students can view own credentials" ON credentials;
DROP POLICY IF EXISTS "Institutions can view issued credentials" ON credentials;
DROP POLICY IF EXISTS "Institutions can insert credentials" ON credentials;
DROP POLICY IF EXISTS "Institutions can update own credentials" ON credentials;
DROP POLICY IF EXISTS "Public can view credentials for verification" ON credentials;
DROP POLICY IF EXISTS "Admin can view all credentials" ON credentials;

DROP POLICY IF EXISTS "Anyone can insert verification logs" ON verification_logs;
DROP POLICY IF EXISTS "Anyone can view verification logs" ON verification_logs;
DROP POLICY IF EXISTS "Admin can view verification logs" ON verification_logs;
DROP POLICY IF EXISTS "Admin can insert verification logs" ON verification_logs;

-- ========================================
-- Profiles policies
-- ========================================
CREATE POLICY "Profiles can view own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Profiles can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Admin can view all profiles"
  ON profiles FOR SELECT
  USING (public.is_admin());

-- ========================================
-- Institutions policies
-- ========================================
CREATE POLICY "Institutions can view own data"
  ON institutions FOR SELECT
  USING (auth.uid() = auth_user_id);

CREATE POLICY "Institutions can update own data"
  ON institutions FOR UPDATE
  USING (auth.uid() = auth_user_id)
  WITH CHECK (auth.uid() = auth_user_id);

CREATE POLICY "Institutions can insert own data"
  ON institutions FOR INSERT
  WITH CHECK (auth.uid() = auth_user_id);

CREATE POLICY "Authenticated users can read institution names"
  ON institutions FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Admin can view all institutions"
  ON institutions FOR SELECT
  USING (public.is_admin());

CREATE POLICY "Admin can update institutions"
  ON institutions FOR UPDATE
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ========================================
-- Students policies
-- ========================================
CREATE POLICY "Students can view own data"
  ON students FOR SELECT
  USING (auth.uid() = auth_user_id);

CREATE POLICY "Students can update own data"
  ON students FOR UPDATE
  USING (auth.uid() = auth_user_id)
  WITH CHECK (auth.uid() = auth_user_id);

CREATE POLICY "Students can insert own data"
  ON students FOR INSERT
  WITH CHECK (auth.uid() = auth_user_id);

CREATE POLICY "Admin can view all students"
  ON students FOR SELECT
  USING (public.is_admin());

CREATE POLICY "Admin can update students"
  ON students FOR UPDATE
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ========================================
-- Credentials policies
-- ========================================
CREATE POLICY "Students can view own credentials"
  ON credentials FOR SELECT
  USING (
    student_id IN (
      SELECT id FROM students WHERE auth_user_id = auth.uid()
    )
  );

CREATE POLICY "Institutions can view issued credentials"
  ON credentials FOR SELECT
  USING (
    institution_id IN (
      SELECT id FROM institutions WHERE auth_user_id = auth.uid()
    )
  );

CREATE POLICY "Institutions can insert credentials"
  ON credentials FOR INSERT
  WITH CHECK (
    institution_id IN (
      SELECT id FROM institutions WHERE auth_user_id = auth.uid()
    )
  );

CREATE POLICY "Institutions can update own credentials"
  ON credentials FOR UPDATE
  USING (
    institution_id IN (
      SELECT id FROM institutions WHERE auth_user_id = auth.uid()
    )
  )
  WITH CHECK (
    institution_id IN (
      SELECT id FROM institutions WHERE auth_user_id = auth.uid()
    )
  );

CREATE POLICY "Admin can view all credentials"
  ON credentials FOR SELECT
  USING (public.is_admin());

-- ========================================
-- Verification logs policies
-- ========================================
CREATE POLICY "Admin can view verification logs"
  ON verification_logs FOR SELECT
  USING (public.is_admin());

CREATE POLICY "Admin can insert verification logs"
  ON verification_logs FOR INSERT
  WITH CHECK (public.is_admin());

CREATE POLICY "Anyone can insert verification logs"
  ON verification_logs FOR INSERT
  WITH CHECK (true);

COMMIT;
