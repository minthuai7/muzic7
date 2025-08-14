/*
  # Create saved tracks table

  1. New Tables
    - `saved_tracks`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `title` (text)
      - `artist` (text)
      - `duration` (integer)
      - `audio_url` (text)
      - `image_url` (text)
      - `tags` (text, optional)
      - `prompt` (text, optional)
      - `task_id` (text, optional)
      - `is_public` (boolean, default false)
      - `is_generated` (boolean, default false)
      - `play_count` (integer, default 0)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `saved_tracks` table
    - Add policies for public tracks visibility
    - Add policies for users to manage their own tracks

  3. Functions
    - `increment_play_count` function for tracking plays
*/

-- Create saved_tracks table
CREATE TABLE IF NOT EXISTS public.saved_tracks (
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
ALTER TABLE public.saved_tracks ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view public tracks"
  ON public.saved_tracks
  FOR SELECT
  USING (is_public = true);

CREATE POLICY "Users can view their own tracks"
  ON public.saved_tracks
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own tracks"
  ON public.saved_tracks
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own tracks"
  ON public.saved_tracks
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own tracks"
  ON public.saved_tracks
  FOR DELETE
  USING (auth.uid() = user_id);

-- Create function to increment play count
CREATE OR REPLACE FUNCTION public.increment_play_count(track_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.saved_tracks
  SET play_count = play_count + 1,
      updated_at = now()
  WHERE id = track_id;
END;
$$;

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS trigger AS $$
BEGIN
  new.updated_at = now();
  RETURN new;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER handle_updated_at
  BEFORE UPDATE ON public.saved_tracks
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();