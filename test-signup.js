// Quick test script to check signup with detailed logging
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testSignup() {
  const testEmail = `test${Date.now()}@example.com`;
  const testPassword = 'Test1234@@';

  console.log('🔐 Testing signup...');
  console.log('Email:', testEmail);

  // Step 1: Create user via Supabase Auth (regular signup, not admin)
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email: testEmail,
    password: testPassword
  });

  if (authError) {
    console.error('❌ Auth error:', authError);
    return;
  }

  console.log('✅ User created in auth.users:', authData.user.id);

  // Step 2: Wait a moment for trigger
  await new Promise(resolve => setTimeout(resolve, 1000));

  // Step 3: Check if user exists in public.users
  const { data: publicUser, error: publicError } = await supabase
    .from('users')
    .select('*')
    .eq('id', authData.user.id)
    .single();

  if (publicError) {
    console.error('❌ Error checking public.users:', publicError);
    return;
  }

  if (publicUser) {
    console.log('✅ User found in public.users:', publicUser);
  } else {
    console.log('❌ User NOT found in public.users');
  }

  // Step 4: Try to create subscription
  const { data: subData, error: subError } = await supabase
    .from('user_subscriptions')
    .insert({
      user_id: authData.user.id,
      plan_type: 'free',
      status: 'trial',
      max_devices: 1
    })
    .select()
    .single();

  if (subError) {
    console.error('❌ Subscription error:', subError);
  } else {
    console.log('✅ Subscription created:', subData);
  }
}

testSignup().catch(console.error);
