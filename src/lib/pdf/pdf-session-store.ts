import { randomUUID, createHash } from "crypto";
import fs from "fs/promises";
import os from "os";
import path from "path";

const TTL_MS = 30 * 60 * 1000;

type PdfSession = {
  filePath: string;
  expires: number;
  ownerHash: string;
  thumbCache: Map<string, string>;
};

type SessionGlobal = {
  pdfSessions?: Map<string, PdfSession>;
};

const globalStore = globalThis as SessionGlobal;
const sessions = globalStore.pdfSessions ?? new Map<string, PdfSession>();
globalStore.pdfSessions = sessions;

function pruneExpired() {
  const now = Date.now();
  for (const [id, session] of sessions) {
    if (session.expires <= now) {
      sessions.delete(id);
      fs.unlink(session.filePath).catch(() => {});
    }
  }
}

/**
 * Build a stable identity hash from caller info.
 * Used to bind sessions to a specific user/guest.
 */
export function buildOwnerHash(userId: string | null, ip: string | null): string {
  const key = userId ?? ip ?? "anonymous";
  return createHash("sha256").update(key).digest("hex").slice(0, 16);
}

export async function createPdfSession(buffer: Buffer, ownerHash?: string): Promise<string> {
  pruneExpired();
  const id = randomUUID();
  const filePath = path.join(os.tmpdir(), `pdf-doctor-session-${id}.pdf`);
  await fs.writeFile(filePath, buffer);
  sessions.set(id, {
    filePath,
    expires: Date.now() + TTL_MS,
    ownerHash: ownerHash ?? "",
    thumbCache: new Map(),
  });
  return id;
}

export async function getPdfSessionBuffer(id: string, ownerHash?: string): Promise<Buffer | null> {
  pruneExpired();
  const session = sessions.get(id);
  if (!session || session.expires <= Date.now()) {
    if (session) {
      sessions.delete(id);
      await fs.unlink(session.filePath).catch(() => {});
    }
    return null;
  }

  if (ownerHash && session.ownerHash && session.ownerHash !== ownerHash) {
    return null;
  }

  try {
    return await fs.readFile(session.filePath);
  } catch {
    sessions.delete(id);
    return null;
  }
}

export function cacheThumb(sessionId: string, cacheKey: string, dataUrl: string) {
  const session = sessions.get(sessionId);
  if (!session) return;
  session.thumbCache.set(cacheKey, dataUrl);
}

export function getCachedThumb(sessionId: string, cacheKey: string, ownerHash?: string): string | undefined {
  const session = sessions.get(sessionId);
  if (!session) return undefined;
  if (ownerHash && session.ownerHash && session.ownerHash !== ownerHash) {
    return undefined;
  }
  return session.thumbCache.get(cacheKey);
}
