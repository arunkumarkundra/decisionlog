/**
 * storage.js
 * Drive file operations: list, create, update, download files
 * Handles DecisionLog JSON file management in Google Drive
 */

class StorageManager {
  constructor() {
    this.currentFileId = null;
    this.currentFileName = null;
    this.currentData = null;
    this.lastSyncTime = null;
  }

  /**
   * List DecisionLog files in user's Drive
   * @returns {Promise<Array>} Array of file objects
   */
  async listFiles() {
    try {
      await window.authManager.ensureValidToken();
      
      const response = await gapi.client.drive.files.list({
        pageSize: 100,
        fields: 'files(id, name, createdTime, modifiedTime, size)',
        q: "name contains 'decisionlog' and trashed=false and mimeType='application/json'",
        orderBy: 'modifiedTime desc',
      });

      return response.result.files || [];
    } catch (error) {
      console.error('Error listing files:', error);
      throw new Error('Failed to list files from Google Drive. Please check your connection and permissions.');
    }
  }

  /**
   * Find files created by this app (matching schema)
   * @returns {Promise<Array>} Array of valid DecisionLog files
   */
  async findAppFiles() {
    try {
      const files = await this.listFiles();
      const validFiles = [];

      // We could validate schema here, but for performance, 
      // we'll just filter by naming convention and validate on open
      for (const file of files) {
        if (file.name.startsWith('decisionlog_') || file.name.includes('decisionlog')) {
          validFiles.push(file);
        }
      }

      return validFiles;
    } catch (error) {
      console.error('Error finding app files:', error);
      throw error;
    }
  }

  /**
   * Create a new file in Drive
   * @param {string} filename - Name of file to create
   * @param {Object} content - JSON content to write
   * @returns {Promise<Object>} Created file metadata
   */
  async createFile(filename, content) {
    try {
      await window.authManager.ensureValidToken();

      const boundary = '-------314159265358979323846';
      const delimiter = "\r\n--" + boundary + "\r\n";
      const close_delim = "\r\n--" + boundary + "--";

      const contentType = 'application/json';
      const metadata = {
        name: filename,
        mimeType: contentType,
      };

      const multipartRequestBody =
        delimiter +
        'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
        JSON.stringify(metadata) +
        delimiter +
        'Content-Type: ' + contentType + '\r\n\r\n' +
        JSON.stringify(content, null, 2) +
        close_delim;

      const response = await gapi.client.request({
        path: '/upload/drive/v3/files',
        method: 'POST',
        params: { uploadType: 'multipart' },
        headers: {
          'Content-Type': 'multipart/related; boundary="' + boundary + '"',
        },
        body: multipartRequestBody,
      });

      this.currentFileId = response.result.id;
      this.currentFileName = filename;
      this.currentData = content;
      this.lastSyncTime = new Date().toISOString();

      return response.result;
    } catch (error) {
      console.error('Error creating file:', error);
      throw new Error('Failed to create file in Google Drive. Please try again.');
    }
  }

  /**
   * Update existing file in Drive
   * @param {string} fileId - ID of file to update
   * @param {Object} content - New JSON content
   * @returns {Promise<Object>} Updated file metadata
   */
  async updateFile(fileId, content) {
    try {
      await window.authManager.ensureValidToken();

      // First, check if file was modified remotely
      const remoteFile = await this.getFileMetadata(fileId);
      if (this.lastSyncTime && remoteFile.modifiedTime > this.lastSyncTime) {
        // File was modified remotely - potential conflict
        throw new Error('CONFLICT: File was modified remotely. Please resolve conflict.');
      }

      const boundary = '-------314159265358979323846';
      const delimiter = "\r\n--" + boundary + "\r\n";
      const close_delim = "\r\n--" + boundary + "--";

      const contentType = 'application/json';
      const metadata = {
        mimeType: contentType,
      };

      const multipartRequestBody =
        delimiter +
        'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
        JSON.stringify(metadata) +
        delimiter +
        'Content-Type: ' + contentType + '\r\n\r\n' +
        JSON.stringify(content, null, 2) +
        close_delim;

      const response = await gapi.client.request({
        path: '/upload/drive/v3/files/' + fileId,
        method: 'PATCH',
        params: { uploadType: 'multipart' },
        headers: {
          'Content-Type': 'multipart/related; boundary="' + boundary + '"',
        },
        body: multipartRequestBody,
      });

      this.currentData = content;
      this.lastSyncTime = new Date().toISOString();

      return response.result;
    } catch (error) {
      console.error('Error updating file:', error);
      if (error.message.includes('CONFLICT')) {
        throw error;
      }
      throw new Error('Failed to update file in Google Drive. Please try again.');
    }
  }

  /**
   * Get file metadata
   * @param {string} fileId - ID of file
   * @returns {Promise<Object>} File metadata
   */
  async getFileMetadata(fileId) {
    try {
      await window.authManager.ensureValidToken();
      
      const response = await gapi.client.drive.files.get({
        fileId: fileId,
        fields: 'id, name, createdTime, modifiedTime, size',
      });

      return response.result;
    } catch (error) {
      console.error('Error getting file metadata:', error);
      throw new Error('Failed to get file information from Google Drive.');
    }
  }

  /**
   * Download file content
   * @param {string} fileId - ID of file to download
   * @returns {Promise<Object>} Parsed JSON content
   */
  async downloadFile(fileId) {
    try {
      await window.authManager.ensureValidToken();
      
      const response = await gapi.client.drive.files.get({
        fileId: fileId,
        alt: 'media',
      });

      let content;
      if (typeof response.body === 'string') {
        content = JSON.parse(response.body);
      } else {
        content = response.result;
      }

      // Validate schema
      this.validateSchema(content);

      this.currentFileId = fileId;
      this.currentData = content;
      this.lastSyncTime = new Date().toISOString();

      return content;
    } catch (error) {
      console.error('Error downloading file:', error);
      if (error.message.includes('Invalid schema')) {
        throw error;
      }
      throw new Error('Failed to download file from Google Drive. The file may be corrupted.');
    }
  }

  /**
   * Validate DecisionLog JSON schema
   * @param {Object} data - Data to validate
   * @throws {Error} If schema is invalid
   */
  validateSchema(data) {
    if (!data || typeof data !== 'object') {
      throw new Error('Invalid schema: Data must be an object');
    }

    // Check for required top-level fields
    if (!data.meta || typeof data.meta !== 'object') {
      // Try to migrate
      data.meta = {
        app: 'DecisionLog',
        version: '1.0',
        username: '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
    }

    if (!Array.isArray(data.decisions)) {
      data.decisions = [];
    }

    // Validate each decision has required fields
    data.decisions.forEach((decision, index) => {
      if (!decision.id) {
        throw new Error(`Invalid schema: Decision at index ${index} missing id`);
      }
      if (!decision.title) {
        decision.title = 'Untitled Decision';
      }
      if (!Array.isArray(decision.reviews)) {
        decision.reviews = [];
      }
      if (typeof decision.importance !== 'number') {
        decision.importance = 0;
      }
      if (!Array.isArray(decision.tags)) {
        decision.tags = [];
      }
    });

    return true;
  }

  /**
   * Import from user-selected file
   * @param {File} fileBlob - File object from input
   * @returns {Promise<Object>} Parsed JSON content
   */
  async importFromUserFile(fileBlob) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (event) => {
        try {
          const content = JSON.parse(event.target.result);
          this.validateSchema(content);
          resolve(content);
        } catch (error) {
          console.error('Error parsing imported file:', error);
          reject(new Error('Failed to parse imported file. Please ensure it is a valid DecisionLog JSON file.'));
        }
      };

      reader.onerror = () => {
        reject(new Error('Failed to read file. Please try again.'));
      };

      reader.readAsText(fileBlob);
    });
  }

  /**
   * Export current data as downloadable JSON
   * @param {Object} data - Data to export
   * @param {string} filename - Name for downloaded file
   */
  exportToDownload(data, filename) {
    const jsonString = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.style.display = 'none';
    
    document.body.appendChild(link);
    link.click();
    
    // Cleanup
    setTimeout(() => {
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }, 100);
  }

  /**
   * Get current file info
   * @returns {Object} Current file information
   */
  getCurrentFileInfo() {
    return {
      fileId: this.currentFileId,
      fileName: this.currentFileName,
      lastSyncTime: this.lastSyncTime,
    };
  }

  /**
   * Close current file
   */
  closeFile() {
    this.currentFileId = null;
    this.currentFileName = null;
    this.currentData = null;
    this.lastSyncTime = null;
  }

  /**
   * Get current data
   * @returns {Object|null} Current file data
   */
  getCurrentData() {
    return this.currentData;
  }

  /**
   * Set current data (for in-memory updates before save)
   * @param {Object} data - Updated data
   */
  setCurrentData(data) {
    this.currentData = data;
  }
}

// Export singleton instance
const storageManager = new StorageManager();

// Make available globally for other modules
if (typeof window !== 'undefined') {
  window.storageManager = storageManager;
}
