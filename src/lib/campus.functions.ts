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
  const { randomUUID } = await import("node:crypto");
  const user = await requireCampusUser();
  const db = getDb();
  const rows =
    user.role !== "Student"
      ? (db
          .prepare(
            `SELECT c.id, c.title, c.category, c.description, c.location, c.priority, c.status,
        substr(c.created_at, 1, 10) AS date,
        c.user_id AS userId, c.resolution_info AS resolutionInfo, c.created_at AS createdAt,
        c.updated_at AS updatedAt, u.name AS by
      FROM complaints c JOIN users u ON u.id = c.user_id ORDER BY c.updated_at DESC`,
          )
          .all() as ComplaintRow[])
      : (db
          .prepare(
            `SELECT c.id, c.title, c.category, c.description, c.location, c.priority, c.status,
        substr(c.created_at, 1, 10) AS date,
        c.user_id AS userId, c.resolution_info AS resolutionInfo, c.created_at AS createdAt,
        c.updated_at AS updatedAt, u.name AS by
      FROM complaints c JOIN users u ON u.id = c.user_id WHERE c.user_id = ? ORDER BY c.updated_at DESC`,
          )
          .all(user.id) as ComplaintRow[]);
  return rows.map((row) => toComplaintRecord(db, row));
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
      c.user_id AS userId, c.resolution_info AS resolutionInfo, c.created_at AS createdAt,
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
      c.user_id AS userId, c.resolution_info AS resolutionInfo, c.created_at AS createdAt,
      c.updated_at AS updatedAt, u.name AS by FROM complaints c JOIN users u ON u.id = c.user_id WHERE c.id = ?`,
      )
      .get(data.id) as ComplaintRow;
    return toComplaintRecord(db, row);
  });

export const listNoticesFn = createServerFn({ method: "GET" }).handler(async () => {
  const { requireCampusUser } = await import("./server/auth.server");
  const { getDb } = await import("./server/db.server");
  const { randomUUID } = await import("node:crypto");
  await requireCampusUser();
  const rows = getDb()
    .prepare(
      `SELECT id, title, category, description, priority, department, date,
      read, updated_at AS updatedAt
    FROM notices ORDER BY date DESC, updated_at DESC`,
    )
    .all() as (Omit<NoticeRow, "read"> & { read: number })[];
  return rows.map((row) => ({ ...row, read: Boolean(row.read) }));
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
  if (user.role !== "Student" && user.role !== "Admin")
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
  return getDb()
    .prepare(
      `SELECT course_code AS code, subject, attended, total FROM attendance
      WHERE student_id = ? ORDER BY course_code`,
    )
    .all(user.id) as { code: string; subject: string; attended: number; total: number }[];
});

export const getStudentAssignmentsFn = createServerFn({ method: "GET" }).handler(async () => {
  const { requireCampusUser } = await import("./server/auth.server");
  const { getDb } = await import("./server/db.server");
  const user = await requireCampusUser("Student");
  return getDb()
    .prepare(
      `SELECT a.id, a.title, a.subject, a.code, a.due, a.status, a.faculty, a.marks,
        s.filename AS submittedFilename, s.mime_type AS submittedMimeType,
        s.file_size_bytes AS submittedFileSizeBytes, s.storage_state AS submissionStorageState,
        s.submitted_at AS submittedAt
      FROM assignments a LEFT JOIN assignment_submissions s
        ON s.assignment_id = a.id AND s.student_id = a.student_id
      WHERE a.student_id = ? ORDER BY a.due, a.title`,
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
        .prepare("SELECT status FROM assignments WHERE id = ? AND student_id = ?")
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
  const totals = db
    .prepare(
      "SELECT COALESCE(SUM(attended), 0) AS attended, COALESCE(SUM(total), 0) AS total FROM attendance WHERE student_id = ?",
    )
    .get(user.id) as { attended: number; total: number };
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
            "SELECT COUNT(*) AS count FROM assignments WHERE student_id = ? AND status = 'Pending' AND date(due) BETWEEN date('now') AND date('now', '+7 days')",
          )
          .get(user.id) as { count: number }
      ).count,
    ),
    pendingAssignmentItems: db
      .prepare(
        "SELECT id, title, subject, code, due, status, faculty FROM assignments WHERE student_id = ? AND status = 'Pending' AND date(due) BETWEEN date('now') AND date('now', '+7 days') ORDER BY due LIMIT 5",
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
    totalFaculty: Number(
      (
        db.prepare("SELECT COUNT(*) AS count FROM users WHERE role = 'Faculty'").get() as {
          count: number;
        }
      ).count,
    ),
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
    noticeCount: Number(
      (db.prepare("SELECT COUNT(*) AS count FROM notices").get() as { count: number }).count,
    ),
    avgResolutionDays: Number(
      (
        (
          db
            .prepare(
              "SELECT AVG(julianday(updated_at) - julianday(created_at)) AS average FROM complaints WHERE status = 'Resolved'",
            )
            .get() as { average: number | null }
        ).average ?? 0
      ).toFixed(1),
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
      const rows = db
        .prepare("SELECT subject, attended, total FROM attendance WHERE student_id = ?")
        .all(user.id) as { subject: string; attended: number; total: number }[];
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
            .prepare("SELECT COUNT(*) AS count FROM assignments WHERE student_id = ?")
            .get(user.id) as { count: number }
        ).count,
      );
      if (assignmentCount === 0) return "No assignment records are available yet.";
      const rows = db
        .prepare(
          "SELECT title, subject, due FROM assignments WHERE student_id = ? AND status = 'Pending' ORDER BY due LIMIT 3",
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
