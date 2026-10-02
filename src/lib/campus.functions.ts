import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import type { Complaint, ComplaintStatus, Notice, Priority } from "@/data/mock";

type ComplaintRecord = Complaint & {
  resolutionInfo: string;
  createdAt: string;
  updatedAt: string;
  history: {
    fromStatus: string | null;
    toStatus: string;
    resolutionInfo: string;
    createdAt: string;
    actorName: string;
  }[];
};
type ComplaintRow = Complaint & {
  userId: string;
  assignedFacultyUserId: string | null;
  resolutionInfo: string;
  createdAt: string;
  updatedAt: string;
};
type NoticeRow = Notice & { updatedAt: string };

const complaintSchema = z.object({
  title: z.string().trim().min(4).max(160),
  category: z.string().trim().min(2).max(80),
  description: z.string().trim().min(8).max(2000),
  location: z.string().trim().min(2).max(160),
  priority: z.enum(["Low", "Medium", "High", "Urgent"]),
});
const complaintUpdateSchema = z.object({
  id: z.string().min(3).max(100),
  status: z.enum(["Submitted", "Under Review", "Assigned", "In Progress", "Resolved", "Rejected"]),
  resolutionInfo: z.string().trim().max(2000),
});
const noticeSchema = z.object({
  title: z.string().trim().min(4).max(160),
  category: z.enum(["Academic", "Exam", "Hostel", "Placement", "General", "Finance"]),
  description: z.string().trim().min(8).max(3000),
  priority: z.enum(["Low", "Medium", "High", "Urgent"]),
  department: z.string().trim().min(2).max(120),
});
const noticeUpdateSchema = noticeSchema.extend({ id: z.string().min(2).max(100) });
const eventSchema = z.object({
  title: z.string().trim().min(4).max(160),
  date: z.string().date(),
  time: z.string().trim().min(2).max(40),
  venue: z.string().trim().min(2).max(160),
  organizer: z.string().trim().min(2).max(120),
  description: z.string().trim().max(2000),
  seats: z.number().int().min(1).max(100000),
});
const complaintAssignmentSchema = z.object({
  complaintId: z.string().trim().min(3).max(100),
  facultyUserId: z.string().trim().min(1).max(100).nullable(),
});
const eventRegistrationSchema = z.object({
  eventId: z.string().min(1).max(100),
  registered: z.boolean(),
});
const lostFoundSchema = z.object({
  kind: z.enum(["Lost", "Found"]),
  item: z.string().trim().min(2).max(160),
  category: z.string().trim().min(2).max(80),
  description: z.string().trim().max(2000),
  location: z.string().trim().min(2).max(160),
});
const lostFoundClaimSchema = z.object({ id: z.string().min(1).max(100) });
const assignmentSubmissionSchema = z.object({
  assignmentId: z.string().min(1).max(100),
  filename: z
    .string()
    .trim()
    .min(1)
    .max(255)
    .transform((name) => name.replace(/[\\/]/g, "_").replace(/[\u0000-\u001F\u007F]/g, ""))
    .refine((name) => name.length > 0, "Choose a valid filename."),
  mimeType: z.string().max(120).default(""),
  fileSizeBytes: z.number().int().min(0).max(25 * 1024 * 1024),
});
const notificationReadSchema = z.discriminatedUnion("mode", [
  z.object({ mode: z.literal("one"), id: z.string().min(1).max(100) }),
  z.object({ mode: z.literal("all") }),
]);
const facultyAttendanceQuerySchema = z.object({
  courseId: z.string().uuid().optional(),
  sessionId: z.string().uuid().optional(),
}).refine((input) => !input.sessionId || input.courseId, "A course is required to load a session.");
const facultyAttendanceSaveSchema = z.object({
  courseId: z.string().uuid(),
  sessionId: z.string().uuid().optional(),
  sessionDate: z.string().date(),
  startTime: z.union([z.string().regex(/^(?:[01]\d|2[0-3]):[0-5]\d$/), z.literal("")]).default(""),
  endTime: z.union([z.string().regex(/^(?:[01]\d|2[0-3]):[0-5]\d$/), z.literal("")]).default(""),
  records: z.array(z.object({
    studentUserId: z.string().trim().min(1).max(100),
    status: z.enum(["Present", "Absent"]),
  })).min(1).max(1000),
}).superRefine((input, context) => {
  const studentIds = input.records.map((record) => record.studentUserId);
  if (new Set(studentIds).size !== studentIds.length) {
    context.addIssue({ code: "custom", path: ["records"], message: "Each enrolled student can be marked only once." });
  }
  if (input.startTime && input.endTime && input.startTime >= input.endTime) {
    context.addIssue({ code: "custom", path: ["endTime"], message: "End time must be after start time." });
  }
});
const courseCreateSchema = z.object({
  code: z.string().trim().min(2).max(24).transform((code) => code.toUpperCase()),
  name: z.string().trim().min(2).max(120),
  semester: z.string().trim().max(40).default(""),
  section: z.string().trim().max(40).default(""),
});
const courseUserSchema = z.object({
  courseId: z.string().uuid(),
  userId: z.string().trim().min(1).max(100),
});
const courseAssignmentSchema = z.object({
  courseId: z.string().uuid(),
  title: z.string().trim().min(3).max(160),
  description: z.string().trim().max(5000).default(""),
  due: z.string().date(),
  maxMarks: z.number().finite().positive().max(1_000_000),
});
const assignmentGradeSchema = z.object({
  courseAssignmentId: z.string().uuid(),
  studentUserId: z.string().trim().min(1).max(100),
  marks: z.number().finite().min(0).max(1_000_000),
});
const facultyAssignmentQuerySchema = z.object({
  courseAssignmentId: z.string().uuid().optional(),
});

type EventView = {
  id: string;
  title: string;
  date: string;
  time: string;
  venue: string;
  organizer: string;
  description: string;
  category: string;
  seats: number;
  registered: number;
  isRegistered: boolean;
};
type LostFoundViewItem = {
  id: string;
  kind: "Lost" | "Found";
  item: string;
  category: string;
  description: string;
  location: string;
  date: string;
  status: "Open" | "Claimed";
};

function complaintHistory(db: import("node:sqlite").DatabaseSync, id: string) {
  return db
    .prepare(
      `SELECT h.from_status AS fromStatus, h.to_status AS toStatus,
      h.resolution_info AS resolutionInfo, h.created_at AS createdAt, u.name AS actorName
    FROM complaint_status_history h JOIN users u ON u.id = h.actor_user_id
    WHERE h.complaint_id = ? ORDER BY h.created_at, h.id`,
    )
    .all(id) as ComplaintRecord["history"];
}

function toComplaintRecord(
  db: import("node:sqlite").DatabaseSync,
  row: ComplaintRow,
): ComplaintRecord {
  return { ...row, history: complaintHistory(db, row.id) };
}

export const listComplaintsFn = createServerFn({ method: "GET" }).handler(async () => {
  const { requireCampusUser } = await import("./server/auth.server");
  const { getDb } = await import("./server/db.server");
  const user = await requireCampusUser();
  const db = getDb();
  if (user.role === "Faculty") throw new Error("Use the Faculty issue list.");
  const query = `SELECT c.id, c.title, c.category, c.description, c.location, c.priority, c.status,
    substr(c.created_at, 1, 10) AS date,
    c.user_id AS userId, c.assigned_faculty_user_id AS assignedFacultyUserId,
    c.resolution_info AS resolutionInfo, c.created_at AS createdAt,
    c.updated_at AS updatedAt, u.name AS by
    FROM complaints c JOIN users u ON u.id = c.user_id`;
  const rows = (user.role === "Admin"
    ? db.prepare(`${query} ORDER BY c.updated_at DESC`).all()
    : db.prepare(`${query} WHERE c.user_id = ? ORDER BY c.updated_at DESC`).all(user.id)) as ComplaintRow[];
  return rows.map((row) => toComplaintRecord(db, row));
});

export const listFacultyComplaintsFn = createServerFn({ method: "GET" }).handler(async () => {
  const { requireCampusUser } = await import("./server/auth.server");
  const { getDb } = await import("./server/db.server");
  const faculty = await requireCampusUser("Faculty");
  const db = getDb();
  const rows = db.prepare(`
    SELECT c.id, c.title, c.category, c.description, c.location, c.priority, c.status,
      substr(c.created_at, 1, 10) AS date,
      c.user_id AS userId, c.assigned_faculty_user_id AS assignedFacultyUserId,
      c.resolution_info AS resolutionInfo, c.created_at AS createdAt,
      c.updated_at AS updatedAt, u.name AS by
    FROM complaints c JOIN users u ON u.id = c.user_id
    WHERE c.assigned_faculty_user_id = ? ORDER BY c.updated_at DESC
  `).all(faculty.id) as ComplaintRow[];
  return rows.map((row) => toComplaintRecord(db, row));
});

export const listAdminComplaintFacultyFn = createServerFn({ method: "GET" }).handler(async () => {
  const { requireCampusUser } = await import("./server/auth.server");
  const { getDb } = await import("./server/db.server");
  await requireCampusUser("Admin");
  return getDb().prepare(`
    SELECT id, name, email FROM users WHERE role = 'Faculty' ORDER BY name COLLATE NOCASE
  `).all() as { id: string; name: string; email: string }[];
});

export const assignComplaintFacultyFn = createServerFn({ method: "POST" })
  .validator((input: unknown) => complaintAssignmentSchema.parse(input))
  .handler(async ({ data }) => {
    const { requireCampusUser } = await import("./server/auth.server");
    const { getDb } = await import("./server/db.server");
    await requireCampusUser("Admin");
    const db = getDb();
    if (data.facultyUserId !== null) {
      const faculty = db.prepare("SELECT id FROM users WHERE id = ? AND role = 'Faculty'").get(data.facultyUserId);
      if (!faculty) throw new Error("Select a registered Faculty account.");
    }
    const result = db.prepare("UPDATE complaints SET assigned_faculty_user_id = ?, updated_at = ? WHERE id = ?")
      .run(data.facultyUserId, new Date().toISOString(), data.complaintId);
    if (Number(result.changes) === 0) throw new Error("Complaint was not found.");
    return { ok: true as const };
  });

export const updateAssignedComplaintFn = createServerFn({ method: "POST" })
  .validator((input: unknown) => complaintUpdateSchema.parse(input))
  .handler(async ({ data }) => {
    const { requireCampusUser } = await import("./server/auth.server");
    const { getDb } = await import("./server/db.server");
    const { randomUUID } = await import("node:crypto");
    const faculty = await requireCampusUser("Faculty");
    const db = getDb();
    db.exec("BEGIN IMMEDIATE");
    try {
      const current = db.prepare(`
        SELECT status, resolution_info AS resolutionInfo FROM complaints
        WHERE id = ? AND assigned_faculty_user_id = ?
      `).get(data.id, faculty.id) as { status: ComplaintStatus; resolutionInfo: string } | undefined;
      if (!current) throw new Error("Assigned complaint was not found.");
      const now = new Date().toISOString();
      db.prepare(`UPDATE complaints SET status = ?, resolution_info = ?, updated_at = ?
        WHERE id = ? AND assigned_faculty_user_id = ?`)
        .run(data.status, data.resolutionInfo, now, data.id, faculty.id);
      if (current.status !== data.status || current.resolutionInfo !== data.resolutionInfo) {
        db.prepare(`INSERT INTO complaint_status_history
          (id, complaint_id, actor_user_id, from_status, to_status, resolution_info, created_at)
          VALUES (?, ?, ?, ?, ?, ?, ?)`)
          .run(randomUUID(), data.id, faculty.id, current.status, data.status, data.resolutionInfo, now);
      }
      db.exec("COMMIT");
    } catch (error) {
      db.exec("ROLLBACK");
      throw error;
    }
    const row = db.prepare(`SELECT c.id, c.title, c.category, c.description, c.location, c.priority, c.status,
      substr(c.created_at, 1, 10) AS date, c.user_id AS userId,
      c.assigned_faculty_user_id AS assignedFacultyUserId,
      c.resolution_info AS resolutionInfo, c.created_at AS createdAt,
      c.updated_at AS updatedAt, u.name AS by FROM complaints c
      JOIN users u ON u.id = c.user_id
      WHERE c.id = ? AND c.assigned_faculty_user_id = ?`).get(data.id, faculty.id) as ComplaintRow;
    return toComplaintRecord(db, row);
  });

export const createComplaintFn = createServerFn({ method: "POST" })
  .validator((input: unknown) => complaintSchema.parse(input))
  .handler(async ({ data }) => {
    const { requireCampusUser } = await import("./server/auth.server");
    const { getDb } = await import("./server/db.server");
    const { randomUUID } = await import("node:crypto");
    const user = await requireCampusUser("Student");
    const db = getDb();
    const now = new Date().toISOString();
    const id = `C-${randomUUID().slice(0, 8).toUpperCase()}`;
    db.exec("BEGIN IMMEDIATE");
    try {
      db.prepare(
        `INSERT INTO complaints (id, user_id, title, category, description, location, priority, status, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, 'Submitted', ?, ?)`,
      ).run(
        id,
        user.id,
        data.title,
        data.category,
        data.description,
        data.location,
        data.priority,
        now,
        now,
      );
      db.prepare(
        `INSERT INTO complaint_status_history (id, complaint_id, actor_user_id, from_status, to_status, resolution_info, created_at)
        VALUES (?, ?, ?, NULL, 'Submitted', '', ?)`,
      ).run(randomUUID(), id, user.id, now);
      db.exec("COMMIT");
    } catch (error) {
      db.exec("ROLLBACK");
      throw error;
    }
    const row = db
      .prepare(
        `SELECT c.id, c.title, c.category, c.description, c.location, c.priority, c.status,
      substr(c.created_at, 1, 10) AS date,
      c.user_id AS userId, c.assigned_faculty_user_id AS assignedFacultyUserId,
      c.resolution_info AS resolutionInfo, c.created_at AS createdAt,
      c.updated_at AS updatedAt, u.name AS by FROM complaints c JOIN users u ON u.id = c.user_id WHERE c.id = ?`,
      )
      .get(id) as ComplaintRow;
    return toComplaintRecord(db, row);
  });

export const updateComplaintFn = createServerFn({ method: "POST" })
  .validator((input: unknown) => complaintUpdateSchema.parse(input))
  .handler(async ({ data }) => {
    const { requireCampusUser } = await import("./server/auth.server");
    const { getDb } = await import("./server/db.server");
    const { randomUUID } = await import("node:crypto");
    const admin = await requireCampusUser("Admin");
    const db = getDb();
    const current = db
      .prepare("SELECT status, resolution_info AS resolutionInfo FROM complaints WHERE id = ?")
      .get(data.id) as { status: ComplaintStatus; resolutionInfo: string } | undefined;
    if (!current) throw new Error("Complaint was not found.");
    const now = new Date().toISOString();
    db.exec("BEGIN IMMEDIATE");
    try {
      db.prepare(
        "UPDATE complaints SET status = ?, resolution_info = ?, updated_at = ? WHERE id = ?",
      ).run(data.status, data.resolutionInfo, now, data.id);
      if (current.status !== data.status || current.resolutionInfo !== data.resolutionInfo) {
        db.prepare(
          `INSERT INTO complaint_status_history (id, complaint_id, actor_user_id, from_status, to_status, resolution_info, created_at)
          VALUES (?, ?, ?, ?, ?, ?, ?)`,
        ).run(
          randomUUID(),
          data.id,
          admin.id,
          current.status,
          data.status,
          data.resolutionInfo,
          now,
        );
      }
      db.exec("COMMIT");
    } catch (error) {
      db.exec("ROLLBACK");
      throw error;
    }
    const row = db
      .prepare(
        `SELECT c.id, c.title, c.category, c.description, c.location, c.priority, c.status,
      substr(c.created_at, 1, 10) AS date,
      c.user_id AS userId, c.assigned_faculty_user_id AS assignedFacultyUserId,
      c.resolution_info AS resolutionInfo, c.created_at AS createdAt,
      c.updated_at AS updatedAt, u.name AS by FROM complaints c JOIN users u ON u.id = c.user_id WHERE c.id = ?`,
      )
      .get(data.id) as ComplaintRow;
    return toComplaintRecord(db, row);
  });

function listNoticeRecords(db: import("node:sqlite").DatabaseSync) {
  const rows = db
    .prepare(
      `SELECT id, title, category, description, priority, department, date,
      read, updated_at AS updatedAt
    FROM notices ORDER BY date DESC, updated_at DESC`,
    )
    .all() as (Omit<NoticeRow, "read"> & { read: number })[];
  return rows.map((row) => ({ ...row, read: Boolean(row.read) }));
}

export const listNoticesFn = createServerFn({ method: "GET" }).handler(async () => {
  const { requireCampusUser } = await import("./server/auth.server");
  const { getDb } = await import("./server/db.server");
  await requireCampusUser();
  return listNoticeRecords(getDb());
});

export const listFacultyNoticesFn = createServerFn({ method: "GET" }).handler(async () => {
  const { requireCampusUser } = await import("./server/auth.server");
  const { getDb } = await import("./server/db.server");
  await requireCampusUser("Faculty");
  return listNoticeRecords(getDb());
});

export const createNoticeFn = createServerFn({ method: "POST" })
  .validator((input: unknown) => noticeSchema.parse(input))
  .handler(async ({ data }) => {
    const { requireCampusUser } = await import("./server/auth.server");
    const { getDb } = await import("./server/db.server");
    const { randomUUID } = await import("node:crypto");
    const admin = await requireCampusUser("Admin");
    const db = getDb();
    const now = new Date().toISOString();
    const record: NoticeRow = {
      id: randomUUID(),
      ...data,
      date: now.slice(0, 10),
      read: false,
      updatedAt: now,
    };
    db.prepare(
      `INSERT INTO notices (id, title, category, description, priority, department, created_by, date, read, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, ?)`,
    ).run(
      record.id,
      record.title,
      record.category,
      record.description,
      record.priority,
      record.department,
      admin.id,
      record.date,
      now,
    );
    return record;
  });

export const updateNoticeFn = createServerFn({ method: "POST" })
  .validator((input: unknown) => noticeUpdateSchema.parse(input))
  .handler(async ({ data }) => {
    const { requireCampusUser } = await import("./server/auth.server");
    const { getDb } = await import("./server/db.server");
    const { randomUUID } = await import("node:crypto");
    const admin = await requireCampusUser("Admin");
    const db = getDb();
    const now = new Date().toISOString();
    const result = db
      .prepare(
        "UPDATE notices SET title = ?, category = ?, description = ?, priority = ?, department = ?, created_by = ?, updated_at = ? WHERE id = ?",
      )
      .run(
        data.title,
        data.category,
        data.description,
        data.priority,
        data.department,
        admin.id,
        now,
        data.id,
      );
    if (Number(result.changes) === 0) throw new Error("Notice was not found.");
    const row = db
      .prepare(
        "SELECT id, title, category, description, priority, department, date, read, updated_at AS updatedAt FROM notices WHERE id = ?",
      )
      .get(data.id) as Omit<NoticeRow, "read"> & { read: number };
    return { ...row, read: Boolean(row.read) };
  });

function eventView(
  db: import("node:sqlite").DatabaseSync,
  id: string,
  userId: string,
): EventView | undefined {
  const row = db
    .prepare(
      `SELECT e.id, e.title, e.date, e.time, e.venue, e.organizer, e.description, e.category,
        e.seats, e.registered,
        EXISTS(SELECT 1 FROM event_registrations r
          WHERE r.event_id = e.id AND r.user_id = ? AND r.status = 'Registered') AS isRegistered
      FROM events e WHERE e.id = ?`,
    )
    .get(userId, id) as (Omit<EventView, "isRegistered"> & { isRegistered: number }) | undefined;
  return row ? { ...row, isRegistered: Boolean(row.isRegistered) } : undefined;
}

export const listEventsFn = createServerFn({ method: "GET" }).handler(async () => {
  const { requireCampusUser } = await import("./server/auth.server");
  const { getDb } = await import("./server/db.server");
  const user = await requireCampusUser();
  if (user.role === "Faculty") await requireCampusUser("Faculty");
  else if (user.role !== "Student" && user.role !== "Admin")
    throw new Error("You do not have access to events.");
  const db = getDb();
  const rows = db.prepare("SELECT id FROM events ORDER BY date, title").all() as { id: string }[];
  return rows.flatMap((row) => {
    const event = eventView(db, row.id, user.id);
    return event ? [event] : [];
  });
});

export const createEventFn = createServerFn({ method: "POST" })
  .validator((input: unknown) => eventSchema.parse(input))
  .handler(async ({ data }) => {
    const { requireCampusUser } = await import("./server/auth.server");
    const { getDb } = await import("./server/db.server");
    const { randomUUID } = await import("node:crypto");
    const admin = await requireCampusUser("Admin");
    const db = getDb();
    const id = randomUUID();
    db.prepare(
      `INSERT INTO events (id, title, date, time, venue, organizer, description, category, seats, registered)
      VALUES (?, ?, ?, ?, ?, ?, ?, 'General', ?, 0)`,
    ).run(id, data.title, data.date, data.time, data.venue, data.organizer, data.description, data.seats);
    const event = eventView(db, id, admin.id);
    if (!event) throw new Error("Could not load the created event.");
    return event;
  });

export const setEventRegistrationFn = createServerFn({ method: "POST" })
  .validator((input: unknown) => eventRegistrationSchema.parse(input))
  .handler(async ({ data }) => {
    const { requireCampusUser } = await import("./server/auth.server");
    const { getDb } = await import("./server/db.server");
    const { randomUUID } = await import("node:crypto");
    const user = await requireCampusUser("Student");
    const db = getDb();
    db.exec("BEGIN IMMEDIATE");
    try {
      const event = db.prepare("SELECT seats, registered FROM events WHERE id = ?").get(data.eventId) as
        | { seats: number; registered: number }
        | undefined;
      if (!event) throw new Error("Event was not found.");
      const existing = db
        .prepare("SELECT id, status FROM event_registrations WHERE event_id = ? AND user_id = ?")
        .get(data.eventId, user.id);
      const now = new Date().toISOString();
      if (data.registered && (!existing || (existing as { status: string }).status === "Cancelled")) {
        if (event.registered >= event.seats) throw new Error("This event is full.");
        if (existing) {
          db.prepare(
            `UPDATE event_registrations SET status = 'Registered', updated_at = ?, cancelled_at = NULL
            WHERE event_id = ? AND user_id = ?`,
          ).run(now, data.eventId, user.id);
        } else {
        db.prepare(
            `INSERT INTO event_registrations (id, event_id, user_id, status, created_at, updated_at)
            VALUES (?, ?, ?, 'Registered', ?, ?)`,
          ).run(randomUUID(), data.eventId, user.id, now, now);
        }
        db.prepare("UPDATE events SET registered = registered + 1 WHERE id = ?").run(data.eventId);
      } else if (!data.registered && existing && (existing as { status: string }).status === "Registered") {
        db.prepare(
          `UPDATE event_registrations SET status = 'Cancelled', updated_at = ?, cancelled_at = ?
          WHERE event_id = ? AND user_id = ?`,
        ).run(now, now, data.eventId, user.id);
        db.prepare("UPDATE events SET registered = MAX(0, registered - 1) WHERE id = ?").run(
          data.eventId,
        );
      }
      db.exec("COMMIT");
    } catch (error) {
      db.exec("ROLLBACK");
      throw error;
    }
    const updated = eventView(db, data.eventId, user.id);
    if (!updated) throw new Error("Event was not found.");
    return updated;
  });

export const listLostFoundFn = createServerFn({ method: "GET" }).handler(async () => {
  const { requireCampusUser } = await import("./server/auth.server");
  const { getDb } = await import("./server/db.server");
  const user = await requireCampusUser();
  if (user.role !== "Student" && user.role !== "Admin")
    throw new Error("You do not have access to Lost & Found.");
  return getDb()
    .prepare(
      `SELECT id, kind, item, category, description, location,
        substr(created_at, 1, 10) AS date, status
      FROM lost_found_items ORDER BY created_at DESC`,
    )
    .all() as LostFoundViewItem[];
});

export const createLostFoundItemFn = createServerFn({ method: "POST" })
  .validator((input: unknown) => lostFoundSchema.parse(input))
  .handler(async ({ data }) => {
    const { requireCampusUser } = await import("./server/auth.server");
    const { getDb } = await import("./server/db.server");
    const { randomUUID } = await import("node:crypto");
    const user = await requireCampusUser("Student");
    const db = getDb();
    const id = randomUUID();
    const now = new Date().toISOString();
    db.exec("BEGIN IMMEDIATE");
    try {
      db.prepare(
        `INSERT INTO lost_found_items
          (id, reporter_user_id, kind, item, category, description, location, status, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, 'Open', ?, ?)`,
      ).run(id, user.id, data.kind, data.item, data.category, data.description, data.location, now, now);
      db.prepare(
        `INSERT INTO lost_found_status_history (id, item_id, actor_user_id, from_status, to_status, created_at)
        VALUES (?, ?, ?, NULL, 'Open', ?)`,
      ).run(randomUUID(), id, user.id, now);
      db.exec("COMMIT");
    } catch (error) {
      db.exec("ROLLBACK");
      throw error;
    }
    return db
      .prepare(
        `SELECT id, kind, item, category, description, location, substr(created_at, 1, 10) AS date, status
        FROM lost_found_items WHERE id = ?`,
      )
      .get(id) as LostFoundViewItem;
  });

export const claimFoundItemFn = createServerFn({ method: "POST" })
  .validator((input: unknown) => lostFoundClaimSchema.parse(input))
  .handler(async ({ data }) => {
    const { requireCampusUser } = await import("./server/auth.server");
    const { getDb } = await import("./server/db.server");
    const { randomUUID } = await import("node:crypto");
    const user = await requireCampusUser();
    if (user.role !== "Student" && user.role !== "Admin")
      throw new Error("You do not have access to claim this item.");
    const db = getDb();
    const now = new Date().toISOString();
    db.exec("BEGIN IMMEDIATE");
    try {
      const item = db
        .prepare("SELECT kind, status, reporter_user_id AS reporterUserId FROM lost_found_items WHERE id = ?")
        .get(data.id) as
        | { kind: string; status: string; reporterUserId: string }
        | undefined;
      if (!item || item.kind !== "Found" || item.status !== "Open")
        throw new Error("This found item is no longer available to claim.");
      if (user.role === "Student" && item.reporterUserId === user.id)
        throw new Error("You cannot claim an item you reported as found.");
      db.prepare(
        `INSERT INTO lost_found_claims (id, item_id, claimer_user_id, status, created_at, updated_at)
        VALUES (?, ?, ?, 'Active', ?, ?)`,
      ).run(randomUUID(), data.id, user.id, now, now);
      db.prepare(
        `UPDATE lost_found_items SET status = 'Claimed', claimed_by_user_id = ?, claimed_at = ?, updated_at = ?
        WHERE id = ?`,
      ).run(user.id, now, now, data.id);
      db.prepare(
        `INSERT INTO lost_found_status_history (id, item_id, actor_user_id, from_status, to_status, created_at)
        VALUES (?, ?, ?, 'Open', 'Claimed', ?)`,
      ).run(randomUUID(), data.id, user.id, now);
      db.exec("COMMIT");
    } catch (error) {
      db.exec("ROLLBACK");
      throw error;
    }
    return db
      .prepare(
        `SELECT id, kind, item, category, description, location, substr(created_at, 1, 10) AS date, status
        FROM lost_found_items WHERE id = ?`,
      )
      .get(data.id) as LostFoundViewItem;
  });

export const getTimetableFn = createServerFn({ method: "GET" }).handler(async () => {
  const { requireCampusUser } = await import("./server/auth.server");
  const { getDb } = await import("./server/db.server");
  const { randomUUID } = await import("node:crypto");
  const user = await requireCampusUser("Student");
  return getDb()
    .prepare(
      `SELECT day, start_time AS start, end_time AS end, subject, code, faculty, room, type
    FROM timetable WHERE student_id = ? ORDER BY day, start_time`,
    )
    .all(user.id) as typeof import("@/data/mock").timetable;
});

export const getStudentAttendanceFn = createServerFn({ method: "GET" }).handler(async () => {
  const { requireCampusUser } = await import("./server/auth.server");
  const { getDb } = await import("./server/db.server");
  const user = await requireCampusUser("Student");
  return getStudentAttendanceRecords(getDb(), user.id);
});

function getStudentAttendanceRecords(
  db: import("node:sqlite").DatabaseSync,
  studentUserId: string,
) {
  return db.prepare(`
    WITH session_totals AS (
      SELECT c.code, MAX(c.name) AS subject,
        SUM(CASE WHEN r.status = 'Present' THEN 1 ELSE 0 END) AS attended,
        COUNT(*) AS total
      FROM attendance_records r
      JOIN attendance_sessions s ON s.id = r.session_id AND s.course_id = r.course_id
      JOIN courses c ON c.id = s.course_id
      WHERE r.student_user_id = ?
      GROUP BY c.code
    )
    SELECT course_code AS code, subject, attended, total FROM attendance
    WHERE student_id = ? AND course_code NOT IN (SELECT code FROM session_totals)
    UNION ALL
    SELECT code, subject, attended, total FROM session_totals
    ORDER BY code
  `).all(studentUserId, studentUserId) as { code: string; subject: string; attended: number; total: number }[];
}

export const getStudentAssignmentsFn = createServerFn({ method: "GET" }).handler(async () => {
  const { requireCampusUser } = await import("./server/auth.server");
  const { getDb } = await import("./server/db.server");
  const user = await requireCampusUser("Student");
  return getDb()
    .prepare(
      `SELECT a.id, a.title, a.subject, a.code, a.due, a.status, a.faculty, a.marks,
        ca.description, ca.max_marks AS maxMarks,
        s.filename AS submittedFilename, s.mime_type AS submittedMimeType,
        s.file_size_bytes AS submittedFileSizeBytes, s.storage_state AS submissionStorageState,
        s.submitted_at AS submittedAt
      FROM assignments a LEFT JOIN assignment_submissions s
        ON s.assignment_id = a.id AND s.student_id = a.student_id
      LEFT JOIN course_assignments ca ON ca.id = a.course_assignment_id
      WHERE a.student_id = ?
        AND (a.course_assignment_id IS NULL OR EXISTS (
          SELECT 1 FROM course_enrollments e
          WHERE e.course_id = ca.course_id AND e.student_user_id = a.student_id
        ))
      ORDER BY a.due, a.title`,
    )
    .all(user.id) as {
    id: string;
    title: string;
    subject: string;
    code: string;
    due: string;
    status: "Pending" | "Submitted" | "Graded" | "Overdue";
    faculty: string;
    marks: string | null;
    description: string | null;
    maxMarks: number | null;
    submittedFilename: string | null;
    submittedMimeType: string | null;
    submittedFileSizeBytes: number | null;
    submissionStorageState: "MetadataOnly" | null;
    submittedAt: string | null;
  }[];
});

export const submitAssignmentFn = createServerFn({ method: "POST" })
  .validator((input: unknown) => assignmentSubmissionSchema.parse(input))
  .handler(async ({ data }) => {
    const { requireCampusUser } = await import("./server/auth.server");
    const { getDb } = await import("./server/db.server");
    const { randomUUID } = await import("node:crypto");
    const user = await requireCampusUser("Student");
    const db = getDb();
    const now = new Date().toISOString();
    db.exec("BEGIN IMMEDIATE");
    try {
      const assignment = db
        .prepare(`SELECT a.status FROM assignments a
          WHERE a.id = ? AND a.student_id = ?
            AND (a.course_assignment_id IS NULL OR EXISTS (
              SELECT 1 FROM course_assignments ca JOIN course_enrollments e ON e.course_id = ca.course_id
              WHERE ca.id = a.course_assignment_id AND e.student_user_id = a.student_id
            ))`)
        .get(data.assignmentId, user.id) as { status: string } | undefined;
      if (!assignment) throw new Error("Assignment was not found for your account.");
      if (assignment.status === "Graded") throw new Error("A graded assignment cannot be changed.");

      db.prepare(
        `INSERT INTO assignment_submissions
          (id, assignment_id, student_id, filename, mime_type, file_size_bytes, storage_state, submitted_at)
        VALUES (?, ?, ?, ?, ?, ?, 'MetadataOnly', ?)
        ON CONFLICT(assignment_id, student_id) DO UPDATE SET
          filename = excluded.filename, mime_type = excluded.mime_type,
          file_size_bytes = excluded.file_size_bytes, storage_state = excluded.storage_state,
          submitted_at = excluded.submitted_at`,
      ).run(
        randomUUID(),
        data.assignmentId,
        user.id,
        data.filename,
        data.mimeType,
        data.fileSizeBytes,
        now,
      );
      db.prepare(
        "UPDATE assignments SET status = 'Submitted' WHERE id = ? AND student_id = ?",
      ).run(data.assignmentId, user.id);
      db.exec("COMMIT");
    } catch (error) {
      db.exec("ROLLBACK");
      throw error;
    }

    return db
      .prepare(
        `SELECT a.id, a.title, a.subject, a.code, a.due, a.status, a.faculty, a.marks,
          s.filename AS submittedFilename, s.mime_type AS submittedMimeType,
          s.file_size_bytes AS submittedFileSizeBytes, s.storage_state AS submissionStorageState,
          s.submitted_at AS submittedAt
        FROM assignments a JOIN assignment_submissions s
          ON s.assignment_id = a.id AND s.student_id = a.student_id
        WHERE a.id = ? AND a.student_id = ?`,
      )
      .get(data.assignmentId, user.id);
  });

type StudentNotification = {
  id: string;
  title: string;
  body: string;
  time: string;
  read: boolean;
  type: "assignment" | "complaint" | "notice" | "event";
};

export const getStudentNotificationsFn = createServerFn({ method: "GET" }).handler(
  async (): Promise<StudentNotification[]> => {
    const { requireCampusUser } = await import("./server/auth.server");
    const { getDb } = await import("./server/db.server");
    const { notifications: demoNotifications } = await import("@/data/mock");
    const user = await requireCampusUser("Student");
    const db = getDb();
    const insert = db.prepare(
      `INSERT OR IGNORE INTO notifications
        (id, user_id, title, body, type, time_label, created_at, read_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    );
    const seedTime = Date.now();
    demoNotifications.forEach((notification, index) => {
      const createdAt = new Date(seedTime - index * 1000).toISOString();
      insert.run(
        notification.id,
        user.id,
        notification.title,
        notification.body,
        notification.type,
        notification.time,
        createdAt,
        notification.read ? createdAt : null,
      );
    });
    const rows = db
      .prepare(
        `SELECT id, title, body, time_label AS time, read_at IS NOT NULL AS isRead, type
        FROM notifications WHERE user_id = ? ORDER BY created_at DESC, id`,
      )
      .all(user.id) as (Omit<StudentNotification, "read"> & { isRead: number })[];
    return rows.map(({ isRead, ...notification }) => ({ ...notification, read: Boolean(isRead) }));
  },
);

export const setStudentNotificationsReadFn = createServerFn({ method: "POST" })
  .validator((input: unknown) => notificationReadSchema.parse(input))
  .handler(async ({ data }) => {
    const { requireCampusUser } = await import("./server/auth.server");
    const { getDb } = await import("./server/db.server");
    const user = await requireCampusUser("Student");
    const db = getDb();
    const now = new Date().toISOString();
    const result =
      data.mode === "all"
        ? db
            .prepare("UPDATE notifications SET read_at = COALESCE(read_at, ?) WHERE user_id = ?")
            .run(now, user.id)
        : db
            .prepare(
              "UPDATE notifications SET read_at = COALESCE(read_at, ?) WHERE user_id = ? AND id = ?",
            )
            .run(now, user.id, data.id);
    if (data.mode === "one" && Number(result.changes) === 0)
      throw new Error("Notification was not found for your account.");
    return { ok: true as const };
  });

export const getStudentDashboardFn = createServerFn({ method: "GET" }).handler(async () => {
  const { requireCampusUser } = await import("./server/auth.server");
  const { getDb } = await import("./server/db.server");
  const { randomUUID } = await import("node:crypto");
  const user = await requireCampusUser("Student");
  const db = getDb();
  const attendanceRecords = getStudentAttendanceRecords(db, user.id);
  const totals = attendanceRecords.reduce(
    (sum, record) => ({ attended: sum.attended + record.attended, total: sum.total + record.total }),
    { attended: 0, total: 0 },
  );
  const today = new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    timeZone: "Asia/Kolkata",
  }).format(new Date());
  const day = (
    { Mon: "Mon", Tue: "Tue", Wed: "Wed", Thu: "Thu", Fri: "Fri" } as Record<string, string>
  )[today];
  const classCount = day
    ? Number(
        (
          db
            .prepare("SELECT COUNT(*) AS count FROM timetable WHERE student_id = ? AND day = ?")
            .get(user.id, day) as { count: number }
        ).count,
      )
    : 0;
  return {
    studentName: user.name,
    today: day ?? null,
    attendance:
      totals.total > 0 ? Number(((totals.attended / totals.total) * 100).toFixed(1)) : null,
    todayClasses: classCount,
    openComplaints: Number(
      (
        db
          .prepare(
            "SELECT COUNT(*) AS count FROM complaints WHERE user_id = ? AND status NOT IN ('Resolved', 'Rejected')",
          )
          .get(user.id) as { count: number }
      ).count,
    ),
    totalComplaints: Number(
      (
        db.prepare("SELECT COUNT(*) AS count FROM complaints WHERE user_id = ?").get(user.id) as {
          count: number;
        }
      ).count,
    ),
    resolvedComplaints: Number(
      (
        db
          .prepare(
            "SELECT COUNT(*) AS count FROM complaints WHERE user_id = ? AND status = 'Resolved'",
          )
          .get(user.id) as {
          count: number;
        }
      ).count,
    ),
    pendingAssignments: Number(
      (
        db
          .prepare(
            `SELECT COUNT(*) AS count FROM assignments a WHERE a.student_id = ? AND a.status = 'Pending'
              AND date(a.due) BETWEEN date('now') AND date('now', '+7 days')
              AND (a.course_assignment_id IS NULL OR EXISTS (
                SELECT 1 FROM course_assignments ca JOIN course_enrollments e ON e.course_id = ca.course_id
                WHERE ca.id = a.course_assignment_id AND e.student_user_id = a.student_id
              ))`,
          )
          .get(user.id) as { count: number }
      ).count,
    ),
    pendingAssignmentItems: db
      .prepare(
        `SELECT a.id, a.title, a.subject, a.code, a.due, a.status, a.faculty FROM assignments a
          WHERE a.student_id = ? AND a.status = 'Pending' AND date(a.due) BETWEEN date('now') AND date('now', '+7 days')
          AND (a.course_assignment_id IS NULL OR EXISTS (
            SELECT 1 FROM course_assignments ca JOIN course_enrollments e ON e.course_id = ca.course_id
            WHERE ca.id = a.course_assignment_id AND e.student_user_id = a.student_id
          )) ORDER BY a.due LIMIT 5`,
      )
      .all(user.id) as {
      id: string;
      title: string;
      subject: string;
      code: string;
      due: string;
      status: string;
      faculty: string;
    }[],
    notices: Number(
      (db.prepare("SELECT COUNT(*) AS count FROM notices").get() as { count: number }).count,
    ),
    latestNotices: (
      db
        .prepare(
          "SELECT id, title, category, description, priority, department, date, read FROM notices ORDER BY date DESC, updated_at DESC LIMIT 3",
        )
        .all() as (Omit<Notice, "read"> & { read: number })[]
    ).map((row) => ({ ...row, read: Boolean(row.read) })),
    upcomingEvents: db
      .prepare(
        "SELECT id, title, date, time, venue, organizer, description, category, seats, registered, 0 AS isRegistered FROM events WHERE date >= ? ORDER BY date LIMIT 3",
      )
      .all(new Date().toISOString().slice(0, 10)) as unknown as typeof import("@/data/mock").events,
    openComplaintItems: db
      .prepare(
        `SELECT c.id, c.title, c.category, c.description, c.location, c.priority, c.status,
      substr(c.created_at, 1, 10) AS date,
      c.user_id AS userId, c.resolution_info AS resolutionInfo, c.created_at AS createdAt,
      c.updated_at AS updatedAt, u.name AS by FROM complaints c JOIN users u ON u.id = c.user_id
      WHERE c.user_id = ? AND c.status NOT IN ('Resolved', 'Rejected') ORDER BY c.updated_at DESC`,
      )
      .all(user.id) as ComplaintRow[],
    timetable: day
      ? (db
          .prepare(
            `SELECT day, start_time AS start, end_time AS end, subject, code, faculty, room, type FROM timetable
      WHERE student_id = ? AND day = ? ORDER BY start_time`,
          )
          .all(user.id, day) as typeof import("@/data/mock").timetable)
      : [],
  };
});

export const getAdminDashboardFn = createServerFn({ method: "GET" }).handler(async () => {
  const { requireCampusUser } = await import("./server/auth.server");
  const { getDb } = await import("./server/db.server");
  const { randomUUID } = await import("node:crypto");
  await requireCampusUser("Admin");
  const db = getDb();
  return {
    totalStudents: Number(
      (
        db.prepare("SELECT COUNT(*) AS count FROM users WHERE role = 'Student'").get() as {
          count: number;
        }
      ).count,
    ),
    totalFaculty: Number((db.prepare("SELECT COUNT(*) AS count FROM users WHERE role = 'Faculty'").get() as { count: number }).count),
    facultySource: "Registered Faculty accounts in users table",
    activeComplaints: Number(
      (
        db
          .prepare(
            "SELECT COUNT(*) AS count FROM complaints WHERE status NOT IN ('Resolved', 'Rejected')",
          )
          .get() as {
          count: number;
        }
      ).count,
    ),
    totalComplaints: Number(
      (db.prepare("SELECT COUNT(*) AS count FROM complaints").get() as { count: number }).count,
    ),
    resolvedComplaints: Number(
      (
        db.prepare("SELECT COUNT(*) AS count FROM complaints WHERE status = 'Resolved'").get() as {
          count: number;
        }
      ).count,
    ),
    complaintStatusCounts: db
      .prepare("SELECT status AS name, COUNT(*) AS value FROM complaints GROUP BY status ORDER BY value DESC, name")
      .all() as { name: string; value: number }[],
    noticeCount: Number(
      (db.prepare("SELECT COUNT(*) AS count FROM notices").get() as { count: number }).count,
    ),
    avgResolutionDays: Number(
      ((db.prepare(`
        SELECT AVG(julianday(COALESCE(
          (SELECT MAX(h.created_at) FROM complaint_status_history h
           WHERE h.complaint_id = c.id AND h.to_status = 'Resolved'),
          c.updated_at
        )) - julianday(c.created_at)) AS average
        FROM complaints c WHERE c.status = 'Resolved'
      `).get() as { average: number | null }).average ?? 0).toFixed(1),
    ),
    resolutionFallbackCount: Number(
      (db.prepare(`
        SELECT COUNT(*) AS count FROM complaints c
        WHERE c.status = 'Resolved' AND NOT EXISTS (
          SELECT 1 FROM complaint_status_history h
          WHERE h.complaint_id = c.id AND h.to_status = 'Resolved'
        )
      `).get() as { count: number }).count,
    ),
    complaintCategories: db
      .prepare(
        "SELECT category AS name, COUNT(*) AS value FROM complaints GROUP BY category ORDER BY value DESC",
      )
      .all() as { name: string; value: number }[],
    upcomingEvents: Number(
      (
        db
          .prepare("SELECT COUNT(*) AS count FROM events WHERE date >= ?")
          .get(new Date().toISOString().slice(0, 10)) as { count: number }
      ).count,
    ),
    totalEvents: Number((db.prepare("SELECT COUNT(*) AS count FROM events").get() as { count: number }).count),
    totalEventRegistrations: Number((db.prepare("SELECT COUNT(*) AS count FROM event_registrations WHERE status = 'Registered'").get() as { count: number }).count),
    eventRegistrationCounts: db.prepare(`
      SELECT e.id, e.title, COUNT(r.id) AS registrations
      FROM events e LEFT JOIN event_registrations r ON r.event_id = e.id AND r.status = 'Registered'
      GROUP BY e.id, e.title ORDER BY e.date, e.title
    `).all() as { id: string; title: string; registrations: number }[],
    recentComplaints: db
      .prepare(
        `SELECT c.id, c.title, c.category, c.description, c.location, c.priority, c.status,
      substr(c.created_at, 1, 10) AS date,
      c.user_id AS userId, c.resolution_info AS resolutionInfo, c.created_at AS createdAt,
      c.updated_at AS updatedAt, u.name AS by FROM complaints c JOIN users u ON u.id = c.user_id
      ORDER BY c.updated_at DESC LIMIT 5`,
      )
      .all() as ComplaintRow[],
  };
});

export const getAdminStudentsFn = createServerFn({ method: "GET" }).handler(async () => {
  const { requireCampusUser } = await import("./server/auth.server");
  const { getDb } = await import("./server/db.server");
  await requireCampusUser("Admin");
  const db = getDb();
  const students = db.prepare(`
    SELECT name, student_id AS studentId, email
    FROM users WHERE role = 'Student'
    ORDER BY name COLLATE NOCASE, student_id
  `).all() as { name: string; studentId: string | null; email: string }[];
  return { students, totalStudents: students.length };
});

export const getAdminFacultyFn = createServerFn({ method: "GET" }).handler(async () => {
  const { requireCampusUser } = await import("./server/auth.server");
  const { getDb } = await import("./server/db.server");
  await requireCampusUser("Admin");
  const db = getDb();
  const faculty = db.prepare(`
    SELECT id, name, email FROM users WHERE role = 'Faculty' ORDER BY name COLLATE NOCASE
  `).all() as { id: string; name: string; email: string }[];
  const students = db.prepare(`
    SELECT id, name, student_id AS studentId, email FROM users
    WHERE role = 'Student' ORDER BY name COLLATE NOCASE
  `).all() as { id: string; name: string; studentId: string | null; email: string }[];
  const courses = db.prepare(`
    SELECT c.id, c.code, c.name, c.semester, c.section, c.status,
      COUNT(DISTINCT e.student_user_id) AS studentCount,
      (SELECT GROUP_CONCAT(u.name, ', ') FROM faculty_courses fc
       JOIN users u ON u.id = fc.faculty_user_id WHERE fc.course_id = c.id) AS facultyNames
    FROM courses c LEFT JOIN course_enrollments e ON e.course_id = c.id
    GROUP BY c.id ORDER BY c.code, c.semester, c.section
  `).all() as { id: string; code: string; name: string; semester: string; section: string; status: string; studentCount: number; facultyNames: string | null }[];
  return { faculty, students, courses };
});

export const createCourseFn = createServerFn({ method: "POST" })
  .validator((input: unknown) => courseCreateSchema.parse(input))
  .handler(async ({ data }) => {
    const { requireCampusUser } = await import("./server/auth.server");
    const { getDb } = await import("./server/db.server");
    const { randomUUID } = await import("node:crypto");
    await requireCampusUser("Admin");
    const db = getDb();
    const id = randomUUID();
    try {
      db.prepare("INSERT INTO courses (id, code, name, semester, section) VALUES (?, ?, ?, ?, ?)")
        .run(id, data.code, data.name, data.semester, data.section);
    } catch (error) {
      if (error instanceof Error && error.message.includes("UNIQUE constraint failed"))
        throw new Error("A course with this code, semester, and section already exists.");
      throw error;
    }
    return { id, ...data, status: "Active" as const, studentCount: 0 };
  });

export const assignFacultyCourseFn = createServerFn({ method: "POST" })
  .validator((input: unknown) => courseUserSchema.parse(input))
  .handler(async ({ data }) => {
    const { requireCampusUser } = await import("./server/auth.server");
    const { getDb } = await import("./server/db.server");
    await requireCampusUser("Admin");
    const db = getDb();
    const faculty = db.prepare("SELECT id FROM users WHERE id = ? AND role = 'Faculty'").get(data.userId);
    const course = db.prepare("SELECT id FROM courses WHERE id = ? AND status = 'Active'").get(data.courseId);
    if (!faculty) throw new Error("Faculty account was not found.");
    if (!course) throw new Error("Active course was not found.");
    const result = db.prepare("INSERT OR IGNORE INTO faculty_courses (faculty_user_id, course_id) VALUES (?, ?)")
      .run(data.userId, data.courseId);
    return { ok: true as const, alreadyAssigned: Number(result.changes) === 0 };
  });

function ensureStudentCourseAssignmentRows(
  db: import("node:sqlite").DatabaseSync,
  courseId: string,
  studentUserId: string,
) {
  const pending = db.prepare(`
    SELECT ca.id AS courseAssignmentId, ca.title, ca.due, c.code, c.name AS subject,
      u.name AS facultyName
    FROM course_assignments ca
    JOIN courses c ON c.id = ca.course_id
    JOIN users u ON u.id = ca.faculty_user_id
    WHERE ca.course_id = ?
  `).all(courseId) as { courseAssignmentId: string; title: string; due: string; code: string; subject: string; facultyName: string }[];
  const insert = db.prepare(`
    INSERT OR IGNORE INTO assignments
      (id, student_id, title, subject, code, due, status, faculty, marks, course_assignment_id)
    VALUES (?, ?, ?, ?, ?, ?, 'Pending', ?, NULL, ?)
  `);
  for (const assignment of pending) {
    insert.run(
      globalThis.crypto.randomUUID(), studentUserId, assignment.title, assignment.subject,
      assignment.code, assignment.due, assignment.facultyName, assignment.courseAssignmentId,
    );
  }
}

export const enrollStudentCourseFn = createServerFn({ method: "POST" })
  .validator((input: unknown) => courseUserSchema.parse(input))
  .handler(async ({ data }) => {
    const { requireCampusUser } = await import("./server/auth.server");
    const { getDb } = await import("./server/db.server");
    await requireCampusUser("Admin");
    const db = getDb();
    const student = db.prepare("SELECT id FROM users WHERE id = ? AND role = 'Student'").get(data.userId);
    const course = db.prepare("SELECT id FROM courses WHERE id = ? AND status = 'Active'").get(data.courseId);
    if (!student) throw new Error("Student account was not found.");
    if (!course) throw new Error("Active course was not found.");
    db.exec("BEGIN IMMEDIATE");
    let alreadyEnrolled: boolean;
    try {
      const result = db.prepare("INSERT OR IGNORE INTO course_enrollments (student_user_id, course_id) VALUES (?, ?)")
        .run(data.userId, data.courseId);
      alreadyEnrolled = Number(result.changes) === 0;
      ensureStudentCourseAssignmentRows(db, data.courseId, data.userId);
      db.exec("COMMIT");
    } catch (error) {
      db.exec("ROLLBACK");
      throw error;
    }
    return { ok: true as const, alreadyEnrolled };
  });

export const getFacultyFoundationFn = createServerFn({ method: "GET" }).handler(async () => {
  const { requireCampusUser } = await import("./server/auth.server");
  const { getDb } = await import("./server/db.server");
  const user = await requireCampusUser("Faculty");
  const db = getDb();
  const courses = db.prepare(`
    SELECT c.id, c.code, c.name, c.semester, c.section,
      COUNT(DISTINCT e.student_user_id) AS studentCount
    FROM faculty_courses fc
    JOIN courses c ON c.id = fc.course_id AND c.status = 'Active'
    LEFT JOIN course_enrollments e ON e.course_id = c.id
    WHERE fc.faculty_user_id = ?
    GROUP BY c.id ORDER BY c.code, c.semester, c.section
  `).all(user.id) as { id: string; code: string; name: string; semester: string; section: string; studentCount: number }[];
  const totalStudents = Number(db.prepare(`
    SELECT COUNT(DISTINCT e.student_user_id) AS count
    FROM faculty_courses fc
    JOIN courses c ON c.id = fc.course_id AND c.status = 'Active'
    JOIN course_enrollments e ON e.course_id = c.id
    WHERE fc.faculty_user_id = ?
  `).get(user.id)?.["count"] ?? 0);
  const assignmentCount = Number(db.prepare(`
    SELECT COUNT(*) AS count FROM course_assignments ca
    JOIN faculty_courses fc ON fc.course_id = ca.course_id AND fc.faculty_user_id = ?
    JOIN courses c ON c.id = ca.course_id AND c.status = 'Active'
  `).get(user.id)?.["count"] ?? 0);
  const issueCounts = db.prepare(`
    SELECT COUNT(*) AS assignedCount,
      SUM(CASE WHEN status NOT IN ('Resolved', 'Rejected') THEN 1 ELSE 0 END) AS openCount
    FROM complaints WHERE assigned_faculty_user_id = ?
  `).get(user.id) as { assignedCount: number; openCount: number | null };
  return {
    identity: { id: user.id, name: user.name, email: user.email, studentId: user.studentId },
    courses,
    totalCourses: courses.length,
    totalStudents,
    assignmentCount,
    assignedIssueCount: Number(issueCounts.assignedCount ?? 0),
    openAssignedIssueCount: Number(issueCounts.openCount ?? 0),
  };
});

export const getFacultyAttendanceDataFn = createServerFn({ method: "GET" })
  .validator((input: unknown) => facultyAttendanceQuerySchema.parse(input))
  .handler(async ({ data }) => {
    const { requireCampusUser } = await import("./server/auth.server");
    const { getDb } = await import("./server/db.server");
    const faculty = await requireCampusUser("Faculty");
    const db = getDb();
    const courses = db.prepare(`
      SELECT c.id, c.code, c.name, c.semester, c.section
      FROM faculty_courses fc JOIN courses c ON c.id = fc.course_id
      WHERE fc.faculty_user_id = ? AND c.status = 'Active'
      ORDER BY c.code, c.semester, c.section
    `).all(faculty.id) as { id: string; code: string; name: string; semester: string; section: string }[];
    const selectedCourseId = data.courseId ?? courses[0]?.id ?? null;
    if (!selectedCourseId) {
      if (data.sessionId) throw new Error("Assign an active course before opening attendance.");
      return { courses, selectedCourseId: null, students: [], sessions: [], selectedSession: null };
    }
    const course = courses.find((item) => item.id === selectedCourseId);
    if (!course) throw new Error("This course is not assigned to your faculty account.");

    const students = db.prepare(`
      SELECT u.id AS userId, u.name, u.student_id AS studentId
      FROM course_enrollments e JOIN users u ON u.id = e.student_user_id
      WHERE e.course_id = ? AND u.role = 'Student'
      ORDER BY u.name COLLATE NOCASE, u.student_id
    `).all(course.id) as { userId: string; name: string; studentId: string | null }[];
    const sessions = db.prepare(`
      SELECT s.id, s.session_date AS sessionDate, s.start_time AS startTime,
        s.end_time AS endTime, s.created_at AS createdAt,
        SUM(CASE WHEN r.status = 'Present' THEN 1 ELSE 0 END) AS presentCount,
        SUM(CASE WHEN r.status = 'Absent' THEN 1 ELSE 0 END) AS absentCount
      FROM attendance_sessions s
      LEFT JOIN attendance_records r ON r.session_id = s.id AND r.course_id = s.course_id
      WHERE s.course_id = ?
      GROUP BY s.id ORDER BY s.session_date DESC, s.created_at DESC
    `).all(course.id) as { id: string; sessionDate: string; startTime: string | null; endTime: string | null; createdAt: string; presentCount: number; absentCount: number }[];

    let selectedSession: { id: string; sessionDate: string; startTime: string | null; endTime: string | null; records: { studentUserId: string; status: "Present" | "Absent" }[] } | null = null;
    if (data.sessionId) {
      const session = db.prepare(`
        SELECT id, session_date AS sessionDate, start_time AS startTime, end_time AS endTime
        FROM attendance_sessions WHERE id = ? AND course_id = ?
      `).get(data.sessionId, course.id) as { id: string; sessionDate: string; startTime: string | null; endTime: string | null } | undefined;
      if (!session) throw new Error("Attendance session was not found for this assigned course.");
      const records = db.prepare(`
        SELECT r.student_user_id AS studentUserId, r.status
        FROM attendance_records r
        JOIN course_enrollments e ON e.course_id = r.course_id AND e.student_user_id = r.student_user_id
        WHERE r.session_id = ? AND r.course_id = ?
      `).all(session.id, course.id) as { studentUserId: string; status: "Present" | "Absent" }[];
      selectedSession = { ...session, records };
    }
    return { courses, selectedCourseId: course.id, course, students, sessions, selectedSession };
  });

export const saveFacultyAttendanceFn = createServerFn({ method: "POST" })
  .validator((input: unknown) => facultyAttendanceSaveSchema.parse(input))
  .handler(async ({ data }) => {
    const { requireCampusUser } = await import("./server/auth.server");
    const { getDb } = await import("./server/db.server");
    const { randomUUID } = await import("node:crypto");
    const faculty = await requireCampusUser("Faculty");
    const db = getDb();
    const sessionId = data.sessionId ?? randomUUID();
    const now = new Date().toISOString();
    db.exec("BEGIN IMMEDIATE");
    try {
      const assignment = db.prepare(`
        SELECT 1 AS allowed FROM faculty_courses fc
        JOIN courses c ON c.id = fc.course_id
        WHERE fc.faculty_user_id = ? AND fc.course_id = ? AND c.status = 'Active'
      `).get(faculty.id, data.courseId);
      if (!assignment) throw new Error("This course is not assigned to your faculty account.");

      const enrolledStudents = db.prepare(`
        SELECT e.student_user_id AS userId FROM course_enrollments e
        JOIN users u ON u.id = e.student_user_id AND u.role = 'Student'
        WHERE e.course_id = ?
      `).all(data.courseId) as { userId: string }[];
      if (enrolledStudents.length === 0) throw new Error("Enroll students in this course before taking attendance.");
      const enrolledIds = new Set(enrolledStudents.map((student) => student.userId));
      if (data.records.length !== enrolledIds.size || data.records.some((record) => !enrolledIds.has(record.studentUserId))) {
        throw new Error("Mark each currently enrolled student exactly once.");
      }

      if (data.sessionId) {
        const existing = db.prepare("SELECT id FROM attendance_sessions WHERE id = ? AND course_id = ?")
          .get(data.sessionId, data.courseId);
        if (!existing) throw new Error("Attendance session was not found for this assigned course.");
        db.prepare(`
          UPDATE attendance_sessions SET session_date = ?, start_time = ?, end_time = ?, updated_at = ?
          WHERE id = ? AND course_id = ?
        `).run(data.sessionDate, data.startTime || null, data.endTime || null, now, data.sessionId, data.courseId);
      } else {
        db.prepare(`
          INSERT INTO attendance_sessions (id, course_id, faculty_user_id, session_date, start_time, end_time, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `).run(sessionId, data.courseId, faculty.id, data.sessionDate, data.startTime || null, data.endTime || null, now, now);
      }

      const upsert = db.prepare(`
        INSERT INTO attendance_records (session_id, course_id, student_user_id, status, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?)
        ON CONFLICT(session_id, student_user_id) DO UPDATE SET
          status = excluded.status, updated_at = excluded.updated_at
      `);
      for (const record of data.records) {
        upsert.run(sessionId, data.courseId, record.studentUserId, record.status, now, now);
      }
      db.exec("COMMIT");
    } catch (error) {
      db.exec("ROLLBACK");
      throw error;
    }
    return { sessionId, created: !data.sessionId };
  });

export const getFacultyAssignmentsFn = createServerFn({ method: "GET" })
  .validator((input: unknown) => facultyAssignmentQuerySchema.parse(input))
  .handler(async ({ data }) => {
    const { requireCampusUser } = await import("./server/auth.server");
    const { getDb } = await import("./server/db.server");
    const faculty = await requireCampusUser("Faculty");
    const db = getDb();
    const courses = db.prepare(`
      SELECT c.id, c.code, c.name, c.semester, c.section
      FROM faculty_courses fc JOIN courses c ON c.id = fc.course_id
      WHERE fc.faculty_user_id = ? AND c.status = 'Active'
      ORDER BY c.code, c.semester, c.section
    `).all(faculty.id) as { id: string; code: string; name: string; semester: string; section: string }[];
    const assignments = db.prepare(`
      SELECT ca.id, ca.course_id AS courseId, ca.title, ca.description, ca.due,
        ca.max_marks AS maxMarks, ca.created_at AS createdAt, c.code, c.name AS subject,
        COUNT(a.id) AS totalStudents,
        SUM(CASE WHEN s.id IS NOT NULL THEN 1 ELSE 0 END) AS submissionCount
      FROM course_assignments ca
      JOIN faculty_courses fc ON fc.course_id = ca.course_id AND fc.faculty_user_id = ?
      JOIN courses c ON c.id = ca.course_id AND c.status = 'Active'
      LEFT JOIN assignments a ON a.course_assignment_id = ca.id
      LEFT JOIN assignment_submissions s ON s.assignment_id = a.id AND s.student_id = a.student_id
      GROUP BY ca.id
      ORDER BY ca.due DESC, ca.created_at DESC
    `).all(faculty.id) as {
      id: string; courseId: string; title: string; description: string; due: string;
      maxMarks: number; createdAt: string; code: string; subject: string;
      totalStudents: number; submissionCount: number;
    }[];
    const selectedAssignment = data.courseAssignmentId
      ? assignments.find((assignment) => assignment.id === data.courseAssignmentId) ?? null
      : null;
    if (data.courseAssignmentId && !selectedAssignment) {
      throw new Error("Assignment was not found in your assigned courses.");
    }
    const submissions = selectedAssignment ? db.prepare(`
      SELECT a.id AS studentAssignmentId, u.id AS studentUserId, u.name AS studentName,
        u.student_id AS studentId, a.status, a.marks, ca.max_marks AS maxMarks,
        s.filename, s.mime_type AS mimeType, s.file_size_bytes AS fileSizeBytes,
        s.storage_state AS storageState, s.submitted_at AS submittedAt
      FROM assignments a
      JOIN users u ON u.id = a.student_id AND u.role = 'Student'
      JOIN course_enrollments e ON e.student_user_id = u.id AND e.course_id = ?
      JOIN course_assignments ca ON ca.id = a.course_assignment_id
      LEFT JOIN assignment_submissions s ON s.assignment_id = a.id AND s.student_id = a.student_id
      WHERE a.course_assignment_id = ?
      ORDER BY u.name COLLATE NOCASE, u.student_id
    `).all(selectedAssignment.courseId, selectedAssignment.id) as {
      studentAssignmentId: string; studentUserId: string; studentName: string;
      studentId: string | null; status: string; marks: string | null; maxMarks: number;
      filename: string | null; mimeType: string | null; fileSizeBytes: number | null;
      storageState: string | null; submittedAt: string | null;
    }[] : [];
    return { courses, assignments, selectedAssignment, submissions };
  });

export const createFacultyAssignmentFn = createServerFn({ method: "POST" })
  .validator((input: unknown) => courseAssignmentSchema.parse(input))
  .handler(async ({ data }) => {
    const { requireCampusUser } = await import("./server/auth.server");
    const { getDb } = await import("./server/db.server");
    const { randomUUID } = await import("node:crypto");
    const faculty = await requireCampusUser("Faculty");
    const db = getDb();
    const id = randomUUID();
    db.exec("BEGIN IMMEDIATE");
    try {
      const course = db.prepare(`
        SELECT c.id, c.code, c.name FROM faculty_courses fc
        JOIN courses c ON c.id = fc.course_id AND c.status = 'Active'
        WHERE fc.faculty_user_id = ? AND c.id = ?
      `).get(faculty.id, data.courseId) as { id: string; code: string; name: string } | undefined;
      if (!course) throw new Error("This course is not assigned to your faculty account.");
      db.prepare(`
        INSERT INTO course_assignments
          (id, course_id, faculty_user_id, title, description, due, max_marks, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(id, course.id, faculty.id, data.title, data.description, data.due, data.maxMarks,
        new Date().toISOString(), new Date().toISOString());
      const students = db.prepare(`
        SELECT e.student_user_id AS userId FROM course_enrollments e
        JOIN users u ON u.id = e.student_user_id AND u.role = 'Student'
        WHERE e.course_id = ?
      `).all(course.id) as { userId: string }[];
      const addStudentAssignment = db.prepare(`
        INSERT INTO assignments
          (id, student_id, title, subject, code, due, status, faculty, marks, course_assignment_id)
        VALUES (?, ?, ?, ?, ?, ?, 'Pending', ?, NULL, ?)
      `);
      for (const student of students) {
        addStudentAssignment.run(randomUUID(), student.userId, data.title, course.name, course.code,
          data.due, faculty.name, id);
      }
      db.exec("COMMIT");
    } catch (error) {
      db.exec("ROLLBACK");
      if (error instanceof Error && error.message.includes("UNIQUE constraint failed: course_assignments.course_id")) {
        throw new Error("An assignment with this title and due date already exists for the course.");
      }
      throw error;
    }
    return { id, courseId: data.courseId, title: data.title, due: data.due, maxMarks: data.maxMarks };
  });

export const gradeFacultyAssignmentFn = createServerFn({ method: "POST" })
  .validator((input: unknown) => assignmentGradeSchema.parse(input))
  .handler(async ({ data }) => {
    const { requireCampusUser } = await import("./server/auth.server");
    const { getDb } = await import("./server/db.server");
    const faculty = await requireCampusUser("Faculty");
    const db = getDb();
    db.exec("BEGIN IMMEDIATE");
    try {
      const assignment = db.prepare(`
        SELECT ca.id, ca.max_marks AS maxMarks
        FROM course_assignments ca JOIN faculty_courses fc ON fc.course_id = ca.course_id
        JOIN courses c ON c.id = ca.course_id AND c.status = 'Active'
        WHERE ca.id = ? AND fc.faculty_user_id = ?
      `).get(data.courseAssignmentId, faculty.id) as { id: string; maxMarks: number } | undefined;
      if (!assignment) throw new Error("Assignment was not found in your assigned courses.");
      if (data.marks > assignment.maxMarks) throw new Error("Marks cannot exceed the assignment maximum.");
      const studentAssignment = db.prepare(`
        SELECT a.id FROM assignments a
        JOIN users u ON u.id = a.student_id AND u.role = 'Student'
        JOIN course_enrollments e ON e.student_user_id = a.student_id
        JOIN course_assignments ca ON ca.id = a.course_assignment_id AND ca.course_id = e.course_id
        JOIN assignment_submissions s ON s.assignment_id = a.id AND s.student_id = a.student_id
        WHERE a.course_assignment_id = ? AND a.student_id = ?
      `).get(data.courseAssignmentId, data.studentUserId) as { id: string } | undefined;
      if (!studentAssignment) throw new Error("A submitted assignment for this enrolled student was not found.");
      db.prepare("UPDATE assignments SET marks = ?, status = 'Graded' WHERE id = ? AND student_id = ?")
        .run(String(data.marks), studentAssignment.id, data.studentUserId);
      db.prepare("UPDATE course_assignments SET updated_at = ? WHERE id = ?")
        .run(new Date().toISOString(), data.courseAssignmentId);
      db.exec("COMMIT");
      return { ok: true as const, marks: data.marks, maxMarks: assignment.maxMarks };
    } catch (error) {
      db.exec("ROLLBACK");
      throw error;
    }
  });

export const askCampusAssistantFn = createServerFn({ method: "POST" })
  .validator((input: unknown) =>
    z.object({ question: z.string().trim().min(1).max(500) }).parse(input),
  )
  .handler(async ({ data }) => {
    const { requireCampusUser } = await import("./server/auth.server");
    const { getDb } = await import("./server/db.server");
    const user = await requireCampusUser("Student");
    const db = getDb();
    const question = data.question.toLowerCase();

    if (question.includes("submit") && question.includes("complaint")) {
      return "Open Complaints from your student portal, choose New complaint, complete the title, category, location and description, then submit. You can follow its status and resolution from the same page.";
    }
    if (question.includes("contact") || question.includes("administration")) {
      const admin = db
        .prepare("SELECT email FROM users WHERE role = 'Admin' ORDER BY created_at LIMIT 1")
        .get() as { email: string } | undefined;
      return admin
        ? `You can contact the administration at ${admin.email}, or submit a campus complaint from Complaints.`
        : "Open the Notices page for the latest campus office contact details, or submit a complaint from your student portal.";
    }
    if (
      question.includes("complaint") &&
      (question.includes("status") || question.includes("track"))
    ) {
      const complaint = db
        .prepare(
          "SELECT id, title, status, resolution_info AS resolutionInfo FROM complaints WHERE user_id = ? ORDER BY updated_at DESC LIMIT 1",
        )
        .get(user.id) as
        { id: string; title: string; status: string; resolutionInfo: string } | undefined;
      if (!complaint)
        return "You have not submitted a complaint yet. Open Complaints and choose New complaint to report an issue.";
      return `Your latest complaint ${complaint.id} (${complaint.title}) is **${complaint.status}**.${complaint.resolutionInfo ? ` Resolution/update: ${complaint.resolutionInfo}` : " No resolution update has been added yet."}`;
    }
    if (question.includes("notice")) {
      const rows = db
        .prepare(
          "SELECT title, priority, date FROM notices ORDER BY date DESC, updated_at DESC LIMIT 3",
        )
        .all() as { title: string; priority: string; date: string }[];
      return rows.length
        ? `Open Notices in your student portal. Latest notices:\n${rows.map((notice) => `• [${notice.priority}] ${notice.title} (${notice.date})`).join("\n")}`
        : "There are no notices published yet. Check the Notices page again later.";
    }
    if (question.includes("attendance")) {
      const rows = getStudentAttendanceRecords(db, user.id);
      const attended = rows.reduce((sum, row) => sum + row.attended, 0);
      const total = rows.reduce((sum, row) => sum + row.total, 0);
      return total
        ? `Your recorded overall attendance is **${((attended / total) * 100).toFixed(1)}%** across ${rows.length} subjects.`
        : "No attendance records are available yet.";
    }
    if (
      question.includes("class") ||
      question.includes("timetable") ||
      question.includes("schedule")
    ) {
      const weekday = new Intl.DateTimeFormat("en-US", {
        weekday: "short",
        timeZone: "Asia/Kolkata",
      }).format(new Date());
      const dayNames: Record<string, string> = {
        Mon: "Mon",
        Tue: "Tue",
        Wed: "Wed",
        Thu: "Thu",
        Fri: "Fri",
      };
      const timetableCount = Number(
        (
          db
            .prepare("SELECT COUNT(*) AS count FROM timetable WHERE student_id = ?")
            .get(user.id) as { count: number }
        ).count,
      );
      if (timetableCount === 0) return "No timetable records are available yet.";
      let day = dayNames[weekday];
      if (question.includes("tomorrow")) {
        const next = new Date(Date.now() + 24 * 60 * 60 * 1000);
        const nextWeekday = new Intl.DateTimeFormat("en-US", {
          weekday: "short",
          timeZone: "Asia/Kolkata",
        }).format(next);
        day = dayNames[nextWeekday];
      }
      if (!day)
        return "Your timetable is available from the Timetable page in your student portal.";
      const rows = db
        .prepare(
          "SELECT start_time AS start, end_time AS end, subject, room FROM timetable WHERE student_id = ? AND day = ? ORDER BY start_time",
        )
        .all(user.id, day) as { start: string; end: string; subject: string; room: string }[];
      return rows.length
        ? `Your ${day} classes:\n${rows.map((item) => `• ${item.start}–${item.end}: ${item.subject} (${item.room})`).join("\n")}`
        : `No classes are scheduled for ${day}.`;
    }
    if (question.includes("assignment") || question.includes("due")) {
      const assignmentCount = Number(
        (
          db
            .prepare(`SELECT COUNT(*) AS count FROM assignments a WHERE a.student_id = ?
              AND (a.course_assignment_id IS NULL OR EXISTS (
                SELECT 1 FROM course_assignments ca JOIN course_enrollments e ON e.course_id = ca.course_id
                WHERE ca.id = a.course_assignment_id AND e.student_user_id = a.student_id
              ))`)
            .get(user.id) as { count: number }
        ).count,
      );
      if (assignmentCount === 0) return "No assignment records are available yet.";
      const rows = db
        .prepare(
          `SELECT a.title, a.subject, a.due FROM assignments a WHERE a.student_id = ? AND a.status = 'Pending'
            AND (a.course_assignment_id IS NULL OR EXISTS (
              SELECT 1 FROM course_assignments ca JOIN course_enrollments e ON e.course_id = ca.course_id
              WHERE ca.id = a.course_assignment_id AND e.student_user_id = a.student_id
            )) ORDER BY a.due LIMIT 3`,
        )
        .all(user.id) as { title: string; subject: string; due: string }[];
      return rows.length
        ? `You have ${rows.length} upcoming pending assignment(s):\n${rows.map((item) => `• ${item.title} — ${item.subject}, due ${item.due}`).join("\n")}`
        : "You have no pending assignments.";
    }
    if (question.includes("event")) {
      const rows = db
        .prepare("SELECT title, date, venue FROM events WHERE date >= ? ORDER BY date LIMIT 3")
        .all(new Date().toISOString().slice(0, 10)) as {
        title: string;
        date: string;
        venue: string;
      }[];
      return rows.length
        ? `Upcoming campus events:\n${rows.map((item) => `• ${item.title} — ${item.date}, ${item.venue}`).join("\n")}`
        : "There are no upcoming campus events listed yet.";
    }
    return "I can help with complaint submission and status, notices, your timetable, attendance, assignments, events, and contacting administration. Try asking “What is my complaint status?”";
  });
