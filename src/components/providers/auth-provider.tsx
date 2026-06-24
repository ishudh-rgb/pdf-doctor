"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { createClient as createBrowserClient, isSupabaseConfigured } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";

interface UserProfile {
  id: string;
  email: string;
  full_name: string | null;
  role: "user" | "admin";
  plan: "free" | "pro";
  plan_expires_at: string | null;
  total_files_processed: number;
  ai_credits_used: number;
}

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  isAdmin: boolean;
  isPro: boolean;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  loading: true,
  isAdmin: false,
  isPro: false,
  signOut: async () => {},
  refreshProfile: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const supabase = useMemo(() => createBrowserClient(), []);

  const fetchProfile = useCallback(async (userId: string) => {
    try {
      const { data } = await supabase
        .from("user_profiles")
        .select("*")
        .eq("id", userId)
        .single();
      if (data) setProfile(data as UserProfile);
    } catch {
      // Profile may not exist yet
    }
  }, [supabase]);

  const fetchLocalDevSession = useCallback(async () => {
    try {
      const res = await fetch("/api/auth/session");
      if (!res.ok) {
        setUser(null);
        setProfile(null);
        return;
      }

      const data = await res.json();
      if (!data.user) {
        setUser(null);
        setProfile(null);
        return;
      }

      setUser({
        id: data.user.id,
        email: data.user.email,
        created_at: data.user.created_at,
      } as User);

      if (data.profile) {
        setProfile(data.profile as UserProfile);
      }
    } catch {
      setUser(null);
      setProfile(null);
    }
  }, []);

  useEffect(() => {
    if (!isSupabaseConfigured()) {
      fetchLocalDevSession().finally(() => setLoading(false));
      return;
    }

    const getSession = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        setUser(session?.user ?? null);
        if (session?.user) {
          await fetchProfile(session.user.id);
        }
      } catch {
        // Supabase not configured
      } finally {
        setLoading(false);
      }
    };

    getSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        await fetchProfile(session.user.id);
      } else {
        setProfile(null);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [fetchLocalDevSession, fetchProfile, supabase]);

  const signOut = useCallback(async () => {
    if (!isSupabaseConfigured()) {
      await fetch("/api/auth/logout", { method: "POST" });
    } else {
      await supabase.auth.signOut();
    }
    setUser(null);
    setProfile(null);
  }, [supabase]);

  const refreshProfile = useCallback(async () => {
    if (!user) return;
    if (!isSupabaseConfigured()) {
      await fetchLocalDevSession();
      return;
    }
    await fetchProfile(user.id);
  }, [fetchLocalDevSession, fetchProfile, user]);

  const value = useMemo<AuthContextType>(
    () => ({
      user,
      profile,
      loading,
      isAdmin: profile?.role === "admin",
      isPro: profile?.plan === "pro",
      signOut,
      refreshProfile,
    }),
    [user, profile, loading, signOut, refreshProfile]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuthContext() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuthContext must be used within AuthProvider");
  }
  return context;
}
