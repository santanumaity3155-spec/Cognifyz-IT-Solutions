/**
 * Forma — Student Intelligence
 * Task 1: HTML Structure and Basic Server Interaction
 *
 * Express server with EJS server-side rendering and in-memory student storage.
 * No database is required for this task. Submitted records live in server memory
 * and are cleared when the server restarts.
 */

const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// ---------------------------------------------------------------------------
// In-memory storage (Task 1 requirement: temporary, cleared on restart)
// ---------------------------------------------------------------------------
const students = [];

// Allowed values for the course field (server-side allowlist validation)
const ALLOWED_COURSES = [
  'Computer Science',
  'Data Science',
  'Cybersecurity',
  'Artificial Intelligence',
  'Software Engineering',
  'Information Technology'
];

const ALLOWED_YEARS = ['1', '2', '3', '4'];

// ---------------------------------------------------------------------------
// Express configuration
// ---------------------------------------------------------------------------

// Parse URL-encoded form data (requirement: handle form submissions)
app.use(express.urlencoded({ extended: true }));

// Serve static CSS, JS, and images from the public directory
app.use(express.static(path.join(__dirname, 'public')));

// Configure EJS as the template engine (requirement: server-side rendering)
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// ---------------------------------------------------------------------------
// Helper: server-side validation
// ---------------------------------------------------------------------------

/**
 * Validates and normalizes a submitted student registration.
 * Returns { valid: true, data: { ... } } or { valid: false, errors: [ ... ] }.
 * All string fields are trimmed. User-supplied values are preserved for redisplay.
 */
function validateRegistration(body) {
  const errors = [];

  // Trim all string fields
  const fullName = (body.fullName || '').trim();
  const email = (body.email || '').trim();
  const course = (body.course || '').trim();
  const academicYear = (body.academicYear || '').trim();
  const phone = (body.phone || '').trim();

  // Required field checks
  if (!fullName) {
    errors.push('Full name is required.');
  } else if (fullName.length < 2) {
    errors.push('Full name must be at least 2 characters long.');
  } else if (fullName.length > 100) {
    errors.push('Full name must not exceed 100 characters.');
  }

  if (!email) {
    errors.push('Email address is required.');
  } else {
    // Basic email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      errors.push('Please enter a valid email address.');
    } else if (email.length > 255) {
      errors.push('Email address is too long.');
    }
  }

  if (!course) {
    errors.push('Course selection is required.');
  } else if (!ALLOWED_COURSES.includes(course)) {
    errors.push('Please select a valid course from the list.');
  }

  if (!academicYear) {
    errors.push('Academic year is required.');
  } else if (!ALLOWED_YEARS.includes(academicYear)) {
    errors.push('Please select a valid academic year (1–4).');
  }

  // Phone is optional but validate format if provided
  if (phone) {
    const phoneRegex = /^\+?[\d\s\-()]{7,20}$/;
    if (!phoneRegex.test(phone)) {
      errors.push('Please enter a valid phone number.');
    } else if (phone.length > 20) {
      errors.push('Phone number is too long.');
    }
  }

  if (errors.length > 0) {
    return {
      valid: false,
      errors,
      // Preserve safe, validated form values for redisplay
      formData: { fullName, email, course, academicYear, phone }
    };
  }

  return {
    valid: true,
    data: { fullName, email, course, academicYear, phone }
  };
}

// ---------------------------------------------------------------------------
// Routes
// ---------------------------------------------------------------------------

// GET / — Landing / registration page
app.get('/', (req, res) => {
  res.render('index', {
    title: 'Register Student | Forma',
    errors: null,
    formData: null,
    activePage: 'home'
  });
});

// POST /register — Handle form submission with server-side validation
app.post('/register', (req, res) => {
  const result = validateRegistration(req.body);

  if (!result.valid) {
    // Re-render the form with errors and preserved input values (400 Bad Request)
    return res.status(400).render('index', {
      title: 'Register Student | Forma',
      errors: result.errors,
      formData: result.formData,
      activePage: 'home'
    });
  }

  // Store the registration in memory
  const student = {
    id: Date.now().toString(),
    ...result.data,
    registeredAt: new Date().toISOString()
  };
  students.push(student);

  // Render success page with HTTP 201 Created
  res.status(201).render('success', {
    title: 'Registration Successful | Forma',
    student,
    activePage: 'home'
  });
});

// GET /students — Display all registered students
app.get('/students', (req, res) => {
  res.render('students', {
    title: 'Student Records | Forma',
    students,
    hasStudents: students.length > 0,
    activePage: 'students'
  });
});

// ---------------------------------------------------------------------------
// 404 handler — unknown routes return a proper 404 page
// ---------------------------------------------------------------------------
app.use((req, res) => {
  res.status(404).render('404', {
    title: 'Page Not Found | Forma',
    activePage: ''
  });
});

// ---------------------------------------------------------------------------
// Global error handler
// ---------------------------------------------------------------------------
app.use((err, req, res, next) => {
  console.error('ERROR:', err.message);
  console.error(err.stack);
  res.status(500).render('404', {
    title: 'Server Error | Forma',
    message: 'An unexpected error occurred. Please try again later.',
    activePage: ''
  });
});

// ---------------------------------------------------------------------------
// Start the server
// ---------------------------------------------------------------------------
app.listen(PORT, () => {
  console.log('Forma server running at http://localhost:' + PORT);
  console.log('Press Ctrl+C to stop. Note: in-memory student records are cleared on restart.');
});

module.exports = { app, students };