/*
  # Create user subscriptions table

  1. New Tables
    - `user_subscriptions`
      - `user_id` (uuid, primary key, references auth.users)
      - `plan_type` (text, default 'free')
      - `monthly_limit` (integer, default 1)
      - `current_usage` (integer, default 0)
      - `reset_date` (timestamptz, default next month)
      - `created_at` (timestamptz, default now)
      - `updated_at` (timestamptz, default now)

  2. Security
    - Enable RLS on `user_subscriptions` table
    - Add policies for authenticated users to manage their own subscription data

  3. Changes
    - Creates the missing table that the get-user-usage edge function depends on
    - Sets up proper RLS policies for user data security
    - Includes automatic timestamp management
*/

CREATE TABLE IF NOT EXISTS public.user_subscriptions (
  user_id uuid REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  plan_type text NOT NULL DEFAULT 'free',
  monthly_limit integer NOT NULL DEFAULT 1,
  current_usage integer NOT NULL DEFAULT 0,
  reset_date timestamptz NOT NULL DEFAULT (date_trunc('month', now()) + interval '1 month')::date,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.user_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own subscription" ON public.user_subscriptions
  FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own subscription" ON public.user_subscriptions
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own subscription" ON public.user_subscriptions
  FOR UPDATE TO authenticated USING (user_id = auth.uid());

-- Add trigger to automatically update the updated_at timestamp
CREATE TRIGGER update_user_subscriptions_updated_at
  BEFORE UPDATE ON public.user_subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();