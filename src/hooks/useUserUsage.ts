import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './useAuth';

interface UserUsage {
  current: number;
  limit: number;
  planType: 'free' | 'premium';
  resetDate: string;
  remaining: number;
}

export function useUserUsage() {
  const [usage, setUsage] = useState<UserUsage | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      loadUsage();
    } else {
      setUsage(null);
    }
  }, [user]);

  const loadUsage = async () => {
    if (!user) return;

    try {
      setLoading(true);
      setError(null);

      // Get current session
      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData.session?.access_token;
      
      if (!accessToken) {
        throw new Error('No valid session found');
      }

      let data, fetchError;
      
      try {
        const result = await supabase.functions.invoke('get-user-usage', {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          }
        });
        data = result.data;
        fetchError = result.error;
      } catch (networkError) {
        console.error('Network error calling get-user-usage:', networkError);
        throw new Error(`Cannot connect to Supabase functions. Please check your VITE_SUPABASE_URL in .env file. Current URL: ${import.meta.env.VITE_SUPABASE_URL}`);
      }

      if (fetchError) {
        console.error('Edge function error:', fetchError);
        throw new Error(`Function error: ${fetchError.message}`);
      }
      
      if (!data) {
        throw new Error('No data returned from function');
      }
      
      if (data.success) {
        setUsage(data.usage);
      } else {
        console.error('Function returned error:', data.error);
        throw new Error(data.error || 'Failed to load usage data');
      }
    } catch (err: any) {
      console.error('Error loading usage:', err);
      
      // Provide specific error messages for common issues
      let errorMessage = err.message;
      if (err.message.includes('Failed to fetch') || err.message.includes('Cannot connect')) {
        errorMessage = 'Cannot connect to Supabase. Please check your internet connection and Supabase configuration.';
      }
      
      setError(`Failed to load usage: ${errorMessage}`);
      
      // Set default usage for free users when function fails
      setUsage({
        current: 0,
        limit: 1,
        planType: 'free',
        resetDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        remaining: 1
      });
    } finally {
      setLoading(false);
    }
  };

  const generateMusic = async (prompt: string, options: any = {}) => {
    if (!user) {
      throw new Error('Must be logged in to generate music');
    }

    try {
      setLoading(true);
      setError(null);

      const { data, error: generateError } = await supabase.functions.invoke('generate-music', {
        body: { prompt, options },
        headers: {
          Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
          'Content-Type': 'application/json'
        }
      });

      if (generateError) throw generateError;

      if (!data) {
        throw new Error('No response data from generate-music function');
      }

      if (data.success) {
        // Update usage after successful generation
        if (data.usage) {
          setUsage(data.usage);
        }
        return data.taskId;
      } else {
        const errorMessage = data.error || 'Generation failed';
        console.error('Music generation failed:', errorMessage);
        throw new Error(errorMessage);
      }
    } catch (err: any) {
      console.error('Error generating music:', err);
      const errorMessage = err.message || 'Generation failed';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const checkGenerationStatus = async (taskId: string) => {
    if (!user) {
      throw new Error('Must be logged in');
    }

    try {
      const { data, error: checkError } = await supabase.functions.invoke('check-generation', {
        body: { taskId },
        headers: {
          Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
          'Content-Type': 'application/json'
        }
      });

      if (checkError) throw checkError;

      if (data.success) {
        return {
          status: data.status,
          tracks: data.data || [],
          error: data.error
        };
      } else {
        throw new Error(data.error || 'Status check failed');
      }
    } catch (err: any) {
      console.error('Error checking status:', err);
      throw err;
    }
  };

  return {
    usage,
    loading,
    error,
    loadUsage,
    generateMusic,
    checkGenerationStatus
  };
}