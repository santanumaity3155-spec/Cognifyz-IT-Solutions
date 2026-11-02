/**
 * Forma — Student Intelligence Platform
 * Task 3: Advanced CSS Styling and Responsive Design with Bootstrap 5
 *
 * Request flow:
 *   Browser ? Inline JavaScript validation (public/js/validation.js)
 *   ? Express route ? Server validation (utils/validation.js)
 *   ? In-memory storage ? EJS response (Bootstrap 5 + custom CSS)
 *
 * Notes:
 * - Client-side validation is a UX improvement ONLY.
 * - MongoDB is NOT used. Records live in a JavaScript array.
 * - All user-generated content is rendered with escaped EJS (`<%= %>`).
 * - Bootstrap 5.3 is loaded via CDN in views.
 * - public/js/validation.js handles form validation and field feedback.
 * - public/js/main.js handles scroll animations and Bootstrap init only.
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

app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

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

// GET / — Home page: multi-section layout
app.get('/', (req, res) => {
  renderPage(res, 'index', {
    title: 'Forma — Student Intelligence Platform',
    activePage: 'home',
    errors: null,
    formData: null,
    courses: ALLOWED_COURSES,
    genders: ALLOWED_GENDERS,
    students: students.slice().reverse().slice(0, 5),
    total: students.length
  });
});

// POST /register — Validate (server-side) and process the registration
app.post('/register', (req, res) => {
  const result = validateRegistration(req.body);

  if (!result.valid) {
    return renderPage(res, 'index', {
      title: 'Register Student | Forma',
      activePage: 'home',
      errors: result.errors,
      formData: result.formData,
      courses: ALLOWED_COURSES,
      genders: ALLOWED_GENDERS,
      students: students.slice().reverse().slice(0, 5),
      total: students.length
    }, 400);
  }

  const student = {
    id: generateReference(),
    ...result.data,
    registeredAt: new Date().toISOString()
  };
  students.push(student);

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

// GET /success — Direct access redirects home
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

// GET /contact — Contact page
app.get('/contact', (req, res) => {
  renderPage(res, 'contact', {
    title: 'Contact | Forma',
    activePage: 'contact'
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
