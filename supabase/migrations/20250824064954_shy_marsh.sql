/*
  # Fix existing tables and policies

  1. Drop existing policies if they exist
  2. Recreate policies with proper conditions
  3. Add missing columns and functions
  4. Create indexes for performance
*/

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can update their own subscription" ON user_subscriptions;
DROP POLICY IF EXISTS "Users can read their own subscription" ON user_subscriptions;
DROP POLICY IF EXISTS "Users can manage their own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON user_profiles;
DROP POLICY IF EXISTS "Profiles are readable by all users" ON user_profiles;
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON user_profiles;
DROP POLICY IF EXISTS "Users can manage their own saved tracks" ON saved_tracks;
DROP POLICY IF EXISTS "Users can insert their own tracks" ON saved_tracks;
DROP POLICY IF EXISTS "Users can update their own tracks" ON saved_tracks;
DROP POLICY IF EXISTS "Users can delete their own tracks" ON saved_tracks;
DROP POLICY IF EXISTS "Users can view their own tracks" ON saved_tracks;
DROP POLICY IF EXISTS "Users can view public tracks" ON saved_tracks;
DROP POLICY IF EXISTS "Public tracks are readable by all users" ON saved_tracks;

-- Ensure tables exist with proper structure
CREATE TABLE IF NOT EXISTS user_profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username text UNIQUE,
  display_name text,
  avatar_url text,
  bio text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS user_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_type text NOT NULL DEFAULT 'free' CHECK (plan_type IN ('free', 'premium')),
  monthly_limit integer NOT NULL DEFAULT 1,
  current_usage integer DEFAULT 0,
  reset_date timestamptz DEFAULT (date_trunc('month', now()) + interval '1 month'),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS saved_tracks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  artist text NOT NULL,
  duration integer NOT NULL,
  audio_url text NOT NULL,
  image_url text NOT NULL,
  tags text,
  prompt text,
  task_id text,
  is_public boolean DEFAULT false,
  is_generated boolean DEFAULT false,
  play_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Add missing columns if they don't exist
DO $$ 
BEGIN
  -- Add missing columns to user_profiles
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_profiles' AND column_name = 'username') THEN
    ALTER TABLE user_profiles ADD COLUMN username text UNIQUE;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_profiles' AND column_name = 'display_name') THEN
    ALTER TABLE user_profiles ADD COLUMN display_name text;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_profiles' AND column_name = 'avatar_url') THEN
    ALTER TABLE user_profiles ADD COLUMN avatar_url text;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_profiles' AND column_name = 'bio') THEN
    ALTER TABLE user_profiles ADD COLUMN bio text;
  END IF;

  -- Add missing columns to saved_tracks
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'saved_tracks' AND column_name = 'tags') THEN
    ALTER TABLE saved_tracks ADD COLUMN tags text;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'saved_tracks' AND column_name = 'prompt') THEN
    ALTER TABLE saved_tracks ADD COLUMN prompt text;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'saved_tracks' AND column_name = 'task_id') THEN
    ALTER TABLE saved_tracks ADD COLUMN task_id text;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'saved_tracks' AND column_name = 'is_public') THEN
    ALTER TABLE saved_tracks ADD COLUMN is_public boolean DEFAULT false;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'saved_tracks' AND column_name = 'is_generated') THEN
    ALTER TABLE saved_tracks ADD COLUMN is_generated boolean DEFAULT false;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'saved_tracks' AND column_name = 'play_count') THEN
    ALTER TABLE saved_tracks ADD COLUMN play_count integer DEFAULT 0;
  END IF;
END $$;

-- Enable RLS on all tables
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_tracks ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for user_profiles
CREATE POLICY "Public profiles are viewable by everyone"
  ON user_profiles
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Profiles are readable by all users"
  ON user_profiles
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can insert their own profile"
  ON user_profiles
  FOR INSERT
  TO public
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON user_profiles
  FOR UPDATE
  TO public
  USING (auth.uid() = id);

CREATE POLICY "Users can manage their own profile"
  ON user_profiles
  FOR ALL
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Create RLS policies for user_subscriptions
CREATE POLICY "Users can read their own subscription"
  ON user_subscriptions
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own subscription"
  ON user_subscriptions
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create RLS policies for saved_tracks
CREATE POLICY "Users can view their own tracks"
  ON saved_tracks
  FOR SELECT
  TO public
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view public tracks"
  ON saved_tracks
  FOR SELECT
  TO public
  USING (is_public = true);

CREATE POLICY "Public tracks are readable by all users"
  ON saved_tracks
  FOR SELECT
  TO authenticated
  USING (is_public = true);

CREATE POLICY "Users can insert their own tracks"
  ON saved_tracks
  FOR INSERT
  TO public
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own tracks"
  ON saved_tracks
  FOR UPDATE
  TO public
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own tracks"
  ON saved_tracks
  FOR DELETE
  TO public
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own saved tracks"
  ON saved_tracks
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_profiles_username ON user_profiles(username);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_user_id ON user_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_saved_tracks_user_id ON saved_tracks(user_id);
CREATE INDEX IF NOT EXISTS idx_saved_tracks_public ON saved_tracks(is_public) WHERE is_public = true;
CREATE INDEX IF NOT EXISTS idx_saved_tracks_created_at ON saved_tracks(created_at DESC);

-- Create or replace the updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create or replace the handle_updated_at function
CREATE OR REPLACE FUNCTION handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create or replace the increment_play_count function
CREATE OR REPLACE FUNCTION increment_play_count(track_id uuid)
RETURNS void AS $$
BEGIN
  UPDATE saved_tracks 
  SET play_count = play_count + 1 
  WHERE id = track_id;
END;
$$ language 'plpgsql';

-- Add triggers for updated_at columns
DROP TRIGGER IF EXISTS update_user_profiles_updated_at ON user_profiles;
CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_user_subscriptions_updated_at ON user_subscriptions;
CREATE TRIGGER update_user_subscriptions_updated_at
  BEFORE UPDATE ON user_subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_saved_tracks_updated_at ON saved_tracks;
CREATE TRIGGER update_saved_tracks_updated_at
  BEFORE UPDATE ON saved_tracks
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS handle_updated_at ON user_profiles;
CREATE TRIGGER handle_updated_at
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION handle_updated_at();

DROP TRIGGER IF EXISTS handle_updated_at ON saved_tracks;
CREATE TRIGGER handle_updated_at
  BEFORE UPDATE ON saved_tracks
  FOR EACH ROW
  EXECUTE FUNCTION handle_updated_at();