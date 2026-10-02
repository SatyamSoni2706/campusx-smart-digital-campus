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
    CREATE TABLE IF NOT EXISTS event_registrations (
      id TEXT PRIMARY KEY,
      event_id TEXT NOT NULL REFERENCES events(id) ON DELETE CASCADE,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      status TEXT NOT NULL CHECK (status IN ('Registered', 'Cancelled')),
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      cancelled_at TEXT,
      UNIQUE(event_id, user_id)
    );
    CREATE INDEX IF NOT EXISTS event_registrations_by_event ON event_registrations(event_id);
    CREATE TABLE IF NOT EXISTS lost_found_items (
      id TEXT PRIMARY KEY,
      reporter_user_id TEXT NOT NULL REFERENCES users(id),
      kind TEXT NOT NULL CHECK (kind IN ('Lost', 'Found')),
      item TEXT NOT NULL,
      category TEXT NOT NULL,
      description TEXT NOT NULL,
      location TEXT NOT NULL,
      status TEXT NOT NULL CHECK (status IN ('Open', 'Claimed')) DEFAULT 'Open',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      claimed_by_user_id TEXT REFERENCES users(id),
      claimed_at TEXT
    );
    CREATE INDEX IF NOT EXISTS lost_found_items_created ON lost_found_items(created_at DESC);
    CREATE TABLE IF NOT EXISTS lost_found_claims (
      id TEXT PRIMARY KEY,
      item_id TEXT NOT NULL UNIQUE REFERENCES lost_found_items(id) ON DELETE CASCADE,
      claimer_user_id TEXT NOT NULL REFERENCES users(id),
      status TEXT NOT NULL CHECK (status IN ('Active', 'Cancelled')),
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS lost_found_status_history (
      id TEXT PRIMARY KEY,
      item_id TEXT NOT NULL REFERENCES lost_found_items(id) ON DELETE CASCADE,
      actor_user_id TEXT NOT NULL REFERENCES users(id),
      from_status TEXT,
      to_status TEXT NOT NULL,
      created_at TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS lost_found_history_by_item ON lost_found_status_history(item_id, created_at);
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
    CREATE TABLE IF NOT EXISTS assignment_submissions (
      id TEXT PRIMARY KEY,
      assignment_id TEXT NOT NULL REFERENCES assignments(id) ON DELETE CASCADE,
      student_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      filename TEXT NOT NULL,
      mime_type TEXT NOT NULL DEFAULT '',
      file_size_bytes INTEGER NOT NULL CHECK (file_size_bytes >= 0),
      storage_state TEXT NOT NULL CHECK (storage_state = 'MetadataOnly'),
      submitted_at TEXT NOT NULL,
      UNIQUE (assignment_id, student_id)
    );
    CREATE INDEX IF NOT EXISTS assignment_submissions_by_student
      ON assignment_submissions(student_id, submitted_at DESC);
    CREATE TABLE IF NOT EXISTS notifications (
      id TEXT NOT NULL,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      title TEXT NOT NULL,
      body TEXT NOT NULL,
      type TEXT NOT NULL CHECK (type IN ('assignment', 'complaint', 'notice', 'event')),
      time_label TEXT NOT NULL,
      created_at TEXT NOT NULL,
      read_at TEXT,
      PRIMARY KEY (user_id, id)
    );
    CREATE INDEX IF NOT EXISTS notifications_by_user
      ON notifications(user_id, created_at DESC);
    CREATE TABLE IF NOT EXISTS attendance (
      id TEXT PRIMARY KEY,
      student_id TEXT NOT NULL REFERENCES users(id),
      course_code TEXT NOT NULL,
      subject TEXT NOT NULL,
      attended INTEGER NOT NULL,
      total INTEGER NOT NULL
    );
  `);

  // Existing SQLite files may have the original event_registrations schema.
  // CREATE TABLE IF NOT EXISTS does not add columns to an existing table.
  const eventRegistrationColumns = new Set(
    (db.prepare("PRAGMA table_info(event_registrations)").all() as { name: string }[]).map(
      (column) => column.name,
    ),
  );
  if (!eventRegistrationColumns.has("status")) {
    db.exec(
      "ALTER TABLE event_registrations ADD COLUMN status TEXT NOT NULL DEFAULT 'Registered' CHECK (status IN ('Registered', 'Cancelled'))",
    );
  }
  if (!eventRegistrationColumns.has("updated_at")) {
    db.exec("ALTER TABLE event_registrations ADD COLUMN updated_at TEXT NOT NULL DEFAULT ''");
    db.exec("UPDATE event_registrations SET updated_at = created_at WHERE updated_at = ''");
  }
  if (!eventRegistrationColumns.has("cancelled_at")) {
    db.exec("ALTER TABLE event_registrations ADD COLUMN cancelled_at TEXT");
  }

  const assignmentColumns = new Set(
    (db.prepare("PRAGMA table_info(assignments)").all() as { name: string }[]).map(
      (column) => column.name,
    ),
  );
  if (!assignmentColumns.has("marks")) {
    db.exec("ALTER TABLE assignments ADD COLUMN marks TEXT");
  }
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
  const satyamDemoStudents = db
    .prepare("SELECT id FROM users WHERE role = 'Student' AND name = ? COLLATE NOCASE")
    .all("Satyam Soni") as { id: string }[];
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
  const satyamDemoStudent = satyamDemoStudents[0];
  if (satyamDemoStudents.length === 1 && satyamDemoStudent) {
    seedSatyamAcademicData(db, satyamDemoStudent.id);
  }
}

function seedSatyamAcademicData(db: DatabaseSync, studentId: string) {
  const demoAssignments = [
    ["satyam-demo-assignment-a1", "ER Diagram for Library System", "Database Systems", "CS303", "2026-10-08", "Pending", "Prof. S. Nair", null],
    ["satyam-demo-assignment-a2", "Process Scheduling Simulator", "Operating Systems", "CS302", "2026-10-10", "Pending", "Prof. M. Kulkarni", null],
    ["satyam-demo-assignment-a3", "Sprint 2 Report", "Software Engineering", "CS304", "2026-10-13", "Pending", "Prof. D. Menon", null],
    ["satyam-demo-assignment-a4", "AVL Tree Implementation", "Data Structures & Algorithms", "CS301", "2026-09-25", "Graded", "Prof. R. Iyer", "18/20"],
    ["satyam-demo-assignment-a5", "Subnetting Worksheet", "Computer Networks", "CS305", "2026-09-27", "Submitted", "Dr. A. Verma", null],
    ["satyam-demo-assignment-a6", "Graph Theory Problem Set", "Discrete Mathematics", "MA301", "2026-09-29", "Overdue", "Dr. K. Rao", null],
  ] as const;
  const insertAssignment = db.prepare(
    `INSERT OR IGNORE INTO assignments (id, student_id, title, subject, code, due, status, faculty, marks)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  );
  for (const [id, title, subject, code, due, status, faculty, marks] of demoAssignments) {
    insertAssignment.run(id, studentId, title, subject, code, due, status, faculty, marks);
  }

  const demoAttendance = [
    ["CS301", "Data Structures & Algorithms", 19, 21],
    ["CS302", "Operating Systems", 17, 21],
    ["CS303", "Database Systems", 20, 22],
    ["CS304", "Software Engineering", 18, 20],
    ["CS305", "Computer Networks", 16, 19],
    ["MA301", "Discrete Mathematics", 15, 20],
  ] as const;
  const insertAttendance = db.prepare(
    "INSERT OR IGNORE INTO attendance (id, student_id, course_code, subject, attended, total) VALUES (?, ?, ?, ?, ?, ?)",
  );
  for (const [code, subject, attended, total] of demoAttendance) {
    insertAttendance.run(`satyam-demo-attendance-${code.toLowerCase()}`, studentId, code, subject, attended, total);
  }

  const demoTimetable = [
    ["Mon", "09:00", "10:00", "Database Systems", "CS303", "Prof. S. Nair", "LH-3", "Lecture"],
    ["Mon", "11:00", "12:00", "Operating Systems", "CS302", "Prof. M. Kulkarni", "LH-3", "Lecture"],
    ["Mon", "14:00", "16:00", "Data Structures & Algorithms", "CS301", "Prof. R. Iyer", "Lab-2", "Lab"],
    ["Tue", "09:00", "10:00", "Discrete Mathematics", "MA301", "Dr. K. Rao", "LH-4", "Lecture"],
    ["Tue", "11:00", "12:00", "Software Engineering", "CS304", "Prof. D. Menon", "LH-2", "Lecture"],
    ["Tue", "14:00", "15:00", "Computer Networks", "CS305", "Dr. A. Verma", "LH-5", "Lecture"],
    ["Wed", "09:00", "10:00", "Operating Systems", "CS302", "Prof. M. Kulkarni", "LH-3", "Lecture"],
    ["Wed", "11:00", "12:00", "Database Systems", "CS303", "Prof. S. Nair", "LH-3", "Tutorial"],
    ["Wed", "14:00", "16:00", "Computer Networks", "CS305", "Dr. A. Verma", "Net-Lab", "Lab"],
    ["Thu", "09:00", "10:00", "Data Structures & Algorithms", "CS301", "Prof. R. Iyer", "LH-2", "Lecture"],
    ["Thu", "11:00", "12:00", "Discrete Mathematics", "MA301", "Dr. K. Rao", "LH-4", "Lecture"],
    ["Thu", "14:00", "16:00", "Software Engineering", "CS304", "Prof. D. Menon", "Project-Lab", "Lab"],
    ["Fri", "09:00", "10:00", "Database Systems", "CS303", "Prof. S. Nair", "LH-3", "Lecture"],
    ["Fri", "11:00", "12:00", "Operating Systems", "CS302", "Prof. M. Kulkarni", "LH-3", "Tutorial"],
    ["Fri", "14:00", "15:00", "Discrete Mathematics", "MA301", "Dr. K. Rao", "LH-4", "Tutorial"],
  ] as const;
  const insertTimetable = db.prepare(
    "INSERT OR IGNORE INTO timetable (id, student_id, day, start_time, end_time, subject, code, faculty, room, type) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
  );
  for (const [day, start, end, subject, code, faculty, room, type] of demoTimetable) {
    insertTimetable.run(
      `satyam-demo-timetable-${day.toLowerCase()}-${start.replace(":", "")}-${code.toLowerCase()}`,
      studentId,
      day,
      start,
      end,
      subject,
      code,
      faculty,
      room,
      type,
    );
  }
}
