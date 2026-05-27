-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Profiles table to easily view roles (admin, institution, student)
CREATE TABLE profiles (
    id UUID PRIMARY KEY REFERENCES auth.users (id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    role TEXT NOT NULL,
    full_name TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Function to handle new user signups and mirror to profiles table
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, role, full_name)
  VALUES (
    new.id, 
    new.email, 
    COALESCE(new.raw_user_meta_data->>'role', 'student'),
    new.raw_user_meta_data->>'name'
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

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

-- Function to automatically create institution records on signup.
CREATE OR REPLACE FUNCTION public.handle_new_institution_user()
RETURNS trigger AS $$
BEGIN
  IF new.raw_user_meta_data->>'role' = 'institution' THEN
    INSERT INTO public.institutions (auth_user_id, name, email)
    VALUES (
      new.id,
      COALESCE(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
      new.email
    )
    ON CONFLICT (email) DO UPDATE
      SET auth_user_id = EXCLUDED.auth_user_id
      WHERE public.institutions.auth_user_id IS NULL;
  END IF;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS on_auth_user_created_institution ON auth.users;
CREATE TRIGGER on_auth_user_created_institution
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_institution_user();

-- Function to automatically create student records on signup.
CREATE OR REPLACE FUNCTION public.handle_new_student_user()
RETURNS trigger AS $$
BEGIN
  IF new.raw_user_meta_data->>'role' = 'student' THEN
    INSERT INTO public.students (auth_user_id, name, email)
    VALUES (
      new.id,
      COALESCE(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
      new.email
    )
    ON CONFLICT (email) DO UPDATE
      SET auth_user_id = EXCLUDED.auth_user_id
      WHERE public.students.auth_user_id IS NULL;
  END IF;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS on_auth_user_created_student ON auth.users;
CREATE TRIGGER on_auth_user_created_student
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_student_user();

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

-- Policies are intentionally defined in secure_rls_migration.sql.
-- Keep this base schema policy-free so new deployments do not briefly
-- create permissive public insert/read policies before hardening.
