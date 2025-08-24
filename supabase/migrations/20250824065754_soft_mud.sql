/*
  # Ensure Database Functions and Triggers

  1. Functions
    - Create increment_play_count function
    - Create handle_updated_at function
    - Create update_updated_at_column function

  2. Triggers
    - Add updated_at triggers to all tables
*/

-- Create or replace the increment play count function
CREATE OR REPLACE FUNCTION increment_play_count(track_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE saved_tracks 
  SET play_count = COALESCE(play_count, 0) + 1,
      updated_at = now()
  WHERE id = track_id;
END;
$$;

-- Create or replace the updated_at trigger function
CREATE OR REPLACE FUNCTION handle_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Alternative updated_at function name (for compatibility)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Ensure triggers exist on all tables
DO $$
BEGIN
  -- Trigger for saved_tracks
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'handle_updated_at' 
    AND tgrelid = 'saved_tracks'::regclass
  ) THEN
    CREATE TRIGGER handle_updated_at
      BEFORE UPDATE ON saved_tracks
      FOR EACH ROW
      EXECUTE FUNCTION handle_updated_at();
  END IF;

  -- Alternative trigger name for saved_tracks
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'update_saved_tracks_updated_at' 
    AND tgrelid = 'saved_tracks'::regclass
  ) THEN
    CREATE TRIGGER update_saved_tracks_updated_at
      BEFORE UPDATE ON saved_tracks
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  END IF;

  -- Trigger for user_profiles
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'update_user_profiles_updated_at' 
    AND tgrelid = 'user_profiles'::regclass
  ) THEN
    CREATE TRIGGER update_user_profiles_updated_at
      BEFORE UPDATE ON user_profiles
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  END IF;

  -- Trigger for user_subscriptions
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'update_user_subscriptions_updated_at' 
    AND tgrelid = 'user_subscriptions'::regclass
  ) THEN
    CREATE TRIGGER update_user_subscriptions_updated_at
      BEFORE UPDATE ON user_subscriptions
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION increment_play_count(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION handle_updated_at() TO authenticated;
GRANT EXECUTE ON FUNCTION update_updated_at_column() TO authenticated;