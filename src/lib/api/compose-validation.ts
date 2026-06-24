import type { ComposeSlot } from "@/lib/services/pdf-compose.service";

const MAX_SLOTS = 500;
const MAX_SESSION_ID_LEN = 128;

function isValidSlot(slot: unknown): slot is ComposeSlot {
  if (!slot || typeof slot !== "object") return false;
  const s = slot as Record<string, unknown>;
  const kind = s.kind;

  if (kind === "blank") return true;

  if (kind === "original" || kind === "imported") {
    if (typeof s.page !== "number" || s.page < 1 || s.page > 10_000) return false;
    if (kind === "imported") {
      if (typeof s.sessionId !== "string" || s.sessionId.length > MAX_SESSION_ID_LEN) {
        return false;
      }
    }
    return true;
  }

  return false;
}

export function parseComposeSlots(raw: string): ComposeSlot[] | null {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return null;
  }

  if (!Array.isArray(parsed) || parsed.length === 0 || parsed.length > MAX_SLOTS) {
    return null;
  }

  if (!parsed.every(isValidSlot)) return null;
  return parsed;
}
