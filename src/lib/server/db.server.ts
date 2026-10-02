import { mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { DatabaseSync } from "node:sqlite";
import { randomUUID } from "node:crypto";
import {
  assignments,
  attendance,
  complaints,
  currentAdmin,
  currentFaculty,
  currentStudent,
  events,
  notices,
  timetable,
} from "@/data/mock";
import { hashPassword } from "./password.server";
import "./env.server";

let connection: DatabaseSync | undefined;

export function getDb(): DatabaseSync {
  if (connection) return connection;

  const path = resolve(process.cwd(), process.env["CAMPUSX_DB_PATH"] || "./data/campusx.sqlite");
  mkdirSync(dirname(path), { recursive: true });
  connection = new DatabaseSync(path);
  connection.exec(
    "PRAGMA foreign_keys = ON; PRAGMA journal_mode = WAL; PRAGMA busy_timeout = 5000;",
  );
  createSchema(connection);
  seedDemoData(connection);
  return connection;
}

function createSchema(db: DatabaseSync) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT NOT NULL UNIQUE COLLATE NOCASE,
      name TEXT NOT NULL,
      role TEXT NOT NULL CHECK (role IN ('Student', 'Admin', 'Faculty')),
      student_id TEXT UNIQUE,
      password_hash TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS sessions (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      expires_at INTEGER NOT NULL,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
    CREATE INDEX IF NOT EXISTS sessions_expiry ON sessions(expires_at);
    CREATE TABLE IF NOT EXISTS complaints (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id),
      title TEXT NOT NULL,
      category TEXT NOT NULL,
      description TEXT NOT NULL,
      location TEXT NOT NULL,
      priority TEXT NOT NULL CHECK (priority IN ('Low', 'Medium', 'High', 'Urgent')),
      status TEXT NOT NULL CHECK (status IN ('Submitted', 'Under Review', 'Assigned', 'In Progress', 'Resolved', 'Rejected')),
      resolution_info TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS complaints_user_updated ON complaints(user_id, updated_at DESC);
    CREATE TABLE IF NOT EXISTS complaint_status_history (
      id TEXT PRIMARY KEY,
      complaint_id TEXT NOT NULL REFERENCES complaints(id) ON DELETE CASCADE,
      actor_user_id TEXT NOT NULL REFERENCES users(id),
      from_status TEXT,
      to_status TEXT NOT NULL,
      resolution_info TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS complaint_history_by_complaint ON complaint_status_history(complaint_id, created_at);
    CREATE TABLE IF NOT EXISTS notices (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      category TEXT NOT NULL,
      description TEXT NOT NULL,
      priority TEXT NOT NULL CHECK (priority IN ('Low', 'Medium', 'High', 'Urgent')),
      department TEXT NOT NULL,
      created_by TEXT REFERENCES users(id),
      date TEXT NOT NULL,
      read INTEGER NOT NULL DEFAULT 0,
      updated_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS events (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      date TEXT NOT NULL,
      time TEXT NOT NULL,
      venue TEXT NOT NULL,
      organizer TEXT NOT NULL,
      description TEXT NOT NULL,
      category TEXT NOT NULL,
      seats INTEGER NOT NULL,
      registered INTEGER NOT NULL DEFAULT 0
    );
    CREATE TABLE IF NOT EXISTS timetable (
      id TEXT PRIMARY KEY,
      student_id TEXT NOT NULL REFERENCES users(id),
      day TEXT NOT NULL CHECK (day IN ('Mon', 'Tue', 'Wed', 'Thu', 'Fri')),
      start_time TEXT NOT NULL,
      end_time TEXT NOT NULL,
      subject TEXT NOT NULL,
      code TEXT NOT NULL,
      faculty TEXT NOT NULL,
      room TEXT NOT NULL,
      type TEXT NOT NULL CHECK (type IN ('Lecture', 'Lab', 'Tutorial'))
    );
    CREATE TABLE IF NOT EXISTS assignments (
      id TEXT PRIMARY KEY,
      student_id TEXT NOT NULL REFERENCES users(id),
      title TEXT NOT NULL,
      subject TEXT NOT NULL,
      code TEXT NOT NULL,
      due TEXT NOT NULL,
      status TEXT NOT NULL,
      faculty TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS attendance (
      id TEXT PRIMARY KEY,
      student_id TEXT NOT NULL REFERENCES users(id),
      course_code TEXT NOT NULL,
      subject TEXT NOT NULL,
      attended INTEGER NOT NULL,
      total INTEGER NOT NULL
    );
  `);
}

function seedDemoData(db: DatabaseSync) {
  // These mock module records are used only to initialize an empty local demo database.
  const studentEmail = currentStudent.email;
  const adminEmail = currentAdmin.email;
  const facultyEmail = currentFaculty.email;
  const studentPassword = process.env["CAMPUSX_DEMO_STUDENT_PASSWORD"];
  const adminPassword = process.env["CAMPUSX_DEMO_ADMIN_PASSWORD"];
  const facultyPassword = process.env["CAMPUSX_DEMO_FACULTY_PASSWORD"];

  if (studentPassword && studentPassword.length < 10)
    throw new Error("CAMPUSX_DEMO_STUDENT_PASSWORD must be at least 10 characters.");
  if (adminPassword && adminPassword.length < 10)
    throw new Error("CAMPUSX_DEMO_ADMIN_PASSWORD must be at least 10 characters.");
  if (facultyPassword && facultyPassword.length < 10)
    throw new Error("CAMPUSX_DEMO_FACULTY_PASSWORD must be at least 10 characters.");

  if (studentPassword && !db.prepare("SELECT id FROM users WHERE email = ?").get(studentEmail)) {
    db.prepare(
      "INSERT INTO users (id, email, name, role, student_id, password_hash) VALUES (?, ?, ?, 'Student', ?, ?)",
    ).run(
      "demo-student",
      studentEmail,
      currentStudent.name,
      currentStudent.roll,
      hashPassword(studentPassword),
    );
  }
  if (adminPassword && !db.prepare("SELECT id FROM users WHERE email = ?").get(adminEmail)) {
    db.prepare(
      "INSERT INTO users (id, email, name, role, password_hash) VALUES (?, ?, ?, 'Admin', ?)",
    ).run("demo-admin", adminEmail, currentAdmin.name, hashPassword(adminPassword));
  }
  if (facultyPassword && !db.prepare("SELECT id FROM users WHERE email = ?").get(facultyEmail)) {
    db.prepare(
      "INSERT INTO users (id, email, name, role, password_hash) VALUES (?, ?, ?, 'Faculty', ?)",
    ).run("demo-faculty", facultyEmail, currentFaculty.name, hashPassword(facultyPassword));
  }

  const admin = db.prepare("SELECT id FROM users WHERE email = ?").get(adminEmail) as
    { id: string } | undefined;
  const student = db.prepare("SELECT id FROM users WHERE email = ?").get(studentEmail) as
    { id: string } | undefined;
  if (
    Number(
      (db.prepare("SELECT COUNT(*) AS count FROM notices").get() as { count: number }).count,
    ) === 0
  ) {
    const insert = db.prepare(
      "INSERT INTO notices (id, title, category, description, priority, department, created_by, date, read, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
    );
    for (const n of notices)
      insert.run(
        n.id,
        n.title,
        n.category,
        n.description,
        n.priority,
        n.department,
        admin?.id ?? null,
        n.date,
        n.read ? 1 : 0,
        n.date,
      );
  }
  if (
    Number(
      (db.prepare("SELECT COUNT(*) AS count FROM events").get() as { count: number }).count,
    ) === 0
  ) {
    const insert = db.prepare(
      "INSERT INTO events (id, title, date, time, venue, organizer, description, category, seats, registered) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
    );
    for (const e of events)
      insert.run(
        e.id,
        e.title,
        e.date,
        e.time,
        e.venue,
        e.organizer,
        e.description,
        e.category,
        e.seats,
        e.registered,
      );
  }
  if (
    student &&
    Number(
      (db.prepare("SELECT COUNT(*) AS count FROM timetable").get() as { count: number }).count,
    ) === 0
  ) {
    const insert = db.prepare(
      "INSERT INTO timetable (id, student_id, day, start_time, end_time, subject, code, faculty, room, type) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
    );
    for (const t of timetable)
      insert.run(
        randomUUID(),
        student.id,
        t.day,
        t.start,
        t.end,
        t.subject,
        t.code,
        t.faculty,
        t.room,
        t.type,
      );
  }
  if (
    student &&
    Number(
      (db.prepare("SELECT COUNT(*) AS count FROM assignments").get() as { count: number }).count,
    ) === 0
  ) {
    for (const a of assignments)
      db.prepare(
        "INSERT INTO assignments (id, student_id, title, subject, code, due, status, faculty) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
      ).run(a.id, student.id, a.title, a.subject, a.code, a.due, a.status, a.faculty);
  }
  if (
    student &&
    Number(
      (db.prepare("SELECT COUNT(*) AS count FROM attendance").get() as { count: number }).count,
    ) === 0
  ) {
    for (const a of attendance)
      db.prepare(
        "INSERT INTO attendance (id, student_id, course_code, subject, attended, total) VALUES (?, ?, ?, ?, ?, ?)",
      ).run(randomUUID(), student.id, a.code, a.subject, a.attended, a.total);
  }
  if (
    student &&
    Number(
      (db.prepare("SELECT COUNT(*) AS count FROM complaints").get() as { count: number }).count,
    ) === 0
  ) {
    const insert = db.prepare(
      "INSERT INTO complaints (id, user_id, title, category, description, location, priority, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
    );
    for (const c of complaints.filter((item) => item.by === currentStudent.name)) {
      insert.run(
        c.id,
        student.id,
        c.title,
        c.category,
        c.description,
        c.location,
        c.priority,
        c.status,
        `${c.date}T00:00:00.000Z`,
        `${c.date}T00:00:00.000Z`,
      );
      db.prepare(
        "INSERT INTO complaint_status_history (id, complaint_id, actor_user_id, from_status, to_status, resolution_info, created_at) VALUES (?, ?, ?, NULL, ?, '', ?)",
      ).run(randomUUID(), c.id, student.id, c.status, `${c.date}T00:00:00.000Z`);
    }
  }
}
