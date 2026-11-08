# Forma – Student Intelligence Platform
> **Cognifyz IT Solutions – Web Development Internship**  
> **Level 3: Advanced | Task 6: Database Integration and User Authentication**  
> *A full-stack, enterprise-grade Student Management & Intelligence Platform built with Node.js, Express, MongoDB (Mongoose), JWT & bcrypt, React 18, TypeScript, Tailwind CSS, and Axios.*

---

## Task 6 Status: Phase 2 Completed (Scaffolding)

### 1. Official Task Requirements
1. **Database Integration**: Store and retrieve form data using MongoDB with Mongoose models (`User` and `Student`), strict schema validation, unique indexes, and document relationships (`createdBy: ObjectId`).
2. **User Authentication**: Implement complete server-side authentication (`/api/auth/register`, `/api/auth/login`, `/api/auth/me`, `/api/auth/logout`) using bcryptjs password hashing and signed JSON Web Tokens (JWT) transported via secure HTTP-only cookies and Authorization headers.
3. **API Authorization Checks**: Enforce role-based access control (`Admin` vs. `Student`) and granular resource ownership checks on all Student CRUD endpoints.

---

## 2. Directory Structure Overview
- `backend/`: Express.js REST API with Mongoose, JWT, bcryptjs, Helmet, and CORS.
- `frontend/`: React 18 SPA with TypeScript, Vite, Tailwind CSS, React Router DOM, and Axios.
- `docs/`: Technical documentation covering API specifications, schema design, and authentication flows.

