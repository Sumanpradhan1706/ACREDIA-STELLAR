-- Migration: Add Admin Access Policies
-- This allows admin users to view all data for dashboard statistics

-- Option 1: Simple approach - Allow service role key to bypass RLS
-- (Already enabled by default for service_role key)

-- Option 2: Create admin-specific policies based on email
-- Add policies to allow specific admin emails to view all data

-- Drop existing restrictive policies for institutions
DROP POLICY IF EXISTS "Institutions can view own data" ON institutions;

-- Create new policies for institutions
CREATE POLICY "Institutions can view own data"
  ON institutions FOR SELECT
  USING (auth.uid() = auth_user_id);

-- Add policy for admin to view all institutions
-- Replace 'admin@acredia.com' with your actual admin email
CREATE POLICY "Admin can view all institutions"
  ON institutions FOR SELECT
  USING (
    auth.jwt() ->> 'email' = 'admin@acredia.com'
  );

-- Alternative: If you want to use a specific admin table
-- CREATE TABLE admins (
--   id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
--   auth_user_id UUID REFERENCES auth.users(id) UNIQUE,
--   email TEXT UNIQUE NOT NULL,
--   created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
-- );
-- 
-- CREATE POLICY "Admin can view all institutions"
--   ON institutions FOR SELECT
--   USING (
--     auth.uid() IN (SELECT auth_user_id FROM admins)
--   );

-- For now, the easiest solution is to use the service_role key in the admin dashboard
-- or temporarily disable RLS for testing

-- To disable RLS temporarily (NOT RECOMMENDED FOR PRODUCTION):
-- ALTER TABLE institutions DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE students DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE credentials DISABLE ROW LEVEL SECURITY;
