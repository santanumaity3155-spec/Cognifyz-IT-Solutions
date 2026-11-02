/**
 * Forma — Student Intelligence Platform
 * public/js/main.js — Task 3 frontend interactions
 *
 * Responsibilities:
 * - Scroll-triggered entrance animations (Intersection Observer)
 * - Bootstrap 5 component initialization
 * - Contact form submission feedback
 *
 * NOTE: public/js/validation.js handles registration form validation,
 * field states, completion bar, toasts, mobile nav toggle, and scroll-to-hash.
 * This file does NOT duplicate any of that functionality.
 */

(function () {
  'use strict';

  // ------------------------------------------------------------------
  // Scroll-triggered entrance animations
  // ------------------------------------------------------------------
  function initScrollAnimations() {
    const observerOptions = {
      threshold: 0.1,
      rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('animate-fade-in-up');
          observer.unobserve(entry.target);
        }
      });
    }, observerOptions);

    document.querySelectorAll('[data-animate]').forEach(function (el) {
      observer.observe(el);
    });

    // Also animate cards and sections on scroll
    document.querySelectorAll('.forma-card, .stat-card, .hover-card').forEach(function (el) {
      observer.observe(el);
    });
  }

  // ------------------------------------------------------------------
  // Bootstrap 5 initialization
  // ------------------------------------------------------------------
  function initBootstrap() {
    // Initialize all tooltips
    var tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
    tooltipTriggerList.map(function (tooltipTriggerEl) {
      return new bootstrap.Tooltip(tooltipTriggerEl);
    });

    // Initialize all popovers
    var popoverTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="popover"]'));
    popoverTriggerList.map(function (popoverTriggerEl) {
      return new bootstrap.Popover(popoverTriggerEl);
    });
  }

  // ------------------------------------------------------------------
  // Contact form submission (demo feedback only)
  // ------------------------------------------------------------------
  function initContactForm() {
    var contactForm = document.querySelector('.contact-form');
    if (!contactForm) return;

    contactForm.addEventListener('submit', function (event) {
      event.preventDefault();
      event.stopPropagation();

      var btn = contactForm.querySelector('button[type="submit"]');
      var originalText = btn.textContent;

      // Basic HTML5 validation check
      if (!contactForm.checkValidity()) {
        contactForm.classList.add('was-validated');
        return;
      }

      // Simulate submission with loading state
      btn.disabled = true;
      btn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Sending...';

      setTimeout(function () {
        btn.disabled = false;
        btn.textContent = 'Message Sent!';
        btn.classList.remove('btn-primary');
        btn.classList.add('btn-success');

        contactForm.reset();
        contactForm.classList.remove('was-validated');

        setTimeout(function () {
          btn.textContent = originalText;
          btn.classList.remove('btn-success');
          btn.classList.add('btn-primary');
        }, 3000);
      }, 1500);
    });
  }

  // ------------------------------------------------------------------
  // Initialize on DOM ready
  // ------------------------------------------------------------------
  document.addEventListener('DOMContentLoaded', function () {
    initScrollAnimations();
    initBootstrap();
    initContactForm();
  });
})();