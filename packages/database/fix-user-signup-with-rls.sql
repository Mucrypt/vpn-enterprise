-- =============================================
-- FIX USER SIGNUP WITH RLS - Run this in Supabase SQL Editor
-- =============================================
-- This fixes the trigger to work with Row Level Security
-- =============================================

-- Step 1: Make sure user_role_enum exists
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role_enum') THEN
        CREATE TYPE user_role_enum AS ENUM ('user', 'admin', 'support');
    END IF;
END $$;

-- Step 2: Drop existing trigger and function
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Step 3: Create the auto-user-creation trigger function with SECURITY DEFINER
-- This allows it to bypass RLS policies
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER 
SECURITY DEFINER -- This is the key - runs with function owner's privileges
SET search_path = public, auth
AS $$
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
EXCEPTION
  WHEN OTHERS THEN
    -- Log the error but don't fail the auth.users insert
    RAISE WARNING 'Failed to create user profile: %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 4: Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO authenticated;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO service_role;

-- Step 5: Create the trigger on auth.users
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Step 6: Create RLS policy to allow the function to insert
DROP POLICY IF EXISTS "Allow trigger to insert new users" ON public.users;
CREATE POLICY "Allow trigger to insert new users"
  ON public.users
  FOR INSERT
  WITH CHECK (true);

-- Step 7: Ensure users can read their own data
DROP POLICY IF EXISTS "Users can read own data" ON public.users;
CREATE POLICY "Users can read own data"
  ON public.users
  FOR SELECT
  USING (auth.uid() = id);

-- Step 8: Ensure users can update their own data
DROP POLICY IF EXISTS "Users can update own data" ON public.users;
CREATE POLICY "Users can update own data"
  ON public.users
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Step 9: Verify everything is set up
SELECT 
  'Organizations table: ' || CASE WHEN EXISTS (
    SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'organizations'
  ) THEN '✅ EXISTS' ELSE '❌ MISSING' END as organizations,
  
  'Users table: ' || CASE WHEN EXISTS (
    SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'users'
  ) THEN '✅ EXISTS' ELSE '❌ MISSING' END as users,
  
  'Trigger: ' || CASE WHEN EXISTS (
    SELECT FROM pg_trigger WHERE tgname = 'on_auth_user_created'
  ) THEN '✅ CREATED' ELSE '❌ MISSING' END as trigger_status,
  
  'RLS Policy: ' || CASE WHEN EXISTS (
    SELECT FROM pg_policies WHERE tablename = 'users' AND policyname = 'Allow trigger to insert new users'
  ) THEN '✅ CREATED' ELSE '❌ MISSING' END as rls_policy;

-- Done! Try signing up now.
