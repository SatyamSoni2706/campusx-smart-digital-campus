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
  { id: "campusx-local-demo-faculty", email: "faculty.demo@campusx.test", name: "Faculty Demo", role: "Faculty", password: "FacultyDemo!2026Local" },
  { id: "campusx-local-demo-admin", email: "admin.demo@campusx.test", name: "Admin Demo", role: "Admin", password: "AdminDemo!2026Local" },
  { id: "campusx-local-demo-student-1", email: "student.demo.one@campusx.test", name: "Aarav Mehta", role: "Student", studentId: "CX26DEMO001", password: "StudentDemo!2026One" },
  { id: "campusx-local-demo-student-2", email: "student.demo.two@campusx.test", name: "Maya Iyer", role: "Student", studentId: "CX26DEMO002", password: "StudentDemo!2026Two" },
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
    const requiredTables = [
      "courses", "faculty_courses", "course_enrollments", "course_assignments",
      "assignments", "assignment_submissions", "attendance_sessions",
      "attendance_records", "complaints", "complaint_status_history", "notifications",
    ];
    const existingTables = new Set(db.prepare("SELECT name FROM sqlite_master WHERE type = 'table'").all().map((row) => row.name));
    const missingTables = requiredTables.filter((table) => !existingTables.has(table));
    if (missingTables.length) {
      throw new Error(`CampusX schema is not initialized (missing ${missingTables.join(", ")}). Start the app once, then rerun this command.`);
    }

    const findExisting = db.prepare(`
      SELECT id, email, name, role, student_id AS studentId, password_hash AS passwordHash
      FROM users WHERE id = ? OR email = ?
    `);
    const insertUser = db.prepare(`
      INSERT INTO users (id, email, name, role, student_id, password_hash)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    const accountResults = [];
    for (const account of demoAccounts) {
      const matches = findExisting.all(account.id, account.email);
      if (matches.length > 1) throw new Error(`Conflicting user records exist for ${account.email}; no records were changed.`);
      const existing = matches[0];
      if (existing) {
        const matchesDemoIdentity = existing.id === account.id
          && existing.email.toLowerCase() === account.email
          && existing.name === account.name
          && existing.role === account.role
          && existing.studentId === (account.studentId ?? null);
        if (!matchesDemoIdentity || !verifyPassword(account.password, existing.passwordHash)) {
          throw new Error(`A different user record conflicts with ${account.email}; no records were changed.`);
        }
        accountResults.push({ account, created: false });
      } else {
        insertUser.run(account.id, account.email, account.name, account.role,
          account.studentId ?? null, hashPassword(account.password));
        accountResults.push({ account, created: true });
      }
    }

    const faculty = db.prepare("SELECT id FROM users WHERE id = ? AND role = 'Faculty'").get("campusx-local-demo-faculty");
    const admin = db.prepare("SELECT id FROM users WHERE id = ? AND role = 'Admin'").get("campusx-local-demo-admin");
    const students = [
      db.prepare("SELECT id, name FROM users WHERE id = ? AND role = 'Student'").get("57ae0be0-6aa5-4d86-a9d9-88e7604096c5"),
      db.prepare("SELECT id, name FROM users WHERE id = ? AND role = 'Student'").get("campusx-local-demo-student-1"),
      db.prepare("SELECT id, name FROM users WHERE id = ? AND role = 'Student'").get("campusx-local-demo-student-2"),
    ].filter(Boolean);
    if (!faculty || !admin || students.length !== 3) {
      throw new Error("Expected Faculty Demo, Admin Demo, and the three approved demo Student accounts were not found.");
    }

    const now = new Date().toISOString();
    const courses = [
      { id: "6e3f00a0-3c80-4ca0-8a70-000000000001", code: "CS201", name: "Data Structures & Algorithms", semester: "Fall 2026", section: "DEMO" },
      { id: "6e3f00a0-3c80-4ca0-8a70-000000000002", code: "CS305", name: "Database Management Systems", semester: "Fall 2026", section: "DEMO" },
      { id: "6e3f00a0-3c80-4ca0-8a70-000000000003", code: "CS320", name: "Computer Networks", semester: "Fall 2026", section: "DEMO" },
    ];
    const insertCourse = db.prepare(`
      INSERT OR IGNORE INTO courses (id, code, name, semester, section, status, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, 'Active', ?, ?)
    `);
    const insertFacultyCourse = db.prepare("INSERT OR IGNORE INTO faculty_courses (faculty_user_id, course_id) VALUES (?, ?)");
    const insertEnrollment = db.prepare("INSERT OR IGNORE INTO course_enrollments (student_user_id, course_id) VALUES (?, ?)");
    for (const course of courses) {
      insertCourse.run(course.id, course.code, course.name, course.semester, course.section, now, now);
      const stored = db.prepare("SELECT code, name, semester, section, status FROM courses WHERE id = ?").get(course.id);
      if (!stored || stored.code !== course.code || stored.name !== course.name
        || stored.semester !== course.semester || stored.section !== course.section || stored.status !== "Active") {
        throw new Error(`A conflicting record uses reserved demo course ID ${course.id}.`);
      }
      insertFacultyCourse.run(faculty.id, course.id);
      for (const student of students) insertEnrollment.run(student.id, course.id);
    }

    const courseAssignments = [
      { id: "7e3f00a0-3c80-4ca0-8a70-000000000001", courseIndex: 0, title: "Algorithm Analysis and Search Lab", description: "Implement binary search and compare its complexity with a linear scan.", due: "2026-10-20", maxMarks: 20 },
      { id: "7e3f00a0-3c80-4ca0-8a70-000000000002", courseIndex: 1, title: "Relational Design and SQL Queries", description: "Normalize a registration schema and write representative SQL queries.", due: "2026-10-27", maxMarks: 25 },
    ];
    const insertCourseAssignment = db.prepare(`
      INSERT OR IGNORE INTO course_assignments
        (id, course_id, faculty_user_id, title, description, due, max_marks, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const insertStudentAssignment = db.prepare(`
      INSERT OR IGNORE INTO assignments
        (id, student_id, title, subject, code, due, status, faculty, marks, course_assignment_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, 'Faculty Demo', NULL, ?)
    `);
    const insertSubmission = db.prepare(`
      INSERT OR IGNORE INTO assignment_submissions
        (id, assignment_id, student_id, filename, mime_type, file_size_bytes, storage_state, submitted_at)
      VALUES (?, ?, ?, ?, 'application/pdf', ?, 'MetadataOnly', ?)
    `);
    let assignmentRow = 0;
    let submissionRow = 0;
    for (let assignmentIndex = 0; assignmentIndex < courseAssignments.length; assignmentIndex++) {
      const assignment = courseAssignments[assignmentIndex];
      const course = courses[assignment.courseIndex];
      insertCourseAssignment.run(assignment.id, course.id, faculty.id, assignment.title,
        assignment.description, assignment.due, assignment.maxMarks, now, now);
      const stored = db.prepare(`
        SELECT course_id AS courseId, faculty_user_id AS facultyUserId, title, due, max_marks AS maxMarks
        FROM course_assignments WHERE id = ?
      `).get(assignment.id);
      if (!stored || stored.courseId !== course.id || stored.facultyUserId !== faculty.id
        || stored.title !== assignment.title || stored.due !== assignment.due || stored.maxMarks !== assignment.maxMarks) {
        throw new Error(`A conflicting record uses reserved demo assignment ID ${assignment.id}.`);
      }
      for (let studentIndex = 0; studentIndex < students.length; studentIndex++) {
        const student = students[studentIndex];
        assignmentRow++;
        const submitted = assignmentIndex === 0 && studentIndex < 2;
        insertStudentAssignment.run(
          `8e3f00a0-3c80-4ca0-8a70-${String(assignmentRow).padStart(12, "0")}`,
          student.id, assignment.title, course.name, course.code, assignment.due,
          submitted ? "Submitted" : "Pending", assignment.id,
        );
        const studentAssignment = db.prepare(`
          SELECT id FROM assignments WHERE course_assignment_id = ? AND student_id = ?
        `).get(assignment.id, student.id);
        if (!studentAssignment) throw new Error(`Missing demo coursework row for ${student.name}.`);
        if (submitted) {
          submissionRow++;
          const firstName = student.name.split(" ")[0];
          insertSubmission.run(
            `9e3f00a0-3c80-4ca0-8a70-${String(submissionRow).padStart(12, "0")}`,
            studentAssignment.id, student.id, `${course.code}_${firstName}_Lab.pdf`,
            184320 + studentIndex * 4096, now,
          );
        }
      }
    }

    const attendanceSessionId = "ae3f00a0-3c80-4ca0-8a70-000000000001";
    db.prepare(`
      INSERT OR IGNORE INTO attendance_sessions
        (id, course_id, faculty_user_id, session_date, start_time, end_time, created_at, updated_at)
      VALUES (?, ?, ?, ?, '10:00', '11:00', ?, ?)
    `).run(attendanceSessionId, courses[0].id, faculty.id, new Date().toISOString().slice(0, 10), now, now);
    const insertAttendance = db.prepare(`
      INSERT OR IGNORE INTO attendance_records
        (session_id, course_id, student_user_id, status, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    students.forEach((student, index) => insertAttendance.run(attendanceSessionId, courses[0].id,
      student.id, index < 2 ? "Present" : "Absent", now, now));

    const complaintId = "C-DEMO-FACULTY-001";
    const createdAt = new Date(Date.now() - 86400000).toISOString();
    const updatedAt = new Date(Date.now() - 3600000).toISOString();
    db.prepare(`
      INSERT OR IGNORE INTO complaints
        (id, user_id, title, category, description, location, priority, status, resolution_info,
         created_at, updated_at, assigned_faculty_user_id)
      VALUES (?, ?, 'Projector display flickers during lectures', 'Classroom Facilities',
        'The projector in the demo lecture room intermittently loses signal during presentations.',
        'Academic Block, Room 204', 'Medium', 'Assigned', '', ?, ?, ?)
    `).run(complaintId, students[1].id, createdAt, updatedAt, faculty.id);
    const storedComplaint = db.prepare(`
      SELECT user_id AS userId, assigned_faculty_user_id AS facultyId, title
      FROM complaints WHERE id = ?
    `).get(complaintId);
    if (!storedComplaint || storedComplaint.userId !== students[1].id
      || storedComplaint.facultyId !== faculty.id || storedComplaint.title !== "Projector display flickers during lectures") {
      throw new Error("A conflicting record uses reserved demo complaint ID.");
    }
    db.prepare(`
      INSERT OR IGNORE INTO complaint_status_history
        (id, complaint_id, actor_user_id, from_status, to_status, resolution_info, created_at)
      VALUES ('be3f00a0-3c80-4ca0-8a70-000000000001', ?, ?, NULL, 'Submitted', '', ?)
    `).run(complaintId, students[1].id, createdAt);
    db.prepare(`
      INSERT OR IGNORE INTO complaint_status_history
        (id, complaint_id, actor_user_id, from_status, to_status, resolution_info, created_at)
      VALUES ('be3f00a0-3c80-4ca0-8a70-000000000002', ?, ?, 'Submitted', 'Assigned', '', ?)
    `).run(complaintId, admin.id, updatedAt);
    db.prepare(`
      INSERT OR IGNORE INTO notifications (id, user_id, title, body, type, time_label, created_at, read_at)
      VALUES ('demo-complaint-C-DEMO-FACULTY-001', ?, 'Complaint assigned to you',
        'Complaint “Projector display flickers during lectures” (C-DEMO-FACULTY-001) has been assigned to your account.',
        'complaint', 'Demo setup', ?, NULL)
    `).run(faculty.id, updatedAt);

    db.exec("COMMIT");
    for (const { account, created } of accountResults) {
      console.log(`${created ? "Created" : "Already provisioned"} ${account.role} demo account.`);
      console.log(`  Email: ${account.email}`);
      console.log(`  Password: ${account.password}`);
    }
    console.log("Seeded/reused 3 Faculty Demo courses, enrolled 3 Students in each, created 2 course assignments and submission metadata, added 1 attendance session and 1 assigned issue.");
    console.log("These credentials and records are for this local demo database only; do not deploy them.");
  } catch (error) {
    db.exec("ROLLBACK");
    throw error;
  }
} finally {
  db.close();
}