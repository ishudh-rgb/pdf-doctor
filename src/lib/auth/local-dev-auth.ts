import fs from "fs/promises";
import path from "path";
import crypto from "crypto";
import { cookies } from "next/headers";
import type { NextResponse } from "next/server";
import { isLocalDevAuthEnabled } from "@/lib/auth/auth-config";
import {
  createLocalDevSessionToken,
  LOCAL_DEV_SESSION_COOKIE,
  parseLocalDevSessionToken,
} from "@/lib/auth/local-dev-session";

const DATA_DIR = path.join(process.cwd(), ".data");
const USERS_FILE = path.join(DATA_DIR, "local-users.json");
const RESET_FILE = path.join(DATA_DIR, "password-resets.json");

interface LocalUserRecord {
  id: string;
  email: string;
  fullName: string;
  passwordHash: string;
  salt: string;
  createdAt: string;
}

interface LocalUsersFile {
  users: LocalUserRecord[];
}

interface PasswordResetRecord {
  email: string;
  code: string;
  codeExpiresAt: number;
  resetToken?: string;
  resetTokenExpiresAt?: number;
}

interface PasswordResetFile {
  records: PasswordResetRecord[];
}

export interface LocalDevUser {
  id: string;
  email: string;
  full_name: string;
  role: "user" | "admin";
  plan: "free" | "pro";
  created_at: string;
}

export { isLocalDevAuthEnabled };

async function readUsersFile(): Promise<LocalUsersFile> {
  try {
    const raw = await fs.readFile(USERS_FILE, "utf8");
    return JSON.parse(raw) as LocalUsersFile;
  } catch {
    return { users: [] };
  }
}

async function writeUsersFile(data: LocalUsersFile): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(USERS_FILE, JSON.stringify(data, null, 2), "utf8");
}

async function readResetFile(): Promise<PasswordResetFile> {
  try {
    const raw = await fs.readFile(RESET_FILE, "utf8");
    return JSON.parse(raw) as PasswordResetFile;
  } catch {
    return { records: [] };
  }
}

async function writeResetFile(data: PasswordResetFile): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(RESET_FILE, JSON.stringify(data, null, 2), "utf8");
}

function hashPassword(password: string, salt: string): string {
  return crypto.scryptSync(password, salt, 64).toString("hex");
}

function toPublicUser(user: LocalUserRecord): LocalDevUser {
  const adminEmail = process.env.ADMIN_EMAIL || "admin@pdfdoctor.com";
  return {
    id: user.id,
    email: user.email,
    full_name: user.fullName,
    role: user.email === adminEmail ? "admin" : "user",
    plan: "free",
    created_at: user.createdAt,
  };
}

function generateCode(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}

export async function localDevUserExists(email: string): Promise<boolean> {
  const db = await readUsersFile();
  return db.users.some((user) => user.email === email.trim().toLowerCase());
}

export async function localDevCreateResetCode(email: string): Promise<string> {
  const normalizedEmail = email.trim().toLowerCase();
  const db = await readUsersFile();

  if (!db.users.some((user) => user.email === normalizedEmail)) {
    throw new Error("No account found with this email address.");
  }

  const code = generateCode();
  const resetDb = await readResetFile();
  resetDb.records = resetDb.records.filter((record) => record.email !== normalizedEmail);
  resetDb.records.push({
    email: normalizedEmail,
    code,
    codeExpiresAt: Date.now() + 10 * 60 * 1000,
  });
  await writeResetFile(resetDb);
  return code;
}

export async function localDevVerifyResetCode(input: {
  email: string;
  code: string;
}): Promise<{ resetToken: string }> {
  const normalizedEmail = input.email.trim().toLowerCase();
  const resetDb = await readResetFile();
  const record = resetDb.records.find((entry) => entry.email === normalizedEmail);

  if (!record) {
    throw new Error("No reset request found. Please request a new code.");
  }

  if (record.codeExpiresAt < Date.now()) {
    throw new Error("Verification code has expired. Please request a new code.");
  }

  if (record.code !== input.code.trim()) {
    throw new Error("Invalid verification code.");
  }

  const resetToken = crypto.randomBytes(32).toString("hex");
  record.resetToken = resetToken;
  record.resetTokenExpiresAt = Date.now() + 30 * 60 * 1000;
  await writeResetFile(resetDb);

  return { resetToken };
}

export async function localDevResetPasswordWithToken(input: {
  token: string;
  password: string;
}): Promise<void> {
  const resetDb = await readResetFile();
  const record = resetDb.records.find((entry) => entry.resetToken === input.token);

  if (!record?.resetTokenExpiresAt || record.resetTokenExpiresAt < Date.now()) {
    throw new Error("This reset link has expired. Please start again.");
  }

  const usersDb = await readUsersFile();
  const userIndex = usersDb.users.findIndex((user) => user.email === record.email);

  if (userIndex === -1) {
    throw new Error("Account not found.");
  }

  const salt = crypto.randomBytes(16).toString("hex");
  usersDb.users[userIndex] = {
    ...usersDb.users[userIndex],
    salt,
    passwordHash: hashPassword(input.password, salt),
  };

  await writeUsersFile(usersDb);
  resetDb.records = resetDb.records.filter((entry) => entry.email !== record.email);
  await writeResetFile(resetDb);
}

export async function localDevSignUp(input: {
  email: string;
  password: string;
  fullName: string;
}): Promise<LocalDevUser> {
  const email = input.email.trim().toLowerCase();
  const db = await readUsersFile();

  if (db.users.some((user) => user.email === email)) {
    throw new Error("An account with this email already exists.");
  }

  const salt = crypto.randomBytes(16).toString("hex");
  const user: LocalUserRecord = {
    id: crypto.randomUUID(),
    email,
    fullName: input.fullName.trim(),
    salt,
    passwordHash: hashPassword(input.password, salt),
    createdAt: new Date().toISOString(),
  };

  db.users.push(user);
  await writeUsersFile(db);
  return toPublicUser(user);
}

export async function localDevSignIn(input: {
  email: string;
  password: string;
}): Promise<LocalDevUser> {
  const email = input.email.trim().toLowerCase();
  const db = await readUsersFile();
  const user = db.users.find((entry) => entry.email === email);

  if (!user) {
    throw new Error("Invalid email or password.");
  }

  const passwordHash = hashPassword(input.password, user.salt);
  if (passwordHash !== user.passwordHash) {
    throw new Error("Invalid email or password.");
  }

  return toPublicUser(user);
}

const LOCAL_DEV_SESSION_OPTIONS = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
  maxAge: 7 * 24 * 60 * 60,
};

export function attachLocalDevSessionCookie(
  response: NextResponse,
  userId: string
): NextResponse {
  response.cookies.set(
    LOCAL_DEV_SESSION_COOKIE,
    createLocalDevSessionToken(userId),
    LOCAL_DEV_SESSION_OPTIONS
  );
  return response;
}

export function clearLocalDevSessionCookie(response: NextResponse): NextResponse {
  response.cookies.delete(LOCAL_DEV_SESSION_COOKIE);
  return response;
}

export async function setLocalDevSession(userId: string): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(
    LOCAL_DEV_SESSION_COOKIE,
    createLocalDevSessionToken(userId),
    LOCAL_DEV_SESSION_OPTIONS
  );
}

export async function clearLocalDevSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(LOCAL_DEV_SESSION_COOKIE);
}

export async function getLocalDevSessionUser(): Promise<LocalDevUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(LOCAL_DEV_SESSION_COOKIE)?.value;
  if (!token) return null;

  const userId = parseLocalDevSessionToken(token);
  if (!userId) return null;

  const db = await readUsersFile();
  const user = db.users.find((entry) => entry.id === userId);
  return user ? toPublicUser(user) : null;
}
