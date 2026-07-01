import { randomUUID, createHash } from "crypto";
import fs from "fs/promises";
import os from "os";
import path from "path";
import { createServiceClient, isSupabaseConfigured } from "@/lib/supabase/server";
import {
  isUpstashConfigured,
  upstashDel,
  upstashGetJson,
  upstashSetJson,
} from "@/lib/server/upstash-kv";

export const PDF_SESSION_TTL_MS = 30 * 60 * 1000;
const TTL_MS = PDF_SESSION_TTL_MS;
const TTL_SEC = Math.ceil(TTL_MS / 1000);
const REDIS_PREFIX = "pdf-session:";
const STORAGE_BUCKET = "pdf-files";

type PdfSession = {
  filePath: string;
  expires: number;
  ownerHash: string;
  thumbCache: Map<string, string>;
  storagePath?: string;
};

type StoredPdfSession = {
  ownerHash: string;
  expiresAt: number;
  storagePath?: string;
  localPath?: string;
  thumbCache: Record<string, string>;
};

type SessionGlobal = {
  pdfSessions?: Map<string, PdfSession>;
};

const globalStore = globalThis as SessionGlobal;
const sessions = globalStore.pdfSessions ?? new Map<string, PdfSession>();
globalStore.pdfSessions = sessions;

function redisKey(sessionId: string): string {
  return `${REDIS_PREFIX}${sessionId}`;
}

function useDistributedStore(): boolean {
  return isUpstashConfigured() && isSupabaseConfigured();
}

async function cleanupSessionFiles(session: PdfSession) {
  if (session.storagePath) {
    try {
      const supabase = await createServiceClient();
      await supabase.storage.from(STORAGE_BUCKET).remove([session.storagePath]);
    } catch {
      // best effort
    }
  }
  await fs.unlink(session.filePath).catch(() => {});
}

function pruneExpiredLocal() {
  const now = Date.now();
  for (const [id, session] of sessions.entries()) {
    if (session.expires <= now) {
      sessions.delete(id);
      void cleanupSessionFiles(session);
    }
  }
}

async function readStoredSession(sessionId: string): Promise<StoredPdfSession | null> {
  if (!isUpstashConfigured()) return null;
  return upstashGetJson<StoredPdfSession>(redisKey(sessionId));
}

async function writeStoredSession(sessionId: string, stored: StoredPdfSession): Promise<void> {
  if (!isUpstashConfigured()) return;
  await upstashSetJson(redisKey(sessionId), stored, TTL_SEC);
}

async function uploadSessionPdf(sessionId: string, buffer: Buffer): Promise<string | null> {
  if (!isSupabaseConfigured()) return null;
  const storagePath = `temp-sessions/pdf/${sessionId}.pdf`;
  const supabase = await createServiceClient();
  const { error } = await supabase.storage.from(STORAGE_BUCKET).upload(storagePath, buffer, {
    contentType: "application/pdf",
    upsert: true,
  });
  if (error) {
    console.warn("[pdf-session] Storage upload failed:", error.message);
    return null;
  }
  return storagePath;
}

async function downloadSessionPdf(storagePath: string): Promise<Buffer | null> {
  const supabase = await createServiceClient();
  const { data, error } = await supabase.storage.from(STORAGE_BUCKET).download(storagePath);
  if (error || !data) return null;
  return Buffer.from(await data.arrayBuffer());
}

async function hydrateLocalFromStored(
  sessionId: string,
  stored: StoredPdfSession
): Promise<PdfSession | null> {
  if (stored.expiresAt <= Date.now()) {
    await upstashDel(redisKey(sessionId));
    return null;
  }

  let filePath = stored.localPath ?? "";
  if (filePath) {
    try {
      await fs.access(filePath);
    } catch {
      filePath = "";
    }
  }

  if (!filePath && stored.storagePath) {
    const buffer = await downloadSessionPdf(stored.storagePath);
    if (!buffer) return null;
    filePath = path.join(os.tmpdir(), `pdf-doctor-session-${sessionId}.pdf`);
    await fs.writeFile(filePath, buffer);
  }

  if (!filePath) return null;

  const session: PdfSession = {
    filePath,
    expires: stored.expiresAt,
    ownerHash: stored.ownerHash,
    thumbCache: new Map(Object.entries(stored.thumbCache ?? {})),
    storagePath: stored.storagePath,
  };
  sessions.set(sessionId, session);
  return session;
}

async function getSessionRecord(sessionId: string): Promise<PdfSession | null> {
  pruneExpiredLocal();

  const cached = sessions.get(sessionId);
  if (cached && cached.expires > Date.now()) {
    return cached;
  }
  if (cached) {
    sessions.delete(sessionId);
    void cleanupSessionFiles(cached);
  }

  const stored = await readStoredSession(sessionId);
  if (!stored) return null;

  return hydrateLocalFromStored(sessionId, stored);
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
  pruneExpiredLocal();
  const id = randomUUID();
  const expiresAt = Date.now() + TTL_MS;
  const filePath = path.join(os.tmpdir(), `pdf-doctor-session-${id}.pdf`);
  await fs.writeFile(filePath, buffer);

  const storagePath = useDistributedStore() ? await uploadSessionPdf(id, buffer) : null;

  const session: PdfSession = {
    filePath,
    expires: expiresAt,
    ownerHash: ownerHash ?? "",
    thumbCache: new Map(),
    storagePath: storagePath ?? undefined,
  };
  sessions.set(id, session);

  if (useDistributedStore()) {
    await writeStoredSession(id, {
      ownerHash: ownerHash ?? "",
      expiresAt,
      storagePath: storagePath ?? undefined,
      localPath: filePath,
      thumbCache: {},
    });
  }

  return id;
}

export async function getPdfSessionBuffer(id: string, ownerHash?: string): Promise<Buffer | null> {
  const session = await getSessionRecord(id);
  if (!session) return null;

  if (ownerHash && session.ownerHash && session.ownerHash !== ownerHash) {
    return null;
  }

  try {
    return await fs.readFile(session.filePath);
  } catch {
    if (session.storagePath) {
      const buffer = await downloadSessionPdf(session.storagePath);
      if (buffer) {
        await fs.writeFile(session.filePath, buffer).catch(() => {});
        return buffer;
      }
    }
    sessions.delete(id);
    await upstashDel(redisKey(id));
    return null;
  }
}

async function persistThumbCache(sessionId: string, session: PdfSession) {
  if (!useDistributedStore()) return;
  await writeStoredSession(sessionId, {
    ownerHash: session.ownerHash,
    expiresAt: session.expires,
    storagePath: session.storagePath,
    localPath: session.filePath,
    thumbCache: Object.fromEntries(session.thumbCache.entries()),
  });
}

export async function cacheThumb(sessionId: string, cacheKey: string, dataUrl: string) {
  const session = await getSessionRecord(sessionId);
  if (!session) return;
  session.thumbCache.set(cacheKey, dataUrl);
  await persistThumbCache(sessionId, session);
}

export async function getCachedThumb(
  sessionId: string,
  cacheKey: string,
  ownerHash?: string
): Promise<string | undefined> {
  const session = await getSessionRecord(sessionId);
  if (!session) return undefined;
  if (ownerHash && session.ownerHash && session.ownerHash !== ownerHash) {
    return undefined;
  }
  return session.thumbCache.get(cacheKey);
}
