/*
  # Fix user profiles and saved tracks relationship

  1. Changes
    - Update user_profiles table to reference auth.users properly
    - Fix foreign key relationship between saved_tracks and user_profiles
    - Ensure proper data types and constraints

  2. Security
    - Maintain existing RLS policies
    - Ensure proper user isolation
*/

-- First, ensure user_profiles has the correct foreign key to auth.users
ALTER TABLE user_profiles 
DROP CONSTRAINT IF EXISTS user_profiles_id_fkey;

ALTER TABLE user_profiles 
ADD CONSTRAINT user_profiles_id_fkey 
FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Ensure saved_tracks has proper foreign key to user_profiles
ALTER TABLE saved_tracks 
DROP CONSTRAINT IF EXISTS saved_tracks_user_id_fkey;

ALTER TABLE saved_tracks 
ADD CONSTRAINT saved_tracks_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES user_profiles(id) ON DELETE CASCADE;