# Forma — Student Intelligence

**Cognifyz Full Stack Internship — Task 1: HTML Structure and Basic Server Interaction**

A premium, portfolio-quality Student Management Platform built with Node.js, Express.js, and EJS server-side rendering.

## 📋 Task 1 Requirements — Implementation Map

| # | Requirement | Implementation | File |
|---|-------------|----------------|------|
| 1 | Semantic HTML structure with forms | `<form>`, `<label>`, `<input type="email">`, `<select>`, `<button type="submit">` | `views/index.ejs` |
| 2 | Node.js server using Express | Express app with middleware, routing, and server startup | `app.js` |
| 3 | Server-side endpoints for form submissions | `POST /register` handles form data | `app.js` |
| 4 | Server-side rendering with EJS | All pages rendered via `res.render()` with EJS templates | `app.js`, `views/` |

## 🚀 Quick Start (Windows PowerShell)

### 1. Create the project directory
```powershell
mkdir "d:\New Project\Cognifyz\Cognifyz-IT-Solutions\Task-1"
cd "d:\New Project\Cognifyz\Cognifyz-IT-Solutions\Task-1"
```

### 2. Initialize npm and install dependencies
```powershell
npm init -y
npm install express ejs
```

> The `package.json` is already included with the project. If starting fresh, the above commands create it automatically.

### 3. Start the server
```powershell
npm start
```

## 📁 Project Structure

```
Task-1/
├── app.js                  # Express server: routes, validation, in-memory store, EJS config
├── package.json            # Dependencies: express, ejs; scripts: start
├── .env.example            # PORT configuration example
├── .gitignore              # node_modules, .env, OS/IDE files
├── README.md               # This file
├── views/
│   ├── index.ejs           # Registration / landing page with form
│   ├── success.ejs         # Registration success page (HTTP 201)
│   ├── students.ejs        # Student records listing + empty state
│   ├── 404.ejs             # Page not found
│   └── partials/
│       ├── head.ejs        # HTML head (meta, fonts, CSS)
│       ├── nav.ejs         # Sidebar + header navigation
│       └── footer.ejs      # Footer + closing tags + JS
└── public/
    ├── css/
    │   └── style.css       # Dark navy design system, CSS variables, responsive
    └── js/
        └── main.js         # Mobile nav toggle, form feedback, accessibility
```

## 🔧 How to Demonstrate Each Requirement to Your Evaluator

### Requirement 1: Semantic HTML with forms
**URL:** `http://localhost:3000`

Open the page and inspect the form. It uses:
- `<form action="/register" method="POST">` with proper semantic structure
- `<label>` elements linked to inputs via `for`/`id`
- `<input type="email">`, `<input type="tel">`, `<input type="text">`
- `<select>` for course and academic year
- `required` attribute on mandatory fields
- `maxlength` for input length limits
- `autocomplete` attributes for better UX

### Requirement 2: Express server
**File:** `app.js`

The server:
- Calls `express()` to create the app
- Uses `express.urlencoded({ extended: true })` to parse form data
- Serves static files from `/public`
- Configures EJS as the view engine (`app.set('view engine', 'ejs')`)
- Listens on `PORT` (default 3000)

### Requirement 3: Server-side endpoints
**File:** `app.js`

| Method | Path | Purpose | Status |
## 🧪 Test Checklist

| # | Test | Expected Result | How to Test |
|---|------|-----------------|-------------|
| 1 | Server starts | Console shows "Forma server running at http://localhost:3000" | Run `npm start` |
| 2 | Registration page renders via EJS | HTML form loads with dark navy theme | Visit `http://localhost:3000` |
| 3 | CSS and JS assets load | Styles apply, mobile menu works | Open DevTools → Network tab, verify 200 for `/css/style.css` and `/js/main.js` |
| 4 | Valid form submission | Redirects to success page with submitted data | Fill form, submit, see success page |
| 5 | Success page displays data | Name, email, course shown correctly | Check success page after submission |
| 6 | Invalid email rejected | Form re-displays with error message | Submit `not-an-email`, see error |
| 7 | Missing required fields rejected | Form re-displays with field errors | Leave name empty, submit, see error |
| 8 | Records appear on student list | Submitted students shown in table | Visit `http://localhost:3000/students` |
| 9 | Empty state works | "No Student Records Yet" shown before any registration | Clear records (restart server), visit `/students` |
| 10 | Unknown URL returns 404 | 404 page with links back | Visit `http://localhost:3000/nonexistent` |
| 11 | Responsive layout | Sidebar collapses on mobile, form stacks vertically | Resize browser or use DevTools device toolbar |
| 12 | Safe rendering | User input shown escaped, no raw HTML | Submit `<script>alert(1)</script>` as name, verify it's escaped |
| 13 | In-memory cleared on restart | Records disappear after `Ctrl+C` + `npm start` | Submit a record, restart server, visit `/students` |

## 🛠 Troubleshooting

### `node` or `npm` not recognized
- **Cause:** Node.js not installed or not in PATH
- **Fix:** Download and install from https://nodejs.org/. Restart your terminal after installation. Verify with `node --version` and `npm --version`.

### Port 3000 already in use
- **Cause:** Another process is using port 3000
- **Fix:** Find and kill the process:
  ```powershell
  Get-Process -Id (Get-NetTCPConnection -LocalPort 3000).OwningProcess
  Stop-Process -Id <PID> -Force
  ```
  Or set a different port:
  ```powershell
  $env:PORT=3001; node app.js
  ```

### Missing npm dependencies
- **Cause:** `node_modules` not installed
- **Fix:** Run `npm install` in the project directory.

### EJS template errors
- **Cause:** Syntax error in `.ejs` files or missing view
- **Fix:** Check the console error output. Ensure all view files exist in `views/` and partials in `views/partials/`.

### Incorrect working directory
- **Cause:** Running `node app.js` from outside the project folder
- **Fix:** `cd` into `Task-1/` first, then run `node app.js`.

### Missing template or static asset files
- **Cause:** Files not created or wrong path
- **Fix:** Verify all files exist under `views/` and `public/`. Express static middleware serves from `/public`.

### MongoDB not installed
- **Note:** MongoDB is **not required** for Task 1. Records are stored in server memory (an array in `app.js`) and are cleared when the server restarts. This is by design for Task 1.
|--------|------|---------|--------|
| GET | `/` | Render registration form | 200 |
| POST | `/register` | Handle form submission + validation | 201 (success) / 400 (validation error) |
| GET | `/students` | List all registered students | 200 |
| GET | `*` (unknown) | 404 page | 404 |

### Requirement 4: EJS server-side rendering
**Files:** `app.js`, `views/`

All HTML is generated on the server:
- `res.render('index', { ... })` — registration page
- `res.render('success', { ... })` — success page with submitted data
- `res.render('students', { ... })` — student records page
- `res.render('404', { ... })` — not found page
## 🔒 Security Notes

- User-supplied data is rendered using **escaped EJS** (`<%= %>`), never unescaped (`<%- %>`)
- Server-side validation runs on every submission (browser validation is not trusted)
- Course and academic year are validated against an **allowlist** of allowed values
- No secrets, passwords, or API keys are hardcoded
- Environment variables are never exposed to the browser
- **Not production-secure:** This is a learning project. Do not deploy to production without additional security measures (CSRF protection, rate limiting, HTTPS, proper session management, etc.)

## 🔄 Future Compatibility

The architecture is modular and ready for future tasks:

| Task | Future Addition | Current State |
|------|----------------|---------------|
| Task 2 | Enhanced client-side validation, dynamic DOM updates | Basic JS interactions included |
| Task 3 | Bootstrap or Tailwind CSS | Custom CSS design system in place |
| Task 4 | Client-side routing, complex validation | EJS SSR with modular routes |
| Task 5 | RESTful CRUD APIs | Express routes ready for extension |
| Task 6 | MongoDB persistence, authentication | In-memory array (replaceable with DB) |
| Task 7 | External API integration, OAuth | Modular Express middleware structure |
| Task 8 | Middleware, background jobs, caching | Express middleware pattern established |

## 📄 License

MIT — Built for Cognifyz Full Stack Internship Task 1.
- User data is output with escaped EJS (`<%= %>`) to prevent XSS
Or run directly with Node:
```powershell
node app.js
```

### 4. Open the application
Visit: **http://localhost:3000**