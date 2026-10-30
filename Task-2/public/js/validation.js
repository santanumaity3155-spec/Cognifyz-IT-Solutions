/**
 * Forma — Student Intelligence Platform
 * public/js/validation.js — Task 2 frontend interactions
 *
 * Features:
 * - Real-time inline form validation (input, change, blur, submit events)
 * - Field-level error / success feedback and character counts
 * - Form completion percentage
 * - Loading state on submit and toast notifications
 * - Mobile navigation toggle with keyboard accessibility
 *
 * IMPORTANT: Client-side validation is a UX improvement only. The Express
 * server validates every submission independently (utils/validation.js).
 * Bypassing the browser does NOT bypass server-side validation.
 */

(function () {
  'use strict';

  // ------------------------------------------------------------------
  // Configuration (mirrors server-side utils/validation.js)
  // ------------------------------------------------------------------
  const LIMITS = {
    fullName: { min: 2, max: 100 },
    email: { max: 255 },
    phone: { minDigits: 7, maxDigits: 15 },
    studentId: { min: 3, max: 20 },
    address: { min: 5, max: 500 }
  };

  const MIN_AGE = 10;
  const MAX_AGE = 100;

  const REGEX = {
    fullName: /^[A-Za-z\s.'-]{2,100}$/,
    email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    phone: /^\+?[\d\s\-()]{7,20}$/,
    studentId: /^[A-Za-z0-9-]{3,20}$/
  };

  const REQUIRED = [
    'fullName', 'email', 'phone', 'studentId', 'course',
    'gender', 'dateOfBirth', 'address', 'terms'
  ];

  // ------------------------------------------------------------------
  // DOM references
  // ------------------------------------------------------------------
  const form = document.getElementById('registrationForm');
  const fields = {};

  function initFields() {
    ['fullName', 'email', 'phone', 'studentId', 'dateOfBirth', 'address'].forEach(function (name) {
      fields[name] = document.getElementById(name);
    });
    fields.course = document.getElementById('course');
    fields.gender = document.querySelector('input[name="gender"]');
    fields.terms = document.getElementById('terms');
  }

  // ------------------------------------------------------------------
  // Helpers
  // ------------------------------------------------------------------
  const $ = function (selector) { return document.querySelector(selector); };

  function getFieldValue(name) {
    const el = fields[name];
    if (!el) return '';
    if (name === 'gender') {
      const checked = document.querySelector('input[name="gender"]:checked');
      return checked ? checked.value : '';
    }
    if (el.type === 'checkbox') return el.checked ? 'on' : '';
    return el.value;
  }

  function setFieldState(name, valid, message) {
    const el = fields[name];
    const group = document.getElementById('field-' + name);
    const errorEl = document.getElementById('error-' + name);
    const successEl = document.getElementById('success-' + name);

    if (!el) return;

    el.classList.remove('is-invalid', 'is-valid');
    el.setAttribute('aria-invalid', 'false');
    if (errorEl) errorEl.textContent = '';
    if (successEl) successEl.textContent = '';
    if (group) {
      group.classList.remove('has-error', 'has-success');
    }

    if (!valid) {
      el.classList.add('is-invalid');
      el.setAttribute('aria-invalid', 'true');
      if (group) group.classList.add('has-error');
      if (errorEl && message) errorEl.textContent = message;
    } else {
      el.classList.add('is-valid');
      if (group) group.classList.add('has-success');
      if (successEl) successEl.textContent = '\u2713';
    }
  }

  function clearField(name) {
    const el = fields[name];
    if (!el) return;
    el.classList.remove('is-invalid', 'is-valid');
    el.setAttribute('aria-invalid', 'false');
    const group = document.getElementById('field-' + name);
    if (group) group.classList.remove('has-error', 'has-success');
    const errorEl = document.getElementById('error-' + name);
    const successEl = document.getElementById('success-' + name);
    if (errorEl) errorEl.textContent = '';
    if (successEl) successEl.textContent = '';
  }

  // ------------------------------------------------------------------
  // Field validators (mirror the server; UX only — server is authoritative)
  // ------------------------------------------------------------------
  function validateFullName() {
    const v = getFieldValue('fullName');
    if (!v) { setFieldState('fullName', false, 'Full name is required.'); return false; }
    if (v.length < 2) { setFieldState('fullName', false, 'Full name must be at least 2 characters long.'); return false; }
    if (v.length > 100) { setFieldState('fullName', false, 'Full name must not exceed 100 characters.'); return false; }
    if (!REGEX.fullName.test(v)) { setFieldState('fullName', false, 'Full name may only contain letters, spaces, hyphens, and apostrophes.'); return false; }
    setFieldState('fullName', true); return true;
  }

  function validateEmail() {
    const v = getFieldValue('email');
    if (!v) { setFieldState('email', false, 'Email address is required.'); return false; }
    if (v.length > 255) { setFieldState('email', false, 'Email address is too long (max 255 characters).'); return false; }
    if (!REGEX.email.test(v)) { setFieldState('email', false, 'Please enter a valid email address.'); return false; }
    setFieldState('email', true); return true;
  }

  function validatePhone() {
    const v = getFieldValue('phone');
    if (!v) { setFieldState('phone', false, 'Phone number is required.'); return false; }
    if (!REGEX.phone.test(v)) { setFieldState('phone', false, 'Please enter a valid phone number (7–20 digits).'); return false; }
    const digits = v.replace(/\D/g, '');
    if (digits.length < 7 || digits.length > 15) { setFieldState('phone', false, 'Phone number must contain between 7 and 15 digits.'); return false; }
    setFieldState('phone', true); return true;
  }

  function validateStudentId() {
    const v = getFieldValue('studentId');
    if (!v) { setFieldState('studentId', false, 'Student ID is required.'); return false; }
    if (!REGEX.studentId.test(v.toUpperCase())) { setFieldState('studentId', false, 'Student ID must be 3–20 characters (letters, numbers, hyphens).'); return false; }
    setFieldState('studentId', true); return true;
  }

  function validateCourse() {
    const v = getFieldValue('course');
    if (!v) { setFieldState('course', false, 'Please select a course.'); return false; }
    setFieldState('course', true); return true;
  }

  function validateGender() {
    const v = getFieldValue('gender');
    if (!v) { setFieldState('gender', false, 'Please select a gender.'); return false; }
    setFieldState('gender', true); return true;
  }

  function validateDateOfBirth() {
    const v = getFieldValue('dateOfBirth');
    if (!v) { setFieldState('dateOfBirth', false, 'Date of birth is required.'); return false; }
    const dob = new Date(v + 'T00:00:00');
    if (Number.isNaN(dob.getTime())) { setFieldState('dateOfBirth', false, 'Please enter a valid date of birth.'); return false; }
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (dob > today) { setFieldState('dateOfBirth', false, 'Date of birth cannot be in the future.'); return false; }
    let age = today.getFullYear() - dob.getFullYear();
    const monthDiff = today.getMonth() - dob.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) age--;
    if (age < MIN_AGE) { setFieldState('dateOfBirth', false, 'You must be at least ' + MIN_AGE + ' years old to register.'); return false; }
    if (age > MAX_AGE) { setFieldState('dateOfBirth', false, 'Please enter a valid date of birth.'); return false; }
    setFieldState('dateOfBirth', true); return true;
  }

  function validateAddress() {
    const v = getFieldValue('address');
    if (!v) { setFieldState('address', false, 'Address is required.'); return false; }
    if (v.length < 5) { setFieldState('address', false, 'Address must be at least 5 characters long.'); return false; }
    if (v.length > 500) { setFieldState('address', false, 'Address must not exceed 500 characters.'); return false; }
    setFieldState('address', true); return true;
  }

  function validateTerms() {
    const el = fields.terms;
    if (!el.checked) { setFieldState('terms', false, 'You must accept the Terms and Conditions to register.'); return false; }
    setFieldState('terms', true); return true;
  }

  const validators = {
    fullName: validateFullName,
    email: validateEmail,
    phone: validatePhone,
    studentId: validateStudentId,
    course: validateCourse,
    gender: validateGender,
    dateOfBirth: validateDateOfBirth,
    address: validateAddress,
    terms: validateTerms
  };

  function validateAll() {
    let valid = true;
    REQUIRED.forEach(function (name) {
      if (!validators[name]()) valid = false;
    });
    return valid;
  }

  // ------------------------------------------------------------------
  // Character counters (full name, address)
  // ------------------------------------------------------------------
  function setupCounter(name) {
    const el = fields[name];
    const max = name === 'fullName' ? LIMITS.fullName.max : LIMITS.address.max;
    const currentEl = document.getElementById('count-' + name + '-current');
    const counterEl = document.getElementById('count-' + name);
    function update() {
      const len = el.value.length;
      if (currentEl) currentEl.textContent = len;
      if (counterEl) counterEl.classList.toggle('at-limit', len >= max);
    }
    el.addEventListener('input', update);
    update();
  }

  // ------------------------------------------------------------------
  // Form completion percentage
  // ------------------------------------------------------------------
  function updateCompletion() {
    let filled = 0;
    REQUIRED.forEach(function (name) {
      if (getFieldValue(name) !== '') filled++;
    });
    const pct = Math.round((filled / REQUIRED.length) * 100);
    const valEl = document.getElementById('completion-value');
    const fillEl = document.getElementById('completion-bar-fill');
    if (valEl) valEl.textContent = pct;
    if (fillEl) fillEl.style.width = pct + '%';
  }

  // ------------------------------------------------------------------
  // Toast notifications
  // ------------------------------------------------------------------
  function showToast(message, type) {
    let container = document.getElementById('toast-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'toast-container';
      document.body.appendChild(container);
    }
    const toast = document.createElement('div');
    toast.className = 'toast toast--' + (type || 'info');
    toast.textContent = message;
    container.appendChild(toast);
    // Force reflow before animating in
    void toast.offsetHeight;
    toast.classList.add('show');
    setTimeout(function () {
      toast.classList.remove('show');
      setTimeout(function () { toast.remove(); }, 300);
    }, 4000);
  }

  // ------------------------------------------------------------------
  // Re-apply server-side validation errors inline after a reload
  // ------------------------------------------------------------------
  function applyServerErrors() {
    const el = document.getElementById('server-errors');
    if (!el) return;
    try {
      const errors = JSON.parse(el.textContent);
      errors.forEach(function (err) {
        setFieldState(err.field, false, err.message);
      });
      updateCompletion();
    } catch (e) {
      // Ignore malformed payload
    }
  }

  // ------------------------------------------------------------------
  // Form submission
  // ------------------------------------------------------------------
  if (form) {
    form.addEventListener('submit', function (event) {
      const allValid = validateAll();
      updateCompletion();

      if (!allValid) {
        event.preventDefault();
        event.stopPropagation();
        showToast('Please fix the errors highlighted above before submitting.', 'error');
        const firstInvalid = form.querySelector('.is-invalid');
        if (firstInvalid) firstInvalid.focus();
        return;
      }

      // All client checks passed: show loading state, then let the
      // browser submit to the server (server validation is authoritative).
      const btn = document.getElementById('submitBtn');
      if (btn) {
        btn.dataset.originalText = btn.textContent;
        btn.textContent = 'Submitting…';
        btn.disabled = true;
        btn.classList.add('is-loading');
      }
      showToast('Submitting your registration…', 'info');
    });

    // Reset button (works independently of the browser reset)
    const resetBtn = document.getElementById('resetBtn');
    if (resetBtn) {
      resetBtn.addEventListener('click', function () {
        form.reset();
        REQUIRED.forEach(clearField);
        updateCompletion();
        document.querySelectorAll('.char-count').forEach(function (c) {
          c.classList.remove('at-limit');
        });
        showToast('Form reset.', 'info');
      });
    }
  }

  // ------------------------------------------------------------------
  // Real-time event listeners (input, change, blur)
  // ------------------------------------------------------------------
  ['fullName', 'email', 'phone', 'studentId', 'dateOfBirth', 'address'].forEach(function (name) {
    const el = fields[name];
    if (!el) return;
    el.addEventListener('input', function () {
      clearField(name);
      updateCompletion();
    });
    el.addEventListener('blur', function () {
      validators[name]();
      updateCompletion();
    });
    el.addEventListener('change', function () {
      validators[name]();
      updateCompletion();
    });
  });

  ['fullName', 'address'].forEach(function (name) {
    setupCounter(name);
  });

  document.querySelectorAll('input[name="gender"]').forEach(function (radio) {
    radio.addEventListener('change', function () {
      validateGender();
      updateCompletion();
    });
    radio.addEventListener('input', function () {
      clearField('gender');
      updateCompletion();
    });
  });

  fields.terms.addEventListener('change', function () {
    validateTerms();
    updateCompletion();
  });
  fields.terms.addEventListener('input', function () {
    clearField('terms');
    updateCompletion();
  });

  updateCompletion();

  // ------------------------------------------------------------------
  // Mobile navigation toggle (accessible)
  // ------------------------------------------------------------------
  const menuToggle = document.querySelector('.menu-toggle');
  const sidebar = document.querySelector('.sidebar');

  if (menuToggle && sidebar) {
    menuToggle.addEventListener('click', function () {
      const isOpen = sidebar.classList.toggle('open');
      menuToggle.setAttribute('aria-expanded', isOpen);
    });

    // Close sidebar when clicking outside
    document.addEventListener('click', function (event) {
      if (
        sidebar.classList.contains('open') &&
        !sidebar.contains(event.target) &&
        !menuToggle.contains(event.target)
      ) {
        sidebar.classList.remove('open');
        menuToggle.setAttribute('aria-expanded', 'false');
      }
    });

    // Close sidebar on Escape key
    document.addEventListener('keydown', function (event) {
      if (event.key === 'Escape' && sidebar.classList.contains('open')) {
        sidebar.classList.remove('open');
        menuToggle.setAttribute('aria-expanded', 'false');
        menuToggle.focus();
      }
    });

    // Close sidebar when a nav link is clicked (mobile)
    document.querySelectorAll('.nav-link').forEach(function (link) {
      link.addEventListener('click', function () {
        sidebar.classList.remove('open');
        menuToggle.setAttribute('aria-expanded', 'false');
      });
    });
  }

  // ------------------------------------------------------------------
  // Scroll to anchored section (e.g. /#registration from the nav)
  // ------------------------------------------------------------------
  function scrollToHash() {
    if (!window.location.hash) return;
    const target = document.getElementById(window.location.hash.slice(1));
    if (target) {
      setTimeout(function () {
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    }
  }

  // ------------------------------------------------------------------
  // Success page toast
  // ------------------------------------------------------------------
  if (document.querySelector('.success-section')) {
    setTimeout(function () {
      showToast('Registration confirmed! Welcome to Forma.', 'success');
    }, 300);
  }

  // ------------------------------------------------------------------
  // Initialize
  // ------------------------------------------------------------------
  document.addEventListener('DOMContentLoaded', function () {
    initFields();
    applyServerErrors();
    scrollToHash();
  });
})();