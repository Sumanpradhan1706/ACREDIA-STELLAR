-- ========================================
-- ADD PUBLIC VERIFICATION ACCESS TO CREDENTIALS
-- ========================================
-- This allows the /verify page to read credentials without authentication

-- Drop existing policies that might conflict
DROP POLICY IF EXISTS "Public can view credentials for verification" ON credentials;

-- Create new policy for public credential verification
CREATE POLICY "Public can view credentials for verification"
  ON credentials FOR SELECT
  USING (true);

-- Note: This allows anyone to verify credentials by token_id
-- The credentials table already has policies for students and institutions
-- This new policy works alongside them to enable public verification

-- Verify the policies
SELECT tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'credentials';
