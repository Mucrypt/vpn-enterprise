-- =============================================
-- FIX USER SIGNUP - Run this in Supabase SQL Editor
-- =============================================
-- This assumes organizations table already exists
-- =============================================

-- Step 1: Make sure user_role_enum exists
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role_enum') THEN
        CREATE TYPE user_role_enum AS ENUM ('user', 'admin', 'support');
    END IF;
END $$;

-- Step 2: Create the auto-user-creation trigger function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (
    id, 
    email, 
    full_name, 
    email_verified, 
    role,
    organization_id
  )
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    NEW.email_confirmed_at IS NOT NULL,
    COALESCE((NEW.raw_user_meta_data->>'role')::user_role_enum, 'user'::user_role_enum),
    NULL  -- No organization by default
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    email_verified = EXCLUDED.email_verified;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 3: Create the trigger on auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Step 4: Verify everything is set up
SELECT 
  'Organizations table: ' || CASE WHEN EXISTS (
    SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'organizations'
  ) THEN '✅ EXISTS' ELSE '❌ MISSING' END as organizations,
  
  'Users table: ' || CASE WHEN EXISTS (
    SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'users'
  ) THEN '✅ EXISTS' ELSE '❌ MISSING' END as users,
  
  'Trigger: ' || CASE WHEN EXISTS (
    SELECT FROM pg_trigger WHERE tgname = 'on_auth_user_created'
  ) THEN '✅ CREATED' ELSE '❌ MISSING' END as trigger_status;

-- Done! Try signing up now.

