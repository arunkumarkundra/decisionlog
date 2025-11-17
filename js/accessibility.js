/**
 * accessibility.js
 * Utilities for focus trap modals, keyboard navigation helpers, and ARIA utilities
 * Ensures WCAG 2.1 AA compliance
 */

class AccessibilityManager {
  constructor() {
    this.focusStack = [];
    this.currentTrap = null;
    this.highContrastEnabled = false;
    this.announceRegion = null;
  }

  /**
   * Initialize accessibility features
   */
  initialize() {
    this.createAnnounceRegion();
    this.setupHighContrastToggle();
    this.setupSkipLinks();
    this.loadAccessibilityPreferences();
    this.setupFocusVisibility();
  }

  /**
   * Create ARIA live region for announcements
   */
  createAnnounceRegion() {
    if (this.announceRegion) {
      return;
    }

    this.announceRegion = document.createElement('div');
    this.announceRegion.setAttribute('role', 'status');
    this.announceRegion.setAttribute('aria-live', 'polite');
    this.announceRegion.setAttribute('aria-atomic', 'true');
    this.announceRegion.className = 'sr-only';
    document.body.appendChild(this.announceRegion);
  }

  /**
   * Announce message to screen readers
   * @param {string} message - Message to announce
   * @param {string} priority - 'polite' or 'assertive'
   */
  announce(message, priority = 'polite') {
    if (!this.announceRegion) {
      this.createAnnounceRegion();
    }

    this.announceRegion.setAttribute('aria-live', priority);
    
    // Clear and set message
    this.announceRegion.textContent = '';
    setTimeout(() => {
      this.announceRegion.textContent = message;
    }, 100);
  }

  /**
   * Trap focus within a container (for modals)
   * @param {HTMLElement} container - Container element to trap focus in
   */
  trapFocus(container) {
    if (!container) {
      return;
    }

    // Store previous active element
    const previouslyFocused = document.activeElement;
    this.focusStack.push(previouslyFocused);

    // Get all focusable elements
    const focusableElements = this.getFocusableElements(container);
    
    if (focusableElements.length === 0) {
      return;
    }

    const firstFocusable = focusableElements[0];
    const lastFocusable = focusableElements[focusableElements.length - 1];

    // Trap focus handler
    const trapHandler = (e) => {
      if (e.key !== 'Tab') {
        return;
      }

      if (e.shiftKey) {
        // Shift + Tab
        if (document.activeElement === firstFocusable) {
          e.preventDefault();
          lastFocusable.focus();
        }
      } else {
        // Tab
        if (document.activeElement === lastFocusable) {
          e.preventDefault();
          firstFocusable.focus();
        }
      }
    };

    // Escape to close
    const escapeHandler = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        this.releaseFocus();
        
        // Try to find and trigger close button
        const closeBtn = container.querySelector('.modal-close, [data-action="cancel"]');
        if (closeBtn) {
          closeBtn.click();
        }
      }
    };

    container.addEventListener('keydown', trapHandler);
    container.addEventListener('keydown', escapeHandler);

    this.currentTrap = {
      container,
      trapHandler,
      escapeHandler,
    };

    // Focus first element
    setTimeout(() => {
      firstFocusable.focus();
    }, 50);
  }

  /**
   * Release focus trap and return focus to previous element
   */
  releaseFocus() {
    if (this.currentTrap) {
      const { container, trapHandler, escapeHandler } = this.currentTrap;
      container.removeEventListener('keydown', trapHandler);
      container.removeEventListener('keydown', escapeHandler);
      this.currentTrap = null;
    }

    // Return focus to previous element
    const previouslyFocused = this.focusStack.pop();
    if (previouslyFocused && previouslyFocused.focus) {
      setTimeout(() => {
        previouslyFocused.focus();
      }, 50);
    }
  }

  /**
   * Get all focusable elements within a container
   * @param {HTMLElement} container - Container element
   * @returns {Array} Array of focusable elements
   */
  getFocusableElements(container) {
    const selector = [
      'a[href]',
      'button:not([disabled])',
      'textarea:not([disabled])',
      'input:not([disabled])',
      'select:not([disabled])',
      '[tabindex]:not([tabindex="-1"])',
    ].join(', ');

    const elements = Array.from(container.querySelectorAll(selector));
    
    // Filter out hidden elements
    return elements.filter(el => {
      return el.offsetWidth > 0 && 
             el.offsetHeight > 0 && 
             window.getComputedStyle(el).visibility !== 'hidden';
    });
  }

  /**
   * Setup high contrast mode toggle
   */
  setupHighContrastToggle() {
    const toggle = document.getElementById('high-contrast-toggle');
    if (!toggle) {
      return;
    }

    toggle.addEventListener('change', (e) => {
      this.setHighContrast(e.target.checked);
    });

    // Set initial state
    const savedPreference = window.utils.getPreference('highContrast', false);
    toggle.checked = savedPreference;
    this.setHighContrast(savedPreference);
  }

  /**
   * Enable or disable high contrast mode
   * @param {boolean} enabled - Whether to enable high contrast
   */
  setHighContrast(enabled) {
    this.highContrastEnabled = enabled;
    
    if (enabled) {
      document.body.classList.add('high-contrast');
    } else {
      document.body.classList.remove('high-contrast');
    }

    window.utils.setPreference('highContrast', enabled);
    this.announce(`High contrast mode ${enabled ? 'enabled' : 'disabled'}`);
  }

  /**
   * Setup skip links for keyboard navigation
   */
  setupSkipLinks() {
    const skipLink = document.querySelector('.skip-link');
    if (!skipLink) {
      return;
    }

    skipLink.addEventListener('click', (e) => {
      e.preventDefault();
      const targetId = skipLink.getAttribute('href').substring(1);
      const target = document.getElementById(targetId);
      
      if (target) {
        target.setAttribute('tabindex', '-1');
        target.focus();
        target.addEventListener('blur', () => {
          target.removeAttribute('tabindex');
        }, { once: true });
      }
    });
  }

  /**
   * Load saved accessibility preferences
   */
  loadAccessibilityPreferences() {
    // High contrast
    const highContrast = window.utils.getPreference('highContrast', false);
    this.setHighContrast(highContrast);

    // Keyboard shortcuts
    const keyboardShortcuts = window.utils.getPreference('keyboardShortcuts', true);
    const shortcutsToggle = document.getElementById('keyboard-shortcuts-toggle');
    if (shortcutsToggle) {
      shortcutsToggle.checked = keyboardShortcuts;
    }

    // Font size (if implemented)
    const fontSize = window.utils.getPreference('fontSize', 'medium');
    this.setFontSize(fontSize);
  }

  /**
   * Set font size preference
   * @param {string} size - Font size ('small', 'medium', 'large')
   */
  setFontSize(size) {
    document.body.classList.remove('font-small', 'font-medium', 'font-large');
    document.body.classList.add(`font-${size}`);
    window.utils.setPreference('fontSize', size);
  }

  /**
   * Setup focus visibility (show focus only on keyboard navigation)
   */
  setupFocusVisibility() {
    let isUsingKeyboard = false;

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Tab') {
        isUsingKeyboard = true;
        document.body.classList.add('keyboard-nav');
      }
    });

    document.addEventListener('mousedown', () => {
      isUsingKeyboard = false;
      document.body.classList.remove('keyboard-nav');
    });
  }

  /**
   * Make an element keyboard accessible
   * @param {HTMLElement} element - Element to make accessible
   * @param {Function} onClick - Click handler
   */
  makeKeyboardAccessible(element, onClick) {
    if (!element) {
      return;
    }

    // Ensure element is focusable
    if (!element.hasAttribute('tabindex')) {
      element.setAttribute('tabindex', '0');
    }

    // Add keyboard handler
    element.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        onClick(e);
      }
    });

    // Add click handler
    element.addEventListener('click', onClick);
  }

  /**
   * Ensure proper heading hierarchy
   * @param {HTMLElement} container - Container to check
   * @returns {Array} Array of heading level violations
   */
  checkHeadingHierarchy(container = document.body) {
    const headings = Array.from(container.querySelectorAll('h1, h2, h3, h4, h5, h6'));
    const violations = [];
    let previousLevel = 0;

    headings.forEach((heading, index) => {
      const level = parseInt(heading.tagName.substring(1));
      
      if (index === 0 && level !== 1) {
        violations.push({
          element: heading,
          message: 'First heading should be h1',
        });
      }

      if (level > previousLevel + 1) {
        violations.push({
          element: heading,
          message: `Heading level skipped from h${previousLevel} to h${level}`,
        });
      }

      previousLevel = level;
    });

    return violations;
  }

  /**
   * Ensure all images have alt text
   * @param {HTMLElement} container - Container to check
   * @returns {Array} Array of images missing alt text
   */
  checkImageAltText(container = document.body) {
    const images = Array.from(container.querySelectorAll('img'));
    const violations = [];

    images.forEach(img => {
      if (!img.hasAttribute('alt')) {
        violations.push({
          element: img,
          message: 'Image missing alt attribute',
        });
      }
    });

    return violations;
  }

  /**
   * Check color contrast (simplified check)
   * @param {HTMLElement} element - Element to check
   * @returns {Object} Contrast information
   */
  checkColorContrast(element) {
    const style = window.getComputedStyle(element);
    const backgroundColor = style.backgroundColor;
    const color = style.color;

    // This is a simplified check - full implementation would calculate actual contrast ratio
    return {
      element,
      backgroundColor,
      color,
      // Would need to calculate actual ratio for WCAG AA (4.5:1) or AAA (7:1)
    };
  }

  /**
   * Validate form accessibility
   * @param {HTMLFormElement} form - Form to validate
   * @returns {Array} Array of accessibility issues
   */
  validateFormAccessibility(form) {
    const issues = [];

    // Check for labels
    const inputs = form.querySelectorAll('input, select, textarea');
    inputs.forEach(input => {
      const id = input.id;
      if (id) {
        const label = form.querySelector(`label[for="${id}"]`);
        if (!label && !input.hasAttribute('aria-label') && !input.hasAttribute('aria-labelledby')) {
          issues.push({
            element: input,
            message: 'Input missing associated label',
          });
        }
      } else {
        issues.push({
          element: input,
          message: 'Input missing id attribute',
        });
      }
    });

    // Check for required fields
    const requiredInputs = form.querySelectorAll('[required]');
    requiredInputs.forEach(input => {
      if (!input.hasAttribute('aria-required')) {
        issues.push({
          element: input,
          message: 'Required input missing aria-required attribute',
        });
      }
    });

    // Check for error messages
    const errorElements = form.querySelectorAll('.form-error, [role="alert"]');
    errorElements.forEach(error => {
      if (error.textContent.trim() && !error.id) {
        issues.push({
          element: error,
          message: 'Error message should have an id for aria-describedby reference',
        });
      }
    });

    return issues;
  }

  /**
   * Run basic accessibility audit
   * @param {HTMLElement} container - Container to audit
   * @returns {Object} Audit results
   */
  runAccessibilityAudit(container = document.body) {
    const results = {
      headingViolations: this.checkHeadingHierarchy(container),
      imageViolations: this.checkImageAltText(container),
      formIssues: [],
    };

    // Check all forms
    const forms = container.querySelectorAll('form');
    forms.forEach(form => {
      const issues = this.validateFormAccessibility(form);
      if (issues.length > 0) {
        results.formIssues.push({
          form,
          issues,
        });
      }
    });

    // Log results
    console.log('Accessibility Audit Results:', results);

    return results;
  }

  /**
   * Add ARIA live region update
   * @param {string} message - Message to announce
   * @param {string} priority - 'polite' or 'assertive'
   */
  announceToScreenReader(message, priority = 'polite') {
    this.announce(message, priority);
  }

  /**
   * Create accessible tooltip
   * @param {HTMLElement} trigger - Element that triggers tooltip
   * @param {string} content - Tooltip content
   */
  createAccessibleTooltip(trigger, content) {
    const tooltipId = `tooltip-${window.utils.generateUUID()}`;
    
    const tooltip = document.createElement('div');
    tooltip.id = tooltipId;
    tooltip.className = 'tooltip';
    tooltip.setAttribute('role', 'tooltip');
    tooltip.textContent = content;
    document.body.appendChild(tooltip);

    trigger.setAttribute('aria-describedby', tooltipId);

    let hideTimeout;

    const show = () => {
      clearTimeout(hideTimeout);
      tooltip.classList.add('visible');
      
      // Position tooltip
      const rect = trigger.getBoundingClientRect();
      tooltip.style.top = `${rect.bottom + 8}px`;
      tooltip.style.left = `${rect.left}px`;
    };

    const hide = () => {
      hideTimeout = setTimeout(() => {
        tooltip.classList.remove('visible');
      }, 200);
    };

    trigger.addEventListener('mouseenter', show);
    trigger.addEventListener('mouseleave', hide);
    trigger.addEventListener('focus', show);
    trigger.addEventListener('blur', hide);

    return {
      show,
      hide,
      destroy: () => {
        trigger.removeEventListener('mouseenter', show);
        trigger.removeEventListener('mouseleave', hide);
        trigger.removeEventListener('focus', show);
        trigger.removeEventListener('blur', hide);
        tooltip.remove();
      },
    };
  }
}

// Export singleton instance
const accessibilityManager = new AccessibilityManager();

// Make available globally
if (typeof window !== 'undefined') {
  window.accessibility = accessibilityManager;
}
