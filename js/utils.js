/**
 * utils.js
 * UUID generator, date helpers, sanitize helpers, debounce for search, 
 * storage helpers for UI prefs (localStorage wrappers)
 */

class UtilsManager {
  constructor() {
    this.dompurify = null;
  }

  /**
   * Generate UUID v4
   * @returns {string} UUID string
   */
  generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }

  /**
   * Format date to ISO date string (YYYY-MM-DD)
   * @param {Date|string} date - Date to format
   * @returns {string} ISO date string
   */
  formatISODate(date) {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  /**
   * Format date to ISO timestamp (YYYY-MM-DDTHH:mm:ss.sssZ)
   * @param {Date|string} date - Date to format
   * @returns {string} ISO timestamp string
   */
  formatISOTimestamp(date) {
    return new Date(date).toISOString();
  }

  /**
   * Parse ISO date string
   * @param {string} dateString - ISO date string
   * @returns {Date} Date object
   */
  parseISODate(dateString) {
    return new Date(dateString);
  }

  /**
   * Format date for display
   * @param {Date|string} date - Date to format
   * @param {string} format - Format type ('short', 'long', 'time')
   * @returns {string} Formatted date string
   */
  formatDate(date, format = 'short') {
    const d = new Date(date);
    
    switch (format) {
      case 'short':
        return d.toLocaleDateString();
      case 'long':
        return d.toLocaleDateString(undefined, { 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric' 
        });
      case 'time':
        return d.toLocaleString();
      default:
        return d.toLocaleDateString();
    }
  }

  /**
   * Get relative time string (e.g., "2 days ago")
   * @param {Date|string} date - Date to format
   * @returns {string} Relative time string
   */
  getRelativeTime(date) {
    const d = new Date(date);
    const now = new Date();
    const diffMs = now - d;
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHour = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHour / 24);
    const diffWeek = Math.floor(diffDay / 7);
    const diffMonth = Math.floor(diffDay / 30);
    const diffYear = Math.floor(diffDay / 365);

    if (diffSec < 60) {
      return 'just now';
    } else if (diffMin < 60) {
      return `${diffMin} minute${diffMin > 1 ? 's' : ''} ago`;
    } else if (diffHour < 24) {
      return `${diffHour} hour${diffHour > 1 ? 's' : ''} ago`;
    } else if (diffDay < 7) {
      return `${diffDay} day${diffDay > 1 ? 's' : ''} ago`;
    } else if (diffWeek < 4) {
      return `${diffWeek} week${diffWeek > 1 ? 's' : ''} ago`;
    } else if (diffMonth < 12) {
      return `${diffMonth} month${diffMonth > 1 ? 's' : ''} ago`;
    } else {
      return `${diffYear} year${diffYear > 1 ? 's' : ''} ago`;
    }
  }

  /**
   * Debounce function - delays execution until after wait time has elapsed
   * @param {Function} func - Function to debounce
   * @param {number} wait - Wait time in milliseconds
   * @returns {Function} Debounced function
   */
  debounce(func, wait = 300) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }

  /**
   * Throttle function - limits execution to once per wait period
   * @param {Function} func - Function to throttle
   * @param {number} wait - Wait time in milliseconds
   * @returns {Function} Throttled function
   */
  throttle(func, wait = 300) {
    let inThrottle;
    return function(...args) {
      if (!inThrottle) {
        func.apply(this, args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, wait);
      }
    };
  }

  /**
   * Escape HTML to prevent XSS
   * @param {string} text - Text to escape
   * @returns {string} Escaped text
   */
  escapeHtml(text) {
    if (typeof text !== 'string') {
      return '';
    }

    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  /**
   * Sanitize text input (basic sanitization)
   * @param {string} text - Text to sanitize
   * @returns {string} Sanitized text
   */
  sanitizeText(text) {
    if (typeof text !== 'string') {
      return '';
    }

    // Remove any HTML tags
    return text.replace(/<[^>]*>/g, '').trim();
  }

  /**
   * Sanitize HTML using DOMPurify (if available)
   * @param {string} html - HTML to sanitize
   * @returns {string} Sanitized HTML
   */
  sanitizeHtml(html) {
    // If DOMPurify is loaded, use it
    if (typeof DOMPurify !== 'undefined') {
      return DOMPurify.sanitize(html, {
        ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a', 'p', 'br', 'ul', 'ol', 'li'],
        ALLOWED_ATTR: ['href', 'target', 'rel'],
      });
    }

    // Fallback: escape everything
    return this.escapeHtml(html);
  }

  /**
   * Sanitize filename for safe storage
   * @param {string} filename - Filename to sanitize
   * @returns {string} Sanitized filename
   */
  sanitizeFilename(filename) {
    if (typeof filename !== 'string') {
      return 'untitled';
    }

    // Remove or replace unsafe characters
    return filename
      .replace(/[^a-zA-Z0-9._-]/g, '_')
      .replace(/_{2,}/g, '_')
      .substring(0, 255);
  }

  /**
   * Get preference from localStorage
   * @param {string} key - Preference key
   * @param {*} defaultValue - Default value if not found
   * @returns {*} Preference value
   */
  getPreference(key, defaultValue = null) {
    try {
      const value = localStorage.getItem(`decisionlog_${key}`);
      if (value === null) {
        return defaultValue;
      }
      return JSON.parse(value);
    } catch (error) {
      console.error('Error getting preference:', error);
      return defaultValue;
    }
  }

  /**
   * Set preference in localStorage
   * @param {string} key - Preference key
   * @param {*} value - Value to store
   */
  setPreference(key, value) {
    try {
      localStorage.setItem(`decisionlog_${key}`, JSON.stringify(value));
    } catch (error) {
      console.error('Error setting preference:', error);
    }
  }

  /**
   * Remove preference from localStorage
   * @param {string} key - Preference key
   */
  removePreference(key) {
    try {
      localStorage.removeItem(`decisionlog_${key}`);
    } catch (error) {
      console.error('Error removing preference:', error);
    }
  }

  /**
   * Clear all preferences
   */
  clearAllPreferences() {
    try {
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        if (key.startsWith('decisionlog_')) {
          localStorage.removeItem(key);
        }
      });
    } catch (error) {
      console.error('Error clearing preferences:', error);
    }
  }

  /**
   * Deep clone an object
   * @param {*} obj - Object to clone
   * @returns {*} Cloned object
   */
  deepClone(obj) {
    if (obj === null || typeof obj !== 'object') {
      return obj;
    }

    if (obj instanceof Date) {
      return new Date(obj.getTime());
    }

    if (obj instanceof Array) {
      return obj.map(item => this.deepClone(item));
    }

    if (obj instanceof Object) {
      const clonedObj = {};
      for (const key in obj) {
        if (obj.hasOwnProperty(key)) {
          clonedObj[key] = this.deepClone(obj[key]);
        }
      }
      return clonedObj;
    }

    throw new Error('Unable to clone object');
  }

  /**
   * Check if object is empty
   * @param {Object} obj - Object to check
   * @returns {boolean} True if empty
   */
  isEmpty(obj) {
    if (obj === null || obj === undefined) {
      return true;
    }

    if (Array.isArray(obj)) {
      return obj.length === 0;
    }

    if (typeof obj === 'object') {
      return Object.keys(obj).length === 0;
    }

    return false;
  }

  /**
   * Truncate text to specified length
   * @param {string} text - Text to truncate
   * @param {number} maxLength - Maximum length
   * @param {string} suffix - Suffix to add (default '...')
   * @returns {string} Truncated text
   */
  truncate(text, maxLength, suffix = '...') {
    if (typeof text !== 'string') {
      return '';
    }

    if (text.length <= maxLength) {
      return text;
    }

    return text.substring(0, maxLength - suffix.length) + suffix;
  }

  /**
   * Capitalize first letter of string
   * @param {string} str - String to capitalize
   * @returns {string} Capitalized string
   */
  capitalize(str) {
    if (typeof str !== 'string' || str.length === 0) {
      return '';
    }

    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  /**
   * Convert string to slug (URL-friendly)
   * @param {string} str - String to convert
   * @returns {string} Slug string
   */
  slugify(str) {
    if (typeof str !== 'string') {
      return '';
    }

    return str
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  /**
   * Parse query string from URL
   * @param {string} queryString - Query string (with or without leading ?)
   * @returns {Object} Parsed query parameters
   */
  parseQueryString(queryString) {
    if (!queryString) {
      return {};
    }

    const params = {};
    const query = queryString.startsWith('?') ? queryString.substring(1) : queryString;
    const pairs = query.split('&');

    pairs.forEach(pair => {
      const [key, value] = pair.split('=');
      if (key) {
        params[decodeURIComponent(key)] = value ? decodeURIComponent(value) : '';
      }
    });

    return params;
  }

  /**
   * Build query string from object
   * @param {Object} params - Parameters object
   * @returns {string} Query string
   */
  buildQueryString(params) {
    if (!params || typeof params !== 'object') {
      return '';
    }

    const pairs = [];
    Object.keys(params).forEach(key => {
      const value = params[key];
      if (value !== null && value !== undefined) {
        pairs.push(`${encodeURIComponent(key)}=${encodeURIComponent(value)}`);
      }
    });

    return pairs.length > 0 ? `?${pairs.join('&')}` : '';
  }

  /**
   * Check if user is on mobile device
   * @returns {boolean} True if mobile
   */
  isMobile() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  }

  /**
   * Check if user prefers reduced motion
   * @returns {boolean} True if reduced motion preferred
   */
  prefersReducedMotion() {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  /**
   * Check if user prefers dark mode
   * @returns {boolean} True if dark mode preferred
   */
  prefersDarkMode() {
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  }

  /**
   * Copy text to clipboard
   * @param {string} text - Text to copy
   * @returns {Promise<boolean>} Success status
   */
  async copyToClipboard(text) {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(text);
        return true;
      } else {
        // Fallback for older browsers
        const textarea = document.createElement('textarea');
        textarea.value = text;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.select();
        const success = document.execCommand('copy');
        document.body.removeChild(textarea);
        return success;
      }
    } catch (error) {
      console.error('Error copying to clipboard:', error);
      return false;
    }
  }

  /**
   * Wait for specified time
   * @param {number} ms - Milliseconds to wait
   * @returns {Promise} Promise that resolves after wait time
   */
  async wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Retry function with exponential backoff
   * @param {Function} fn - Function to retry
   * @param {number} maxRetries - Maximum number of retries
   * @param {number} delay - Initial delay in milliseconds
   * @returns {Promise} Promise that resolves with function result
   */
  async retry(fn, maxRetries = 3, delay = 1000) {
    let lastError;

    for (let i = 0; i < maxRetries; i++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error;
        if (i < maxRetries - 1) {
          await this.wait(delay * Math.pow(2, i));
        }
      }
    }

    throw lastError;
  }

  /**
   * Format file size for display
   * @param {number} bytes - File size in bytes
   * @returns {string} Formatted file size
   */
  formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  }

  /**
   * Validate email address
   * @param {string} email - Email to validate
   * @returns {boolean} True if valid
   */
  isValidEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  }

  /**
   * Get browser information
   * @returns {Object} Browser info
   */
  getBrowserInfo() {
    const ua = navigator.userAgent;
    let browserName = 'Unknown';
    let browserVersion = 'Unknown';

    if (ua.indexOf('Firefox') > -1) {
      browserName = 'Firefox';
      browserVersion = ua.match(/Firefox\/([0-9.]+)/)?.[1] || 'Unknown';
    } else if (ua.indexOf('Chrome') > -1) {
      browserName = 'Chrome';
      browserVersion = ua.match(/Chrome\/([0-9.]+)/)?.[1] || 'Unknown';
    } else if (ua.indexOf('Safari') > -1) {
      browserName = 'Safari';
      browserVersion = ua.match(/Version\/([0-9.]+)/)?.[1] || 'Unknown';
    } else if (ua.indexOf('Edge') > -1) {
      browserName = 'Edge';
      browserVersion = ua.match(/Edge\/([0-9.]+)/)?.[1] || 'Unknown';
    }

    return {
      name: browserName,
      version: browserVersion,
      userAgent: ua,
    };
  }
}

// Export singleton instance
const utilsManager = new UtilsManager();

// Make available globally
if (typeof window !== 'undefined') {
  window.utils = utilsManager;
}
