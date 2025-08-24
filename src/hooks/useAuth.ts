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
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });
      return { data, error };
    } catch (networkError) {
      console.error('Network error during sign up:', networkError);
      return { 
        data: null, 
        error: { 
          message: 'Connection failed. Please check your internet connection and try again.',
          name: 'NetworkError'
        } 
      };
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      return { data, error };
    } catch (networkError) {
      console.error('Network error during sign in:', networkError);
      return { 
        data: null, 
        error: { 
          message: 'Connection failed. Please check your internet connection and try again.',
          name: 'NetworkError'
        } 
      };
    }
  };

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      return { error };
    } catch (networkError) {
      console.error('Network error during sign out:', networkError);
      return { 
        error: { 
          message: 'Connection failed. Please check your internet connection and try again.',
          name: 'NetworkError'
        } 
      };
    }
  };

  const resetPassword = async (email: string) => {
    try {
      const { data, error } = await supabase.auth.resetPasswordForEmail(email);
      return { data, error };
    } catch (networkError) {
      console.error('Network error during password reset:', networkError);
      return { 
        data: null, 
        error: { 
          message: 'Connection failed. Please check your internet connection and try again.',
          name: 'NetworkError'
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