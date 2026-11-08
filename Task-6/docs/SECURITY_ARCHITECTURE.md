# Forma – Security Architecture & Defense In Depth
> **Level 3, Task 6: Database Integration and User Authentication**

---

## 1. Authentication Security

### 1.1 Password Hashing & Salt Rounds
- Passwords are never stored in plaintext.
- The `User` Mongoose model uses `bcryptjs` with 10 salt rounds executed via an asynchronous pre-save lifecycle hook.
- Double-hashing defense: Passwords matching bcrypt signatures (`/^\$2[aby]\$\d{2}\$/`) are detected and protected from re-hashing.
- Model projection: `password` has `select: false` on the schema, ensuring normal queries (`find`, `findOne`, `findById`) never include password hashes. JSON serialization (`toSafeObject()`) strictly omits `password`.

### 1.2 RFC 7519 JSON Web Tokens (JWT)
- Tokens are digitally signed using HMAC-SHA256 (`HS256`) with a production-validated secret (`JWT_SECRET`).
- Payload contains minimal, safe claims:
  - `userId`: MongoDB ObjectId string
  - `email`: Normalized user email
  - `role`: `'Admin' | 'Student'`
- Expiration (`JWT_EXPIRES_IN`) is strictly enforced; expired tokens fail signature verification with an immediate `401 Unauthorized` response.

### 1.3 Transport Security: HTTP-Only Cookie Architecture
- The authentication token is transported via the `forma_token` cookie.
- Flags:
  - `httpOnly: true`: Prevents frontend JavaScript (`document.cookie`) from accessing or reading the token, eliminating XSS token theft.
  - `sameSite: 'lax'` (development) / `'strict'` (production): Protects against cross-site leakage.
  - `secure: true` in production (enforces HTTPS).
  - `path: '/'`: Available across all application routes.

---

## 2. Authorization & Data Isolation (RBAC)

### 2.1 Role-Based Access Control (`authorizeRoles`)
- Two distinct roles:
  1. `Admin`: System administrator with unrestricted management access.
  2. `Student`: Individual student account with resource-level isolation.
- Route gating middleware `authorizeRoles(...roles)` verifies the user's role and returns `403 FORBIDDEN_ROLE` if unauthorized.
- Public registration strictly enforces `role = 'Student'` on the server; client-supplied `role` values are unconditionally discarded.

### 2.2 Resource Ownership Protection (`verifyResourceOwnership`)
- For all single-record operations (`GET /api/students/:id`, `PUT /api/students/:id`, `DELETE /api/students/:id`):
  - If `user.role === 'Admin'`: Access is granted.
  - If `user.role === 'Student'`: The record's `createdBy` ObjectId is checked against `req.user.id`. If they differ, the request is immediately rejected with `403 FORBIDDEN_RESOURCE`.
- For list queries (`GET /api/students`):
  - Students automatically have their database query constrained to `{ createdBy: req.user.id }`.
- Mass-assignment defense:
  - When creating a student, `createdBy` is set directly from `req.user.id`.
  - When updating a student, `createdBy` and `studentId` are stripped from the payload, preventing ownership transfers.

---

## 3. Defense In Depth & Hardening

### 3.1 CSRF Protection
- Cookie-authenticated state-changing requests (`POST`, `PUT`, `DELETE`) require custom CORS headers (`X-Requested-With: XMLHttpRequest`) or origin validation against `CLIENT_URL`. Browsers disallow unauthorized cross-origin requests from injecting custom headers without CORS preflight clearance.

### 3.2 NoSQL Injection & ReDoS Defenses
- Regex special characters in search inputs are escaped via `escapeRegex` (`[.*+?^${}()|[\]\\]`) to prevent regular expression denial of service.
- Query parameters (`email`, `course`, `academicYear`, `status`) have strict string type guards preventing NoSQL operator injection (`{ $ne: null }`).
- Sorting is constrained to an allowlist: `ALLOWED_SORT_FIELDS`.

### 3.3 Rate Limiting
- `express-rate-limit` throttles repeated requests:
  - Registration: 10 requests / 15 minutes per IP.
  - Login: 15 requests / 15 minutes per IP (defends against brute-force credential stuffing).

### 3.4 HTTP Security Headers
- `helmet` is active on all endpoints, configuring `X-Content-Type-Options: nosniff`, `X-Frame-Options: SAMEORIGIN`, and strict referer policies.

### 3.5 Sensitive Data Redaction
- Connection strings with embedded credentials are masked via `maskConnectionString` before output to console or logs (`mongodb://user:****@host...`).
- Internal stack traces are suppressed in production mode (`NODE_ENV === 'production'`).

