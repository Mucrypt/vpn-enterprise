-- Migrate Existing Users to Billing System
-- This creates default free subscriptions for all existing users

-- Create subscriptions for existing users who don't have one
INSERT INTO user_subscriptions (
    user_id,
    plan_type,
    credits_limit,
    credits_remaining,
    database_quota_gb,
    apps_limit
)
SELECT 
    u.id,
    'free',
    100,
    100,
    1,
    3
FROM "user" u
LEFT JOIN user_subscriptions us ON u.id = us.user_id
WHERE us.user_id IS NULL;

-- Show results
SELECT 
    COUNT(*) as migrated_users
FROM user_subscriptions
WHERE created_at >= NOW() - INTERVAL '1 minute';
