import { useState, useEffect } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    }).catch((error) => {
      console.error('Error getting session:', error);
      setLoading(false);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email: string, password: string) => {
    try {
      // For demo purposes, simulate successful signup
      console.log('Demo signup attempt:', email);
      return { 
        data: { user: null, session: null }, 
        error: null 
      };
    } catch (error) {
      console.error('Sign up error:', error);
      return { 
        data: null, 
        error: { 
          message: 'Demo mode: Sign up simulated successfully. Please use sign in instead.',
          name: 'DemoError'
        } 
      };
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      // For demo purposes, create a mock user session
      console.log('Demo signin attempt:', email);
      
      const mockUser = {
        id: 'demo-user-id',
        email: email,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        aud: 'authenticated',
        role: 'authenticated',
        app_metadata: {},
        user_metadata: {}
      } as User;

      const mockSession = {
        access_token: 'demo-access-token',
        refresh_token: 'demo-refresh-token',
        expires_in: 3600,
        expires_at: Date.now() + 3600000,
        token_type: 'bearer',
        user: mockUser
      } as Session;

      setUser(mockUser);
      setSession(mockSession);

      return { 
        data: { user: mockUser, session: mockSession }, 
        error: null 
      };
    } catch (error) {
      console.error('Sign in error:', error);
      return { 
        data: null, 
        error: { 
          message: 'Demo mode: Authentication simulated. Any email/password will work.',
          name: 'DemoError'
        } 
      };
    }
  };

  const signOut = async () => {
    try {
      setUser(null);
      setSession(null);
      return { error: null };
    } catch (error) {
      console.error('Sign out error:', error);
      return { 
        error: { 
          message: 'Sign out failed',
          name: 'SignOutError'
        } 
      };
    }
  };

  const resetPassword = async (email: string) => {
    try {
      console.log('Demo password reset for:', email);
      return { 
        data: {}, 
        error: null 
      };
    } catch (error) {
      console.error('Password reset error:', error);
      return { 
        data: null, 
        error: { 
          message: 'Demo mode: Password reset simulated',
          name: 'DemoError'
        } 
      };
    }
  };

  return {
    user,
    session,
    loading,
    signUp,
    signIn,
    signOut,
    resetPassword,
  };
}