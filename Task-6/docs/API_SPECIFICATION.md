# Forma – API Specification & Contract
> **Level 3, Task 6: Database Integration and User Authentication**  
> Base URL: `http://localhost:5000/api`

---

## 1. Authentication Endpoints (`/api/auth`)

### 1.1 User Registration
- **Method & Route**: `POST /api/auth/register`
- **Access**: Public
- **Rate Limit**: 10 requests / 15 minutes per IP
- **Description**: Registers a new Student user account. Passwords are validated for complexity and securely hashed with bcryptjs (salt rounds: 10). Public registration automatically assigns the `Student` role; client-supplied `role` values are stripped to prevent privilege escalation.
- **Request Body**:
  ```json
  {
    "name": "Alex Rivera",
    "email": "alex.rivera@forma.edu",
    "password": "StrongPassword2026!"
  }
  ```
- **Success Response (`201 Created`)**:
  ```json
  {
    "success": true,
    "message": "User registered successfully",
    "data": {
      "user": {
        "id": "672e00000000000000000004",
        "name": "Alex Rivera",
        "email": "alex.rivera@forma.edu",
        "role": "Student",
        "isActive": true,
        "createdAt": "2026-11-08T15:00:00.000Z"
      },
      "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
    }
  }
  ```
- **Cookie Set**: `forma_token=<jwt>; HttpOnly; SameSite=Lax; Path=/`
- **Error Responses**:
  - `400 Bad Request`: Validation failure (name < 2 chars, invalid email, weak password).
  - `409 Conflict`: Email address already registered.

---

### 1.2 User Login
- **Method & Route**: `POST /api/auth/login`
- **Access**: Public
- **Rate Limit**: 15 requests / 15 minutes per IP
- **Description**: Authenticates user credentials using bcrypt comparison, verifies active account status, issues a signed JWT, and sets an HTTP-only authentication cookie (`forma_token`).
- **Request Body**:
  ```json
  {
    "email": "alex.mercer@forma.edu",
    "password": "StudentPass2026!"
  }
  ```
- **Success Response (`200 OK`)**:
  ```json
  {
    "success": true,
    "message": "Login successful",
    "data": {
      "user": {
        "id": "672e00000000000000000002",
        "name": "Alex Mercer (Student)",
        "email": "alex.mercer@forma.edu",
        "role": "Student",
        "isActive": true
      },
      "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
    }
  }
  ```
- **Cookie Set**: `forma_token=<jwt>; HttpOnly; SameSite=Lax; Path=/`
- **Error Responses**:
  - `400 Bad Request`: Missing email or password.
  - `401 Unauthorized`: Invalid email or password (generic message to avoid enumeration).
  - `403 Forbidden`: Account is inactive (`isActive: false`).

---

### 1.3 Active Profile Retrieval
- **Method & Route**: `GET /api/auth/me`
- **Access**: Protected (`authenticateUser` middleware)
- **Description**: Verifies session from HTTP-only cookie, retrieves current authenticated user profile from database, and returns safe attributes.
- **Success Response (`200 OK`)**:
  ```json
  {
    "success": true,
    "message": "Profile retrieved successfully",
    "data": {
      "user": {
        "id": "672e00000000000000000002",
        "name": "Alex Mercer (Student)",
        "email": "alex.mercer@forma.edu",
        "role": "Student",
        "isActive": true
      }
    }
  }
  ```
- **Error Responses**:
  - `401 Unauthorized`: Token missing, expired, or invalid.

---

### 1.4 User Logout
- **Method & Route**: `POST /api/auth/logout`
- **Access**: Public
- **Description**: Clears the `forma_token` HTTP-only cookie by setting expiration to the UNIX epoch (`Thu, 01 Jan 1970 00:00:00 GMT`).
- **Success Response (`200 OK`)**:
  ```json
  {
    "success": true,
    "message": "Logged out successfully"
  }
  ```

---

## 2. Student Management Endpoints (`/api/students`)

All `/api/students` endpoints require active authentication via `authenticateUser`.

### 2.1 List Students
- **Method & Route**: `GET /api/students`
- **Access**: Protected
- **Role Scope**:
  - **Admin**: Returns all student records across all creators in the database.
  - **Student**: Query is automatically scoped to `createdBy == req.user.id`.
- **Query Parameters**:
  - `search` (string): Text search across name, email, student ID, course, college.
  - `course` (string): Filter by degree course (`All`, `Computer Science`, etc.).
  - `academicYear` (string): Filter by academic year.
  - `status` (string): Filter by registration status (`Active`, `Pending`, etc.).
  - `page` (number, default: 1): Page number.
  - `limit` (number, default: 10): Items per page.
  - `sortBy` (string, default: `createdAt`): Whitelisted sort field.
  - `sortOrder` (`asc` | `desc`, default: `desc`): Sort direction.
- **Success Response (`200 OK`)**:
  ```json
  {
    "success": true,
    "message": "Students retrieved successfully",
    "data": [
      {
        "_id": "672e00000000000000000010",
        "studentId": "STU-2026-001",
        "fullName": "David Miller",
        "email": "david.miller@example.com",
        "phone": "+1 555-123-4567",
        "dateOfBirth": "2002-05-14",
        "gender": "Male",
        "collegeName": "Cognifyz Institute of Technology",
        "course": "Computer Science",
        "academicYear": "3rd Year",
        "skills": ["React", "Node.js", "MongoDB"],
        "registrationStatus": "Active",
        "createdBy": {
          "_id": "672e00000000000000000002",
          "name": "Alex Mercer",
          "email": "alex.mercer@forma.edu",
          "role": "Student"
        },
        "createdAt": "2026-11-08T10:00:00.000Z",
        "updatedAt": "2026-11-08T10:00:00.000Z"
      }
    ],
    "total": 1,
    "count": 1,
    "pagination": {
      "page": 1,
      "limit": 10,
      "totalPages": 1
    }
  }
  ```

---

### 2.2 Get Single Student Record
- **Method & Route**: `GET /api/students/:id`
- **Access**: Protected (`verifyResourceOwnership` middleware)
- **Role Scope**:
  - **Admin**: Can view any student record.
  - **Student**: Allowed only if `record.createdBy == req.user.id`.
- **Success Response (`200 OK`)**:
  ```json
  {
    "success": true,
    "message": "Student retrieved successfully",
    "data": { ...studentObject }
  }
  ```
- **Error Responses**:
  - `403 Forbidden`: `FORBIDDEN_RESOURCE` if a Student attempts to view another user's student record.
  - `404 Not Found`: Student record does not exist.

---

### 2.3 Create Student Record
- **Method & Route**: `POST /api/students`
- **Access**: Protected (`csrfProtection` middleware)
- **Security**: The server unconditionally overrides/assigns `createdBy = req.user.id`. Any client-supplied `createdBy` or `_id` is discarded.
- **Request Body**:
  ```json
  {
    "fullName": "Elena Rostova",
    "email": "elena.rostova@example.com",
    "phone": "+1 555-987-6543",
    "dateOfBirth": "2003-09-22",
    "gender": "Female",
    "collegeName": "Cognifyz Institute of Technology",
    "course": "Data Science",
    "academicYear": "2nd Year",
    "skills": ["Python", "Pandas", "PyTorch"],
    "registrationStatus": "Active"
  }
  ```
- **Success Response (`201 Created`)**:
  ```json
  {
    "success": true,
    "message": "Student record created successfully",
    "data": { ...newStudentObject }
  }
  ```
- **Error Responses**:
  - `400 Bad Request`: Missing or invalid fields.
  - `409 Conflict`: Duplicate email or student ID.

---

### 2.4 Update Student Record
- **Method & Route**: `PUT /api/students/:id`
- **Access**: Protected (`csrfProtection`, `verifyResourceOwnership` middleware)
- **Security**: Students can only update their own records. Ownership (`createdBy`) and `studentId` are immutable.
- **Request Body**:
  ```json
  {
    "phone": "+1 555-999-0000",
    "academicYear": "3rd Year",
    "skills": ["Python", "Pandas", "PyTorch", "FastAPI"]
  }
  ```
- **Success Response (`200 OK`)**:
  ```json
  {
    "success": true,
    "message": "Student record updated successfully",
    "data": { ...updatedStudentObject }
  }
  ```
- **Error Responses**:
  - `403 Forbidden`: Student attempting to modify another user's record.
  - `404 Not Found`: Record not found.

---

### 2.5 Delete Student Record
- **Method & Route**: `DELETE /api/students/:id`
- **Access**: Protected (`csrfProtection`, `verifyResourceOwnership` middleware)
- **Role Scope**:
  - **Admin**: Can delete any record.
  - **Student**: Can delete only records they created.
- **Success Response (`200 OK`)**:
  ```json
  {
    "success": true,
    "message": "Student record deleted successfully",
    "data": { ...deletedStudentObject }
  }
  ```
- **Error Responses**:
  - `403 Forbidden`: Student attempting to delete another user's record.
  - `404 Not Found`: Record not found.

---

### 2.6 Reset Seed Records (Admin Only)
- **Method & Route**: `POST /api/students/reset-seed`
- **Access**: Admin only (`authorizeRoles('Admin')`, `csrfProtection` middleware)
- **Description**: Re-seeds the database with the initial 10 academic demo profiles.
- **Success Response (`200 OK`)**:
  ```json
  {
    "success": true,
    "message": "Student seed data reset successfully."
  }
  ```
- **Error Responses**:
  - `403 Forbidden`: Student attempting admin-only reset.

---

## 3. Dashboard Endpoints (`/api/dashboard`)

### 3.1 Role-Scoped Dashboard Statistics
- **Method & Route**: `GET /api/dashboard/stats`
- **Access**: Protected
- **Description**: Returns KPI analytics. For Students, metrics are scoped strictly to their owned records; for Admins, metrics reflect global system-wide aggregates.
- **Success Response (`200 OK`)**:
  ```json
  {
    "success": true,
    "message": "Analytics retrieved successfully",
    "data": {
      "totalStudents": 10,
      "activeStudents": 7,
      "pendingStudents": 2,
      "graduatedStudents": 1,
      "totalCourses": 4,
      "scope": "global",
      "courseDistribution": [
        { "course": "Computer Science", "count": 4, "percentage": 40 },
        { "course": "Data Science", "count": 3, "percentage": 30 }
      ]
    }
  }
  ```

---

### 3.2 Administrative Overview (Admin Only)
- **Method & Route**: `GET /api/dashboard/admin-overview`
- **Access**: Admin only (`authorizeRoles('Admin')` middleware)
- **Description**: System-wide telemetry and audit metadata.
- **Success Response (`200 OK`)**:
  ```json
  {
    "success": true,
    "message": "Administrative overview retrieved successfully",
    "data": {
      "totalStudents": 10,
      "activeStudents": 7,
      "scope": "administrative",
      "audit": {
        "requestedBy": "admin@forma.edu",
        "timestamp": "2026-11-08T15:00:00.000Z"
      }
    }
  }
  ```

---

## 4. System Health Endpoint (`/api/health`)
- **Method & Route**: `GET /api/health`
- **Access**: Public
- **Description**: Returns live server uptime, environment mode, and database connection state (identifies active MongoDB vs. in-memory fallback store).
- **Success Response (`200 OK`)**:
  ```json
  {
    "status": "healthy",
    "service": "forma-task6-backend",
    "task": "Task-6: Database Integration and User Authentication",
    "database": {
      "mode": "in-memory-fallback",
      "state": "error",
      "isPersistent": false
    },
    "timestamp": "2026-11-08T15:00:00.000Z"
  }
  ```

