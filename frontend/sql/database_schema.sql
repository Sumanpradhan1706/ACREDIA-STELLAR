-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Institutions table
CREATE TABLE institutions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4 (),
    auth_user_id UUID REFERENCES auth.users (id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    wallet_address TEXT UNIQUE,
    verified BOOLEAN DEFAULT false,
    authorization_tx_hash TEXT,
    created_at TIMESTAMP
    WITH
        TIME ZONE DEFAULT NOW()
);

-- Students table
CREATE TABLE students (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4 (),
    auth_user_id UUID REFERENCES auth.users (id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    wallet_address TEXT UNIQUE,
    created_at TIMESTAMP
    WITH
        TIME ZONE DEFAULT NOW()
);

-- Credentials table
CREATE TABLE credentials (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4 (),
    student_id UUID REFERENCES students (id) ON DELETE CASCADE,
    student_wallet_address TEXT,
    institution_id UUID REFERENCES institutions (id) ON DELETE CASCADE,
    issuer_wallet_address TEXT,
    token_id TEXT UNIQUE NOT NULL,
    ipfs_hash TEXT NOT NULL,
    blockchain_hash TEXT NOT NULL,
    metadata JSONB NOT NULL,
    issued_at TIMESTAMP
    WITH
        TIME ZONE DEFAULT NOW(),
        revoked BOOLEAN DEFAULT false,
        revoked_at TIMESTAMP
    WITH
        TIME ZONE
);

-- Verification logs table
CREATE TABLE verification_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4 (),
    credential_id UUID REFERENCES credentials (id) ON DELETE SET NULL,
    verifier_email TEXT,
    verifier_org TEXT,
    verification_result JSONB NOT NULL,
    created_at TIMESTAMP
    WITH
        TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_institutions_auth_user ON institutions (auth_user_id);

CREATE INDEX idx_institutions_wallet ON institutions (wallet_address);

CREATE INDEX idx_students_auth_user ON students (auth_user_id);

CREATE INDEX idx_students_wallet ON students (wallet_address);

CREATE INDEX idx_credentials_student ON credentials (student_id);

CREATE INDEX idx_credentials_institution ON credentials (institution_id);

CREATE INDEX idx_credentials_token ON credentials (token_id);

CREATE INDEX idx_verification_logs_credential ON verification_logs (credential_id);

-- Enable Row Level Security
ALTER TABLE institutions ENABLE ROW LEVEL SECURITY;

ALTER TABLE students ENABLE ROW LEVEL SECURITY;

ALTER TABLE credentials ENABLE ROW LEVEL SECURITY;

ALTER TABLE verification_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for Institutions
CREATE POLICY "Institutions can view own data" ON institutions FOR
SELECT USING (auth.uid () = auth_user_id);

CREATE POLICY "Institutions can update own data" ON institutions FOR
UPDATE USING (auth.uid () = auth_user_id);

CREATE POLICY "Anyone can insert institutions" ON institutions FOR
INSERT
WITH
    CHECK (true);

-- RLS Policies for Students
CREATE POLICY "Students can view own data" ON students FOR
SELECT USING (auth.uid () = auth_user_id);

CREATE POLICY "Students can update own data" ON students FOR
UPDATE USING (auth.uid () = auth_user_id);

CREATE POLICY "Anyone can insert students" ON students FOR
INSERT
WITH
    CHECK (true);

-- RLS Policies for Credentials
CREATE POLICY "Students can view own credentials" ON credentials FOR
SELECT USING (
        student_id IN (
            SELECT id
            FROM students
            WHERE
                auth_user_id = auth.uid ()
        )
    );

CREATE POLICY "Institutions can view issued credentials" ON credentials FOR
SELECT USING (
        institution_id IN (
            SELECT id
            FROM institutions
            WHERE
                auth_user_id = auth.uid ()
        )
    );

CREATE POLICY "Institutions can insert credentials" ON credentials FOR
INSERT
WITH
    CHECK (
        institution_id IN (
            SELECT id
            FROM institutions
            WHERE
                auth_user_id = auth.uid ()
        )
    );

CREATE POLICY "Institutions can update own credentials" ON credentials FOR
UPDATE USING (
    institution_id IN (
        SELECT id
        FROM institutions
        WHERE
            auth_user_id = auth.uid ()
    )
);

-- RLS Policies for Verification Logs (public read for verification portal)
CREATE POLICY "Anyone can insert verification logs" ON verification_logs FOR
INSERT
WITH
    CHECK (true);

CREATE POLICY "Anyone can view verification logs" ON verification_logs FOR
SELECT USING (true);