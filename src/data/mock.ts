// Demo fixtures for screens that are not database-backed yet and initial SQLite seeding.
// Persistent complaint, notice, session, and dashboard data is fetched through server functions.
export type Priority = "Low" | "Medium" | "High" | "Urgent";
export type ComplaintStatus = "Submitted" | "Under Review" | "Assigned" | "In Progress" | "Resolved" | "Rejected";

export const currentStudent = {
  name: "Ananya Sharma", initials: "AS", roll: "21CSE1047", email: "ananya.sharma@campusx.edu",
  dept: "Computer Science & Engineering", semester: 5, section: "B", phone: "+91 98765 43210",
  advisor: "Prof. R. Iyer", attendance: 87.4,
};
export const currentFaculty = {
  name: "Prof. Rajesh Iyer", initials: "RI", email: "r.iyer@campusx.edu",
  dept: "Computer Science & Engineering", designation: "Associate Professor", office: "Block C, 312",
};
export const currentAdmin = { name: "Dr. Meera Kapoor", initials: "MK", email: "admin@campusx.edu", designation: "Registrar" };

export const days = ["Mon", "Tue", "Wed", "Thu", "Fri"] as const;
export type Day = (typeof days)[number];
export type Slot = { day: Day; start: string; end: string; subject: string; code: string; faculty: string; room: string; type: "Lecture" | "Lab" | "Tutorial" };

const S = (day: Day, start: string, end: string, subject: string, code: string, faculty: string, room: string, type: Slot["type"] = "Lecture"): Slot => ({ day, start, end, subject, code, faculty, room, type });
export const timetable: Slot[] = [
  S("Mon", "09:00", "10:00", "Data Structures & Algorithms", "CS301", "Prof. R. Iyer", "LH-2"),
  S("Mon", "10:00", "11:00", "Operating Systems", "CS302", "Prof. M. Kulkarni", "LH-3"),
  S("Mon", "13:00", "15:00", "DBMS Lab", "CS303L", "Prof. S. Nair", "Lab 204", "Lab"),
  S("Tue", "09:00", "10:00", "Data Structures & Algorithms", "CS301", "Prof. R. Iyer", "Lab 204", "Lab"),
  S("Tue", "11:00", "12:00", "Operating Systems", "CS302", "Prof. M. Kulkarni", "LH-3"),
  S("Tue", "13:00", "14:00", "Database Systems", "CS303", "Prof. S. Nair", "LH-1"),
  S("Tue", "15:00", "16:00", "Software Engineering", "CS304", "Prof. D. Menon", "Lab 118"),
  S("Wed", "09:00", "10:00", "Computer Networks", "CS305", "Dr. A. Verma", "LH-2"),
  S("Wed", "10:00", "11:00", "Database Systems", "CS303", "Prof. S. Nair", "LH-1"),
  S("Wed", "14:00", "15:00", "Discrete Mathematics", "MA301", "Dr. K. Rao", "LH-4", "Tutorial"),
  S("Thu", "09:00", "10:00", "Software Engineering", "CS304", "Prof. D. Menon", "LH-3"),
  S("Thu", "10:00", "11:00", "Computer Networks", "CS305", "Dr. A. Verma", "LH-2"),
  S("Thu", "13:00", "15:00", "Networks Lab", "CS305L", "Dr. A. Verma", "Lab 210", "Lab"),
  S("Fri", "09:00", "10:00", "Operating Systems", "CS302", "Prof. M. Kulkarni", "LH-3"),
  S("Fri", "11:00", "12:00", "Discrete Mathematics", "MA301", "Dr. K. Rao", "LH-4"),
  S("Fri", "14:00", "15:00", "Data Structures & Algorithms", "CS301", "Prof. R. Iyer", "LH-2"),
];
export function todayKey(): Day {
  const d = new Date().getDay();
  return (d >= 1 && d <= 5 ? days[d - 1] : undefined) ?? "Mon";
}

export const attendance = [
  { code: "CS301", subject: "Data Structures & Algorithms", attended: 38, total: 42 },
  { code: "CS302", subject: "Operating Systems", attended: 33, total: 40 },
  { code: "CS303", subject: "Database Systems", attended: 36, total: 39 },
  { code: "CS304", subject: "Software Engineering", attended: 27, total: 36 },
  { code: "CS305", subject: "Computer Networks", attended: 31, total: 35 },
  { code: "MA301", subject: "Discrete Mathematics", attended: 25, total: 30 },
];

export type Notice = { id: string; title: string; category: "Academic" | "Exam" | "Hostel" | "Placement" | "General" | "Finance"; description: string; date: string; priority: Priority; department: string; read: boolean };
export const notices: Notice[] = [
  { id: "n1", title: "Mid-semester examinations begin 20 Oct", category: "Exam", description: "Hall tickets are available on the portal. Carry your college ID to every exam. Seating plans will be posted 48 hours before each paper.", date: "2026-10-01", priority: "Urgent", department: "Examination Cell", read: false },
  { id: "n2", title: "Library open until 10 PM during exam weeks", category: "Academic", description: "The central library will extend reading-room hours from 12 Oct to 31 Oct.", date: "2026-09-30", priority: "Medium", department: "Central Library", read: false },
  { id: "n3", title: "Merit scholarship applications close 18 Oct", category: "Finance", description: "Students with CGPA above 8.5 may apply via the finance office portal with mark sheets and income certificate.", date: "2026-09-28", priority: "High", department: "Finance Office", read: true },
  { id: "n4", title: "Infosys campus drive — registration open", category: "Placement", description: "Eligible final and pre-final year students must register by 10 Oct. Pre-placement talk on 12 Oct in Main Auditorium.", date: "2026-09-27", priority: "High", department: "Training & Placement", read: false },
  { id: "n5", title: "Hostel water supply maintenance on Sunday", category: "Hostel", description: "Water supply in Blocks A–D will be interrupted 8–11 AM on 5 Oct.", date: "2026-09-26", priority: "Low", department: "Hostel Office", read: true },
  { id: "n6", title: "Revised timetable for Semester 5 CSE", category: "Academic", description: "Discrete Mathematics tutorial moved to Wednesday 2 PM, LH-4.", date: "2026-09-24", priority: "Medium", department: "CSE Department", read: true },
  { id: "n7", title: "Campus Wi-Fi upgrade this weekend", category: "General", description: "Intermittent connectivity expected in academic blocks on 4–5 Oct.", date: "2026-09-22", priority: "Low", department: "IT Services", read: true },
];

export type CampusEvent = { id: string; title: string; date: string; time: string; venue: string; organizer: string; description: string; category: string; seats: number; registered: number; isRegistered: boolean };
export const events: CampusEvent[] = [
  { id: "e1", title: "InnoVate 2026 — Annual Tech Fest", date: "2026-10-08", time: "10:00 AM", venue: "Main Auditorium", organizer: "Technical Council", description: "Three days of hackathons, robotics, and talks from industry leaders.", category: "Technical", seats: 800, registered: 642, isRegistered: true },
  { id: "e2", title: "Guest Lecture: Ethics of Generative AI", date: "2026-10-10", time: "11:00 AM", venue: "Seminar Hall B", organizer: "CSE Department", description: "Dr. Priya Raman (IISc) on responsible AI deployment.", category: "Academic", seats: 200, registered: 188, isRegistered: false },
  { id: "e3", title: "Inter-Department Cricket Final", date: "2026-10-12", time: "3:00 PM", venue: "University Grounds", organizer: "Sports Committee", description: "CSE vs Mechanical — come cheer your department.", category: "Sports", seats: 1500, registered: 420, isRegistered: false },
  { id: "e4", title: "Resume Clinic with Alumni", date: "2026-10-14", time: "2:00 PM", venue: "Placement Cell, Block A", organizer: "Training & Placement", description: "One-on-one resume reviews with alumni from Google, Microsoft and Flipkart.", category: "Career", seats: 60, registered: 60, isRegistered: false },
  { id: "e5", title: "Sanskriti — Cultural Night", date: "2026-10-18", time: "6:00 PM", venue: "Open Air Theatre", organizer: "Cultural Committee", description: "Music, dance and drama performances by student clubs.", category: "Cultural", seats: 1200, registered: 870, isRegistered: true },
];

export type Assignment = { id: string; title: string; subject: string; code: string; due: string; status: "Pending" | "Submitted" | "Graded" | "Overdue"; marks?: string; faculty: string; submissions?: number; total?: number };
export const assignments: Assignment[] = [
  { id: "a1", title: "ER Diagram for Library System", subject: "Database Systems", code: "CS303", due: "2026-10-03", status: "Pending", faculty: "Prof. S. Nair", submissions: 41, total: 62 },
  { id: "a2", title: "Process Scheduling Simulator", subject: "Operating Systems", code: "CS302", due: "2026-10-04", status: "Pending", faculty: "Prof. M. Kulkarni", submissions: 28, total: 62 },
  { id: "a3", title: "Sprint 2 Report", subject: "Software Engineering", code: "CS304", due: "2026-10-06", status: "Pending", faculty: "Prof. D. Menon", submissions: 12, total: 62 },
  { id: "a4", title: "AVL Tree Implementation", subject: "Data Structures & Algorithms", code: "CS301", due: "2026-09-25", status: "Graded", marks: "18/20", faculty: "Prof. R. Iyer", submissions: 60, total: 62 },
  { id: "a5", title: "Subnetting Worksheet", subject: "Computer Networks", code: "CS305", due: "2026-09-27", status: "Submitted", faculty: "Dr. A. Verma", submissions: 58, total: 62 },
  { id: "a6", title: "Graph Theory Problem Set", subject: "Discrete Mathematics", code: "MA301", due: "2026-09-22", status: "Overdue", faculty: "Dr. K. Rao", submissions: 55, total: 62 },
];

export type Complaint = { id: string; title: string; category: string; description: string; location: string; priority: Priority; status: ComplaintStatus; date: string; by: string; assignee?: string };
export const complaints: Complaint[] = [
  { id: "C-1042", title: "Projector not working in LH-3", category: "Classroom", description: "The projector flickers and turns off after 5 minutes.", location: "LH-3, Block B", priority: "High", status: "In Progress", date: "2026-09-29", by: "Ananya Sharma", assignee: "AV Maintenance" },
  { id: "C-1039", title: "Wi-Fi drops in Hostel Block C", category: "IT / Network", description: "Connection drops every evening between 8–11 PM.", location: "Hostel Block C, Floor 2", priority: "Medium", status: "Assigned", date: "2026-09-27", by: "Ananya Sharma", assignee: "IT Services" },
  { id: "C-1031", title: "Broken chair in Library reading room", category: "Furniture", description: "Two chairs at table 14 are broken.", location: "Central Library", priority: "Low", status: "Resolved", date: "2026-09-20", by: "Ananya Sharma", assignee: "Estate Office" },
  { id: "C-1045", title: "Water leakage near Lab 204", category: "Infrastructure", description: "Water dripping from ceiling near entrance.", location: "Lab 204, Block C", priority: "Urgent", status: "Under Review", date: "2026-09-30", by: "Rohan Gupta" },
  { id: "C-1046", title: "Canteen hygiene concern", category: "Canteen", description: "Uncovered food at the North Block counter.", location: "North Block Canteen", priority: "High", status: "Submitted", date: "2026-10-01", by: "Kavya Reddy" },
  { id: "C-1028", title: "Streetlight out near Gate 2", category: "Infrastructure", description: "Path is very dark after 7 PM.", location: "Gate 2 walkway", priority: "Medium", status: "Resolved", date: "2026-09-15", by: "Arjun Mehta", assignee: "Estate Office" },
];

export type LostItem = { id: string; kind: "Lost" | "Found"; item: string; category: string; description: string; location: string; date: string; reporter: string; contact: string; status: "Open" | "Claimed" };
export const lostFound: LostItem[] = [
  { id: "L1", kind: "Lost", item: "Black JBL earbuds case", category: "Electronics", description: "Black case with a small scratch on the lid.", location: "Central Library, 2nd floor", date: "2026-09-30", reporter: "Ananya Sharma", contact: "ananya.sharma@campusx.edu", status: "Open" },
  { id: "L2", kind: "Found", item: "Blue Milton water bottle", category: "Personal", description: "Steel bottle with 'R.G.' sticker.", location: "LH-2", date: "2026-09-29", reporter: "Rohan Gupta", contact: "rohan.g@campusx.edu", status: "Open" },
  { id: "L3", kind: "Found", item: "Student ID card — Kavya Reddy", category: "Documents", description: "CSE, 3rd year ID card.", location: "North Block Canteen", date: "2026-09-28", reporter: "Security Desk", contact: "security@campusx.edu", status: "Claimed" },
  { id: "L4", kind: "Lost", item: "Casio scientific calculator", category: "Stationery", description: "fx-991EX with name written on the back.", location: "Exam Hall 1", date: "2026-09-26", reporter: "Arjun Mehta", contact: "arjun.m@campusx.edu", status: "Open" },
  { id: "L5", kind: "Found", item: "Silver bracelet", category: "Accessories", description: "Thin chain bracelet found near the badminton court.", location: "Sports Complex", date: "2026-09-25", reporter: "Sports Office", contact: "sports@campusx.edu", status: "Open" },
];

export const notifications = [
  { id: "x1", title: "Assignment due tomorrow", body: "ER Diagram for Library System — Database Systems", time: "1h ago", read: false, type: "assignment" },
  { id: "x2", title: "Complaint C-1042 updated", body: "Status changed to In Progress — AV Maintenance assigned", time: "3h ago", read: false, type: "complaint" },
  { id: "x3", title: "New urgent notice", body: "Mid-semester examinations begin 20 Oct", time: "5h ago", read: false, type: "notice" },
  { id: "x4", title: "Event registration confirmed", body: "InnoVate 2026 — Annual Tech Fest", time: "1d ago", read: true, type: "event" },
  { id: "x5", title: "Grade published", body: "AVL Tree Implementation — 18/20", time: "4d ago", read: true, type: "assignment" },
];

export const students = [
  { id: "21CSE1047", name: "Ananya Sharma", dept: "CSE", year: 3, attendance: 87, cgpa: 8.9, status: "Active" },
  { id: "21CSE1012", name: "Rohan Gupta", dept: "CSE", year: 3, attendance: 72, cgpa: 7.6, status: "Active" },
  { id: "21CSE1088", name: "Kavya Reddy", dept: "CSE", year: 3, attendance: 94, cgpa: 9.3, status: "Active" },
  { id: "22ME2031", name: "Arjun Mehta", dept: "MECH", year: 2, attendance: 68, cgpa: 7.1, status: "Probation" },
  { id: "20ECE3009", name: "Sneha Pillai", dept: "ECE", year: 4, attendance: 91, cgpa: 8.4, status: "Active" },
  { id: "23CIV4015", name: "Vikram Singh", dept: "CIVIL", year: 1, attendance: 83, cgpa: 8.0, status: "Active" },
  { id: "21CSE1063", name: "Ishita Banerjee", dept: "CSE", year: 3, attendance: 79, cgpa: 8.2, status: "Active" },
  { id: "22EEE5022", name: "Aditya Joshi", dept: "EEE", year: 2, attendance: 62, cgpa: 6.8, status: "Probation" },
];

export const faculty = [
  { id: "F101", name: "Prof. Rajesh Iyer", dept: "CSE", designation: "Associate Professor", courses: 3, email: "r.iyer@campusx.edu" },
  { id: "F102", name: "Prof. Meena Kulkarni", dept: "CSE", designation: "Professor", courses: 2, email: "m.kulkarni@campusx.edu" },
  { id: "F103", name: "Prof. Sunil Nair", dept: "CSE", designation: "Assistant Professor", courses: 3, email: "s.nair@campusx.edu" },
  { id: "F104", name: "Prof. Deepa Menon", dept: "CSE", designation: "Associate Professor", courses: 2, email: "d.menon@campusx.edu" },
  { id: "F105", name: "Dr. Amit Verma", dept: "CSE", designation: "Assistant Professor", courses: 2, email: "a.verma@campusx.edu" },
  { id: "F106", name: "Dr. Kiran Rao", dept: "MATH", designation: "Professor", courses: 4, email: "k.rao@campusx.edu" },
];

export const facultyClasses = [
  { code: "CS301", name: "Data Structures & Algorithms", section: "CSE-5B", students: 62, schedule: "Mon 9:00, Tue 9:00 (Lab), Fri 14:00", room: "LH-2" },
  { code: "CS301", name: "Data Structures & Algorithms", section: "CSE-5A", students: 58, schedule: "Mon 11:00, Wed 11:00, Thu 14:00", room: "LH-2" },
  { code: "CS501", name: "Advanced Algorithms", section: "M.Tech-1", students: 24, schedule: "Tue 14:00, Thu 11:00", room: "Seminar Room 3" },
];

export const analytics = {
  totalStudents: 8420, totalFaculty: 412, activeComplaints: 37, resolvedComplaints: 284, upcomingEvents: 12, avgResolutionDays: 2.4,
  categories: [
    { name: "Infrastructure", value: 92 }, { name: "IT / Network", value: 74 }, { name: "Classroom", value: 58 },
    { name: "Hostel", value: 46 }, { name: "Canteen", value: 31 }, { name: "Other", value: 20 },
  ],
  engagement: [
    { month: "Apr", active: 5200, events: 1800 }, { month: "May", active: 4100, events: 900 }, { month: "Jun", active: 3600, events: 600 },
    { month: "Jul", active: 6400, events: 2100 }, { month: "Aug", active: 7300, events: 2900 }, { month: "Sep", active: 7900, events: 3400 },
  ],
  resolution: [
    { week: "W1", opened: 42, resolved: 35 }, { week: "W2", opened: 38, resolved: 40 }, { week: "W3", opened: 51, resolved: 44 }, { week: "W4", opened: 33, resolved: 39 },
  ],
};

export const services = [
  { name: "Transport", desc: "12 buses · 8 routes", status: "Operational" },
  { name: "Central Library", desc: "Open 8 AM – 10 PM", status: "Operational" },
  { name: "Health Centre", desc: "Doctor on duty 24×7", status: "Operational" },
  { name: "Campus Wi-Fi", desc: "Upgrade in progress — Block B", status: "Degraded" },
  { name: "Hostel Mess", desc: "4 messes · 2,800 residents", status: "Operational" },
  { name: "Sports Complex", desc: "Pool closed for maintenance", status: "Maintenance" },
];

export function fmtDate(d: string) {
  return new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}
