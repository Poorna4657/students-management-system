# Student Management System

A full-stack web application for administrators to manage student records, courses, attendance, and academic information through a secure, user-friendly interface.

## Features

### Authentication & Authorization
- Email/password sign-up and sign-in powered by Supabase Auth
- Protected routes — only authenticated users can access the dashboard
- Each admin only sees records they created (row-level security)

### Dashboard
- Overview stats: total students, active courses, enrollments, today's attendance
- Quick action shortcuts to add students, courses, or mark attendance
- Recently added students and recent attendance records
- Attendance rate for the current day

### Student Management (CRUD)
- Add, edit, and delete student records
- Fields: name, email, phone, date of birth, gender, address, enrollment date, status
- Search by name or email
- Filter by status (active, inactive, graduated, suspended)
- Responsive table on desktop, card layout on mobile

### Course Management (CRUD)
- Add, edit, and delete courses
- Fields: code, title, description, credits, instructor, capacity, status
- Search by code, title, or instructor
- Filter by status (active, archived)
- Card-based layout with enrollment capacity tracking

### Enrollment Management
- Enroll students into courses from the course card
- View and remove enrolled students
- Prevents duplicate enrollments and over-capacity enrollment

### Attendance Tracking
- Mark attendance by course and date (present, absent, late, excused)
- Bulk "mark all present" shortcut
- Attendance history with filters by course, status, and student name
- Delete individual attendance records

### UI / UX
- Fully responsive (mobile, tablet, desktop)
- Light/dark mode toggle with system preference detection
- Toast notifications for success/error feedback
- Confirmation dialogs for destructive actions
- Clean, modern design with the Inter font and a blue/teal color system
- Smooth animations and micro-interactions

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + TypeScript + Vite |
| Styling | Tailwind CSS |
| Icons | Lucide React |
| Routing | React Router v6 |
| Backend | Supabase (PostgreSQL, Auth, RLS) |

## Database Schema

Four tables with Row Level Security enabled. All policies scope to `authenticated` users with ownership checks via `auth.uid() = user_id`.

### `students`
| Column | Type | Description |
|--------|------|-------------|
| id | uuid (PK) | Auto-generated |
| first_name | text | Required |
| last_name | text | Required |
| email | text (unique) | Required |
| phone | text | Optional |
| date_of_birth | date | Optional |
| gender | text | male / female / other |
| address | text | Optional |
| enrollment_date | date | Defaults to today |
| status | text | active / inactive / graduated / suspended |
| user_id | uuid (FK → auth.users) | Owner, defaults to auth.uid() |
| created_at | timestamptz | Auto |
| updated_at | timestamptz | Auto (trigger) |

### `courses`
| Column | Type | Description |
|--------|------|-------------|
| id | uuid (PK) | Auto-generated |
| code | text (unique) | e.g. CS101 |
| title | text | Required |
| description | text | Optional |
| credits | integer | Default 3 |
| instructor | text | Optional |
| capacity | integer | Default 30 |
| status | text | active / archived |
| user_id | uuid (FK → auth.users) | Owner |
| created_at | timestamptz | Auto |
| updated_at | timestamptz | Auto (trigger) |

### `enrollments`
| Column | Type | Description |
|--------|------|-------------|
| id | uuid (PK) | Auto-generated |
| student_id | uuid (FK → students) | Cascade delete |
| course_id | uuid (FK → courses) | Cascade delete |
| enrollment_date | date | Defaults to today |
| grade | text | Letter grade or null |
| status | text | enrolled / completed / dropped |
| user_id | uuid (FK → auth.users) | Owner |
| created_at | timestamptz | Auto |
| | | Unique: (student_id, course_id) |

### `attendance`
| Column | Type | Description |
|--------|------|-------------|
| id | uuid (PK) | Auto-generated |
| student_id | uuid (FK → students) | Cascade delete |
| course_id | uuid (FK → courses) | Cascade delete |
| date | date | Required |
| status | text | present / absent / late / excused |
| notes | text | Optional |
| user_id | uuid (FK → auth.users) | Owner |
| created_at | timestamptz | Auto |
| | | Unique: (student_id, course_id, date) |

### Security (RLS)
- RLS enabled on all tables
- 4 policies per table (SELECT, INSERT, UPDATE, DELETE) scoped to `authenticated`
- Ownership check: `auth.uid() = user_id`
- `user_id` columns default to `auth.uid()` so client inserts succeed without explicitly passing it
- Cascading deletes: removing a student or course cleans up related enrollments and attendance

## API Documentation

The app communicates with Supabase directly from the browser using the PostgREST API (no custom REST endpoints needed). All data access is enforced by RLS policies.

### Authentication
| Method | Supabase Call | Description |
|--------|--------------|-------------|
| Sign Up | `supabase.auth.signUp({ email, password })` | Creates a new account |
| Sign In | `supabase.auth.signInWithPassword({ email, password })` | Authenticates existing user |
| Sign Out | `supabase.auth.signOut()` | Ends the session |

### Students
| Operation | Supabase Call |
|-----------|--------------|
| List | `supabase.from('students').select('*')` |
| Create | `supabase.from('students').insert({ ...fields })` |
| Update | `supabase.from('students').update({ ...fields }).eq('id', id)` |
| Delete | `supabase.from('students').delete().eq('id', id)` |

### Courses
| Operation | Supabase Call |
|-----------|--------------|
| List | `supabase.from('courses').select('*')` |
| Create | `supabase.from('courses').insert({ ...fields })` |
| Update | `supabase.from('courses').update({ ...fields }).eq('id', id)` |
| Delete | `supabase.from('courses').delete().eq('id', id)` |

### Enrollments
| Operation | Supabase Call |
|-----------|--------------|
| List by course | `supabase.from('enrollments').select('*, student:students(...)').eq('course_id', id)` |
| Create | `supabase.from('enrollments').insert({ student_id, course_id })` |
| Delete | `supabase.from('enrollments').delete().eq('id', id)` |

### Attendance
| Operation | Supabase Call |
|-----------|--------------|
| List (history) | `supabase.from('attendance').select('*, student:students(...), course:courses(...)')` |
| List by course+date | `supabase.from('attendance').select('*').eq('course_id', id).eq('date', date)` |
| Create (bulk) | `supabase.from('attendance').insert([{ student_id, course_id, date, status }, ...])` |
| Delete | `supabase.from('attendance').delete().eq('id', id)` |

## Getting Started

### Prerequisites
- Node.js 18+
- A Supabase project (URL and anon key)

### Installation
```bash
npm install
```

### Environment Variables
Create a `.env` file with:
```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Running the Development Server
```bash
npm run dev
```

### Building for Production
```bash
npm run build
```

### Running Type Check
```bash
npm run typecheck
```

## Project Structure
```
src/
  components/        Reusable UI components
    ConfirmDialog.tsx
    EmptyState.tsx
    Layout.tsx       Sidebar + header shell
    Loader.tsx
    Modal.tsx
    StatusBadge.tsx
    Toast.tsx
  contexts/          React contexts
    AuthContext.tsx
    ThemeContext.tsx
  lib/               Utilities
    format.ts
    supabase.ts
  pages/             Route pages
    AuthPage.tsx
    Dashboard.tsx
    StudentsPage.tsx
    CoursesPage.tsx
    AttendancePage.tsx
  types/             TypeScript type definitions
    index.ts
  App.tsx            Root component + routing
  main.tsx           Entry point
  index.css          Global styles + Tailwind
```

## Usage Guide

1. **Sign Up** — Create an admin account with email and password on the login screen.
2. **Dashboard** — View stats and quick actions after signing in.
3. **Students** — Click "Add Student" to create records. Use search and filters to find students. Click edit or delete icons to manage records.
4. **Courses** — Click "Add Course" to create courses. Click "Enrollments" on a course card to enroll students.
5. **Attendance** — Select a course and date, mark each student's status, then save. View and filter history below.
6. **Theme** — Toggle light/dark mode from the sidebar footer or mobile header.
