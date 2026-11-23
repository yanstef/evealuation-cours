import crypto from "node:crypto";
import { cookies } from "next/headers";

const STUDENT_COOKIE = "eval_student";
const ADMIN_COOKIE = "eval_admin";
const MAX_AGE = 60 * 60 * 8; // 8 h

function secret() {
  const s = process.env.SESSION_SECRET;
  if (!s || s.length < 16) throw new Error("SESSION_SECRET manquant ou trop court");
  return s;
}

function sign(payload: string) {
  return crypto.createHmac("sha256", secret()).update(payload).digest("base64url");
}

function pack(data: object) {
  const payload = Buffer.from(JSON.stringify({ ...data, exp: Date.now() + MAX_AGE * 1000 })).toString("base64url");
  return `${payload}.${sign(payload)}`;
}

function unpack<T>(token: string | undefined): T | null {
  if (!token) return null;
  const [payload, sig] = token.split(".");
  if (!payload || !sig) return null;
  const expected = sign(payload);
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
  try {
    const data = JSON.parse(Buffer.from(payload, "base64url").toString());
    if (typeof data.exp !== "number" || data.exp < Date.now()) return null;
    return data as T;
  } catch {
    return null;
  }
}

export function normalizeName(s: string) {
  return s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

export type Student = { nom: string; prenom: string; key: string };

export async function setStudentSession(s: Student) {
  (await cookies()).set(STUDENT_COOKIE, pack(s), {
    httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", maxAge: MAX_AGE,
  });
}
export async function getStudent(): Promise<Student | null> {
  return unpack<Student>((await cookies()).get(STUDENT_COOKIE)?.value);
}
export async function clearStudentSession() {
  (await cookies()).delete(STUDENT_COOKIE);
}

export async function setAdminSession() {
  (await cookies()).set(ADMIN_COOKIE, pack({ admin: true }), {
    httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "strict", path: "/", maxAge: MAX_AGE,
  });
}
export async function isAdmin(): Promise<boolean> {
  return !!unpack<{ admin: boolean }>((await cookies()).get(ADMIN_COOKIE)?.value)?.admin;
}

export function checkAdminPassword(input: string) {
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected) return false;
  const a = crypto.createHash("sha256").update(input).digest();
  const b = crypto.createHash("sha256").update(expected).digest();
  return crypto.timingSafeEqual(a, b);
}
