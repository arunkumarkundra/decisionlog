/**
 * auth.js
 * Handles Google Identity Services (GSI) sign-in and OAuth token acquisition.
 * No cookies - tokens kept in-memory only.
 */

const AUTH_CONFIG = {
  CLIENT_ID: 'YOUR_GOOGLE_CLIENT_ID_HERE', // Replace with actual OAuth Client ID
  API_KEY: 'YOUR_GOOGLE_API_KEY_HERE', // Replace with actual API Key
  DISCOVERY_DOCS: ['https://www.googleapis.com/discovery/v1/apis/drive/v3/rest'],
  SCOPES: 'https://www.googleapis.com/auth/drive.file', // Minimal scope - only files created by app
};

class AuthManager {
  constructor() {
    this.accessToken = null;
    this.tokenClient = null;
    this.userInfo = null;
    this.isInitialized = false;
    this.onAuthChangeCallbacks = [];
  }

  /**
   * Initialize Google Identity Services and gapi client
   */
  async initialize() {
    if (this.isInitialized) {
      return;
    }

    try {
      // Load gapi client
      await this.loadGapiClient();
      
      // Initialize Google Identity Services token client
      this.tokenClient = google.accounts.oauth2.initTokenClient({
        client_id: AUTH_CONFIG.CLIENT_ID,
        scope: AUTH_CONFIG.SCOPES,
        callback: (tokenResponse) => {
          if (tokenResponse.error) {
            console.error('Token error:', tokenResponse.error);
            this.notifyAuthChange(false);
            return;
          }
          this.accessToken = tokenResponse.access_token;
          this.loadUserInfo();
          this.notifyAuthChange(true);
        },
      });

      this.isInitialized = true;
    } catch (error) {
      console.error('Auth initialization failed:', error);
      throw new Error('Failed to initialize authentication');
    }
  }

  /**
   * Load and initialize gapi client
   */
  async loadGapiClient() {
    return new Promise((resolve, reject) => {
      if (typeof gapi === 'undefined') {
        reject(new Error('Google API library not loaded'));
        return;
      }

      gapi.load('client', async () => {
        try {
          await gapi.client.init({
            apiKey: AUTH_CONFIG.API_KEY,
            discoveryDocs: AUTH_CONFIG.DISCOVERY_DOCS,
          });
          resolve();
        } catch (error) {
          reject(error);
        }
      });
    });
  }

  /**
   * Sign in - request access token
   */
  signIn() {
    if (!this.isInitialized) {
      throw new Error('Auth not initialized. Call initialize() first.');
    }
    
    // Request access token
    this.tokenClient.requestAccessToken({ prompt: 'consent' });
  }

  /**
   * Sign out - clear token and user info
   */
  signOut() {
    if (this.accessToken) {
      // Revoke the token
      google.accounts.oauth2.revoke(this.accessToken, () => {
        console.log('Token revoked');
      });
    }
    
    this.accessToken = null;
    this.userInfo = null;
    this.notifyAuthChange(false);
  }

  /**
   * Get current access token
   * @returns {string|null} Access token or null if not signed in
   */
  getAccessToken() {
    return this.accessToken;
  }

  /**
   * Check if user is signed in
   * @returns {boolean} True if signed in
   */
  isSignedIn() {
    return this.accessToken !== null;
  }

  /**
   * Get user info
   * @returns {Object|null} User info object or null
   */
  getUserInfo() {
    return this.userInfo;
  }

  /**
   * Load user info from Google
   */
  async loadUserInfo() {
    if (!this.accessToken) {
      return;
    }

    try {
      const response = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
        },
      });

      if (response.ok) {
        this.userInfo = await response.json();
      } else {
        console.error('Failed to load user info:', response.status);
      }
    } catch (error) {
      console.error('Error loading user info:', error);
    }
  }

  /**
   * Set access token (for gapi client calls)
   */
  setGapiToken() {
    if (this.accessToken && gapi.client) {
      gapi.client.setToken({ access_token: this.accessToken });
    }
  }

  /**
   * Register callback for auth state changes
   * @param {Function} callback - Function to call on auth change
   */
  onAuthChange(callback) {
    this.onAuthChangeCallbacks.push(callback);
  }

  /**
   * Notify all registered callbacks of auth state change
   * @param {boolean} isSignedIn - Current sign-in state
   */
  notifyAuthChange(isSignedIn) {
    this.onAuthChangeCallbacks.forEach(callback => {
      try {
        callback(isSignedIn, this.userInfo);
      } catch (error) {
        console.error('Error in auth change callback:', error);
      }
    });
  }

  /**
   * Check and refresh token if needed
   * @returns {boolean} True if token is valid
   */
  async ensureValidToken() {
    if (!this.accessToken) {
      return false;
    }

    // Token validation could be improved with expiry checking
    // For now, we rely on gapi to handle token refresh
    this.setGapiToken();
    return true;
  }
}

// Export singleton instance
const authManager = new AuthManager();

// Make available globally for other modules
if (typeof window !== 'undefined') {
  window.authManager = authManager;
}
