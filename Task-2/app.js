/**
 * Forma — Student Intelligence Platform
 * Task 2: Express server with inline + server-side validation.
 *
 * Request flow (Task 2 requirement):
 *   Browser → Inline JavaScript validation (public/js/validation.js)
 *   → Express route → Server validation (utils/validation.js)
 *   → In-memory storage → EJS response
 *
 * Notes:
 * - Client-side validation is a UX improvement ONLY. The Express backend
 *   validates every submission independently, so bypassing the browser
 *   does not bypass validation.
 * - MongoDB is NOT used. Records live in a JavaScript array and are cleared
 *   when the server restarts (by design for Task 2).
 * - All user-generated content is rendered with escaped EJS (`<%= %>`),
 *   never unescaped (`<%- %>`), to prevent XSS.
 */

const express = require('express');
const path = require('path');
const fs = require('fs');

const {
  validateRegistration,
  ALLOWED_COURSES,
  ALLOWED_GENDERS
} = require('./utils/validation');

const app = express();
const PORT = process.env.PORT || 3000;
const NODE_ENV = process.env.NODE_ENV || 'development';

// ---------------------------------------------------------------------------
// Minimal .env loader (no extra npm dependency)
// ---------------------------------------------------------------------------
function loadEnvFile() {
  try {
    const envPath = path.join(__dirname, '.env');
    if (!fs.existsSync(envPath)) return;
    fs.readFileSync(envPath, 'utf8').split(/\r?\n/).forEach((line) => {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) return;
      const eq = trimmed.indexOf('=');
      if (eq === -1) return;
      const key = trimmed.slice(0, eq).trim();
      let value = trimmed.slice(eq + 1).trim();
      if (value.startsWith('"') && value.endsWith('"')) {
        value = value.slice(1, -1);
      }
      if (key && process.env[key] === undefined) {
        process.env[key] = value;
      }
    });
  } catch (err) {
    console.warn('Warning: could not load .env file:', err.message);
  }
}
loadEnvFile();

// ---------------------------------------------------------------------------
// In-memory storage (Task 2 requirement: temporary, cleared on restart)
// ---------------------------------------------------------------------------
const students = [];

const REF_PREFIX = 'FORMA';
function generateReference() {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.floor(Math.random() * 10000).toString(10).padStart(4, '0');
  return `${REF_PREFIX}-${timestamp}-${random}`;
}

function trim(value) {
  return value === null || value === undefined ? '' : String(value).trim();
}

// ---------------------------------------------------------------------------
// Express configuration
// ---------------------------------------------------------------------------
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// ---------------------------------------------------------------------------
// Helper: render a page body partial inside the shared layout shell
// ---------------------------------------------------------------------------
function renderPage(res, view, data, status = 200) {
  app.render(view, data, (err, body) => {
    if (err) {
      console.error('Render error:', err.message);
      return res.status(500).render('layout', {
        title: 'Server Error | Forma',
        activePage: '',
        body: '',
        message: 'An unexpected error occurred while rendering the page.'
      });
    }
    if (status !== 200) res.status(status);
    res.render('layout', { ...data, body });
  });
}

// ---------------------------------------------------------------------------
// Routes
// ---------------------------------------------------------------------------

// GET / — Home page: hero section + registration form
app.get('/', (req, res) => {
  renderPage(res, 'index', {
    title: 'Register Student | Forma',
    activePage: 'home',
    errors: null,
    formData: null,
    courses: ALLOWED_COURSES,
    genders: ALLOWED_GENDERS
  });
});

// POST /register — Validate (server-side) and process the registration
app.post('/register', (req, res) => {
  const result = validateRegistration(req.body);

  if (!result.valid) {
    // Server rejected the submission: re-render the form with errors and
    // preserved safe values (HTTP 400 Bad Request).
    return renderPage(res, 'index', {
      title: 'Register Student | Forma',
      activePage: 'home',
      errors: result.errors,
      formData: result.formData,
      courses: ALLOWED_COURSES,
      genders: ALLOWED_GENDERS
    }, 400);
  }

  const student = {
    id: generateReference(),
    ...result.data,
    registeredAt: new Date().toISOString()
  };
  students.push(student);

  // Render success page with HTTP 201 Created
  return renderPage(res, 'success', {
    title: 'Registration Successful | Forma',
    activePage: 'home',
    student
  }, 201);
});

// GET /students — Student records with optional search and course filter
app.get('/students', (req, res) => {
  const q = trim(req.query.q);
  const course = trim(req.query.course);

  let filtered = students.slice();

  if (q) {
    const needle = q.toLowerCase();
    filtered = filtered.filter((s) =>
      `${s.fullName} ${s.email} ${s.studentId}`.toLowerCase().includes(needle)
    );
  }

  if (course) {
    // Reject unexpected filter values gracefully: only allowlisted courses
    // are applied; unknown values are ignored so search UX never breaks.
    if (ALLOWED_COURSES.includes(course)) {
      filtered = filtered.filter((s) => s.course === course);
    }
  }

  return renderPage(res, 'students', {
    title: 'Student Records | Forma',
    activePage: 'students',
    students: filtered,
    total: students.length,
    query: q,
    course,
    courses: ALLOWED_COURSES,
    hasStudents: filtered.length > 0
  });
});

// GET /success — The success page requires submitted student data which only
// exists after a successful POST /register. A direct GET has nothing to
// display, so we redirect home instead of rendering an empty page.
app.get('/success', (req, res) => {
  res.redirect('/');
});

// GET /about — About page
app.get('/about', (req, res) => {
  renderPage(res, 'about', {
    title: 'About | Forma',
    activePage: 'about'
  });
});

// ---------------------------------------------------------------------------
// Custom 404 route
// ---------------------------------------------------------------------------
app.use((req, res) => {
  return renderPage(res, '404', {
    title: 'Page Not Found | Forma',
    activePage: ''
  }, 404);
});

// ---------------------------------------------------------------------------
// Global error handler
// ---------------------------------------------------------------------------
app.use((err, req, res, next) => {
  console.error('ERROR:', err.message);
  console.error(err.stack);
  return res.status(500).render('layout', {
    title: 'Server Error | Forma',
    activePage: '',
    body: '',
    message: 'An unexpected error occurred. Please try again later.'
  });
});

// ---------------------------------------------------------------------------
// Start the server
// ---------------------------------------------------------------------------
app.listen(PORT, () => {
  console.log('Forma server running at http://localhost:' + PORT);
  console.log('Environment:', NODE_ENV);
  console.log('Press Ctrl+C to stop. Note: in-memory student records are cleared on restart.');
});

module.exports = { app, students };
