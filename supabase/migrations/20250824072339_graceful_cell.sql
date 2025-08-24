/*
  # Debug and fix saved_tracks table

  1. Check table structure
  2. Verify RLS policies
  3. Ensure proper permissions
  4. Add debugging functions
*/

-- Check if table exists and show structure
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'saved_tracks') THEN
    RAISE NOTICE 'saved_tracks table exists';
  ELSE
    RAISE NOTICE 'saved_tracks table does not exist - creating it';
    
    CREATE TABLE saved_tracks (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id uuid NOT NULL,
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
  END IF;
END $$;

-- Ensure RLS is enabled
ALTER TABLE saved_tracks ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Users can insert their own tracks" ON saved_tracks;
DROP POLICY IF EXISTS "Users can view their own tracks" ON saved_tracks;
DROP POLICY IF EXISTS "Users can view public tracks" ON saved_tracks;
DROP POLICY IF EXISTS "Users can update their own tracks" ON saved_tracks;
DROP POLICY IF EXISTS "Users can delete their own tracks" ON saved_tracks;
DROP POLICY IF EXISTS "Users can manage their own saved tracks" ON saved_tracks;
DROP POLICY IF EXISTS "Public tracks are readable by all users" ON saved_tracks;

-- Create comprehensive RLS policies
CREATE POLICY "Users can insert their own tracks"
  ON saved_tracks
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own tracks"
  ON saved_tracks
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Anyone can view public tracks"
  ON saved_tracks
  FOR SELECT
  TO authenticated, anon
  USING (is_public = true);

CREATE POLICY "Users can update their own tracks"
  ON saved_tracks
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own tracks"
  ON saved_tracks
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_saved_tracks_user_id ON saved_tracks(user_id);
CREATE INDEX IF NOT EXISTS idx_saved_tracks_public ON saved_tracks(is_public) WHERE is_public = true;
CREATE INDEX IF NOT EXISTS idx_saved_tracks_created_at ON saved_tracks(created_at DESC);

-- Create or update the updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for updated_at
DROP TRIGGER IF EXISTS update_saved_tracks_updated_at ON saved_tracks;
CREATE TRIGGER update_saved_tracks_updated_at
  BEFORE UPDATE ON saved_tracks
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create function to increment play count
CREATE OR REPLACE FUNCTION increment_play_count(track_id uuid)
RETURNS void AS $$
BEGIN
  UPDATE saved_tracks 
  SET play_count = play_count + 1, updated_at = now()
  WHERE id = track_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated, anon;
GRANT ALL ON saved_tracks TO authenticated;
GRANT SELECT ON saved_tracks TO anon;
GRANT EXECUTE ON FUNCTION increment_play_count(uuid) TO authenticated;

-- Add foreign key constraint if user_profiles table exists
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'user_profiles') THEN
    -- Drop existing constraint if it exists
    ALTER TABLE saved_tracks DROP CONSTRAINT IF EXISTS saved_tracks_user_id_fkey;
    
    -- Add foreign key constraint
    ALTER TABLE saved_tracks 
    ADD CONSTRAINT saved_tracks_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
    
    RAISE NOTICE 'Foreign key constraint added to saved_tracks';
  ELSE
    RAISE NOTICE 'user_profiles table not found, skipping foreign key constraint';
  END IF;
END $$;