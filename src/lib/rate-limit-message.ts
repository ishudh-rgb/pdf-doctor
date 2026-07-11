export type RateLimitScope = "login" | "signup" | "password-reset" | "generic";

type Locale = "en" | "hi";

/** Human-friendly wait duration (rounded up to the nearest minute or hour). */
export function formatRetryAfterWait(seconds: number, locale: Locale = "en"): string {
  const safe = Math.max(1, Math.ceil(seconds));

  if (safe < 60) {
    return locale === "hi" ? "1 मिनट" : "1 minute";
  }

  if (safe < 3600) {
    const minutes = Math.ceil(safe / 60);
    if (locale === "hi") {
      return minutes === 1 ? "1 मिनट" : `${minutes} मिनट`;
    }
    return minutes === 1 ? "1 minute" : `${minutes} minutes`;
  }

  const hours = Math.ceil(safe / 3600);
  if (locale === "hi") {
    return hours === 1 ? "1 घंटा" : `${hours} घंटे`;
  }
  return hours === 1 ? "1 hour" : `${hours} hours`;
}

const MESSAGE_TEMPLATES: Record<Locale, Record<RateLimitScope, string>> = {
  en: {
    login: "Too many login attempts. Please try again in {time}.",
    signup: "Too many signup attempts. Please try again in {time}.",
    "password-reset": "Too many password reset attempts. Please try again in {time}.",
    generic: "Too many requests. Please try again in {time}.",
  },
  hi: {
    login: "बहुत ज़्यादा लॉगिन प्रयास। कृपया {time} बाद फिर कोशिश करें।",
    signup: "बहुत ज़्यादा साइन अप प्रयास। कृपया {time} बाद फिर कोशिश करें।",
    "password-reset": "बहुत ज़्यादा पासवर्ड रीसेट प्रयास। कृपया {time} बाद फिर कोशिश करें।",
    generic: "बहुत ज़्यादा अनुरोध। कृपया {time} बाद फिर कोशिश करें।",
  },
};

export function buildRateLimitMessage(
  scope: RateLimitScope,
  retryAfterSec: number,
  locale: Locale = "en"
): string {
  const time = formatRetryAfterWait(retryAfterSec, locale);
  return MESSAGE_TEMPLATES[locale][scope].replace("{time}", time);
}

export function resolveRateLimitError(
  data: {
    error?: string;
    retryAfterSec?: number;
    rateLimitScope?: RateLimitScope;
  },
  status: number,
  locale: Locale,
  fallback: string
): string {
  if (
    status === 429 &&
    typeof data.retryAfterSec === "number" &&
    data.rateLimitScope
  ) {
    return buildRateLimitMessage(data.rateLimitScope, data.retryAfterSec, locale);
  }
  return data.error || fallback;
}
