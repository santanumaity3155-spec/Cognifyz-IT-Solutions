# Forma — Student Intelligence Platform

**Cognifyz Full Stack Internship — Task 3: Advanced CSS Styling and Responsive Design**

A premium, portfolio-quality Student Intelligence Platform built with Node.js, Express.js, EJS server-side rendering, and **Bootstrap 5.3**. This is **Task 3** of the internship and is a completely separate project from Task 1 and Task 2.

---

## ?? Table of Contents

1. [Project overview](#project-overview)
2. [Official Task 3 requirements](#official-task-3-requirements)
3. [Features](#features)
4. [Technologies used](#technologies-used)
5. [Project structure](#project-structure)
6. [Architecture & data flow](#architecture--data-flow)
7. [Installation (Windows PowerShell)](#installation-windows-powershell)
8. [Execution instructions](#execution-instructions)
9. [Testing procedure](#testing-procedure)
10. [Responsive design](#responsive-design)
11. [Troubleshooting guide](#troubleshooting-guide)
12. [Security & code quality](#security--code-quality)
13. [Conclusion](#conclusion)

---

## ?? Project overview

**Forma** is a student intelligence (management) platform where users can register students through a rich, validated form and browse searchable student records. Task 3 enhances the platform with:

- **Bootstrap 5.3** for a consistent, responsive UI framework
- **Advanced CSS** — transitions, hover animations, entrance animations, glassmorphism, custom design system
- **Multi-section layout** — hero, about, features, statistics, registration, records preview, and contact sections
- **Fully responsive design** — mobile (360px), tablet (768px), laptop (1024px), and desktop (1440px)
- All Task 2 functionality preserved: registration, dual validation, search, filtering, records

Task 1 (`Task-1/`) and Task 2 (`Task-2/`) are **completely untouched**.

---

## ? Official Task 3 requirements

| # | Requirement | Implementation |
|---|-------------|----------------|
| 1 | Complex layout with multiple sections | Hero, about, features, statistics, registration, records preview, contact (`views/index.ejs`) |
| 2 | Advanced CSS properties (transitions, animations) | `public/css/style.css` — fade-in-up, shake, hover transitions, glassmorphism |
| 3 | CSS framework (Bootstrap 5) for responsive UI | Bootstrap 5.3 via CDN in all views + custom CSS overrides |

---

## ?? Features

- Responsive navigation bar — Bootstrap navbar on mobile/tablet, desktop sidebar on lg+
- Hero section — headline, CTA buttons, visual card with glassmorphism
- About Forma section — feature cards with icons and descriptions
- Features section — three feature cards with hover effects
- Student statistics section — animated stat cards
- Student registration section — 9-field form with inline validation (client + server)
- Student records preview — latest 5 students with link to full records page
- Contact section — contact form with Bootstrap validation and loading state
- Student records page — full table with server-side search and course filtering
- Success page — registration reference and submitted details summary
- About page — technology stack, storage, security info
- 404 page — professional error page with navigation
- Dark premium theme — navy, indigo, purple, violet accents with custom CSS variables
- Entrance animations — Intersection Observer scroll-triggered fade-in-up
- No horizontal overflow — tested at all breakpoints

---

## ?? Technologies used

| Layer | Technology | Version |
|-------|-----------|---------|
| Runtime | Node.js | v18+ |
| Framework | Express.js | ^4.19.2 |
| Templating | EJS | ^3.1.10 |
| CSS Framework | Bootstrap 5 | 5.3.3 (CDN) |
| Styling | CSS3 | Custom variables, grid, flexbox, animations |
| JavaScript | Vanilla JS | ES6+ |
| Icons | Bootstrap Icons | Via CDN |
| Fonts | Inter | Google Fonts |

---

## ?? Project structure

```
Task-3/
+-- app.js                        # Express server + routes
+-- package.json                  # Dependencies & scripts
+-- .env                          # PORT, NODE_ENV
+-- .env.example                  # Config template
+-- .gitignore                    # Git ignore rules
+-- README.md                     # This file
+-- utils/
¦   +-- validation.js             # Server-side validation
+-- public/
¦   +-- css/
¦   ¦   +-- style.css             # Custom CSS on top of Bootstrap 5
¦   +-- js/
¦   ¦   +-- validation.js         # Client-side form validation
¦   ¦   +-- main.js               # Scroll animations, Bootstrap init
¦   +-- images/
¦       +-- .gitkeep
+-- views/
    +-- layout.ejs                # Shell with Bootstrap 5 CDN
    +-- partials/
    ¦   +-- head.ejs              # Meta tags, Bootstrap CSS, custom CSS
    ¦   +-- nav.ejs               # Bootstrap navbar + desktop sidebar
    ¦   +-- footer.ejs            # Multi-column footer
    +-- index.ejs                 # Multi-section homepage
    +-- students.ejs              # Records table with search & filter
    +-- success.ejs               # Registration success page
    +-- about.ejs                 # About page
    +-- contact.ejs               # Contact page
    +-- 404.ejs                   # Error page
```

---

## ?? Architecture & data flow

```
Browser ? Inline JS validation (public/js/validation.js)
  ? Express route (app.js)
  ? Server-side validation (utils/validation.js)
  ? In-memory storage (students array)
  ? EJS response (Bootstrap 5 + custom CSS)
```

- `renderPage()` helper renders a view partial inside `layout.ejs` with proper HTTP status codes (200, 201, 400, 404, 500)
- `utils/validation.js` contains pure, route-independent validator functions
- `public/js/validation.js` handles registration form client-side validation and field feedback
- `public/js/main.js` handles scroll animations and Bootstrap initialization only — no duplicate functionality
- All user data rendered with escaped `<%= %>` to prevent XSS
- In-memory storage cleared on server restart (by design)

---

## ?? Installation (Windows PowerShell)

```powershell
# 1. Navigate to the Task-3 folder
cd "d:\New Project\Cognifyz\Cognifyz-IT-Solutions\Task-3"

# 2. Install dependencies
npm install

# 3. Copy .env.example to .env if needed
copy .env.example .env
```

---

## ?? Execution instructions

```powershell
# Navigate to Task-3
cd "d:\New Project\Cognifyz\Cognifyz-IT-Solutions\Task-3"

# Start the server
npm start

# Or run directly with node
node app.js
```

Server will run at: **http://localhost:3000**

To change the port, edit `.env` or set the `PORT` environment variable:
```powershell
$env:PORT=3001; npm start
```

---

## ?? Testing procedure

### Routes to test

| Route | Method | Expected |
|-------|--------|----------|
| `/` | GET | Homepage with all sections |
| `/register` | POST | Valid ? success page (201); Invalid ? form with errors (400) |
| `/students` | GET | Records table with search/filter |
| `/success` | GET | Redirects to `/` |
| `/about` | GET | About page |
| `/contact` | GET | Contact page |
| Any unknown | GET | 404 page |

### Form validation tests

1. Empty submit — should show all field errors
2. Invalid email — should show "Please enter a valid email address"
3. Invalid phone — should show format error
4. Valid submission — should redirect to success page with reference
5. Terms unchecked — should show terms error

### Search & filter tests

1. Search by name — should filter matching students
2. Search by email — should filter matching students
3. Filter by course — should show only that course
4. Clear filters — should show all students

### Responsive tests

Use Chrome DevTools device toolbar to test at:
- **360px** (mobile)
- **768px** (tablet)
- **1024px** (laptop)
- **1440px** (desktop)

Check: navigation, hero, cards, forms, tables, buttons, footer — no horizontal overflow or overlapping elements.

### Console checks

- Browser console: no JavaScript errors
- Terminal: no server errors
- Network: Bootstrap CSS/JS loaded from CDN

---

## ?? Troubleshooting guide

| Problem | Likely cause | Fix |
|---------|--------------|-----|
| `Cannot find module 'express'` | Dependencies not installed | Run `npm install` inside `Task-3/` |
| Port 3000 already in use | Another process on port 3000 | `$env:PORT=3001; npm start` |
| CSS not loading | CDN blocked or cache | Hard-refresh (`Ctrl+F5`) |
| Form re-renders with errors | Server-side validation failed | Read inline error messages |
| Records missing after restart | In-memory storage | By design — data resets on restart |
| 404 on `/success` | Direct access | `/success` redirects to `/` |
| EJS template error | Syntax error in `.ejs` | Check terminal output |
| Bootstrap styles not applying | CSS load order | Confirm `style.css` loads after Bootstrap CDN |

---

## ?? Security & code quality

- All data validated on **server** (`utils/validation.js`); client validation is UX only
- Allowlist validation for `course` and `gender` rejects unexpected values
- All EJS output uses **escaped** tags (`<%= %>`); unescaped tags never used for user data
- No hardcoded secrets; configuration via `.env` / environment variables
- `.gitignore` excludes `node_modules/`, `.env`, logs, OS/IDE files
- Minimal dependencies: only `express` and `ejs`; Bootstrap via CDN
- Graceful error handling: custom 404 page and global 500 handler
- XSS protection: no `<%- %>` for user-generated content

---

## ?? Responsive design

Tested breakpoints:
- **Mobile** (360px): stacked sections, full-width buttons, collapsed navbar
- **Tablet** (768px): two-column grids, responsive tables
- **Laptop** (1024px): desktop sidebar appears, multi-column layouts
- **Desktop** (1440px): full sidebar navigation, wide containers

No `overflow-x: hidden` used as a shortcut. All overflow issues fixed at the source.

---

## ?? Conclusion

Task 3 is complete: advanced CSS styling with transitions and animations, Bootstrap 5 responsive framework, and a complex multi-section layout — all while preserving 100% of Task 2 functionality. Task 1 and Task 2 remain completely untouched.
