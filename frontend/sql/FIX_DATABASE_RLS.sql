-- ========================================
-- FIX SUPABASE RLS AND MISSING INSTITUTION DATA
-- ========================================

-- Problem 1: The credentials INSERT policy requires institution_id to exist
-- But institutions table is empty! Users register but aren't added to institutions table

-- Problem 2: Need to populate institutions table from auth.users
-- Problem 3: Need better RLS policies

-- ========================================
-- STEP 1: Create function to auto-populate institutions table
-- ========================================

-- Function to automatically create institution record when user registers
CREATE OR REPLACE FUNCTION public.handle_new_institution_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Only create institution record if role is 'institution'
  IF NEW.raw_user_meta_data->>'role' = 'institution' THEN
    INSERT INTO public.institutions (auth_user_id, name, email)
    VALUES (
      NEW.id,
      COALESCE(NEW.raw_user_meta_data->>'name', NEW.email),
      NEW.email
    )
    ON CONFLICT (email) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to run function on user creation
DROP TRIGGER IF EXISTS on_auth_user_created_institution ON auth.users;
CREATE TRIGGER on_auth_user_created_institution
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_institution_user();

-- ========================================
-- STEP 2: Create function to auto-populate students table
-- ========================================

CREATE OR REPLACE FUNCTION public.handle_new_student_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Only create student record if role is 'student'
  IF NEW.raw_user_meta_data->>'role' = 'student' THEN
    INSERT INTO public.students (auth_user_id, name, email)
    VALUES (
      NEW.id,
      COALESCE(NEW.raw_user_meta_data->>'name', NEW.email),
      NEW.email
    )
    ON CONFLICT (email) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for students
DROP TRIGGER IF EXISTS on_auth_user_created_student ON auth.users;
CREATE TRIGGER on_auth_user_created_student
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_student_user();

-- ========================================
-- STEP 3: Backfill existing users into institutions/students tables
-- ========================================

-- Insert existing institution users
INSERT INTO public.institutions (auth_user_id, name, email)
SELECT 
  id,
  COALESCE(raw_user_meta_data->>'name', email),
  email
FROM auth.users
WHERE raw_user_meta_data->>'role' = 'institution'
ON CONFLICT (email) DO NOTHING;

-- Insert existing student users
INSERT INTO public.students (auth_user_id, name, email)
SELECT 
  id,
  COALESCE(raw_user_meta_data->>'name', email),
  email
FROM auth.users
WHERE raw_user_meta_data->>'role' = 'student'
ON CONFLICT (email) DO NOTHING;

-- ========================================
-- STEP 4: Fix RLS Policies for Credentials
-- ========================================

-- Drop existing policies
DROP POLICY IF EXISTS "Institutions can insert credentials" ON credentials;
DROP POLICY IF EXISTS "Students can view own credentials" ON credentials;
DROP POLICY IF EXISTS "Institutions can view issued credentials" ON credentials;
DROP POLICY IF EXISTS "Institutions can update own credentials" ON credentials;

-- Better policy: Allow institutions to insert credentials
CREATE POLICY "Institutions can insert credentials"
  ON credentials FOR INSERT
  WITH CHECK (
    -- Check if the user is an institution
    EXISTS (
      SELECT 1 FROM institutions 
      WHERE auth_user_id = auth.uid() 
      AND id = institution_id
    )
  );

-- Allow institutions to view their issued credentials
CREATE POLICY "Institutions can view issued credentials"
  ON credentials FOR SELECT
  USING (
    institution_id IN (
      SELECT id FROM institutions WHERE auth_user_id = auth.uid()
    )
  );

-- Allow students to view their own credentials
CREATE POLICY "Students can view own credentials"
  ON credentials FOR SELECT
  USING (
    student_id IN (
      SELECT id FROM students WHERE auth_user_id = auth.uid()
    )
  );

-- Allow institutions to update their issued credentials (for revocation)
CREATE POLICY "Institutions can update own credentials"
  ON credentials FOR UPDATE
  USING (
    institution_id IN (
      SELECT id FROM institutions WHERE auth_user_id = auth.uid()
    )
  );

-- ========================================
-- STEP 5: Add helper function to get institution_id by auth_user_id
-- ========================================

CREATE OR REPLACE FUNCTION public.get_institution_id_by_auth_id(auth_id UUID)
RETURNS UUID AS $$
  SELECT id FROM public.institutions WHERE auth_user_id = auth_id LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER;

-- ========================================
-- STEP 6: Add helper function to get student_id by wallet
-- ========================================

CREATE OR REPLACE FUNCTION public.get_or_create_student_by_wallet(
  student_wallet TEXT,
  student_name TEXT DEFAULT 'Student'
)
RETURNS UUID AS $$
DECLARE
  student_uuid UUID;
BEGIN
  -- Try to find existing student
  SELECT id INTO student_uuid
  FROM public.students
  WHERE wallet_address = student_wallet
  LIMIT 1;
  
  -- If not found, create new student record
  IF student_uuid IS NULL THEN
    INSERT INTO public.students (name, email, wallet_address)
    VALUES (
      student_name,
      student_wallet || '@wallet.address', -- temporary email
      student_wallet
    )
    RETURNING id INTO student_uuid;
  END IF;
  
  RETURN student_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ========================================
-- VERIFICATION: Check if setup worked
-- ========================================

-- Check institutions table
SELECT 'Institutions count:' as info, COUNT(*) as count FROM institutions;

-- Check students table  
SELECT 'Students count:' as info, COUNT(*) as count FROM students;

-- Check RLS policies
SELECT 'RLS Policies on credentials:' as info, COUNT(*) as count 
FROM pg_policies 
WHERE tablename = 'credentials';

SELECT '✅ Setup complete!' as status;
