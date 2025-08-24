/*
  # Add Admin User

  1. New Admin User
    - Add naylamagic4u@gmail.com as admin user
    - Grant admin permissions for payment management
    - Set as active admin account

  2. Security
    - Admin user linked to existing user account
    - Full admin permissions granted
    - Active status enabled
*/

-- First, we need to get the user ID for naylamagic4u@gmail.com
-- This will be done via a function since we can't directly query auth.users in migrations

-- Create a function to add admin user by email
CREATE OR REPLACE FUNCTION add_admin_by_email(user_email TEXT)
RETURNS VOID AS $$
DECLARE
    user_uuid UUID;
BEGIN
    -- Get the user ID from auth.users
    SELECT id INTO user_uuid 
    FROM auth.users 
    WHERE email = user_email;
    
    -- If user exists, add them as admin
    IF user_uuid IS NOT NULL THEN
        INSERT INTO admin_users (id, role, permissions, is_active)
        VALUES (
            user_uuid,
            'admin',
            ARRAY['manage_payments', 'view_orders', 'approve_orders', 'reject_orders'],
            true
        )
        ON CONFLICT (id) DO UPDATE SET
            role = 'admin',
            permissions = ARRAY['manage_payments', 'view_orders', 'approve_orders', 'reject_orders'],
            is_active = true,
            updated_at = now();
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add the admin user
SELECT add_admin_by_email('naylamagic4u@gmail.com');

-- Drop the function as it's no longer needed
DROP FUNCTION add_admin_by_email(TEXT);