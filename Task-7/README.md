# Forma – Student Intelligence Platform
## Developer Intelligence Module
> **Cognifyz IT Solutions – Web Development Internship**  
> **Level 4: Expert | Task 7: Advanced API Usage and External API Integration**  
> *A full-stack, enterprise-grade GitHub Developer Intelligence module built with Node.js, Express, MongoDB/In-Memory fallback, GitHub OAuth 2.0, GitHub REST API, React 18, TypeScript, Tailwind CSS, and Axios.*

---

## 1. Project Overview

**Forma Developer Intelligence Module** is built to fulfill all three core requirements of Level 4: Expert – Task 7:
1. **OAuth 2.0 for Secure API Authentication**: Cryptographically validated state parameter for CSRF prevention, backend Authorization Code exchange, and AES-256-GCM token encryption at rest with zero exposure to frontend JavaScript.
2. **External API Integration**: Live GitHub REST API communication for user profiles, public repositories, and language byte statistics with retry, backoff, and timeouts.
3. **Advanced API Features**: Tiered express rate-limiting, in-memory TTL caching with cache-invalidation support, standardized HTTP status code mapping, and reliable external API communication.

---

## 2. Ports and Architecture

- **Backend**: `http://localhost:5001` (API endpoints under `/api/*`)
- **Frontend**: `http://localhost:5174` (Vite development server)
- **Isolation**: Entirely self-contained in `Task-7`, strictly preserving Tasks 1–6.

