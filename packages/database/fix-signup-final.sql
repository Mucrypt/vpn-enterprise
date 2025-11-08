-- =============================================
-- FINAL FIX: Non-blocking trigger for user signup
-- Run this in Supabase SQL Editor
-- =============================================

-- Step 1: Drop existing trigger and function
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;

-- Step 2: Create a completely safe trigger function
-- This version will NEVER block user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public, auth
LANGUAGE plpgsql
AS $$
DECLARE
  user_role user_role_enum;
BEGIN
  -- Try to get role from metadata, default to 'user'
  BEGIN
    user_role := COALESCE((NEW.raw_user_meta_data->>'role')::user_role_enum, 'user'::user_role_enum);
  EXCEPTION
    WHEN OTHERS THEN
      user_role := 'user'::user_role_enum;
  END;

  -- Insert into public.users
  BEGIN
    INSERT INTO public.users (
      id, 
      email, 
      full_name, 
      email_verified, 
      role,
      organization_id,
      created_at,
      updated_at
    )
    VALUES (
      NEW.id,
      NEW.email,
      COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
      (NEW.email_confirmed_at IS NOT NULL),
      user_role,
      NULL,
      NOW(),
      NOW()
    )
    ON CONFLICT (id) DO UPDATE SET
      email = EXCLUDED.email,
      email_verified = EXCLUDED.email_verified,
      updated_at = NOW();
      
    RAISE LOG 'Successfully created user profile for %', NEW.email;
  EXCEPTION
    WHEN OTHERS THEN
      -- Log error but DON'T prevent user creation
      RAISE WARNING 'Error creating user profile for %: %', NEW.email, SQLERRM;
  END;
  
  -- Always return NEW to allow auth.users insert to succeed
  RETURN NEW;
END;
$$;

-- Step 3: Grant permissions
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO postgres;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO service_role;

-- Step 4: Disable RLS temporarily on users table for the trigger
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;

-- Step 5: Create the trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Step 6: Re-enable RLS and create proper policies
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Drop all existing policies first
DROP POLICY IF EXISTS "Allow trigger to insert new users" ON public.users;
DROP POLICY IF EXISTS "Users can read own data" ON public.users;
DROP POLICY IF EXISTS "Users can update own data" ON public.users;
DROP POLICY IF EXISTS "Service role can do anything" ON public.users;
DROP POLICY IF EXISTS "Service role bypass" ON public.users;
DROP POLICY IF EXISTS "Users can read own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
DROP POLICY IF EXISTS "Allow authenticated inserts" ON public.users;
DROP POLICY IF EXISTS "Allow anon inserts for signup" ON public.users;

-- Create comprehensive RLS policies
CREATE POLICY "Service role bypass"
  ON public.users
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Users can read own profile"
  ON public.users
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.users
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Allow inserts from anyone (for trigger)
CREATE POLICY "Allow authenticated inserts"
  ON public.users
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow anon inserts for signup"
  ON public.users
  FOR INSERT
  TO anon
  WITH CHECK (true);

-- Step 7: Verify setup
SELECT 
  'Users table: ' || CASE WHEN EXISTS (
    SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'users'
  ) THEN '✅ EXISTS' ELSE '❌ MISSING' END as status,
  
  'Trigger: ' || CASE WHEN EXISTS (
    SELECT FROM pg_trigger WHERE tgname = 'on_auth_user_created'
  ) THEN '✅ CREATED' ELSE '❌ MISSING' END as trigger_status,
  
  'Policies: ' || COUNT(*)::TEXT || ' RLS policies active' as policies
FROM pg_policies 
WHERE tablename = 'users';

-- Test the function manually (optional)
-- SELECT public.handle_new_user();
