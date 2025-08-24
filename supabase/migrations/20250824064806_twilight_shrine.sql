/*
  # Fix existing tables and policies

  1. Tables
    - Ensure all required columns exist in existing tables
    - Add missing columns if needed
  
  2. Security
    - Only create policies that don't already exist
    - Update existing policies if needed
  
  3. Functions
    - Create helper functions for play count tracking
*/

-- Ensure user_profiles table has all required columns
DO $$
BEGIN
  -- Add missing columns to user_profiles if they don't exist
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
END $$;

-- Ensure saved_tracks table has all required columns
DO $$
BEGIN
  -- Add missing columns to saved_tracks if they don't exist
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

-- Create indexes if they don't exist
DO $$
BEGIN
  -- Index for user_profiles username
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_user_profiles_username') THEN
    CREATE INDEX idx_user_profiles_username ON user_profiles(username);
  END IF;
  
  -- Index for saved_tracks user_id
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_saved_tracks_user_id') THEN
    CREATE INDEX idx_saved_tracks_user_id ON saved_tracks(user_id);
  END IF;
  
  -- Index for saved_tracks public tracks
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_saved_tracks_public') THEN
    CREATE INDEX idx_saved_tracks_public ON saved_tracks(is_public) WHERE is_public = true;
  END IF;
  
  -- Index for saved_tracks created_at
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_saved_tracks_created_at') THEN
    CREATE INDEX idx_saved_tracks_created_at ON saved_tracks(created_at DESC);
  END IF;
  
  -- Index for user_subscriptions user_id
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_user_subscriptions_user_id') THEN
    CREATE INDEX idx_user_subscriptions_user_id ON user_subscriptions(user_id);
  END IF;
END $$;

-- Create or replace the increment play count function
CREATE OR REPLACE FUNCTION increment_play_count(track_id uuid)
RETURNS void AS $$
BEGIN
  UPDATE saved_tracks 
  SET play_count = play_count + 1 
  WHERE id = track_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Only create policies that don't already exist
DO $$
BEGIN
  -- User profiles policies
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'user_profiles' AND policyname = 'Public profiles are viewable by everyone') THEN
    CREATE POLICY "Public profiles are viewable by everyone"
      ON user_profiles FOR SELECT
      TO public
      USING (true);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'user_profiles' AND policyname = 'Users can insert their own profile') THEN
    CREATE POLICY "Users can insert their own profile"
      ON user_profiles FOR INSERT
      TO public
      WITH CHECK (auth.uid() = id);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'user_profiles' AND policyname = 'Users can update their own profile') THEN
    CREATE POLICY "Users can update their own profile"
      ON user_profiles FOR UPDATE
      TO public
      USING (auth.uid() = id);
  END IF;
  
  -- Saved tracks policies
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'saved_tracks' AND policyname = 'Users can view their own tracks') THEN
    CREATE POLICY "Users can view their own tracks"
      ON saved_tracks FOR SELECT
      TO public
      USING (auth.uid() = user_id);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'saved_tracks' AND policyname = 'Users can view public tracks') THEN
    CREATE POLICY "Users can view public tracks"
      ON saved_tracks FOR SELECT
      TO public
      USING (is_public = true);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'saved_tracks' AND policyname = 'Users can insert their own tracks') THEN
    CREATE POLICY "Users can insert their own tracks"
      ON saved_tracks FOR INSERT
      TO public
      WITH CHECK (auth.uid() = user_id);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'saved_tracks' AND policyname = 'Users can update their own tracks') THEN
    CREATE POLICY "Users can update their own tracks"
      ON saved_tracks FOR UPDATE
      TO public
      USING (auth.uid() = user_id);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'saved_tracks' AND policyname = 'Users can delete their own tracks') THEN
    CREATE POLICY "Users can delete their own tracks"
      ON saved_tracks FOR DELETE
      TO public
      USING (auth.uid() = user_id);
  END IF;
  
  -- User subscriptions policies (only if they don't exist)
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'user_subscriptions' AND policyname = 'Users can read their own subscription') THEN
    CREATE POLICY "Users can read their own subscription"
      ON user_subscriptions FOR SELECT
      TO authenticated
      USING (auth.uid() = user_id);
  END IF;
END $$;