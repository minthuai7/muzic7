import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';
import { supabase } from '../lib/supabase';
import SunoAPI from '../services/kieAI';

interface UserUsage {
  current: number;
  limit: number;
  planType: 'free' | 'premium';
  resetDate: string;
  remaining: number;
  apiKeyStats?: Array<{
    index: number;
    usage: number;
    maxUsage: number;
    resetTime: Date;
    isActive: boolean;
    lastUsed: Date | null;
  }>;
  totalAvailableGenerations?: number;
}

export function useUserUsage() {
  const [usage, setUsage] = useState<UserUsage | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();
  const [sunoAPI] = useState(() => new SunoAPI());

  useEffect(() => {
    if (user) {
      loadUsage();
    } else {
      setUsage(null);
    }
  }, [user]);

  // Update usage with API key statistics
  const updateUsageWithApiStats = (baseUsage: UserUsage): UserUsage => {
    try {
      const apiKeyStats = sunoAPI.getApiKeyStats();
      const totalAvailableGenerations = sunoAPI.getTotalAvailableGenerations();
      
      return {
        ...baseUsage,
        apiKeyStats,
        totalAvailableGenerations
      };
    } catch (error) {
      console.warn('Failed to get API key stats:', error);
      return baseUsage;
    }
  };
  const loadUsage = async () => {
    if (!user) return;

    try {
      setLoading(true);
      setError(null);

      // Check if Supabase URL is configured
      if (!import.meta.env.VITE_SUPABASE_URL || import.meta.env.VITE_SUPABASE_URL === 'your_supabase_project_url') {
        throw new Error('Supabase not configured - please set VITE_SUPABASE_URL');
      }

      const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/get-user-usage`;
      
      console.log('Fetching usage from:', apiUrl);
      
      // Check if we have a valid session token
      const session = await supabase.auth.getSession();
      if (!session.data.session?.access_token) {
        throw new Error('No valid session token');
      }

      console.log('Making request with token...');
      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${session.data.session.access_token}`,
          'Content-Type': 'application/json',
        },
      });

      console.log('Response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Response error:', errorText);
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
      }

      const result = await response.json();
      console.log('Usage result:', result);
      
      if (result.success) {
        setUsage(updateUsageWithApiStats(result.usage));
      } else {
        console.error('API error:', result);
        throw new Error(result.error || 'Failed to load usage data');
      }
    } catch (err: any) {
      console.error('Error loading usage:', err.message || err);
      console.error('Full error:', err);
      
      // Handle different types of fetch errors
      if (err.message?.includes('Supabase not configured')) {
        setError('Supabase not configured. Please set up your environment variables.');
      } else if (err.message?.includes('No valid session token')) {
        setError('Authentication required. Please sign in again.');
      } else if (err.name === 'TypeError' && err.message.includes('Failed to fetch')) {
        setError('Unable to connect to server. Please check your internet connection.');
      } else if (err.message.includes('HTTP error')) {
        setError('Server error. Please try again later.');
      } else {
        setError(`Failed to load usage data: ${err.message}`);
      }
      
      // Set default usage on error
      const defaultUsage = {
        current: 0,
        limit: 1,
        planType: 'free' as const,
        resetDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        remaining: 1
      };
      setUsage(updateUsageWithApiStats(defaultUsage));
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

      // Use the SunoAPI directly with multiple key rotation
      console.log('🎵 Starting music generation with multiple API keys...');
      const taskId = await sunoAPI.generateMusic(prompt, options);
      
      // Update usage after successful generation
      await loadUsage();
      return taskId;
      
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
      // Use the SunoAPI directly for status checking
      const statusData = await sunoAPI.getTaskStatus(taskId);
      
      return {
        status: statusData.status,
        tracks: statusData.response?.sunoData || [],
        error: statusData.errorMessage
      };
      
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
    checkGenerationStatus,
    sunoAPI // Expose API instance for advanced usage
  };
}