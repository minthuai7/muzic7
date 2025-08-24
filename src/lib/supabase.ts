import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Check for missing environment variables
if (!supabaseUrl) {
  throw new Error('VITE_SUPABASE_URL is missing. Please add it to your .env file with your Supabase project URL (e.g., https://your-project-id.supabase.co)');
}

if (!supabaseAnonKey) {
  throw new Error('VITE_SUPABASE_ANON_KEY is missing. Please add it to your .env file with your Supabase anonymous key.');
}

// Validate URL format
try {
  new URL(supabaseUrl);
} catch (error) {
  throw new Error(`Invalid VITE_SUPABASE_URL format: "${supabaseUrl}". Please ensure it's a valid URL like https://your-project-id.supabase.co (without trailing slash)`);
}

// Validate URL is a Supabase URL
if (!supabaseUrl.includes('.supabase.co') || supabaseUrl.includes('placeholder')) {
  console.warn(`VITE_SUPABASE_URL "${supabaseUrl}" doesn't appear to be a valid Supabase URL. Expected format: https://your-project-id.supabase.co`);
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);