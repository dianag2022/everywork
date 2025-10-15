'use client';

import { useEffect, useState } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import type { User, Session } from '@supabase/supabase-js';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Use the same auth helper that the middleware uses
  const supabase = createClientComponentClient();

  useEffect(() => {
    // Get initial sessiona
    const getInitialSession = async () => {
      const { data: { session }, error } = await supabase.auth.getSession();
      
  
      
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    };

    getInitialSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        
        
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, [supabase.auth]);

  const signIn = async (
    provider: 'google' | 'github' | 'email' = 'google',
    callbackUrl?: string
  ) => {
    if (provider === 'email') {
      throw new Error('Email sign in not implemented yet');
    }
  
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || window.location.origin;
  
    const redirectTo = callbackUrl
      ? `${baseUrl}/auth/callback?callbackUrl=${encodeURIComponent(callbackUrl)}`
      : `${baseUrl}/auth/callback`;
  
    console.log('useAuth: Starting OAuth signin with redirectTo:', redirectTo);
  
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo }
    });
  
    if (error) {
      console.error('useAuth: OAuth signin error:', error);
      throw error;
    }
  };
  

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      throw error;
    }
  };

  const signUp = async (email: string, password: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`
      }
    });

    if (error) {
      throw error;
    }
  };

  const signInWithEmail = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) {
      throw error;
    }
  };

  return {
    user,
    session,
    loading,
    signIn,
    signOut,
    signUp,
    signInWithEmail,
    isAuthenticated: !!user
  };
}