# Forma – Student Intelligence Platform
> **Cognifyz IT Solutions – Web Development Internship**  
> **Level 3: Advanced | Task 6: Database Integration and User Authentication**  
> *A full-stack, enterprise-grade Student Management & Intelligence Platform built with Node.js, Express, MongoDB (Mongoose), JWT, bcryptjs, React 18, TypeScript, Tailwind CSS, and Axios.*

---

## 1. Project Overview

**Forma** is an enterprise-grade Student Intelligence Platform designed to fulfill the three core requirements of Level 3, Task 6:
1. **Database Integration**: Persistent data storage and retrieval using **MongoDB** with **Mongoose ODM**, strict schema validation, unique indexes, and document relationships (`createdBy: ObjectId`).
2. **User Authentication**: Secure server-side authentication (`/api/auth/register`, `/api/auth/login`, `/api/auth/me`, `/api/auth/logout`) leveraging **bcryptjs** (10 salt rounds) and signed **JSON Web Tokens (JWT)** transported via secure **HTTP-only cookies** (`forma_token`).
3. **API Authorization Checks**: Server-side role-based access control (**RBAC**) and strict **resource ownership** verification (`authenticateUser`, `authorizeRoles`, `verifyResourceOwnership`) for `Admin` and `Student` roles.

The platform provides a dual-interface architecture:
- **Administrator Role**: System-wide directory visibility, full CRUD management over all student records, course distribution analytics, and seed reset controls.
- **Student Role**: Cryptographically isolated workspace where users view and manage only their own student records, protected by strict server-side ownership checks.

---

## 2. Key Features

- **Robust Database Engine**: MongoDB persistent storage via Mongoose schemas (`User` and `Student`) with compound indexes, timestamps, and an integrated, documented offline fallback store for zero-crash development continuity.
- **JWT & HTTP-Only Cookie Authentication**: RFC 7519 signed JWTs transported inside `httpOnly: true`, `sameSite: 'lax'`/`'strict'` cookies. Frontend JavaScript has zero access to raw tokens, neutralizing XSS credential theft.
- **Role-Based Access Control (RBAC)**: Distinguishes between `Admin` and `Student` users. Administrative endpoints are gated via `authorizeRoles('Admin')`.
- **Resource Ownership Isolation**: Gated via `verifyResourceOwnership`. Students cannot view, edit, or delete another student's record (`403 Forbidden`). Ownership (`createdBy`) is immutable and server-assigned.
- **Complete Student CRUD Operations**: Full creation, editing, inspection, and deletion workflows with search, course filtering, academic year filtering, status filtering, and pagination.
- **Responsive UI/UX**: Mobile navigation drawer, desktop data table, responsive mobile cards, accessible modal dialogs, and real-time password strength meter adhering to the Indigo/Slate SaaS theme.
- **Hardened Defense in Depth**: Helmet security headers, rate limiting (login and registration brute-force defenses), CSRF origin verification, input sanitization, and ReDoS protection.
- **100% Automated Test Coverage**: 99 backend integration and unit tests + 38 frontend integration and component tests (137 tests total, 100% pass rate).

---

## 3. Technology Stack

| Layer | Technologies |
| :--- | :--- |
| **Backend Runtime** | Node.js (v18+ recommended, tested on v24), Express 4.21 |
| **Database & ODM** | MongoDB, Mongoose 8.8 (with documented in-memory fallback store) |
| **Security & Auth** | bcryptjs (10 salt rounds), jsonwebtoken (JWT), cookie-parser, helmet, cors, express-rate-limit |
| **Frontend Framework** | React 18, TypeScript 5.6, Vite 5.4 |
| **Styling & Icons** | Tailwind CSS 3.4, Lucide React icons |
| **Routing & HTTP** | React Router DOM v6, Axios (with `withCredentials: true`) |
| **Testing Harness** | Vitest 2.1, Supertest, Testing Library (React, DOM, user-event) |

---

## 4. Architecture & Directory Structure

```text
Task-6/
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   ├── db.js                 # Mongoose connection manager & fallback store
│   │   │   └── environment.js        # Environment validation & credential masking
│   │   ├── controllers/
│   │   │   ├── authController.js     # Register, login, me, logout handlers
│   │   │   ├── dashboardController.js# Role-scoped dashboard analytics
│   │   │   ├── healthController.js   # Health check & database state probe
│   │   │   └── studentController.js  # Authenticated student CRUD operations
│   │   ├── middleware/
│   │   │   ├── authenticateUser.js   # JWT cookie verification middleware
│   │   │   ├── authorizeRoles.js     # RBAC gating middleware (Admin vs Student)
│   │   │   ├── csrfProtection.js     # CSRF & custom header origin verification
│   │   │   ├── rateLimiter.js        # Express rate limiters for auth endpoints
│   │   │   └── verifyResourceOwnership.js # Resource-level createdBy authorization
│   │   ├── models/
│   │   │   ├── Student.js            # Student Mongoose model & schema constraints
│   │   │   └── User.js               # User Mongoose model with bcrypt pre-save hook
│   │   ├── routes/
│   │   │   ├── authRoutes.js         # /api/auth endpoints
│   │   │   ├── dashboardRoutes.js    # /api/dashboard endpoints
│   │   │   ├── healthRoutes.js       # /api/health endpoint
│   │   │   └── studentRoutes.js      # /api/students endpoints
│   │   ├── seed/
│   │   │   └── seedData.js           # 10 initial student records & test users
│   │   ├── services/
│   │   │   ├── authStore.js          # User storage abstraction (MongoDB & fallback)
│   │   │   └── studentStore.js       # Student storage abstraction & query builder
│   │   ├── test/
│   │   │   ├── authApi.test.js       # Authentication endpoints test suite
│   │   │   ├── authenticateUser.test.js # Auth middleware tests
│   │   │   ├── authorization.test.js # RBAC & ownership tests
│   │   │   ├── database.test.js      # Database connection & fallback tests
│   │   │   ├── jwtAuth.test.js       # JWT signing & cookie tests
│   │   │   ├── models.test.js        # Mongoose schema validation tests
│   │   │   ├── securityAndIntegration.test.js # End-to-end security audit tests
│   │   │   └── server.test.js        # Server lifecycle tests
│   │   ├── utils/
│   │   │   ├── passwordValidator.js  # Password complexity criteria evaluator
│   │   │   └── tokenUtils.js         # JWT generator & cookie handlers
│   │   ├── validators/
│   │   │   └── authValidators.js     # Payload validation middleware
│   │   └── server.js                 # Express application entrypoint
│   ├── .env.example                  # Environment configuration template
│   └── package.json                  # Backend dependencies & scripts
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── common/
│   │   │   │   ├── Badge.tsx         # Status & role indicators
│   │   │   │   ├── ConfirmModal.tsx  # Accessible confirmation modal
│   │   │   │   ├── Pagination.tsx    # Responsive pagination controls
│   │   │   │   └── PasswordStrengthMeter.tsx # Real-time strength criteria
│   │   │   └── students/
│   │   │       ├── StudentFilterBar.tsx # Debounced search & filter dropdowns
│   │   │       ├── StudentForm.tsx   # Add/Edit form with accessible validation
│   │   │       └── StudentTable.tsx  # Dual table/card responsive directory
│   │   ├── context/
│   │   │   └── AuthContext.tsx       # React Context session manager
│   │   ├── hooks/
│   │   │   └── useAuth.ts            # Custom hook for authentication state
│   │   ├── layouts/
│   │   │   ├── AuthLayout.tsx        # Centered auth card container
│   │   │   └── MainLayout.tsx        # Responsive navbar & mobile menu drawer
│   │   ├── pages/
│   │   │   ├── auth/
│   │   │   │   ├── LoginPage.tsx     # Sign-in page with quick-fill demo pills
│   │   │   │   ├── RegisterPage.tsx  # Student account creation page
│   │   │   │   └── UnauthorizedPage.tsx # 403 Forbidden access denial page
│   │   │   ├── dashboard/
│   │   │   │   └── DashboardPage.tsx # Role-tailored analytics dashboard
│   │   │   ├── profile/
│   │   │   │   └── ProfilePage.tsx   # User profile & session security status
│   │   │   ├── students/
│   │   │   │   ├── AddStudentPage.tsx    # Register new student page
│   │   │   │   ├── EditStudentPage.tsx   # Edit student profile page
│   │   │   │   ├── StudentDetailPage.tsx # Single student view
│   │   │   │   └── StudentsPage.tsx      # Main student directory
│   │   │   └── LandingPage.tsx       # Marketing & live health probe page
│   │   ├── routes/
│   │   │   ├── AppRoutes.tsx         # Central application route hierarchy
│   │   │   ├── ProtectedRoute.tsx    # Auth guard with role gating
│   │   │   └── PublicRoute.tsx       # Guest guard redirecting to /dashboard
│   │   ├── services/
│   │   │   ├── api.ts                # Axios base instance with withCredentials
│   │   │   ├── authService.ts        # Authentication API service
│   │   │   ├── dashboardService.ts   # Dashboard metrics API service
│   │   │   └── studentService.ts     # Student CRUD API service
│   │   ├── test/
│   │   │   ├── authPages.test.tsx    # Login & register component tests
│   │   │   ├── authRouting.test.tsx  # Route protection & session hydration tests
│   │   │   ├── setup.ts              # Testing library setup
│   │   │   ├── smoke.test.tsx        # Frontend smoke tests
│   │   │   └── studentsManagement.test.tsx # Student CRUD & RBAC UI tests
│   │   ├── types/
│   │   │   └── student.ts            # Student & Dashboard TypeScript types
│   │   ├── App.tsx                   # Main React component
│   │   ├── index.css                 # Tailwind directives & styles
│   │   └── main.tsx                  # DOM mounting entrypoint
│   ├── .env.example                  # Frontend environment template
│   ├── package.json                  # Frontend dependencies & scripts
│   ├── tailwind.config.js            # Tailwind theme configuration
│   ├── tsconfig.json                 # TypeScript strict compiler config
│   └── vite.config.ts                # Vite dev server & proxy config
├── docs/
│   ├── API_SPECIFICATION.md          # Complete REST API documentation
│   └── SECURITY_ARCHITECTURE.md      # Security & defense-in-depth details
├── .gitignore                        # Git exclusion rules
└── README.md                         # Project documentation
```

---

## 5. Prerequisites

- **Node.js**: `v18.0.0` or higher (tested on Node `v24.14.0`).
- **npm**: `v9.0.0` or higher (tested on npm `11.10.0`).
- **MongoDB** *(Optional)*: Local daemon running at `mongodb://127.0.0.1:27017` or MongoDB Atlas URI.
  > **Note on Storage Engine**: If MongoDB is not running locally, Forma automatically detects this and engages its **documented in-memory fallback store**. The entire API, Mongoose validation, and authentication flows remain 100% operational. The `/api/health` endpoint clearly reports whether storage is running in persistent MongoDB mode or in-memory fallback mode.

---

## 6. Installation & Quick Start

### 6.1 Clone & Navigate
```bash
cd "D:\New Project\Cognifyz\Cognifyz-IT-Solutions\Task-6"
```

### 6.2 Backend Setup
```bash
cd backend

# 1. Install dependencies
npm install

# 2. Configure environment
cp .env.example .env

# 3. Start development server
npm run dev
# The API will be available at http://localhost:5000
```

### 6.3 Frontend Setup
```bash
cd ../frontend

# 1. Install dependencies
npm install

# 2. Configure environment (optional)
cp .env.example .env.local

# 3. Start Vite dev server
npm run dev
# The SPA will be available at http://localhost:5173
```

---

## 7. Environment Variables Configuration

### Backend (`backend/.env`)
| Variable | Default Value | Description |
| :--- | :--- | :--- |
| `PORT` | `5000` | HTTP port on which the Express API listens |
| `MONGODB_URI` | `mongodb://127.0.0.1:27017/forma_task6` | Persistent MongoDB connection string |
| `JWT_SECRET` | `forma_task6_jwt_secret_dev_only_change_in_production_2026` | Secret key used to sign and verify JWT tokens (must be $\ge 32$ chars in prod) |
| `JWT_EXPIRES_IN` | `1d` | Token expiration duration (e.g., `1d`, `12h`) |
| `CLIENT_URL` | `http://localhost:5173` | Allowed origin for CORS and CSRF verification |
| `NODE_ENV` | `development` | Environment mode (`development`, `production`, `test`) |
| `COOKIE_SECRET` | `forma_cookie_secret_dev_2026` | Secret key for signed cookie verification |

### Frontend (`frontend/.env.local`)
| Variable | Default Value | Description |
| :--- | :--- | :--- |
| `VITE_API_BASE_URL` | `http://localhost:5000/api` | Base URL for all backend API endpoints |

---

## 8. Pre-Configured Test Accounts

For evaluation and testing convenience, the following pre-seeded accounts are immediately available:

| Role | Email Address | Password | Permissions & Scope |
| :--- | :--- | :--- | :--- |
| **Admin** | `admin@forma.edu` | `AdminPassword2026!` | **System Administrator**: Full access to all student records across all owners, administrative overview, and seed reset controls. |
| **Student** | `alex.mercer@forma.edu` | `StudentPass2026!` | **Student User**: Cryptographically scoped to records created by this account (`STU-2026-001`). Forbidden from viewing or editing other users' records. |
| **Inactive** | `inactive@forma.edu` | `InactivePass2026!` | **Deactivated Account**: Used to verify that inactive accounts are rejected with `403 ACCOUNT_INACTIVE`. |

> **Evaluation Tip**: On the frontend Login page (`/login`), quick-fill buttons are provided to instantly populate the form with either the **Admin** or **Student** credentials with one click.

---

## 9. API Specification Summary

Complete, detailed payload and response contracts are documented in [`docs/API_SPECIFICATION.md`](docs/API_SPECIFICATION.md). Below is an overview:

| Method | Endpoint | Access | Required Role | Description |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/health` | Public | None | Server health, uptime, and database storage mode |
| `POST` | `/api/auth/register` | Public | None | Register new student user (auto-assigns `Student` role) |
| `POST` | `/api/auth/login` | Public | None | Authenticate credentials & issue HTTP-only JWT cookie |
| `GET` | `/api/auth/me` | Protected | Any | Retrieve safe profile of the authenticated user |
| `POST` | `/api/auth/logout` | Public | None | Clear authentication cookie and terminate session |
| `GET` | `/api/dashboard/stats` | Protected | Any | Retrieve dashboard KPIs (role-scoped to user records) |
| `GET` | `/api/dashboard/admin-overview` | Protected | `Admin` | System-wide statistics and audit telemetry |
| `GET` | `/api/students` | Protected | Any | List students with search, filters, pagination (role-scoped) |
| `GET` | `/api/students/:id` | Protected | Owner / Admin | Retrieve individual student record |
| `POST` | `/api/students` | Protected | Any | Create student record (server sets `createdBy = req.user.id`) |
| `PUT` | `/api/students/:id` | Protected | Owner / Admin | Update student record (ownership verified) |
| `DELETE` | `/api/students/:id` | Protected | Owner / Admin | Delete student record (ownership verified) |
| `POST` | `/api/students/reset-seed` | Protected | `Admin` | Reset student database to 10 academic seed records |

---

## 10. Role-Based Permissions & Data Ownership Matrix

| Capability | Administrator (`Admin`) | Student User (`Student`) |
| :--- | :---: | :---: |
| Register an account | Via Admin seed / direct | Self-service (`POST /api/auth/register`) |
| View own student records | Yes | Yes |
| View other users' student records | Yes (System-Wide) | **No** (`403 Forbidden`) |
| Create a student record | Yes | Yes (server assigns `createdBy = user.id`) |
| Edit own student records | Yes | Yes |
| Edit other users' student records | Yes | **No** (`403 Forbidden`) |
| Delete own student records | Yes | Yes (with confirmation dialog) |
| Delete other users' student records | Yes | **No** (`403 Forbidden`) |
| Access Admin Dashboard Overview | Yes | **No** (`403 Forbidden`) |
| Reset seed demo records | Yes | **No** (`403 Forbidden`) |
| View Creator Account Info in Table | Yes (`Created By` badge) | Hidden (irrelevant in scoped view) |

---

## 11. Automated Testing Instructions

Forma features an exhaustive test suite verifying every layer of the platform:

### 11.1 Run Backend Tests (99 tests)
```bash
cd backend
npm test -- --run
```
Covers:
- Mongoose schema constraints, pre-save hooks, and password hashing (`models.test.js`)
- JWT signing, expiration, and cookie option generation (`jwtAuth.test.js`)
- MongoDB connection lifecycle and in-memory fallback (`database.test.js`)
- Registration and login REST APIs with validation (`authApi.test.js`)
- Authentication middleware and route protection (`authenticateUser.test.js`)
- RBAC and resource ownership isolation (`authorization.test.js`)
- End-to-end security audit and injection defenses (`securityAndIntegration.test.js`)
- Server startup and health endpoint probes (`server.test.js`)

### 11.2 Run Frontend Tests (38 tests)
```bash
cd frontend
npm test -- --run
```
Covers:
- Login and registration form interactions, validation, password toggle, and quick-fill (`authPages.test.tsx`)
- Session hydration via `GET /api/auth/me`, public/protected route redirection, and 403 pages (`authRouting.test.tsx`)
- Student listing, search, multi-criteria filtering, add, edit, and delete flows (`studentsManagement.test.tsx`)
- Scaffolding and health status smoke testing (`smoke.test.tsx`)

### 11.3 Production Frontend Build
```bash
cd frontend
npm run build
```
Executes TypeScript type-checking (`tsc`) followed by Vite production bundling, generating optimized static assets in `dist/`.

---

## 12. Security Architecture Highlights

For an exhaustive breakdown, refer to [`docs/SECURITY_ARCHITECTURE.md`](docs/SECURITY_ARCHITECTURE.md).
- **Zero Token Leakage**: JWTs are strictly transported via secure HTTP-only cookies (`forma_token`). No tokens or passwords are ever stored in `localStorage` or `sessionStorage`.
- **Pre-Save Password Hashing**: Passwords are automatically hashed with `bcryptjs` (10 rounds) before persistence and protected from double-hashing.
- **Mass-Assignment Defense**: Client-supplied `createdBy` or `_id` parameters are unconditionally stripped; the server assigns ownership from the authenticated session.
- **NoSQL Injection & ReDoS Defense**: Search queries are sanitized through an `escapeRegex` utility; filter inputs have strict type guards.
- **CSRF Protection**: State-changing requests enforce origin and custom header verification (`X-Requested-With: XMLHttpRequest`).
- **Rate Limiting**: Brute-force attacks against `/api/auth/login` and `/api/auth/register` are throttled per IP.
- **Credential Masking**: Sensitive database connection strings are masked in console output and logs (`maskConnectionString`).

---

## 13. License & Internship Attribution

Developed for **Cognifyz IT Solutions – Web Development Internship**  
**Level 3, Task 6: Database Integration and User Authentication**  
*Forma – Student Intelligence Platform*
