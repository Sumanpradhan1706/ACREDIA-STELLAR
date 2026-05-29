-- 1. Create profiles table to track roles clearly
CREATE TABLE profiles (
    id UUID PRIMARY KEY REFERENCES auth.users (id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    role TEXT NOT NULL,
    full_name TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- 3. Basic RLS policies for profiles
CREATE POLICY "Profiles are viewable by everyone" ON profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);

-- 4. Create a database trigger to automatically sync auth.users into profiles.
-- Client-supplied signup metadata must not be able to create admin profiles.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, role, full_name)
  VALUES (
    new.id, 
    new.email, 
    CASE
      WHEN new.raw_user_meta_data->>'role' = 'institution' THEN 'institution'
      ELSE 'student'
    END,
    new.raw_user_meta_data->>'name'
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Prevent users from changing their own role through profile updates.
CREATE OR REPLACE FUNCTION public.prevent_profile_role_escalation()
RETURNS trigger AS $$
BEGIN
  IF old.role IS DISTINCT FROM new.role AND auth.role() <> 'service_role' THEN
    RAISE EXCEPTION 'Profile roles can only be changed by a trusted server-side admin process';
  END IF;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS prevent_profile_role_escalation ON public.profiles;
CREATE TRIGGER prevent_profile_role_escalation
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE PROCEDURE public.prevent_profile_role_escalation();

-- 5. Attach the trigger to Supabase auth table
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Optional: If you already have users in your database, run this snippet to backfill them:
-- INSERT INTO public.profiles (id, email, role, full_name)
-- SELECT id, email,
--   CASE WHEN raw_user_meta_data->>'role' = 'institution' THEN 'institution' ELSE 'student' END,
--   raw_user_meta_data->>'name'
-- FROM auth.users
-- ON CONFLICT (id) DO NOTHING;
