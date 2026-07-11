import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(
  request: NextRequest,
  options?: { loadProfileRole?: boolean; loadProfileFlags?: boolean }
) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey || supabaseUrl === "your_supabase_url") {
    return {
      supabaseResponse: NextResponse.next({ request }),
      user: null,
      profileRole: null,
      profileBlocked: false,
      mfaVerificationRequired: false,
    };
  }

  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value)
        );
        supabaseResponse = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options)
        );
      },
    },
  });

  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    let profileRole: string | null = null;
    let profileBlocked = false;
    let mfaVerificationRequired = false;

    if (user) {
      const { data: assurance, error: assuranceError } =
        await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
      if (assuranceError || !assurance) {
        // Fail closed: block protected routes when MFA status cannot be verified.
        mfaVerificationRequired = true;
      } else {
        mfaVerificationRequired =
          assurance.nextLevel === "aal2" && assurance.currentLevel !== "aal2";
      }
    }

    if (user && (options?.loadProfileRole || options?.loadProfileFlags)) {
      const { data: profile } = await supabase
        .from("user_profiles")
        .select("role, is_blocked")
        .eq("id", user.id)
        .maybeSingle();
      profileRole = profile?.role ?? null;
      profileBlocked = profile?.is_blocked === true;
    }

    return { supabaseResponse, user, profileRole, profileBlocked, mfaVerificationRequired };
  } catch {
    return {
      supabaseResponse,
      user: null,
      profileRole: null,
      profileBlocked: false,
      mfaVerificationRequired: false,
    };
  }
}
