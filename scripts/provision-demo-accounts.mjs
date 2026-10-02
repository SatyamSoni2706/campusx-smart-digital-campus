import { existsSync, mkdirSync, realpathSync } from "node:fs";
import { dirname, isAbsolute, relative, resolve } from "node:path";
import { loadEnvFile } from "node:process";
import { DatabaseSync } from "node:sqlite";
import { hashPassword, verifyPassword } from "../src/lib/server/password.server.ts";

const root = process.cwd();
const envFile = resolve(root, ".env");
if (existsSync(envFile)) loadEnvFile(envFile);

if (process.env["DEMO_MODE"] !== "true") {
  throw new Error("Provisioning blocked. Explicitly set DEMO_MODE=true for this command.");
}
if (process.env["NODE_ENV"] === "production" || process.env["CI"] === "true") {
  throw new Error("Provisioning is local-only and cannot run in production or CI.");
}

const localDataDir = resolve(root, "data");
const dbPath = resolve(root, process.env["CAMPUSX_DB_PATH"] || "./data/campusx.sqlite");
mkdirSync(dirname(dbPath), { recursive: true });

const canonicalDataDir = realpathSync(localDataDir);
const canonicalDbDir = realpathSync(dirname(dbPath));
const relativeDbDir = relative(canonicalDataDir, canonicalDbDir);
if (relativeDbDir === ".." || relativeDbDir.startsWith(`..${process.platform === "win32" ? "\\" : "/"}`) || isAbsolute(relativeDbDir)) {
  throw new Error("Provisioning is limited to a SQLite database inside this project's local data directory.");
}
if (existsSync(dbPath)) {
  const relativeDbPath = relative(canonicalDataDir, realpathSync(dbPath));
  if (relativeDbPath === ".." || relativeDbPath.startsWith(`..${process.platform === "win32" ? "\\" : "/"}`) || isAbsolute(relativeDbPath)) {
    throw new Error("Provisioning is limited to a SQLite database inside this project's local data directory.");
  }
}

const demoAccounts = [
  {
    id: "campusx-local-demo-faculty",
    email: "faculty.demo@campusx.test",
    name: "Faculty Demo",
    role: "Faculty",
    password: "FacultyDemo!2026Local",
  },
  {
    id: "campusx-local-demo-admin",
    email: "admin.demo@campusx.test",
    name: "Admin Demo",
    role: "Admin",
    password: "AdminDemo!2026Local",
  },
];

const db = new DatabaseSync(dbPath);
try {
  db.exec("PRAGMA foreign_keys = ON; PRAGMA journal_mode = WAL; PRAGMA busy_timeout = 5000;");
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT NOT NULL UNIQUE COLLATE NOCASE,
      name TEXT NOT NULL,
      role TEXT NOT NULL CHECK (role IN ('Student', 'Admin', 'Faculty')),
      student_id TEXT UNIQUE,
      password_hash TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.exec("BEGIN IMMEDIATE");
  try {
    const findExisting = db.prepare(`
      SELECT id, email, name, role, student_id AS studentId, password_hash AS passwordHash
      FROM users WHERE id = ? OR email = ?
    `);
    const insertUser = db.prepare(`
      INSERT INTO users (id, email, name, role, student_id, password_hash)
      VALUES (?, ?, ?, ?, NULL, ?)
    `);
    const results = [];

    for (const account of demoAccounts) {
      const matches = findExisting.all(account.id, account.email);
      if (matches.length > 1) {
        throw new Error(`Conflicting user records exist for ${account.email}; no accounts were changed.`);
      }

      const existing = matches[0];
      if (existing) {
        const matchesDemoIdentity = existing.id === account.id
          && existing.email.toLowerCase() === account.email
          && existing.name === account.name
          && existing.role === account.role
          && existing.studentId === null;
        if (!matchesDemoIdentity || !verifyPassword(account.password, existing.passwordHash)) {
          throw new Error(`A different user record conflicts with ${account.email}; no accounts were changed.`);
        }
        results.push({ account, created: false });
      } else {
        insertUser.run(account.id, account.email, account.name, account.role, hashPassword(account.password));
        results.push({ account, created: true });
      }
    }

    db.exec("COMMIT");
    for (const { account, created } of results) {
      console.log(`${created ? "Created" : "Already provisioned"} ${account.role} demo account.`);
      console.log(`  Email: ${account.email}`);
      console.log(`  Password: ${account.password}`);
    }
    console.log("These credentials are for this local demo database only; do not deploy them.");
  } catch (error) {
    db.exec("ROLLBACK");
    throw error;
  }
} finally {
  db.close();
}
