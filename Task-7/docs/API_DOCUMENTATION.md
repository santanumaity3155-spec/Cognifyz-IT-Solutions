# Forma – Developer Intelligence Platform
## API Documentation & Reference Guide
> **Cognifyz Full Stack Web Development Internship**  
> **Level 4: Expert | Task 7: Advanced API Usage and External API Integration**  
> **Backend Service Base URL**: `http://localhost:5001/api`

---

## Table of Contents
1. [Overview & Standards](#1-overview--standards)
2. [Authentication & Session Headers](#2-authentication--session-headers)
3. [Rate Limiting Policies](#3-rate-limiting-policies)
4. [Standard Error Responses](#4-standard-error-responses)
5. [Health Check Endpoint](#5-health-check-endpoint)
6. [User Authentication Endpoints](#6-user-authentication-endpoints)
7. [GitHub OAuth 2.0 Endpoints](#7-github-oauth-20-endpoints)
8. [Developer Intelligence Data Endpoints](#8-developer-intelligence-data-endpoints)

---

## 1. Overview & Standards

All endpoints communicate over HTTP/REST using standard JSON payloads. The platform implements:
- **Consistent Response Formats**: Every response returns a standard JSON object containing `{ success: true, data: ... }` or `{ success: false, error: "CODE", message: "..." }`.
- **RFC 7807 Style Error Contracts**: Standardized error bodies with precise error codes.
- **RESTful Status Codes**: 200 (OK), 201 (Created), 400 (Bad Request), 401 (Unauthorized), 404 (Not Found), 429 (Too Many Requests), 500 (Internal Server Error), 502/503 (Upstream GitHub Error).

---

## 2. Authentication & Session Headers

User session management relies on secure, signed, HTTP-only cookies (`forma_token`) containing an encrypted JWT payload.
- **Cookie Name**: `forma_token`
- **Security Flags**: `httpOnly: true`, `secure: false` (in development; `true` in production), `sameSite: 'lax'`.
- **Fallback Bearer Header**: If cookies are blocked, requests may include `Authorization: Bearer <JWT_TOKEN>`.
- **Access Token Exposure**: GitHub access tokens are **never** returned in API responses. Tokens remain encrypted at rest using AES-256-GCM.

---

## 3. Rate Limiting Policies

The backend enforces three independent rate-limiting tiers via `express-rate-limit`:

| Limiter Tier | Applied Endpoints | Window | Max Requests | Response Headers |
| :--- | :--- | :--- | :--- | :--- |
| **General Limiter** | All `/api/*` endpoints | 15 minutes | 100 requests / IP | `RateLimit-Limit`, `RateLimit-Remaining`, `RateLimit-Reset` |
| **Auth Limiter** | `/api/auth/*`, `/api/github/connect` | 15 minutes | 25 requests / IP | `RateLimit-Limit`, `RateLimit-Remaining`, `RateLimit-Reset` |
| **GitHub Proxy Limiter** | `/api/github/profile`, `/api/github/repositories/*`, `/api/github/rate-limit` | 15 minutes | 60 requests / IP | `RateLimit-Limit`, `RateLimit-Remaining`, `RateLimit-Reset` |

### Rate Limit Exceeded Response (HTTP 429)
```json
{
  "success": false,
  "error": "RATE_LIMIT_EXCEEDED",
  "message": "Too many requests. Please try again after 15 minutes.",
  "retryAfter": 842
}
```

---

## 4. Standard Error Responses

When an error occurs, the API returns a structured JSON payload:
```json
{
  "success": false,
  "error": "INVALID_CREDENTIALS",
  "message": "Invalid email or password combination."
}
```

Common Error Codes:
- `VALIDATION_ERROR` (400): Request body or query parameters failed Zod schema validation.
- `UNAUTHORIZED` (401): Missing or expired user session cookie/token.
- `GITHUB_NOT_CONNECTED` (401): User has not linked a GitHub account.
- `OAUTH_CONFIG_REQUIRED` (503): GitHub OAuth client ID or secret missing in `.env`.
- `GITHUB_RATE_LIMIT_EXCEEDED` (429): Upstream GitHub REST API hourly limit reached.
- `GITHUB_UPSTREAM_UNAVAILABLE` (503): GitHub REST API returned persistent 502/503/504 errors.
- `ENDPOINT_NOT_FOUND` (404): Route does not exist.

---

## 5. Health Check Endpoint

### `GET /api/health`
Probes the operational status, database connectivity mode, and GitHub OAuth configuration status.

- **Authentication**: None (Public)
- **Rate Limit**: General Limiter (100 / 15 min)

#### Response `200 OK`
```json
{
  "success": true,
  "status": "UP",
  "timestamp": "2026-11-09T10:00:00.000Z",
  "level": "Level 4: Expert",
  "task": "Task 7: Advanced API Usage and External API Integration",
  "database": {
    "mode": "mongodb",
    "isPersistent": true,
    "databaseName": "forma_task7",
    "host": "localhost"
  },
  "oauth": {
    "configured": true,
    "maskedClientId": "Iv23****9aB"
  }
}
```

---

## 6. User Authentication Endpoints

### `POST /api/auth/register`
Creates a new student account in the Task-7 database (or in-memory store) and establishes a signed session cookie.

- **Authentication**: None
- **Rate Limit**: Auth Limiter (25 / 15 min)
- **Request Body**:
```json
{
  "name": "Jane Developer",
  "email": "jane@example.com",
  "password": "Password123!"
}
```
- **Response `201 Created`**:
```json
{
  "success": true,
  "message": "Student account registered successfully.",
  "data": {
    "user": {
      "id": "673010b9c0a1e4a1b8923a10",
      "name": "Jane Developer",
      "email": "jane@example.com",
      "role": "Student"
    }
  }
}
```

---

### `POST /api/auth/login`
Authenticates student credentials and issues a signed HTTP-only cookie.

- **Authentication**: None
- **Rate Limit**: Auth Limiter (25 / 15 min)
- **Request Body**:
```json
{
  "email": "jane@example.com",
  "password": "Password123!"
}
```
- **Response `200 OK`**:
```json
{
  "success": true,
  "message": "Login successful.",
  "data": {
    "user": {
      "id": "673010b9c0a1e4a1b8923a10",
      "name": "Jane Developer",
      "email": "jane@example.com",
      "role": "Student"
    }
  }
}
```

---

### `GET /api/auth/me`
Retrieves authenticated student profile details from the session cookie.

- **Authentication**: Required (`forma_token` cookie)
- **Rate Limit**: Auth Limiter (25 / 15 min)
- **Response `200 OK`**:
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "673010b9c0a1e4a1b8923a10",
      "name": "Jane Developer",
      "email": "jane@example.com",
      "role": "Student"
    }
  }
}
```

---

### `POST /api/auth/logout`
Clears the `forma_token` session cookie.

- **Authentication**: None
- **Response `200 OK`**:
```json
{
  "success": true,
  "message": "Signed out successfully."
}
```

---

## 7. GitHub OAuth 2.0 Endpoints

### `GET /api/github/connect`
Initiates the OAuth 2.0 Authorization Code flow.
1. Generates a cryptographically random 32-byte (64 hex char) state nonce using `crypto.randomBytes(32)`.
2. Stores the nonce in `oauthStateStore` with a 10-minute TTL.
3. Sets a signed, HTTP-only, SameSite cookie (`github_oauth_state`).
4. Returns the GitHub authorization URL requesting minimal scope (`read:user`).

- **Authentication**: Required (`forma_token` cookie)
- **Rate Limit**: Auth Limiter (25 / 15 min)
- **Response `200 OK`**:
```json
{
  "success": true,
  "data": {
    "authorizationUrl": "https://github.com/login/oauth/authorize?client_id=Iv23...&redirect_uri=http%3A%2F%2Flocalhost%3A5001%2Fapi%2Fgithub%2Fcallback&scope=read%3Auser&state=a1b2c3d4..."
  }
}
```

---

### `GET /api/github/callback`
Handles GitHub's redirect after the user authorizes access.
1. Validates the `state` query parameter against the stored nonce and signed cookie.
2. Consumes the state nonce immediately (single-use enforcement).
3. Exchanges authorization `code` with GitHub for an OAuth access token.
4. Retrieves user's public profile from GitHub to capture login and identity.
5. Encrypts the OAuth access token at rest using **AES-256-GCM**.
6. Stores the encrypted token in the student's database record.
7. Redirects the browser back to frontend `/github/callback?status=success&username=<login>`.

- **Query Parameters**:
  - `code`: Temporary authorization code provided by GitHub.
  - `state`: 64-hex-character CSRF verification nonce.
- **Authentication**: State cookie verification.
- **Redirect Response `302 Found`**:
  - On Success: `http://localhost:5174/github/callback?status=success&username=octocat`
  - On Failure: `http://localhost:5174/github/callback?status=error&error=STATE_MISMATCH`

---

### `GET /api/github/status`
Checks whether the authenticated user has an active, linked GitHub connection.

- **Authentication**: Required
- **Response `200 OK` (Connected)**:
```json
{
  "success": true,
  "connected": true,
  "oauthConfigured": true,
  "data": {
    "username": "octocat",
    "avatarUrl": "https://avatars.githubusercontent.com/u/583231?v=4",
    "profileUrl": "https://github.com/octocat",
    "scopes": ["read:user"],
    "connectedAt": "2026-11-09T08:30:00.000Z"
  }
}
```
- **Response `200 OK` (Not Connected)**:
```json
{
  "success": true,
  "connected": false,
  "oauthConfigured": true,
  "message": "No GitHub account is currently connected to this profile."
}
```

---

### `DELETE /api/github/disconnect`
Securely revokes platform access:
1. Deletes the encrypted access token from database storage.
2. Purges all in-memory cached profile, repository, and language entries for the user.
3. Resets connection metadata.

- **Authentication**: Required
- **Response `200 OK`**:
```json
{
  "success": true,
  "message": "GitHub account disconnected successfully."
}
```

---

## 8. Developer Intelligence Data Endpoints

All data endpoints require user authentication and an active GitHub connection. Upstream requests decrypt tokens in memory, proxy directly to GitHub REST API with retries and exponential backoff, and cache clean normalized responses in memory for 5 minutes.

### `GET /api/github/profile`
Fetches the authenticated user's normalized GitHub profile telemetry.

- **Authentication**: Required
- **Rate Limit**: GitHub Proxy Limiter (60 / 15 min)
- **Query Parameters**:
  - `refresh` (optional): `true` to bypass in-memory TTL cache and query GitHub upstream directly.
- **Response `200 OK`**:
```json
{
  "success": true,
  "message": "GitHub profile retrieved successfully.",
  "isCached": true,
  "cachedAt": "2026-11-09T10:15:00.000Z",
  "data": {
    "profile": {
      "id": 583231,
      "login": "octocat",
      "name": "The Octocat",
      "avatarUrl": "https://avatars.githubusercontent.com/u/583231?v=4",
      "profileUrl": "https://github.com/octocat",
      "bio": "GitHub mascot and developer advocate",
      "company": "GitHub Inc.",
      "location": "San Francisco",
      "blog": "https://github.blog",
      "twitterUsername": "github",
      "publicRepos": 8,
      "publicGists": 4,
      "followers": 9500,
      "following": 9,
      "createdAt": "2011-01-25T18:44:36Z",
      "updatedAt": "2026-10-10T12:00:00Z"
    },
    "rateLimit": {
      "limit": 5000,
      "remaining": 4982,
      "used": 18,
      "resetTime": 1770003600,
      "resetDate": "2026-11-09T11:00:00.000Z",
      "resetInSeconds": 3340
    }
  }
}
```

---

### `GET /api/github/repositories`
Retrieves public repositories with server-side pagination, sorting, and type filtering.

- **Authentication**: Required
- **Rate Limit**: GitHub Proxy Limiter (60 / 15 min)
- **Query Parameters**:
  - `page` (optional, default: `1`): Positive integer.
  - `per_page` (optional, default: `20`, max: `100`): Results per page.
  - `sort` (optional, default: `updated`): `created`, `updated`, `pushed`, `full_name`.
  - `direction` (optional, default: `desc`): `asc` or `desc`.
  - `type` (optional, default: `all`): `all`, `owner`, `public`, `private`, `member`.
  - `refresh` (optional): `true` to force upstream query.
- **Response `200 OK`**:
```json
{
  "success": true,
  "isCached": false,
  "data": {
    "repositories": [
      {
        "id": 1296269,
        "name": "Hello-World",
        "fullName": "octocat/Hello-World",
        "description": "My first repository on GitHub!",
        "isPrivate": false,
        "isFork": false,
        "htmlUrl": "https://github.com/octocat/Hello-World",
        "cloneUrl": "https://github.com/octocat/Hello-World.git",
        "language": "C",
        "starsCount": 2400,
        "forksCount": 1800,
        "openIssuesCount": 22,
        "watchersCount": 2400,
        "defaultBranch": "master",
        "topics": ["beginner", "hello-world"],
        "license": {
          "key": "mit",
          "name": "MIT License",
          "spdxId": "MIT"
        },
        "createdAt": "2011-01-26T19:01:12Z",
        "updatedAt": "2026-10-15T08:22:10Z",
        "pushedAt": "2026-10-14T19:40:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "perPage": 20,
      "hasNextPage": false,
      "hasPrevPage": false
    },
    "rateLimit": {
      "limit": 5000,
      "remaining": 4981,
      "used": 19,
      "resetTime": 1770003600,
      "resetDate": "2026-11-09T11:00:00.000Z",
      "resetInSeconds": 3338
    }
  }
}
```

---

### `GET /api/github/repositories/:owner/:repo`
Fetches in-depth telemetry for a specific repository.

- **Authentication**: Required
- **Parameters**:
  - `owner`: GitHub repository owner username or organization.
  - `repo`: Repository name.
- **Query Parameters**:
  - `refresh` (optional): `true` to bypass cache.
- **Response `200 OK`**:
```json
{
  "success": true,
  "data": {
    "repository": {
      "id": 1296269,
      "name": "Hello-World",
      "fullName": "octocat/Hello-World",
      "description": "My first repository on GitHub!",
      "isPrivate": false,
      "isFork": false,
      "htmlUrl": "https://github.com/octocat/Hello-World",
      "cloneUrl": "https://github.com/octocat/Hello-World.git",
      "language": "C",
      "starsCount": 2400,
      "forksCount": 1800,
      "openIssuesCount": 22,
      "watchersCount": 2400,
      "defaultBranch": "master",
      "topics": ["beginner", "hello-world"],
      "license": {
        "key": "mit",
        "name": "MIT License",
        "spdxId": "MIT"
      },
      "createdAt": "2011-01-26T19:01:12Z",
      "updatedAt": "2026-10-15T08:22:10Z",
      "pushedAt": "2026-10-14T19:40:00Z"
    },
    "rateLimit": {
      "limit": 5000,
      "remaining": 4980,
      "used": 20,
      "resetTime": 1770003600,
      "resetDate": "2026-11-09T11:00:00.000Z",
      "resetInSeconds": 3336
    }
  }
}
```

---

### `GET /api/github/repositories/:owner/:repo/languages`
Retrieves programming language byte distribution and computes accurate percentage shares.

- **Authentication**: Required
- **Parameters**:
  - `owner`: Repository owner.
  - `repo`: Repository name.
- **Response `200 OK`**:
```json
{
  "success": true,
  "data": {
    "totalBytes": 50000,
    "languages": [
      {
        "language": "TypeScript",
        "bytes": 35000,
        "percentage": 70.0
      },
      {
        "language": "CSS",
        "bytes": 15000,
        "percentage": 30.0
      }
    ],
    "rateLimit": {
      "limit": 5000,
      "remaining": 4979,
      "used": 21,
      "resetTime": 1770003600,
      "resetDate": "2026-11-09T11:00:00.000Z",
      "resetInSeconds": 3334
    }
  }
}
```

---

### `GET /api/github/rate-limit`
Directly probes GitHub's authenticated rate limit allowance for the user's token.

- **Authentication**: Required
- **Rate Limit**: GitHub Proxy Limiter (60 / 15 min)
- **Response `200 OK`**:
```json
{
  "success": true,
  "data": {
    "rateLimit": {
      "limit": 5000,
      "remaining": 4978,
      "used": 22,
      "resetTime": 1770003600,
      "resetDate": "2026-11-09T11:00:00.000Z",
      "resetInSeconds": 3332
    }
  }
}
```

