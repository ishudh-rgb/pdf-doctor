import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  clearLocalDevSessionCookie,
  getLocalDevSessionUser,
  isLocalDevAuthEnabled,
} from "@/lib/auth/local-dev-auth";

export async function POST() {
  try {
    if (isLocalDevAuthEnabled()) {
      const user = await getLocalDevSessionUser();
      const response = NextResponse.json({
        message: user ? "Logged out successfully" : "Logged out",
      });
      return clearLocalDevSessionCookie(response);
    }

    const supabase = await createClient();
    const { error } = await supabase.auth.signOut();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ message: "Logged out successfully" });
  } catch (err) {
    console.error("Logout error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
