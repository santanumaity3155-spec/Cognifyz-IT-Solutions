const VALID_YEARS = ['1st Year', '2nd Year', '3rd Year', '4th Year', 'Postgraduate'];
const VALID_STATUSES = ['Active', 'Pending', 'Suspended', 'Graduated'];
const VALID_GENDERS = ['Male', 'Female', 'Non-Binary', 'Other'];
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Validate Student Creation Body (POST /api/students)
 */
export const validateCreateStudent = (req, res, next) => {
  const { fullName, email, phone, dateOfBirth, course, academicYear, gender, registrationStatus } = req.body;
  const errors = [];

  // Full Name
  if (!fullName || typeof fullName !== 'string' || fullName.trim().length < 2) {
    errors.push({
      field: 'fullName',
      message: 'Full name is required and must be at least 2 characters long.',
    });
  }

  // Email
  if (!email || typeof email !== 'string' || !EMAIL_REGEX.test(email.trim())) {
    errors.push({
      field: 'email',
      message: 'A valid email address is required (e.g., student@example.com).',
    });
  }

  // Phone
  if (!phone || typeof phone !== 'string' || phone.trim().length < 7) {
    errors.push({
      field: 'phone',
      message: 'A valid phone number with at least 7 digits is required.',
    });
  }

  // Date of Birth
  if (!dateOfBirth || typeof dateOfBirth !== 'string' || !dateOfBirth.trim()) {
    errors.push({
      field: 'dateOfBirth',
      message: 'Date of birth is required.',
    });
  }

  // Course
  if (!course || typeof course !== 'string' || !course.trim()) {
    errors.push({
      field: 'course',
      message: 'Course selection is required.',
    });
  }

  // Academic Year
  if (!academicYear || !VALID_YEARS.includes(academicYear)) {
    errors.push({
      field: 'academicYear',
      message: `Academic year must be one of: ${VALID_YEARS.join(', ')}.`,
    });
  }

  // Gender (optional, but if provided must be valid)
  if (gender && !VALID_GENDERS.includes(gender)) {
    errors.push({
      field: 'gender',
      message: `Gender must be one of: ${VALID_GENDERS.join(', ')}.`,
    });
  }

  // Registration Status (optional, default Active)
  if (registrationStatus && !VALID_STATUSES.includes(registrationStatus)) {
    errors.push({
      field: 'registrationStatus',
      message: `Registration status must be one of: ${VALID_STATUSES.join(', ')}.`,
    });
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed. Please correct the highlighted errors.',
      error: 'VALIDATION_ERROR',
      errors,
    });
  }

  next();
};

/**
 * Validate Student Update Body (PUT /api/students/:id)
 */
export const validateUpdateStudent = (req, res, next) => {
  const { fullName, email, phone, course, academicYear, gender, registrationStatus } = req.body;
  const errors = [];

  if (fullName !== undefined && (typeof fullName !== 'string' || fullName.trim().length < 2)) {
    errors.push({
      field: 'fullName',
      message: 'Full name must be at least 2 characters long.',
    });
  }

  if (email !== undefined && (typeof email !== 'string' || !EMAIL_REGEX.test(email.trim()))) {
    errors.push({
      field: 'email',
      message: 'A valid email address is required.',
    });
  }

  if (phone !== undefined && (typeof phone !== 'string' || phone.trim().length < 7)) {
    errors.push({
      field: 'phone',
      message: 'Phone number must be at least 7 digits.',
    });
  }

  if (course !== undefined && (typeof course !== 'string' || !course.trim())) {
    errors.push({
      field: 'course',
      message: 'Course cannot be blank.',
    });
  }

  if (academicYear !== undefined && !VALID_YEARS.includes(academicYear)) {
    errors.push({
      field: 'academicYear',
      message: `Academic year must be one of: ${VALID_YEARS.join(', ')}.`,
    });
  }

  if (gender !== undefined && !VALID_GENDERS.includes(gender)) {
    errors.push({
      field: 'gender',
      message: `Gender must be one of: ${VALID_GENDERS.join(', ')}.`,
    });
  }

  if (registrationStatus !== undefined && !VALID_STATUSES.includes(registrationStatus)) {
    errors.push({
      field: 'registrationStatus',
      message: `Registration status must be one of: ${VALID_STATUSES.join(', ')}.`,
    });
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed for update.',
      error: 'VALIDATION_ERROR',
      errors,
    });
  }

  next();
};

