-- ========================================
-- ENABLE PUBLIC READ FOR ADMIN STATS API
-- ========================================
-- This allows the admin stats API to count records without authentication

-- Allow anyone to count institutions
DROP POLICY IF EXISTS "Public can count institutions" ON institutions;
CREATE POLICY "Public can count institutions"
  ON institutions FOR SELECT
  USING (true);

-- Allow anyone to count students  
DROP POLICY IF EXISTS "Public can count students" ON students;
CREATE POLICY "Public can count students"
  ON students FOR SELECT
  USING (true);

-- Note: credentials already has public read access from verification fix

-- Verify the policies are in place
SELECT 
    schemaname,
    tablename, 
    policyname, 
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies 
WHERE tablename IN ('institutions', 'students', 'credentials')
ORDER BY tablename, policyname;
