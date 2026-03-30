-- ============================================
-- FIX STUDENT CREDENTIALS - Migration Script
-- ============================================
-- Run this in Supabase SQL Editor
-- This will fix existing credentials to work with the new system

-- Step 1: Add the new column if it doesn't exist
ALTER TABLE credentials 
ADD COLUMN IF NOT EXISTS student_wallet_address TEXT;

-- Step 2: Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_credentials_student_wallet 
ON credentials(student_wallet_address);

-- Step 3: Update existing credentials with wallet addresses from metadata
-- This copies the studentWallet from the metadata JSON to the new column
UPDATE credentials
SET student_wallet_address = metadata->'credentialData'->>'studentWallet'
WHERE student_wallet_address IS NULL 
  AND metadata->'credentialData'->>'studentWallet' IS NOT NULL;

-- Step 4: Verify the update
SELECT 
    token_id,
    student_wallet_address,
    metadata->'credentialData'->>'studentWallet' as wallet_from_metadata,
    CASE 
        WHEN student_wallet_address IS NOT NULL THEN '✅ Has wallet'
        ELSE '❌ Missing wallet'
    END as status
FROM credentials
ORDER BY issued_at DESC;

-- Step 5: Show statistics
SELECT 
    COUNT(*) as total_credentials,
    COUNT(student_wallet_address) as credentials_with_wallet,
    COUNT(*) - COUNT(student_wallet_address) as credentials_missing_wallet
FROM credentials;
