/*
  # Create saved tracks table for user music library

  1. New Tables
    - `saved_tracks`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to auth.users)
      - `title` (text, required)
      - `artist` (text, required)
      - `duration` (integer, required)
      - `audio_url` (text, required)
      - `image_url` (text, required)
      - `tags` (text, optional)
      - `prompt` (text, optional for AI generated tracks)
      - `task_id` (text, optional for AI generated tracks)
      - `is_public` (boolean, default false)
      - `is_generated` (boolean, default false)
      - `play_count` (integer, default 0)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `saved_tracks` table
    - Add policies for users to manage their own tracks
    - Add policy for public tracks to be readable by all users

  3. Functions
    - Create function to increment play count
*/

-- Create saved_tracks table
CREATE TABLE IF NOT EXISTS saved_tracks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
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

-- Enable RLS
ALTER TABLE saved_tracks ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can manage their own saved tracks"
  ON saved_tracks
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Public tracks are readable by all users"
  ON saved_tracks
  FOR SELECT
  TO authenticated
  USING (is_public = true);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_saved_tracks_user_id ON saved_tracks(user_id);
CREATE INDEX IF NOT EXISTS idx_saved_tracks_public ON saved_tracks(is_public) WHERE is_public = true;
CREATE INDEX IF NOT EXISTS idx_saved_tracks_created_at ON saved_tracks(created_at DESC);

-- Create function to increment play count
CREATE OR REPLACE FUNCTION increment_play_count(track_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE saved_tracks 
  SET play_count = play_count + 1,
      updated_at = now()
  WHERE id = track_id;
END;
$$;

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_saved_tracks_updated_at
  BEFORE UPDATE ON saved_tracks
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();