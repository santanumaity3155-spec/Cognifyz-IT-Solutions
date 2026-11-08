import { validatePasswordStrength } from '../utils/passwordValidator.js';

const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;

/**
 * Middleware to validate registration request payloads
 */
export const validateRegister = (req, res, next) => {
  const { name, email, password } = req.body || {};
  const errors = [];

  // Validate Name
  if (!name || typeof name !== 'string' || name.trim().length === 0) {
    errors.push('Full name is required.');
  } else if (name.trim().length < 2) {
    errors.push('Full name must be at least 2 characters long.');
  } else if (name.trim().length > 60) {
    errors.push('Full name cannot exceed 60 characters.');
  }

  // Validate Email
  if (!email || typeof email !== 'string' || email.trim().length === 0) {
    errors.push('Email address is required.');
  } else {
    const normalizedEmail = email.trim().toLowerCase();
    if (!emailRegex.test(normalizedEmail)) {
      errors.push('Please provide a valid email address.');
    }
  }

  // Validate Password Complexity
  const passwordCheck = validatePasswordStrength(password);
  if (!passwordCheck.isValid) {
    errors.push(...passwordCheck.errors);
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      error: 'VALIDATION_ERROR',
      message: errors[0],
      errors,
    });
  }

  // Normalize fields on req.body for downstream controller
  req.body.name = name.trim();
  req.body.email = email.trim().toLowerCase();

  next();
};

/**
 * Middleware to validate login request payloads
 */
export const validateLogin = (req, res, next) => {
  const { email, password } = req.body || {};
  const errors = [];

  // Validate Email
  if (!email || typeof email !== 'string' || email.trim().length === 0) {
    errors.push('Email address is required.');
  } else {
    const normalizedEmail = email.trim().toLowerCase();
    if (!emailRegex.test(normalizedEmail)) {
      errors.push('Please provide a valid email address.');
    }
  }

  // Validate Password existence
  if (!password || typeof password !== 'string' || password.length === 0) {
    errors.push('Password is required.');
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      error: 'VALIDATION_ERROR',
      message: errors[0],
      errors,
    });
  }

  // Normalize email for downstream controller
  req.body.email = email.trim().toLowerCase();

  next();
};
