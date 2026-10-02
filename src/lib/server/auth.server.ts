import { createHash, randomBytes, randomUUID } from "node:crypto";
import { deleteCookie, getCookie, setCookie } from "@tanstack/react-start/server";
import { getDb } from "./db.server";
import { hashPassword, verifyPassword } from "./password.server";

export type CampusUser = {
  id: string;
  email: string;
  name: string;
  role: "Student" | "Admin" | "Faculty";
  studentId: string | null;
};

type UserRow = CampusUser & { password_hash: string };
const SESSION_COOKIE = "campusx_session";
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7;
const DUMMY_HASH = hashPassword("campusx-credential-check-dummy");
const loginAttempts = new Map<string, { count: number; resetAt: number }>();

function sessionHash(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

function publicUser(row: UserRow): CampusUser {
  return {
    id: row.id,
    email: row.email,
    name: row.name,
    role: row.role,
    studentId: row.studentId,
  };
}

async function startSession(userId: string) {
  const db = getDb();
  const previousToken = getCookie(SESSION_COOKIE);
  if (previousToken) {
    db.prepare("DELETE FROM sessions WHERE id = ?").run(sessionHash(previousToken));
  }

  const token = randomBytes(32).toString("base64url");
  db.prepare("INSERT INTO sessions (id, user_id, expires_at) VALUES (?, ?, ?)").run(
    sessionHash(token),
    userId,
    Date.now() + SESSION_MAX_AGE_SECONDS * 1000,
  );
  db.prepare("DELETE FROM sessions WHERE expires_at <= ?").run(Date.now());
  setCookie(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env["NODE_ENV"] === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE_SECONDS,
  });
}

export async function currentCampusUser(): Promise<CampusUser | null> {
  const token = getCookie(SESSION_COOKIE);
  if (!token) return null;

  const db = getDb();
  const sessionId = sessionHash(token);
  const session = db
    .prepare("SELECT user_id AS userId, expires_at AS expiresAt FROM sessions WHERE id = ?")
    .get(sessionId) as { userId: string; expiresAt: number } | undefined;
  if (!session || session.expiresAt <= Date.now()) {
    db.prepare("DELETE FROM sessions WHERE id = ?").run(sessionId);
    deleteCookie(SESSION_COOKIE, { path: "/" });
    return null;
  }

  const row = db
    .prepare(
      "SELECT id, email, name, role, student_id AS studentId, password_hash FROM users WHERE id = ?",
    )
    .get(session.userId) as UserRow | undefined;
  if (!row) {
    db.prepare("DELETE FROM sessions WHERE id = ?").run(sessionId);
    deleteCookie(SESSION_COOKIE, { path: "/" });
    return null;
  }
  return publicUser(row);
}

export async function requireCampusUser(role?: CampusUser["role"]): Promise<CampusUser> {
  const user = await currentCampusUser();
  if (!user) throw new Error("Sign in is required.");
  if (role && user.role !== role) throw new Error("You do not have access to this action.");
  return user;
}

export async function loginCampusUser(data: { email: string; password: string }) {
  const email = data.email.trim().toLowerCase();
  const current = loginAttempts.get(email);
  if (current && Date.now() < current.resetAt && current.count >= 8) {
    return { ok: false as const, error: "Too many sign-in attempts. Try again in 15 minutes." };
  }
  if (!current || Date.now() >= current.resetAt) {
    loginAttempts.set(email, { count: 0, resetAt: Date.now() + 15 * 60 * 1000 });
  }

  const row = getDb()
    .prepare(
      "SELECT id, email, name, role, student_id AS studentId, password_hash FROM users WHERE email = ?",
    )
    .get(email) as UserRow | undefined;
  const valid = verifyPassword(data.password, row?.password_hash ?? DUMMY_HASH);
  if (!row || !valid) {
    const attempt = loginAttempts.get(email);
    if (attempt) attempt.count += 1;
    return { ok: false as const, error: "Email or password is incorrect." };
  }

  loginAttempts.delete(email);
  await startSession(row.id);
  return { ok: true as const, user: publicUser(row) };
}

export async function registerCampusStudent(data: {
  name: string;
  email: string;
  studentId: string;
  password: string;
}) {
  const db = getDb();
  const email = data.email.trim().toLowerCase();
  const studentId = data.studentId.trim();
  const exists = db
    .prepare("SELECT id FROM users WHERE email = ? OR student_id = ?")
    .get(email, studentId);
  if (exists) {
    return {
      ok: false as const,
      error: "That university email or student ID is already registered.",
    };
  }

  const user: CampusUser = {
    id: randomUUID(),
    email,
    name: data.name.trim(),
    role: "Student",
    studentId,
  };
  try {
    db.prepare(
      "INSERT INTO users (id, email, name, role, student_id, password_hash) VALUES (?, ?, ?, 'Student', ?, ?)",
    ).run(user.id, user.email, user.name, studentId, hashPassword(data.password));
  } catch {
    return {
      ok: false as const,
      error: "That university email or student ID is already registered.",
    };
  }

  await startSession(user.id);
  return { ok: true as const, user };
}

export async function updateCampusStudentProfile(data: {
  name: string;
  email: string;
  studentId: string;
}) {
  const user = await requireCampusUser("Student");
  const db = getDb();
  const existing = db
    .prepare("SELECT id FROM users WHERE (email = ? OR student_id = ?) AND id <> ?")
    .get(data.email, data.studentId, user.id);
  if (existing) {
    return { ok: false as const, error: "That email or student ID is already in use." };
  }

  try {
    db.prepare("UPDATE users SET name = ?, email = ?, student_id = ? WHERE id = ?").run(
      data.name,
      data.email,
      data.studentId,
      user.id,
    );
  } catch {
    return { ok: false as const, error: "Could not save the profile. Check the email and student ID." };
  }

  return {
    ok: true as const,
    user: { ...user, name: data.name, email: data.email, studentId: data.studentId },
  };
}

export async function logoutCampusUser() {
  const token = getCookie(SESSION_COOKIE);
  if (token) getDb().prepare("DELETE FROM sessions WHERE id = ?").run(sessionHash(token));
  deleteCookie(SESSION_COOKIE, { path: "/" });
  return { ok: true as const };
}
