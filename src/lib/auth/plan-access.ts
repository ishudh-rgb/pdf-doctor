type ProfileLike = {
  plan?: string | null;
  plan_expires_at?: string | null;
  is_blocked?: boolean | null;
};

/** True when profile has an active Pro plan (respects plan_expires_at). */
export function isActivePro(profile: ProfileLike): boolean {
  if (profile.plan !== "pro") return false;
  if (!profile.plan_expires_at) return true;
  const expires = new Date(profile.plan_expires_at);
  return Number.isFinite(expires.getTime()) && expires > new Date();
}

export function isBlockedProfile(profile: ProfileLike): boolean {
  return profile.is_blocked === true;
}

export class UserBlockedError extends Error {
  constructor(
    message = "Your account has been suspended. Contact support for help."
  ) {
    super(message);
    this.name = "UserBlockedError";
  }
}
