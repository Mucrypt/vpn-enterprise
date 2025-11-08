-- Remove the security settings trigger that's blocking signups
DROP TRIGGER IF EXISTS on_auth_user_created_security ON auth.users;
DROP FUNCTION IF EXISTS create_default_security_settings() CASCADE;

-- Verify it's gone
SELECT 
  'Security trigger removed: ' || CASE WHEN NOT EXISTS (
    SELECT FROM pg_trigger WHERE tgname = 'on_auth_user_created_security'
  ) THEN '✅ SUCCESS' ELSE '❌ STILL EXISTS' END as status;
