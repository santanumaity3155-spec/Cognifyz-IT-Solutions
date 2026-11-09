# GitHub OAuth 2.0 Setup & Integration Guide
## Forma – Developer Intelligence Platform
> **Cognifyz Full Stack Web Development Internship**  
> **Level 4: Expert | Task 7: Advanced API Usage and External API Integration**  

---

## 1. OAuth 2.0 Architecture Overview

The Forma platform implements the **OAuth 2.0 Authorization Code Grant Flow** to securely integrate with the GitHub REST API. 

### Core Security Design
- **Least-Privilege Scope**: Requests only `read:user` (read-only access to user profile and public repositories). No destructive, private repository, or organization write permissions are ever requested.
- **CSRF State Nonce**: Generates a 32-byte (64 hex characters) cryptographically secure random token using `crypto.randomBytes(32)` on each authorization attempt.
- **Single-Use Enforcement**: Nonce is consumed immediately upon validation during callback; replay attempts are rejected.
- **Dual-State Validation**: Validates both the stored in-memory state and a signed, HTTP-only, SameSite state cookie (`github_oauth_state`).
- **AES-256-GCM Encryption at Rest**: GitHub access tokens are encrypted using AES-256-GCM before writing to MongoDB (or the in-memory fallback store). Tokens are **never** returned to the browser or logged.

---

## 2. GitHub OAuth App Creation Walkthrough

Follow these steps to register your OAuth application with GitHub:

### Step 1: Open GitHub Developer Settings
1. Log in to your GitHub account at [github.com](https://github.com).
2. Go to **Settings** -> **Developer settings** -> **OAuth Apps**  
   Direct link: [https://github.com/settings/developers](https://github.com/settings/developers)
3. Click the **New OAuth App** button (or **Register a new application**).

### Step 2: Register the Application
Fill in the application registration form with the following exact values:

| Field | Configuration Value | Description |
| :--- | :--- | :--- |
| **Application name** | `Forma Developer Intelligence Platform` | User-facing title shown during authorization |
| **Homepage URL** | `http://localhost:5174` | Forma frontend Vite development server URL |
| **Application description** | `Developer Intelligence and External API Integration Module for Cognifyz Level 4: Expert Task 7.` | Optional app description |
| **Authorization callback URL** | `http://localhost:5001/api/github/callback` | **CRITICAL**: The backend route that receives authorization codes |

> [!IMPORTANT]
> The **Authorization callback URL** must be `http://localhost:5001/api/github/callback`.  
> If there is a typo or trailing slash mismatch, GitHub will reject authorization with a `redirect_uri_mismatch` error.

### Step 3: Generate Client Secret
1. Click **Register application**.
2. Copy your **Client ID** (displayed under the application title, e.g. `Iv23...`).
3. Click **Generate a new client secret**.
4. Copy the newly generated **Client Secret** immediately. (GitHub will only display it once).

---

## 3. Configuring Backend Environment

Add your credentials to `Task-7/backend/.env`:

```env
# GitHub OAuth 2.0 Credentials
GITHUB_CLIENT_ID=your_github_client_id_here
GITHUB_CLIENT_SECRET=your_github_client_secret_here
GITHUB_CALLBACK_URL=http://localhost:5001/api/github/callback
```

> [!CAUTION]
> Never commit real GitHub OAuth Client Secrets or `.env` files to Git. The `.gitignore` files in `Task-7/` and `Task-7/backend/` strictly exclude all `.env` files.

---

## 4. End-to-End Authorization Sequence Flow

```mermaid
sequenceDiagram
    autonumber
    actor Developer as Authenticated Student
    participant Browser as Forma Frontend (React)
    participant Backend as Forma Backend (Express)
    participant GitHub as GitHub OAuth Server
    participant GitHubAPI as GitHub REST API

    Developer->>Browser: Clicks "Connect GitHub"
    Browser->>Backend: GET /api/github/connect (with forma_token cookie)
    Backend->>Backend: Generate crypto.randomBytes(32) state nonce
    Backend->>Backend: Store state in oauthStateStore (10m TTL)
    Backend->>Browser: Set signed cookie github_oauth_state & return Auth URL
    Browser->>GitHub: Redirect to GitHub authorization screen
    Developer->>GitHub: Authorizes "Forma Developer Intelligence Platform"
    GitHub->>Backend: Redirect GET /api/github/callback?code=CODE&state=STATE
    Backend->>Backend: Validate state vs cookie & memory; consume state
    Backend->>GitHub: POST https://github.com/login/oauth/access_token
    GitHub-->>Backend: Returns access_token, token_type, scope: "read:user"
    Backend->>GitHubAPI: GET https://api.github.com/user (Authorization: Bearer)
    GitHubAPI-->>Backend: Returns user identity (@username, avatarUrl)
    Backend->>Backend: Encrypt token with AES-256-GCM (random 12-byte IV)
    Backend->>Backend: Store encrypted token in User record
    Backend-->>Browser: Redirect /github/callback?status=success&username=octocat
    Browser->>Backend: GET /api/github/status
    Backend-->>Browser: { connected: true, username: "octocat" }
```

---

## 5. Troubleshooting & Common OAuth Errors

| Symptom / Error | Root Cause | Remediation |
| :--- | :--- | :--- |
| **`redirect_uri_mismatch`** | The callback URL configured on GitHub does not match `http://localhost:5001/api/github/callback`. | Go to GitHub OAuth App settings and verify the Authorization callback URL matches character-for-character. |
| **`bad_verification_code`** | The authorization code expired or was used more than once. | Initiate connection again by clicking "Connect GitHub" in the dashboard. |
| **`STATE_MISMATCH` / CSRF Rejection** | The returned `state` parameter did not match the browser cookie or was already consumed. | Ensure third-party cookies or strict browser privacy extensions allow cookies on localhost. Click "Connect GitHub" fresh. |
| **`OAUTH_CONFIG_REQUIRED` (503)** | `GITHUB_CLIENT_ID` or `GITHUB_CLIENT_SECRET` is missing in `backend/.env`. | Populate the environment variables in `Task-7/backend/.env` and restart the backend server. |
| **User Authorization Denied** | The user clicked "Cancel" on GitHub's authorization consent page. | Backend redirects to `/github/callback?status=error&error=access_denied`. Return to dashboard to retry when ready. |

