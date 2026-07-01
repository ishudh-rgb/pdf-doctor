"use client";



import {

  createContext,

  useCallback,

  useContext,

  useEffect,

  useMemo,

  useRef,

  useState,

  type ReactNode,

} from "react";

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

  const signOutInProgressRef = useRef(false);



  const supabase = useMemo(() => createBrowserClient(), []);



  const syncSession = useCallback(async () => {

    if (signOutInProgressRef.current) return;



    try {

      const res = await fetch("/api/auth/session", {

        cache: "no-store",

        credentials: "include",

      });



      if (signOutInProgressRef.current) return;



      // Do not wipe auth on transient rate limits / network blips

      if (res.status === 429) return;



      if (!res.ok) {

        setUser(null);

        setProfile(null);

        return;

      }



      const data = (await res.json()) as {

        user?: { id: string; email: string; created_at: string } | null;

        profile?: UserProfile | null;

      };



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

      setProfile(data.profile ?? null);

    } catch {

      /* keep last known session */

    }

  }, []);



  useEffect(() => {

    let cancelled = false;



    const bootstrap = async () => {

      await syncSession();

      if (!cancelled) setLoading(false);

    };



    void bootstrap();



    const onFocus = () => {

      if (!signOutInProgressRef.current) {

        void syncSession();

      }

    };

    window.addEventListener("focus", onFocus);



    if (!isSupabaseConfigured()) {

      return () => {

        cancelled = true;

        window.removeEventListener("focus", onFocus);

      };

    }



    const {

      data: { subscription },

    } = supabase.auth.onAuthStateChange((event) => {

      if (signOutInProgressRef.current || event === "SIGNED_OUT") return;

      void syncSession();

    });



    return () => {

      cancelled = true;

      window.removeEventListener("focus", onFocus);

      subscription.unsubscribe();

    };

  }, [syncSession, supabase]);



  const signOut = useCallback(async () => {

    signOutInProgressRef.current = true;

    setUser(null);

    setProfile(null);



    try {

      await fetch("/api/auth/logout", {

        method: "POST",

        credentials: "include",

      });



      if (isSupabaseConfigured()) {

        await supabase.auth.signOut({ scope: "global" });

      }

    } catch {

      /* redirect anyway */

    }



    window.location.assign("/");

  }, [supabase]);



  const refreshProfile = useCallback(async () => {

    await syncSession();

  }, [syncSession]);



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

