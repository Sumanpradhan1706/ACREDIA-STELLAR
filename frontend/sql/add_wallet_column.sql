-- Add student_wallet_address column to credentials table
ALTER TABLE credentials ADD COLUMN IF NOT EXISTS student_wallet_address TEXT;
CREATE INDEX IF NOT EXISTS idx_credentials_student_wallet ON credentials(student_wallet_address);
