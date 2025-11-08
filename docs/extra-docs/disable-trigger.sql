-- =============================================
-- EMERGENCY FIX: Disable trigger temporarily
-- Run this to allow signups while we debug
-- =============================================

-- Remove the trigger completely
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;

-- Disable RLS on users table temporarily
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;

-- Verify
SELECT 
  'Trigger removed: ' || CASE WHEN NOT EXISTS (
    SELECT FROM pg_trigger WHERE tgname = 'on_auth_user_created'
  ) THEN '✅ SUCCESS' ELSE '❌ STILL EXISTS' END as status;
