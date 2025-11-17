/**
 * script.js
 * App bootstrap: load auth, show home, wire up event listeners, initialize UI
 */

(async function initializeApp() {
  'use strict';

  console.log('DecisionLog initializing...');

  /**
   * Wait for DOM to be ready
   */
  function waitForDOM() {
    return new Promise(resolve => {
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', resolve);
      } else {
        resolve();
      }
    });
  }

  /**
   * Wait for Google API libraries to load
   */
  function waitForGoogleAPIs() {
    return new Promise(resolve => {
      const checkInterval = setInterval(() => {
        if (typeof gapi !== 'undefined' && typeof google !== 'undefined') {
          clearInterval(checkInterval);
          resolve();
        }
      }, 100);

      // Timeout after 10 seconds
      setTimeout(() => {
        clearInterval(checkInterval);
        if (typeof gapi === 'undefined' || typeof google === 'undefined') {
          console.error('Failed to load Google APIs');
          window.uiManager.showToast('Failed to load Google APIs. Please refresh the page.', 'error');
        }
        resolve();
      }, 10000);
    });
  }

  /**
   * Wait for all application modules to be loaded
   */
  function waitForModules() {
    return new Promise(resolve => {
      const checkInterval = setInterval(() => {
        if (
          window.utils &&
          window.accessibility &&
          window.authManager &&
          window.storageManager &&
          window.charts &&
          window.forms &&
          window.uiManager
        ) {
          clearInterval(checkInterval);
          resolve();
        }
      }, 50);

      // Timeout after 5 seconds
      setTimeout(() => {
        clearInterval(checkInterval);
        console.error('Failed to load all modules');
        resolve(); // Continue anyway
      }, 5000);
    });
  }

  try {
    // Wait for DOM
    await waitForDOM();
    console.log('DOM ready');

    // Wait for modules
    await waitForModules();
    console.log('Modules loaded');

    // Wait for Google APIs
    await waitForGoogleAPIs();
    console.log('Google APIs loaded');

    // Initialize accessibility features
    window.accessibility.initialize();
    console.log('Accessibility initialized');

    // Initialize UI
    window.uiManager.initialize();
    console.log('UI initialized');

    // Initialize authentication
    await window.authManager.initialize();
    console.log('Auth initialized');

    // Setup auth state change listener
    window.authManager.onAuthChange((isSignedIn, userInfo) => {
      console.log('Auth state changed:', isSignedIn);
      
      if (isSignedIn) {
        console.log('User signed in:', userInfo?.email);
        
        // Show file picker modal
        window.uiManager.showFilePickerModal();
      } else {
        console.log('User signed out');
        
        // Show home view
        window.uiManager.showView('home');
      }
    });

    // Setup additional sign-in buttons
    const signInBtnCta = document.getElementById('sign-in-btn-cta');
    if (signInBtnCta) {
      signInBtnCta.addEventListener('click', () => {
        window.authManager.signIn();
      });
    }

    // Setup keyboard shortcuts toggle
    const keyboardShortcutsToggle = document.getElementById('keyboard-shortcuts-toggle');
    if (keyboardShortcutsToggle) {
      keyboardShortcutsToggle.addEventListener('change', (e) => {
        window.utils.setPreference('keyboardShortcuts', e.target.checked);
        window.accessibility.announce(
          `Keyboard shortcuts ${e.target.checked ? 'enabled' : 'disabled'}`
        );
      });

      // Set initial state
      const savedPreference = window.utils.getPreference('keyboardShortcuts', true);
      keyboardShortcutsToggle.checked = savedPreference;
    }

    // Setup theme detection
    if (window.utils.prefersDarkMode()) {
      document.body.classList.add('prefers-dark');
    }

    // Handle reduced motion preference
    if (window.utils.prefersReducedMotion()) {
      document.body.classList.add('reduce-motion');
    }

    // Listen for online/offline events
    window.addEventListener('online', () => {
      window.uiManager.showToast('Connection restored', 'success');
    });

    window.addEventListener('offline', () => {
      window.uiManager.showToast('You are offline. Changes cannot be saved until connection is restored.', 'warning');
    });

    // Handle beforeunload - warn if there are unsaved changes
    window.addEventListener('beforeunload', (e) => {
      const data = window.storageManager.getCurrentData();
      if (data) {
        // In a real implementation, you might track whether there are unsaved changes
        // For now, we just ensure the user is aware they're leaving
        const message = 'Make sure your changes are saved before leaving.';
        e.returnValue = message;
        return message;
      }
    });

    // Log successful initialization
    console.log('DecisionLog initialized successfully');
    
    // Announce to screen readers
    window.accessibility.announce('DecisionLog application loaded and ready');

    // Optional: Run accessibility audit in development
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      console.log('Running accessibility audit...');
      const auditResults = window.accessibility.runAccessibilityAudit();
      
      if (auditResults.headingViolations.length > 0) {
        console.warn('Heading violations found:', auditResults.headingViolations);
      }
      if (auditResults.imageViolations.length > 0) {
        console.warn('Image violations found:', auditResults.imageViolations);
      }
      if (auditResults.formIssues.length > 0) {
        console.warn('Form issues found:', auditResults.formIssues);
      }
      
      if (
        auditResults.headingViolations.length === 0 &&
        auditResults.imageViolations.length === 0 &&
        auditResults.formIssues.length === 0
      ) {
        console.log('✓ Accessibility audit passed!');
      }
    }

  } catch (error) {
    console.error('Failed to initialize DecisionLog:', error);
    
    // Show error to user
    const errorMessage = document.createElement('div');
    errorMessage.className = 'init-error';
    errorMessage.setAttribute('role', 'alert');
    errorMessage.innerHTML = `
      <h2>Failed to Initialize DecisionLog</h2>
      <p>${error.message || 'An unknown error occurred.'}</p>
      <p>Please try refreshing the page. If the problem persists, check your browser console for more details.</p>
      <button onclick="location.reload()" class="btn btn-primary">Refresh Page</button>
    `;
    
    document.body.innerHTML = '';
    document.body.appendChild(errorMessage);
  }
})();

/**
 * Service Worker Registration (Optional)
 * Uncomment to enable offline functionality via Service Worker
 */
/*
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/service-worker.js')
      .then(registration => {
        console.log('ServiceWorker registered:', registration);
      })
      .catch(error => {
        console.log('ServiceWorker registration failed:', error);
      });
  });
}
*/

/**
 * Handle app updates (for progressive web app functionality)
 * Uncomment if implementing PWA features
 */
/*
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.ready.then(registration => {
    registration.addEventListener('updatefound', () => {
      const newWorker = registration.installing;
      
      newWorker.addEventListener('statechange', () => {
        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
          // New version available
          if (confirm('A new version of DecisionLog is available. Reload to update?')) {
            window.location.reload();
          }
        }
      });
    });
  });
}
*/

/**
 * Global error handler
 */
window.addEventListener('error', (event) => {
  console.error('Global error:', event.error);
  
  // Don't show toast for script loading errors - those are already handled
  if (event.error && !event.error.message.includes('script')) {
    if (window.uiManager && window.uiManager.showToast) {
      window.uiManager.showToast('An unexpected error occurred. Please try again.', 'error');
    }
  }
});

/**
 * Global unhandled promise rejection handler
 */
window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled promise rejection:', event.reason);
  
  // Show user-friendly error
  if (window.uiManager && window.uiManager.showToast) {
    const message = event.reason?.message || 'An unexpected error occurred';
    window.uiManager.showToast(message, 'error');
  }
});

/**
 * Expose version info
 */
window.DECISIONLOG_VERSION = '1.0.0';
console.log(`DecisionLog v${window.DECISIONLOG_VERSION}`);
