/**
 * Forma — Student Intelligence Platform
 * utils/validation.js — Reusable server-side validation (Task 2).
 *
 * These are pure functions: they receive input, return results, and never
 * touch the Express request/response objects. This keeps validation logic
 * separate from routing, testable, and reusable (e.g. by future REST APIs).
 *
 * Every validator trims whitespace and rejects unexpected values against
 * explicit allowlists.
 */

// ---------------------------------------------------------------------------
// Allowlists (unexpected values are rejected)
// ---------------------------------------------------------------------------
const ALLOWED_COURSES = [
  'Computer Science',
  'Data Science',
  'Cybersecurity',
  'Artificial Intelligence',
  'Software Engineering',
  'Information Technology'
];

const ALLOWED_GENDERS = ['Male', 'Female', 'Other', 'Prefer not to say'];

const MIN_AGE = 10;
const MAX_AGE = 100;

// ---------------------------------------------------------------------------
// Regular expressions
// ---------------------------------------------------------------------------
const REGEX = {
  // Letters, spaces, apostrophes, hyphens; 2–100 characters
  fullName: /^[A-Za-z\s.'-]{2,100}$/,
  email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  // Optional leading +, digits, spaces, dashes, parentheses; 7–20 chars
  phone: /^\+?[\d\s\-()]{7,20}$/,
  // Alphanumeric plus hyphens; 3–20 characters
  studentId: /^[A-Za-z0-9-]{3,20}$/
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function trim(value) {
  return value === null || value === undefined ? '' : String(value).trim();
}

// ---------------------------------------------------------------------------
// Individual field validators (reusable)
// Each returns { valid: boolean, error: string|null, value: string }
// ---------------------------------------------------------------------------

function validateFullName(value) {
  const v = trim(value);
  if (!v) return { valid: false, error: 'Full name is required.', value: v };
  if (v.length < 2) {
    return { valid: false, error: 'Full name must be at least 2 characters long.', value: v };
  }
  if (v.length > 100) {
    return { valid: false, error: 'Full name must not exceed 100 characters.', value: v };
  }
  if (!REGEX.fullName.test(v)) {
    return {
      valid: false,
      error: 'Full name may only contain letters, spaces, hyphens, and apostrophes.',
      value: v
    };
  }
  return { valid: true, error: null, value: v };
}

function validateEmail(value) {
  const v = trim(value);
  if (!v) return { valid: false, error: 'Email address is required.', value: v };
  if (v.length > 255) {
    return { valid: false, error: 'Email address is too long (max 255 characters).', value: v };
  }
  if (!REGEX.email.test(v)) {
    return { valid: false, error: 'Please enter a valid email address.', value: v };
  }
  return { valid: true, error: null, value: v };
}

function validatePhone(value) {
  const v = trim(value);
  if (!v) return { valid: false, error: 'Phone number is required.', value: v };
  if (!REGEX.phone.test(v)) {
    return { valid: false, error: 'Please enter a valid phone number (7–20 digits).', value: v };
  }
  const digits = v.replace(/\D/g, '');
  if (digits.length < 7 || digits.length > 15) {
    return {
      valid: false,
      error: 'Phone number must contain between 7 and 15 digits.',
      value: v
    };
  }
  return { valid: true, error: null, value: v };
}

function validateStudentId(value) {
  const v = trim(value);
  if (!v) return { valid: false, error: 'Student ID is required.', value: v };
  const upper = v.toUpperCase();
  if (!REGEX.studentId.test(upper)) {
    return {
      valid: false,
      error: 'Student ID must be 3–20 characters (letters, numbers, hyphens).',
      value: v
    };
  }
  return { valid: true, error: null, value: upper };
}

function validateCourse(value) {
  const v = trim(value);
  if (!v) return { valid: false, error: 'Please select a course.', value: v };
  if (!ALLOWED_COURSES.includes(v)) {
    return { valid: false, error: 'Please select a valid course from the list.', value: v };
  }
  return { valid: true, error: null, value: v };
}

function validateGender(value) {
  const v = trim(value);
  if (!v) return { valid: false, error: 'Please select a gender.', value: v };
  if (!ALLOWED_GENDERS.includes(v)) {
    return { valid: false, error: 'Please select a valid gender option.', value: v };
  }
  return { valid: true, error: null, value: v };
}

function validateDateOfBirth(value) {
  const v = trim(value);
  if (!v) return { valid: false, error: 'Date of birth is required.', value: v };
  const dob = new Date(v + 'T00:00:00'); // local date, avoids timezone shift
  if (Number.isNaN(dob.getTime())) {
    return { valid: false, error: 'Please enter a valid date of birth.', value: v };
  }
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (dob > today) {
    return { valid: false, error: 'Date of birth cannot be in the future.', value: v };
  }
  let age = today.getFullYear() - dob.getFullYear();
  const monthDiff = today.getMonth() - dob.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) age--;
  if (age < MIN_AGE) {
    return { valid: false, error: `You must be at least ${MIN_AGE} years old to register.`, value: v };
  }
  if (age > MAX_AGE) {
    return { valid: false, error: 'Please enter a valid date of birth.', value: v };
  }
  return { valid: true, error: null, value: v };
}

function validateAddress(value) {
  const v = trim(value);
  if (!v) return { valid: false, error: 'Address is required.', value: v };
  if (v.length < 5) {
    return { valid: false, error: 'Address must be at least 5 characters long.', value: v };
  }
  if (v.length > 500) {
    return { valid: false, error: 'Address must not exceed 500 characters.', value: v };
  }
  return { valid: true, error: null, value: v };
}

function validateTerms(value) {
  const accepted = value === 'on' || value === true || value === 'true';
  if (!accepted) {
    return {
      valid: false,
      error: 'You must accept the Terms and Conditions to register.',
      value: value
    };
  }
  return { valid: true, error: null, value: true };
}

// ---------------------------------------------------------------------------
// Full registration validator
//
// Returns { valid: true, data: { ... } }
// or     { valid: false, errors: [ { field, message } ], formData: { ... } }
// ---------------------------------------------------------------------------

function validateRegistration(body) {
  const errors = [];
  const formData = {};

  const fields = [
    { name: 'fullName', validate: validateFullName },
    { name: 'email', validate: validateEmail },
    { name: 'phone', validate: validatePhone },
    { name: 'studentId', validate: validateStudentId },
    { name: 'course', validate: validateCourse },
    { name: 'gender', validate: validateGender },
    { name: 'dateOfBirth', validate: validateDateOfBirth },
    { name: 'address', validate: validateAddress },
    { name: 'terms', validate: validateTerms }
  ];

  for (const { name, validate } of fields) {
    const result = validate(body[name]);
    formData[name] = result.value;
    if (!result.valid) {
      errors.push({ field: name, message: result.error });
    }
  }

  if (errors.length > 0) {
    return { valid: false, errors, formData };
  }

  return {
    valid: true,
    data: {
      fullName: formData.fullName,
      email: formData.email,
      phone: formData.phone,
      studentId: formData.studentId,
      course: formData.course,
      gender: formData.gender,
      dateOfBirth: formData.dateOfBirth,
      address: formData.address,
      termsAccepted: true
    }
  };
}

module.exports = {
  validateRegistration,
  validateFullName,
  validateEmail,
  validatePhone,
  validateStudentId,
  validateCourse,
  validateGender,
  validateDateOfBirth,
  validateAddress,
  validateTerms,
  ALLOWED_COURSES,
  ALLOWED_GENDERS,
  REGEX,
  MIN_AGE,
  MAX_AGE
};