-- Migration: Add authorization_tx_hash column to institutions table
-- This stores the blockchain transaction hash when an institution is authorized
-- Run this in Supabase SQL Editor

-- Add the authorization_tx_hash column
ALTER TABLE institutions
ADD COLUMN IF NOT EXISTS authorization_tx_hash TEXT;

-- Add an index for faster lookups
CREATE INDEX IF NOT EXISTS idx_institutions_authorization_tx ON institutions (authorization_tx_hash);

-- Add comment
COMMENT ON COLUMN institutions.authorization_tx_hash IS 'Blockchain transaction hash from when the institution was authorized by admin';

-- Verify the column was added
SELECT
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE
    table_name = 'institutions'
    AND column_name = 'authorization_tx_hash';