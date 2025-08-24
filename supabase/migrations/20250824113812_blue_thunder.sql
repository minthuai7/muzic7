/*
  # Add Foreign Key Relationship Between saved_tracks and user_profiles

  1. Changes
    - Add foreign key constraint linking saved_tracks.user_id to user_profiles.id
    - This enables Supabase to perform joins between these tables
    - Ensures referential integrity between tracks and user profiles

  2. Security
    - Maintains existing RLS policies
    - No changes to permissions or access control
*/

-- Add foreign key constraint to link saved_tracks to user_profiles
DO $$
BEGIN
  -- Check if the foreign key constraint doesn't already exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'saved_tracks_user_id_fkey_profiles' 
    AND table_name = 'saved_tracks'
  ) THEN
    -- Add the foreign key constraint
    ALTER TABLE saved_tracks 
    ADD CONSTRAINT saved_tracks_user_id_fkey_profiles 
    FOREIGN KEY (user_id) REFERENCES user_profiles(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Create index for better join performance if it doesn't exist
CREATE INDEX IF NOT EXISTS idx_saved_tracks_user_id_profiles 
ON saved_tracks(user_id);