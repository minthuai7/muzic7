import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';
import { supabase } from '../lib/supabase';

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

    // Check if Supabase URL is configured
    if (!import.meta.env.VITE_SUPABASE_URL) {
      console.error('VITE_SUPABASE_URL not configured');
      setError('Supabase configuration missing');
      // Set default usage on configuration error
      setUsage({
        current: 0,
        limit: 1,
        planType: 'free',
        resetDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        remaining: 1
      });
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/get-user-usage`;
      
      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${user.access_token || (await supabase.auth.getSession()).data.session?.access_token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.success) {
        setUsage(result.usage);
      } else {
        throw new Error(result.error || 'Failed to load usage');
      }
    } catch (err: any) {
      console.error('Error loading usage:', err);
      
      // Handle different types of fetch errors
      if (err.name === 'TypeError' && err.message.includes('Failed to fetch')) {
        setError('Unable to connect to server. Please check your internet connection.');
      } else if (err.message.includes('HTTP error')) {
        setError('Server error. Please try again later.');
      } else {
        setError('Failed to load usage data');
      }
      
      // Set default usage on error
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

    if (!usage || usage.remaining <= 0) {
      throw new Error('No generations remaining. Please upgrade your plan.');
    }

    try {
      setLoading(true);
      setError(null);

      const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-music`;
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${user.access_token || (await supabase.auth.getSession()).data.session?.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt, options }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.success) {
        // Update usage after successful generation
        await loadUsage();
        return result.taskId;
      } else {
        throw new Error(result.error || 'Generation failed');
      }
    } catch (err: any) {
      console.error('Error generating music:', err);
      const errorMessage = err.message || 'Music generation failed';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const checkGenerationStatus = async (taskId: string) => {
    if (!user) {
      throw new Error('Must be logged in');
    }

    try {
      const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/check-generation`;
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${user.access_token || (await supabase.auth.getSession()).data.session?.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ taskId }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.success) {
        return {
          status: result.status,
          tracks: result.data || [],
          error: result.error
        };
      } else {
        throw new Error(result.error || 'Status check failed');
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