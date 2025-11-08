-- =============================================
-- Enable RLS and Create Proper Policies for users table
-- =============================================

-- Step 1: Enable RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Step 2: Drop any existing policies
DROP POLICY IF EXISTS "Service role has full access" ON public.users;
DROP POLICY IF EXISTS "Users can read own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
DROP POLICY IF EXISTS "Enable insert for service role" ON public.users;

-- Step 3: Create comprehensive RLS policies

-- Allow service_role to do anything (needed for trigger)
CREATE POLICY "Service role has full access"
  ON public.users
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Allow users to read their own profile
CREATE POLICY "Users can read own profile"
  ON public.users
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- Allow users to update their own profile
CREATE POLICY "Users can update own profile"
  ON public.users
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Step 4: Verify RLS is enabled
SELECT 
  schemaname,
  tablename,
  CASE 
    WHEN rowsecurity THEN '✅ RLS ENABLED'
    ELSE '❌ RLS DISABLED'
  END as rls_status,
  (SELECT COUNT(*) FROM pg_policies WHERE tablename = 'users') || ' policies' as policy_count
FROM pg_tables 
WHERE schemaname = 'public' AND tablename = 'users';
