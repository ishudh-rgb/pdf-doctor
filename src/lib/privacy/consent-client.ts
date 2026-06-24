import {
  CONSENT_STORAGE_KEY,
  type CookieConsentState,
} from "@/lib/privacy/consent";

export function persistConsentLocal(state: CookieConsentState) {
  localStorage.setItem(CONSENT_STORAGE_KEY, JSON.stringify(state));
  document.cookie = `pd_consent=${encodeURIComponent(JSON.stringify(state))};path=/;max-age=31536000;SameSite=Lax`;
}

export async function syncConsentToServer(state: CookieConsentState) {
  await fetch("/api/privacy/consent", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      analytics: state.analytics,
      marketing: state.marketing,
      consent_version: state.version,
    }),
  });
}

export async function applyConsent(state: CookieConsentState) {
  persistConsentLocal(state);
  try {
    await syncConsentToServer(state);
  } catch {
    /* non-blocking */
  }
}
