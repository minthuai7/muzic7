/*
  # Create Default Admin Account

  1. New Features
    - Creates a default admin user account
    - Grants admin privileges to the default account
    - Sets up user profile for the admin
    - Provides initial subscription for the admin

  2. Default Admin Credentials
    - Email: admin@muzai.com
    - Password: AdminMuzAI2024!
    - Role: super_admin
    - All permissions granted

  3. Security
    - Admin user is created with secure defaults
    - Profile is automatically set up
    - Subscription includes unlimited generations

  IMPORTANT: Change the default password after first login!
*/

-- Create default admin user in auth.users
INSERT INTO auth.users (
  id,
  instance_id,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  role,
  aud,
  confirmation_token,
  email_change_token_new,
  recovery_token
) VALUES (
  '00000000-0000-0000-0000-000000000001'::uuid,
  '00000000-0000-0000-0000-000000000000'::uuid,
  'admin@muzai.com',
  crypt('AdminMuzAI2024!', gen_salt('bf')),
  now(),
  now(),
  now(),
  'authenticated',
  'authenticated',
  '',
  '',
  ''
) ON CONFLICT (id) DO NOTHING;

-- Create user profile for admin
INSERT INTO user_profiles (
  id,
  username,
  display_name,
  avatar_url,
  bio,
  created_at,
  updated_at
) VALUES (
  '00000000-0000-0000-0000-000000000001'::uuid,
  'admin',
  'System Administrator',
  'https://images.pexels.com/photos/1105666/pexels-photo-1105666.jpeg?auto=compress&cs=tinysrgb&w=800',
  'Default system administrator account for MuzAI platform',
  now(),
  now()
) ON CONFLICT (id) DO NOTHING;

-- Grant admin privileges
INSERT INTO admin_users (
  id,
  role,
  permissions,
  is_active,
  created_at,
  updated_at
) VALUES (
  '00000000-0000-0000-0000-000000000001'::uuid,
  'super_admin',
  ARRAY['manage_payments', 'manage_users', 'manage_content', 'system_admin'],
  true,
  now(),
  now()
) ON CONFLICT (id) DO NOTHING;

-- Create premium subscription for admin
INSERT INTO user_subscriptions (
  id,
  user_id,
  plan_type,
  monthly_limit,
  current_usage,
  reset_date,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000001'::uuid,
  'premium',
  999999,
  0,
  (date_trunc('month', now()) + '1 mon'::interval),
  now(),
  now()
) ON CONFLICT (user_id) DO NOTHING;

-- Add identity record for the admin user
INSERT INTO auth.identities (
  id,
  user_id,
  identity_data,
  provider,
  last_sign_in_at,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000001'::uuid,
  jsonb_build_object(
    'sub', '00000000-0000-0000-0000-000000000001',
    'email', 'admin@muzai.com',
    'email_verified', true
  ),
  'email',
  now(),
  now(),
  now()
) ON CONFLICT (user_id, provider) DO NOTHING;