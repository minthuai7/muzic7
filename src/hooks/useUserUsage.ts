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

      const { data, error: fetchError } = await supabase.functions.invoke('get-user-usage', {
        headers: {
          Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
        }
      });

      if (fetchError) throw fetchError;

      if (data.success) {
        setUsage(data.usage);
      } else {
        throw new Error(data.error || 'Failed to load usage');
      }
    } catch (err: any) {
      console.error('Error loading usage:', err);
      setError(err.message || 'Failed to load usage');
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

      if (data.success) {
        // Update usage after successful generation
        if (data.usage) {
          setUsage(data.usage);
        }
        return data.taskId;
      } else {
        throw new Error(data.error || 'Generation failed');
      }
    } catch (err: any) {
      console.error('Error generating music:', err);
      setError(err.message || 'Generation failed');
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