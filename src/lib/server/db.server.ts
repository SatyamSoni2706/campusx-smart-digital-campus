import { mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { DatabaseSync } from "node:sqlite";
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
      updated_at TEXT NOT NULL,
      assigned_faculty_user_id TEXT REFERENCES users(id) ON DELETE SET NULL
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
    CREATE TABLE IF NOT EXISTS courses (
      id TEXT PRIMARY KEY,
      code TEXT NOT NULL,
      name TEXT NOT NULL,
      semester TEXT NOT NULL DEFAULT '',
      section TEXT NOT NULL DEFAULT '',
      status TEXT NOT NULL DEFAULT 'Active' CHECK (status IN ('Active', 'Inactive')),
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      UNIQUE (code, semester, section)
    );
    CREATE TABLE IF NOT EXISTS faculty_courses (
      faculty_user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      course_id TEXT NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (faculty_user_id, course_id)
    );
    CREATE INDEX IF NOT EXISTS faculty_courses_by_course ON faculty_courses(course_id);
    CREATE TABLE IF NOT EXISTS course_enrollments (
      student_user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      course_id TEXT NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (student_user_id, course_id)
    );
    CREATE INDEX IF NOT EXISTS course_enrollments_by_course ON course_enrollments(course_id);
    CREATE TABLE IF NOT EXISTS course_assignments (
      id TEXT PRIMARY KEY,
      course_id TEXT NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
      faculty_user_id TEXT NOT NULL REFERENCES users(id),
      title TEXT NOT NULL,
      description TEXT NOT NULL DEFAULT '',
      due TEXT NOT NULL,
      max_marks REAL NOT NULL CHECK (max_marks >= 0),
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      UNIQUE (course_id, title, due)
    );
    CREATE INDEX IF NOT EXISTS course_assignments_by_course_due
      ON course_assignments(course_id, due);
    CREATE TABLE IF NOT EXISTS attendance_sessions (
      id TEXT PRIMARY KEY,
      course_id TEXT NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
      faculty_user_id TEXT NOT NULL REFERENCES users(id),
      session_date TEXT NOT NULL,
      start_time TEXT,
      end_time TEXT,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      UNIQUE (id, course_id)
    );
    CREATE INDEX IF NOT EXISTS attendance_sessions_by_course_date
      ON attendance_sessions(course_id, session_date DESC);
    CREATE TABLE IF NOT EXISTS attendance_records (
      session_id TEXT NOT NULL,
      course_id TEXT NOT NULL,
      student_user_id TEXT NOT NULL,
      status TEXT NOT NULL CHECK (status IN ('Present', 'Absent')),
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (session_id, student_user_id),
      FOREIGN KEY (session_id, course_id)
        REFERENCES attendance_sessions(id, course_id) ON DELETE CASCADE,
      FOREIGN KEY (student_user_id, course_id)
        REFERENCES course_enrollments(student_user_id, course_id) ON DELETE CASCADE
    );
    CREATE INDEX IF NOT EXISTS attendance_records_by_student_course
      ON attendance_records(student_user_id, course_id);
  `);

  // Additive migration for existing databases. Existing complaints remain unassigned.
  const complaintColumns = new Set(
    (db.prepare("PRAGMA table_info(complaints)").all() as { name: string }[]).map(
      (column) => column.name,
    ),
  );
  if (!complaintColumns.has("assigned_faculty_user_id")) {
    db.exec(
      "ALTER TABLE complaints ADD COLUMN assigned_faculty_user_id TEXT REFERENCES users(id) ON DELETE SET NULL",
    );
  }
  db.exec(`
    CREATE INDEX IF NOT EXISTS complaints_by_assigned_faculty_updated
      ON complaints(assigned_faculty_user_id, updated_at DESC)
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
  if (!assignmentColumns.has("course_assignment_id")) {
    db.exec("ALTER TABLE assignments ADD COLUMN course_assignment_id TEXT REFERENCES course_assignments(id) ON DELETE CASCADE");
  }
  db.exec(`
    CREATE UNIQUE INDEX IF NOT EXISTS assignments_by_course_assignment_student
      ON assignments(course_assignment_id, student_id) WHERE course_assignment_id IS NOT NULL
  `);
}
