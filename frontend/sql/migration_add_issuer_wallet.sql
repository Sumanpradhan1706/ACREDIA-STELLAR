-- Migration: Add issuer_wallet_address to credentials table
-- Run this in Supabase SQL Editor

ALTER TABLE credentials 
ADD COLUMN IF NOT EXISTS issuer_wallet_address TEXT;

-- Add student_wallet_address if it doesn't exist
ALTER TABLE credentials 
ADD COLUMN IF NOT EXISTS student_wallet_address TEXT;

-- Update existing credentials with institution wallet from institutions table
UPDATE credentials c
SET issuer_wallet_address = i.wallet_address
FROM institutions i
WHERE c.institution_id = i.id
AND c.issuer_wallet_address IS NULL;

-- Add comment
COMMENT ON COLUMN credentials.issuer_wallet_address IS 'Wallet address of the institution that issued the credential';
COMMENT ON COLUMN credentials.student_wallet_address IS 'Wallet address of the student who owns the credential';
