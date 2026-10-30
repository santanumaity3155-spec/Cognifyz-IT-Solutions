# Forma — Student Intelligence Platform

**Cognifyz Full Stack Internship — Task 2: Inline + Server-Side Validation**

A premium, portfolio-quality Student Management Platform built with Node.js, Express.js, and EJS server-side rendering. This is **Task 2** of the internship and extends the existing Task 1 project without modifying it.

---

## 📑 Table of Contents

1. [Project overview](#project-overview)
2. [Objective](#objective)
3. [Technologies used](#technologies-used)
4. [Features](#features)
5. [Project structure](#project-structure)
6. [Architecture & data flow](#architecture--data-flow)

7. [Installation (Windows PowerShell)](#installation-windows-powershell)
8. [Execution instructions](#execution-instructions)
9. [Testing procedure](#testing-procedure)
10. [Troubleshooting guide](#troubleshooting-guide)

11. [Screenshots checklist](#screenshots-checklist)
12. [Security & code quality](#security--code-quality)
13. [Future compatibility](#future-compatibility)
14. [Conclusion](#conclusion)

## 🎯 Project overview

**Forma** is a student intelligence (management) platform where users can register students through a rich, validated form and browse the registered student records. Task 2 focuses on **form validation**:

- Extended registration form with 9 fields (Full Name, Email, Phone, Student ID, Course, Gender, Date of Birth, Address, Terms & Conditions).
- **Inline JavaScript validation** in the browser with real-time feedback.
- **Express server-side validation** that independently rejects invalid submissions — even if browser validation is bypassed.
- Meaningful error messages, preserved form values after errors, in-memory storage, a success page with a registration reference, and a student records page with search and course filtering.

The design is a premium dark SaaS-style interface (dark navy & charcoal, purple/indigo/blue gradients), fully responsive on desktop, tablet, and mobile.

Task 1 (`Task-1/`) is **untouched** — its existing functionality is fully preserved.

## 🎯 Objective

Complete Cognifyz Internship Task 2 while maintaining existing Task 1 functionality:

| # | Requirement | Implementation |
|---|-------------|----------------|
| 1 | Extend the registration form | 9 fields with HTML5 input types and accessible labels (`views/index.ejs`) |
| 2 | Inline JavaScript validation | `public/js/validation.js` — required fields, name, email, phone, student ID, course, DOB, terms |
| 3 | Real-time form validation | `input`, `change`, `blur`, `submit` listeners with inline feedback |
| 4 | Server-side validation using Express | `utils/validation.js` + `POST /register` in `app.js` |
| 5 | Validate all information independently on the backend | Backend validators run on every submission; browser validation is never trusted |
| 6 | Meaningful error messages | Field-specific messages shown inline and in an error summary |
| 7 | Preserve safe form values after errors | Trimmed submitted values are redisplayed after a failed submission |
| 8 | In-memory storage | `students` array in `app.js` — cleared on server restart (by design) |
| 9 | Successful registration message | Success page (`views/success.ejs`) with HTTP 201 |
| 10 | Registered students in a records page | `GET /students` (`views/students.ejs`) with count, search, filters |

## 🛠 Technologies used

- **Node.js** (v24+) — runtime
- **Express.js** — web framework and server
- **EJS** — server-side templating (escaped output with `<%= %>`)
- **HTML5** — semantic form structure
- **CSS3** — custom design system with CSS variables, grid, responsive media queries
- **Vanilla JavaScript** — real-time validation and interactions (no frameworks)
- **Express static middleware** — serves `/public`

No database is used (MongoDB is not required for Task 2). No extra npm dependencies beyond `express` and `ejs`.

## ✨ Features

- **Navigation**: Forma logo, Dashboard, Registration, Student Records, About; responsive mobile sidebar menu.
- **Hero section**: headline, description, call-to-action, feature highlights.
- **Registration form**: Full Name, Email Address, Phone Number, Student ID, Course, Gender, Date of Birth, Address, Terms & Conditions checkbox.
- **Real-time inline validation**: field-level errors/success states on `input`, `change`, `blur`, `submit`; character counters; form completion percentage.
- **Loading indicator** during submission and toast notifications.
- **Server-side validation**: independent Express validation with meaningful errors, HTTP 400 on failure, preserved input values.
- **Success page**: registration confirmation, submitted details, registration reference, "Register another student" action.
- **Student records**: list view, total registration count, search by name/email/ID, course filter, empty state, responsive table.
- **Custom 404 page** and global 500 error handler.
- **Accessibility**: skip link, ARIA labels, keyboard navigation, Escape to close mobile menu.
- **Premium UI**: dark navy/charcoal theme, purple-indigo-blue gradients, soft shadows, hover transitions, responsive breakpoints.

## 📁 Project structure

```
Task-2/
├── app.js                  # Express server: routes, server validation, in-memory store, EJS config
├── package.json            # Dependencies: express, ejs; scripts: start / dev
├── .env.example            # Configuration example (PORT, NODE_ENV)
├── .env                    # Local configuration (gitignored)
├── .gitignore              # node_modules, .env, logs, OS/IDE files
├── README.md               # This file
├── utils/
│   └── validation.js       # Reusable, pure server-side validation functions
├── views/
│   ├── layout.ejs          # Shared page shell (head + nav + body + footer)
│   ├── partials/
│   │   ├── head.ejs        # HTML head (meta, fonts, CSS)
│   │   ├── nav.ejs         # Sidebar + header navigation
│   │   └── footer.ejs      # Footer
│   ├── index.ejs           # Hero + registration form (body partial)
│   ├── success.ejs         # Registration success page (body partial)
│   ├── students.ejs        # Student records + search + filters (body partial)
│   ├── about.ejs           # About page (body partial)
│   └── 404.ejs             # Page not found (body partial)
└── public/
    ├── css/
    │   └── style.css       # Full design system (responsive, dark mode)
    ├── js/
    │   └── validation.js   # Real-time validation, toasts, nav, interactions
    └── images/
        └── .gitkeep        # Reserved for future brand assets
```

**Why this structure:** It mirrors Task 1's proven layout while adding `utils/validation.js` to keep server-side validation logic separate from route handlers — reusable and testable for future REST API work. Views are body partials wrapped by `layout.ejs`, rendered via Express's `app.render()` callback so one shared shell surrounds every page.

## 🔁 Architecture & data flow

```
Browser → Inline JS validation (public/js/validation.js)
  → Express POST /register (app.js)
    → Server validation (utils/validation.js) — independent of browser
      → In-memory students array (cleared on restart)
        → EJS response (views/)
```

Routes:

| Method | Path | Purpose | Status |
|--------|------|---------|--------|
| GET | `/` | Home: hero + registration form | 200 |
| POST | `/register` | Validate + register a student | 201 success / 400 validation error |
| GET | `/students` | Student records (search `?q=`, course `?course=`) | 200 |
| GET | `/success` | Redirects to `/` | 302 |
| GET | `/about` | About page | 200 |
| GET | `*` | Custom 404 page | 404 |

Server-side validation runs on **every** submission. Client-side validation is UX only.

## 🪟 Installation (Windows PowerShell)

All commands below are executed in **Windows PowerShell**. Open PowerShell (Press `Win`, type "PowerShell", hit Enter).

### 1. Open the project in VS Code

```powershell
code 'd:\New Project\Cognifyz\Cognifyz-IT-Solutions\Task-2'
```

### 2. Change into the project folder

```powershell
cd 'd:\New Project\Cognifyz\Cognifyz-IT-Solutions\Task-2'
```

### 3. Install dependencies

```powershell
npm install
```

This installs `express` and `ejs` into `node_modules/` (gitignored). Run once, or whenever `package.json` changes.

## ▶️ Execution instructions

### Start the backend

```powershell
cd 'd:\New Project\Cognifyz\Cognifyz-IT-Solutions\Task-2'
npm start
```

Expected output:

```
Forma server running at http://localhost:3000
Environment: development
Press Ctrl+C to stop. Note: in-memory student records are cleared on restart.
```

### Open the website

```powershell
Start-Process 'http://localhost:3000'
```

Or open your browser manually and go to **http://localhost:3000**.

### Use a different port (optional)

```powershell
$env:PORT=3001; npm start
```

Or edit `.env` (gitignored) and set `PORT=3001`.

### Restart the server

1. In the PowerShell terminal running the server, press **Ctrl+C**.
2. Run `npm start` again.

> **Important:** Task 2 uses in-memory storage, so restarting the server clears all registered students. This is intentional and documented.

## 🧪 Testing procedure

Test these scenarios manually in the browser at **http://localhost:3000**:

| # | Test | Expected result |
|---|------|-----------------|
| 1 | Submit an empty form | Inline errors appear for every required field; form does not submit; server returns 400 if submitted directly |
| 2 | Enter an invalid email (e.g. `not-an-email`) | "Please enter a valid email address." under the email field |
| 3 | Enter an invalid phone number (e.g. `abc`) | "Please enter a valid phone number (7–20 digits)." under the phone field |
| 4 | Leave required fields empty | Each empty required field shows "is required" on blur/submit |
| 5 | Do not accept Terms and Conditions | "You must accept the Terms and Conditions to register." appears; form won't submit |
| 6 | Submit valid information | Success page with registration reference and submitted details |
| 7 | Register multiple students | Each gets a unique reference (e.g. `FORMA-…`); all appear in Student Records |
| 8 | Search for a student | Type a name/email/ID in the search box; list filters to matches |
| 9 | Filter students by course | Choose a course from the dropdown; only matching students show |
| 10 | Refresh the records page | Search/filter persist via URL query params; page re-renders correctly |
| 11 | Restart the server and verify data loss | Records page shows "No Student Records Yet" after restart |
| 12 | Test mobile responsiveness | Resize browser / use DevTools device toolbar; sidebar toggles, form stacks to one column |
| 13 | Bypass browser validation and test backend directly | Send a POST to `/register` with invalid data → server responds 400 with errors |

### Example backend test with PowerShell (curl)

Invalid submission (server must reject with 400):

```powershell
Invoke-WebRequest -Method POST -Uri 'http://localhost:3000/register' -Body 'fullName=&email=&phone=&studentId=&course=&gender=&dateOfBirth=&address=&terms=' -ContentType 'application/x-www-form-urlencoded' -ErrorAction SilentlyContinue | Select-Object StatusCode
```

Valid submission:

```powershell
$body = 'fullName=Alex+Rivera&email=alex.rivera%40university.edu&phone=%2B15550000000&studentId=STU-2024-0001&course=Computer+Science&gender=Male&dateOfBirth=2004-03-15&address=123+University+Lane%2C+City&terms=on'
Invoke-WebRequest -Method POST -Uri 'http://localhost:3000/register' -Body $body -ContentType 'application/x-www-form-urlencoded' -ErrorAction SilentlyContinue | Select-Object StatusCode
```

Expected: `201` for valid, `400` for invalid.

## 🔧 Troubleshooting guide

| Problem | Likely cause | Fix |
|---------|--------------|-----|
| `Cannot find module 'express'` | Dependencies not installed | Run `npm install` inside `Task-2/` |
| Port 3000 already in use | Another process on port 3000 | Kill it, or use `$env:PORT=3001; npm start` |
| Page styles look broken | CSS not loading | Confirm `public/css/style.css` exists; hard-refresh (`Ctrl+F5`) |
| Form re-renders with errors | Server-side validation failed | Read the inline error messages; all fields are required |
| Records missing after restart | In-memory storage | By design — data resets when the server stops |
| 404 on `/success` | Direct access | `/success` redirects to `/`; it renders only after POST /register |
| EJS template error | Syntax error in `.ejs` | Check terminal output; ensure all files exist under `views/` |

Confirm `node --version` is v18+ and `npm --version` works.

## 🖼 Screenshots checklist

For your internship submission, capture:

1. Home page with hero section and navigation (desktop)
2. Registration form with inline field errors (empty submit)
3. Invalid email/phone feedback messages
4. Success page with registration reference and submitted details
5. Student records page with multiple students and total count
6. Search filtering in action
7. Course filter dropdown in action
8. Empty state (no records)
9. Mobile view (sidebar open/closed, stacked form)
10. PowerShell terminal showing `npm start` running

## 🔒 Security & code quality

- All data is validated on the **server** (`utils/validation.js`); client validation is UX only.
- Allowlist validation for `course` and `gender` rejects unexpected values.
- All EJS output uses **escaped** tags (`<%= %>`); unescaped tags are never used for user data.
- No hardcoded secrets; configuration via `.env` / environment variables.
- `.gitignore` excludes `node_modules/`, `.env`, logs, and OS/IDE files.
- Minimal dependencies: only `express` and `ejs`.
- Graceful error handling: custom 404 page and global 500 handler.
- Not production-hardened: add CSRF protection, rate limiting, HTTPS, and session management before production deployment.

## 🚀 Future compatibility

The architecture is ready for future internship tasks without rework:

| Future addition | Current state |
|-----------------|---------------|
| React / Vite frontend | Can be added alongside EJS routes |
| Tailwind CSS | Custom CSS system in place; swap stylesheet later |
| Express REST APIs | `utils/validation.js` is route-independent and reusable |
| MongoDB persistence | Replace the `students` array with a database model |
| Authentication / authorization | Modular Express middleware structure established |
| Admin dashboard | New routes/views can extend the same layout shell |
| Analytics & charts | Records route already aggregates data |
| AI assistant | Optional API config via `.env`, no changes to core flow |

EJS is intentionally kept for Task 2 (per requirements).

## ✅ Conclusion

Task 2 is complete: extended registration form, real-time inline validation, independent Express server-side validation, meaningful errors, preserved values, temporary in-memory storage, success page with registration reference, and a searchable student records page — all in a premium responsive design. Task 1 remains untouched and fully functional in `Task-1/`.

**Next step suggestion:** Task 3 could integrate a persistent database (MongoDB) for student records, add pagination, and/or convert the registration endpoint into a JSON REST API consumed by fetch.
