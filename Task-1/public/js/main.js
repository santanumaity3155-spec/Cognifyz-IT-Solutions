/**
 * Forma — Student Intelligence
 * Frontend interactions for Task 1
 *
 * Handles mobile navigation toggle, form feedback, and accessibility enhancements.
 * The server remains responsible for all form processing and validation.
 */

(function () {
  'use strict';

  // ------------------------------------------------------------------
  // Mobile navigation toggle
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
  }

  // ------------------------------------------------------------------
  // Form submission feedback
  // ------------------------------------------------------------------
  const registrationForm = document.querySelector('.registration-form');

  if (registrationForm) {
    const submitBtn = registrationForm.querySelector('button[type="submit"]');

    registrationForm.addEventListener('submit', function (event) {
      // Button feedback (server handles actual validation)
      if (submitBtn) {
        const originalText = submitBtn.textContent;
        submitBtn.textContent = 'Submitting...';
        submitBtn.disabled = true;

        // Re-enable after a short delay (in case of client-side navigation issues)
        setTimeout(function () {
          submitBtn.textContent = originalText;
          submitBtn.disabled = false;
        }, 2000);
      }
    });

    // Real-time input styling: show valid state on blur for fields that pass
    const inputs = registrationForm.querySelectorAll('input, select');
    inputs.forEach(function (input) {
      input.addEventListener('blur', function () {
        if (input.checkValidity()) {
          input.style.borderColor = 'var(--color-success)';
        } else if (input.value.trim() !== '') {
          input.style.borderColor = 'var(--color-error)';
        } else {
          input.style.borderColor = '';
        }
      });

      input.addEventListener('input', function () {
        input.style.borderColor = '';
      });
    });
  }

  // ------------------------------------------------------------------
  // Success page: auto-hide any temporary messages (future-proofing)
  // ------------------------------------------------------------------
  const alerts = document.querySelectorAll('.alert');
  alerts.forEach(function (alert) {
    setTimeout(function () {
      alert.style.opacity = '0';
      setTimeout(function () {
        alert.remove();
      }, 300);
    }, 8000);
  });
})();