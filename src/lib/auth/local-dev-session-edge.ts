import type { NextRequest } from "next/server";

export const LOCAL_DEV_SESSION_COOKIE = "pdf-doctor-dev-session";

function getSessionSecret(): string {
  return process.env.CRON_SECRET || "pdf-doctor-local-dev-secret";
}

function decodeBase64Url(value: string): string {
  const padded = value + "=".repeat((4 - (value.length % 4)) % 4);
  const base64 = padded.replace(/-/g, "+").replace(/_/g, "/");
  const binary = atob(base64);
  const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

function encodeBase64Url(value: string): string {
  const bytes = new TextEncoder().encode(value);
  let binary = "";
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

async function createHmacHex(payload: string, secret: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signature = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(payload)
  );
  return Array.from(new Uint8Array(signature))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

export async function parseLocalDevSessionTokenEdge(
  token: string
): Promise<string | null> {
  try {
    const decoded = decodeBase64Url(token);
    const separator = decoded.lastIndexOf(".");
    if (separator === -1) return null;

    const payload = decoded.slice(0, separator);
    const signature = decoded.slice(separator + 1);
    const expected = await createHmacHex(payload, getSessionSecret());

    if (signature !== expected) return null;

    const parsed = JSON.parse(payload) as { userId: string; exp: number };
    if (!parsed.userId || parsed.exp < Date.now()) return null;
    return parsed.userId;
  } catch {
    return null;
  }
}

export async function getLocalDevUserIdFromRequestEdge(
  request: NextRequest
): Promise<string | null> {
  const token = request.cookies.get(LOCAL_DEV_SESSION_COOKIE)?.value;
  if (!token) return null;
  return parseLocalDevSessionTokenEdge(token);
}

export async function createLocalDevSessionTokenEdge(userId: string): Promise<string> {
  const payload = JSON.stringify({
    userId,
    exp: Date.now() + 7 * 24 * 60 * 60 * 1000,
  });
  const signature = await createHmacHex(payload, getSessionSecret());
  return encodeBase64Url(`${payload}.${signature}`);
}
