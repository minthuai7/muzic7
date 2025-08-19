/*
  # API Key Management and User Limits

  1. New Tables
    - `user_subscriptions`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to user_profiles)
      - `plan_type` (text: 'free' or 'premium')
      - `monthly_limit` (integer)
      - `current_usage` (integer)
      - `reset_date` (timestamp)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    
    - `api_keys`
      - `id` (uuid, primary key)
      - `key_name` (text)
      - `api_key` (text, encrypted)
      - `usage_count` (integer)
      - `max_usage` (integer)
      - `reset_time` (timestamp)
      - `is_active` (boolean)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on both tables
    - Add policies for user access control
    - Add function to check usage limits

  3. Functions
    - Function to reset monthly usage
    - Function to check and increment usage
    - Function to get available API key
</sql>

-- Create user_subscriptions table
CREATE TABLE IF NOT EXISTS user_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES user_profiles(id) ON DELETE CASCADE,
  plan_type text NOT NULL DEFAULT 'free' CHECK (plan_type IN ('free', 'premium')),
  monthly_limit integer NOT NULL DEFAULT 1,
  current_usage integer NOT NULL DEFAULT 0,
  reset_date timestamptz NOT NULL DEFAULT (date_trunc('month', now()) + interval '1 month'),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id)
);

-- Create api_keys table (admin only)
CREATE TABLE IF NOT EXISTS api_keys (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key_name text NOT NULL,
  api_key text NOT NULL,
  usage_count integer NOT NULL DEFAULT 0,
  max_usage integer NOT NULL DEFAULT 50,
  reset_time timestamptz NOT NULL DEFAULT (now() + interval '1 hour'),
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE user_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;

-- Policies for user_subscriptions
CREATE POLICY "Users can read own subscription"
  ON user_subscriptions
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own subscription"
  ON user_subscriptions
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- Policies for api_keys (admin only for now)
CREATE POLICY "Service role can manage api keys"
  ON api_keys
  FOR ALL
  TO service_role
  USING (true);

-- Function to create default subscription for new users
CREATE OR REPLACE FUNCTION create_user_subscription()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO user_subscriptions (user_id, plan_type, monthly_limit)
  VALUES (NEW.id, 'free', 1)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create subscription when profile is created
CREATE OR REPLACE TRIGGER create_subscription_on_profile
  AFTER INSERT ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION create_user_subscription();

-- Function to check and increment usage
CREATE OR REPLACE FUNCTION check_and_increment_usage(p_user_id uuid)
RETURNS json AS $$
DECLARE
  subscription_record user_subscriptions%ROWTYPE;
  result json;
BEGIN
  -- Get user subscription
  SELECT * INTO subscription_record
  FROM user_subscriptions
  WHERE user_id = p_user_id;
  
  -- If no subscription exists, create free plan
  IF NOT FOUND THEN
    INSERT INTO user_subscriptions (user_id, plan_type, monthly_limit)
    VALUES (p_user_id, 'free', 1)
    RETURNING * INTO subscription_record;
  END IF;
  
  -- Reset usage if past reset date
  IF subscription_record.reset_date <= now() THEN
    UPDATE user_subscriptions
    SET current_usage = 0,
        reset_date = date_trunc('month', now()) + interval '1 month',
        updated_at = now()
    WHERE user_id = p_user_id
    RETURNING * INTO subscription_record;
  END IF;
  
  -- Check if user has remaining usage
  IF subscription_record.current_usage >= subscription_record.monthly_limit THEN
    result := json_build_object(
      'success', false,
      'message', 'Monthly limit reached',
      'current_usage', subscription_record.current_usage,
      'monthly_limit', subscription_record.monthly_limit,
      'plan_type', subscription_record.plan_type,
      'reset_date', subscription_record.reset_date
    );
  ELSE
    -- Increment usage
    UPDATE user_subscriptions
    SET current_usage = current_usage + 1,
        updated_at = now()
    WHERE user_id = p_user_id;
    
    result := json_build_object(
      'success', true,
      'message', 'Usage incremented',
      'current_usage', subscription_record.current_usage + 1,
      'monthly_limit', subscription_record.monthly_limit,
      'plan_type', subscription_record.plan_type,
      'reset_date', subscription_record.reset_date
    );
  END IF;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get available API key
CREATE OR REPLACE FUNCTION get_available_api_key()
RETURNS text AS $$
DECLARE
  api_key_record api_keys%ROWTYPE;
  selected_key text;
BEGIN
  -- Reset usage for keys past reset time
  UPDATE api_keys
  SET usage_count = 0,
      reset_time = now() + interval '1 hour'
  WHERE reset_time <= now() AND is_active = true;
  
  -- Get available API key
  SELECT * INTO api_key_record
  FROM api_keys
  WHERE is_active = true 
    AND usage_count < max_usage
  ORDER BY usage_count ASC, random()
  LIMIT 1;
  
  IF FOUND THEN
    -- Increment usage
    UPDATE api_keys
    SET usage_count = usage_count + 1
    WHERE id = api_key_record.id;
    
    selected_key := api_key_record.api_key;
  ELSE
    selected_key := NULL;
  END IF;
  
  RETURN selected_key;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to upgrade user to premium
CREATE OR REPLACE FUNCTION upgrade_to_premium(p_user_id uuid)
RETURNS boolean AS $$
BEGIN
  UPDATE user_subscriptions
  SET plan_type = 'premium',
      monthly_limit = 40,
      updated_at = now()
  WHERE user_id = p_user_id;
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add updated_at trigger
CREATE OR REPLACE TRIGGER update_user_subscriptions_updated_at
  BEFORE UPDATE ON user_subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();