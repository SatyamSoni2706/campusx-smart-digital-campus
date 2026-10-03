# CampusX — Smart University Digital Campus

## 🚀 Overview

CampusX is a unified digital campus platform that brings Students, Faculty, and Administrators into one role-based system. It provides a shared place to access academic records, manage coursework and attendance, communicate campus notices, register for events, and track campus issues.

## 🎯 Problem Statement

University workflows are often spread across separate tools and channels. Students may have difficulty finding current academic information; Faculty and Students can lack connected workflows for coursework and attendance; and complaints, event registration, communications, and notifications may be handled independently. Without a unified campus platform, information is harder to access and follow through on.

## 💡 Our Solution

CampusX combines student services, faculty workflows, and administrative tools in one application. Role-specific portals show the functions relevant to each user. Core accounts and academic and campus records are persisted in SQLite, with server-side role checks protecting data and actions.

## ✨ Key Features

### 👨‍🎓 Student Portal

- Student dashboard and profile
- Personal timetable and attendance records
- Assignments, submission status, and grades
- Notices and persisted notifications with read state
- Campus events and persisted event registration
- Complaint submission and status tracking
- Lost & Found reports and claims
- Campus Assistant for common campus questions

Assignment submissions currently store filename, type, size, and submission time as metadata; file contents are not stored.

### 👨‍🏫 Faculty Portal

- Faculty dashboard and profile
- Assigned courses and enrolled students
- Attendance sessions and student attendance management
- Assignment creation, submission review, and grading
- Assigned student issues and status updates
- Read-only campus events and notices
- Faculty notifications

### 🛡️ Admin Portal

- Admin dashboard and persisted analytics
- Student and Faculty directories
- Course creation, Faculty course assignments, and Student enrollments
- Notice and event management
- Complaint review, status updates, and Faculty assignment
- Lost & Found oversight

The System Settings and Campus Services screens are presentation/demo screens; they do not currently persist configuration or service-status changes.

### 🤖 Campus Assistant

The Student Campus Assistant is a keyword- and rule-based server function, not a generative AI model or external AI API. It can answer supported questions using the authenticated Student’s persisted attendance, timetable, assignments, complaints, and shared notices or events, and provide fixed guidance for common campus tasks. The interface labels this feature as “demo mode”; answers are limited to the supported question patterns.

## 🔐 Authentication & Security

CampusX supports Student, Faculty, and Admin roles. Student registration is available in the application; Faculty and Admin accounts are provisioned separately. Protected portal layouts redirect users to the appropriate role area, and server functions enforce role authorization for protected reads and changes.

Passwords are stored as scrypt hashes. Sign-in creates a random session token in an HTTP-only cookie; SQLite stores a SHA-256 hash of the token with its expiry. The application does not use OAuth or JWT authentication.

## 💾 Data & Persistence

CampusX uses SQLite through Node.js’s built-in `node:sqlite` module. The database path is set with `CAMPUSX_DB_PATH`; by default, the application uses `./data/campusx.sqlite`. The application creates its schema and applies safe additive migrations when it initializes the database. Normal startup does not seed demo application records.

Persisted data includes:

- Users and sessions
- Courses, Faculty course assignments, and Student course enrollments
- Course assignments, Student assignment records, submission metadata, and marks
- Aggregate Student attendance plus dated attendance sessions and records
- Complaints and complaint status history
- Notices
- Events and event registrations
- Notifications and per-user read timestamps
- Lost & Found items, claims, and status history

## 🧰 Technology Stack

- React 19 and TypeScript
- TanStack Start and TanStack Router
- Vite and Nitro (`node-server` production preset)
- Tailwind CSS 4
- Node.js 22.5 or newer, including built-in `node:sqlite`
- SQLite
- Zod for server-function input validation
- Recharts for dashboard visualizations

## 📁 Project Structure

```text
src/
├── routes/                 # Active file-based routes for public, Student, Faculty, and Admin portals
├── components/
│   ├── campus/             # Shared campus layouts and feature components
│   └── ui/                 # Reusable interface components
└── lib/
    ├── campus.functions.ts # Server functions for campus data and workflows
    ├── auth.functions.ts   # Authentication server functions
    └── server/             # SQLite, session authentication, and password hashing
scripts/
└── provision-demo-accounts.mjs # Explicit local-only demo account and data setup
public/                     # Static files (currently robots.txt)
```

## ⚙️ Local Setup

### Requirements

- Node.js 22.5 or newer
- npm

### Run in development

```bash
git clone https://github.com/SatyamSoni2706/campusx-smart-digital-campus.git
cd campusx-smart-digital-campus
npm install --no-package-lock
npm run dev
```

The development server runs on Vite’s configured local port. If `CAMPUSX_DB_PATH` is unset, the application creates and uses `data/campusx.sqlite` in the project directory.

### Optional local demo provisioning

The demo setup command is explicit and guarded; it does not run during application startup. It requires a local database under the project’s `data/` directory and refuses to run in production or CI. From the project root, enable demo mode for this command only:

```bash
DEMO_MODE=true npm run demo:provision
```

In PowerShell:

```powershell
$env:DEMO_MODE = "true"
npm run demo:provision
```

The command provisions the local Faculty and Admin demo accounts, two additional Student demo accounts, and a small persisted Faculty course/workflow dataset. It prints the local demo credentials when it runs. Do not use these demo accounts in production.

### Build and run as a Node.js server

```bash
npm run build
npm start
```

For production, configure `CAMPUSX_DB_PATH`, `NODE_ENV=production`, and `PORT` as shown in `.env.example`. Mount persistent storage at the configured database path; an ephemeral filesystem will not retain SQLite data across replacement or restart.

### Useful checks

```bash
npx tsc --noEmit
npm run lint
```
