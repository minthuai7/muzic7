import { useState, useEffect } from 'react';
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

      // Demo usage data
      const demoUsage: UserUsage = {
        current: 0,
        limit: 5,
        planType: 'free',
        resetDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        remaining: 5
      };

      setUsage(demoUsage);
    } catch (err: any) {
      console.error('Error loading usage:', err);
      setError('Failed to load usage data');
      
      // Set default usage even on error
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

      // Demo music generation - simulate API call
      console.log('Demo music generation:', prompt, options);
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Return demo task ID
      const taskId = `demo-task-${Date.now()}`;
      
      // Update usage
      if (usage) {
        const newUsage = {
          ...usage,
          current: usage.current + 1,
          remaining: Math.max(0, usage.remaining - 1)
        };
        setUsage(newUsage);
      }
      
      return taskId;
    } catch (err: any) {
      console.error('Error generating music:', err);
      const errorMessage = 'Demo mode: Music generation simulated';
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
      console.log('Demo status check for task:', taskId);
      
      // Simulate successful generation
      return {
        status: 'SUCCESS',
        tracks: [
          {
            id: `demo-track-${Date.now()}`,
            title: 'Demo Generated Track',
            audioUrl: 'https://www.soundjay.com/misc/sounds/bell-ringing-05.mp3',
            duration: 180,
            tags: 'demo, ai-generated'
          }
        ],
        error: null
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
    checkGenerationStatus
  };
}