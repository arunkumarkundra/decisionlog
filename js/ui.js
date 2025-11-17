/**
 * ui.js
 * All DOM rendering for lists, modals, toasts, detail pane
 * Provides accessible rendering helpers
 */

class UIManager {
  constructor() {
    this.currentView = 'home'; // home, app
    this.selectedDecisionId = null;
    this.filterState = {
      searchTerm: '',
      tags: [],
      minImportance: 0,
      dateFrom: null,
      dateTo: null,
    };
    this.sortState = {
      field: 'date', // date, title, importance
      order: 'desc', // asc, desc
    };
  }

  /**
   * Initialize UI and event listeners
   */
  initialize() {
    this.setupEventListeners();
    this.showView('home');
  }

  /**
   * Setup global event listeners
   */
  setupEventListeners() {
    // Sign in button
    const signInBtn = document.getElementById('sign-in-btn');
    if (signInBtn) {
      signInBtn.addEventListener('click', () => {
        window.authManager.signIn();
      });
    }

    // Sign out button
    const signOutBtn = document.getElementById('sign-out-btn');
    if (signOutBtn) {
      signOutBtn.addEventListener('click', () => {
        this.handleSignOut();
      });
    }

    // About modal triggers
    const aboutBtns = document.querySelectorAll('[data-action="show-about"]');
    aboutBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        this.showAboutModal();
      });
    });

    // Search input
    const searchInput = document.getElementById('search-input');
    if (searchInput) {
      searchInput.addEventListener('input', window.utils.debounce((e) => {
        this.filterState.searchTerm = e.target.value;
        this.renderDecisionList();
      }, 300));
    }

    // Add decision button
    const addDecisionBtn = document.getElementById('add-decision-btn');
    if (addDecisionBtn) {
      addDecisionBtn.addEventListener('click', () => {
        window.forms.showDecisionForm();
      });
    }

    // Close file button
    const closeFileBtn = document.getElementById('close-file-btn');
    if (closeFileBtn) {
      closeFileBtn.addEventListener('click', () => {
        this.handleCloseFile();
      });
    }

    // Export button
    const exportBtn = document.getElementById('export-btn');
    if (exportBtn) {
      exportBtn.addEventListener('click', () => {
        this.handleExport();
      });
    }

    // Import button
    const importBtn = document.getElementById('import-btn');
    if (importBtn) {
      importBtn.addEventListener('click', () => {
        this.handleImport();
      });
    }

    // Open file button (in app view)
    const openFileBtn = document.getElementById('open-file-btn');
    if (openFileBtn) {
      openFileBtn.addEventListener('click', () => {
        this.showFilePickerModal();
      });
    }

    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
      this.handleKeyboardShortcuts(e);
    });
  }

  /**
   * Handle keyboard shortcuts
   */
  handleKeyboardShortcuts(e) {
    // Only handle when not in input/textarea
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
      return;
    }

    const shortcutsEnabled = window.utils.getPreference('keyboardShortcuts', true);
    if (!shortcutsEnabled) {
      return;
    }

    if (this.currentView === 'app') {
      if (e.key === 'n' || e.key === 'N') {
        e.preventDefault();
        window.forms.showDecisionForm();
      } else if (e.key === 'f' || e.key === 'F') {
        e.preventDefault();
        const searchInput = document.getElementById('search-input');
        if (searchInput) {
          searchInput.focus();
        }
      } else if (e.key === '?') {
        e.preventDefault();
        this.showKeyboardShortcutsModal();
      }
    }
  }

  /**
   * Show specific view (home or app)
   */
  showView(viewName) {
    this.currentView = viewName;
    
    const homeView = document.getElementById('home-view');
    const appView = document.getElementById('app-view');

    if (viewName === 'home') {
      if (homeView) homeView.classList.remove('hidden');
      if (appView) appView.classList.add('hidden');
    } else if (viewName === 'app') {
      if (homeView) homeView.classList.add('hidden');
      if (appView) appView.classList.remove('hidden');
      this.renderAppView();
    }
  }

  /**
   * Show file picker modal (open existing or create new)
   */
  async showFilePickerModal() {
    try {
      const files = await window.storageManager.findAppFiles();
      
      const modal = this.createModal({
        title: 'Open or Create Decision Log',
        content: this.renderFilePickerContent(files),
        size: 'large',
        onClose: () => {
          // Focus return handled by accessibility module
        },
      });

      // Setup file list listeners
      const fileItems = modal.querySelectorAll('.file-item');
      fileItems.forEach(item => {
        item.addEventListener('click', () => {
          const fileId = item.dataset.fileId;
          this.handleOpenFile(fileId);
          this.closeModal(modal);
        });
      });

      // Setup create new file listener
      const createForm = modal.querySelector('#create-file-form');
      if (createForm) {
        createForm.addEventListener('submit', async (e) => {
          e.preventDefault();
          const filename = createForm.querySelector('#new-filename').value;
          await this.handleCreateFile(filename);
          this.closeModal(modal);
        });
      }

    } catch (error) {
      console.error('Error showing file picker:', error);
      this.showToast('Failed to load files. Please try again.', 'error');
    }
  }

  /**
   * Render file picker content
   */
  renderFilePickerContent(files) {
    const userInfo = window.authManager.getUserInfo();
    const username = userInfo ? userInfo.email.split('@')[0].replace(/\./g, '_') : 'user';
    const timestamp = new Date().toISOString().replace(/[:.]/g, '').split('.')[0] + 'Z';
    const defaultFilename = `decisionlog_${username}_${timestamp}.json`;

    return `
      <div class="file-picker-content">
        <section class="file-picker-section" aria-labelledby="existing-files-heading">
          <h3 id="existing-files-heading" class="file-picker-heading">Open Existing File</h3>
          ${files.length > 0 ? `
            <ul class="file-list" role="list" aria-label="Existing decision log files">
              ${files.map(file => `
                <li class="file-item" 
                    role="button" 
                    tabindex="0" 
                    data-file-id="${window.utils.escapeHtml(file.id)}"
                    aria-label="Open ${window.utils.escapeHtml(file.name)}, last modified ${new Date(file.modifiedTime).toLocaleString()}">
                  <div class="file-info">
                    <span class="file-name">${window.utils.escapeHtml(file.name)}</span>
                    <span class="file-meta">Modified: ${new Date(file.modifiedTime).toLocaleString()}</span>
                  </div>
                </li>
              `).join('')}
            </ul>
          ` : `
            <p class="no-files-message">No existing decision logs found.</p>
          `}
        </section>

        <div class="divider" role="separator" aria-label="Or"></div>

        <section class="file-picker-section" aria-labelledby="create-file-heading">
          <h3 id="create-file-heading" class="file-picker-heading">Create New File</h3>
          <form id="create-file-form" class="create-file-form">
            <div class="form-group">
              <label for="new-filename" class="form-label">Filename:</label>
              <input 
                type="text" 
                id="new-filename" 
                name="filename" 
                class="form-input" 
                value="${defaultFilename}"
                required
                aria-describedby="filename-help"
              />
              <small id="filename-help" class="form-help">
                You can edit the filename before creating.
              </small>
            </div>
            <button type="submit" class="btn btn-primary">
              Create New File
            </button>
          </form>
        </section>
      </div>
    `;
  }

  /**
   * Handle opening existing file
   */
  async handleOpenFile(fileId) {
    try {
      this.showToast('Opening file...', 'info');
      const data = await window.storageManager.downloadFile(fileId);
      const metadata = await window.storageManager.getFileMetadata(fileId);
      window.storageManager.currentFileName = metadata.name;
      
      this.showToast('File opened successfully', 'success');
      this.showView('app');
      
      // Select first decision if available
      if (data.decisions && data.decisions.length > 0) {
        this.selectedDecisionId = data.decisions[0].id;
      }
      
      this.renderAppView();
    } catch (error) {
      console.error('Error opening file:', error);
      this.showToast(error.message || 'Failed to open file', 'error');
    }
  }

  /**
   * Handle creating new file
   */
  async handleCreateFile(filename) {
    try {
      const userInfo = window.authManager.getUserInfo();
      const now = new Date().toISOString();
      
      const initialData = {
        meta: {
          app: 'DecisionLog',
          version: '1.0',
          username: userInfo ? userInfo.email : '',
          createdAt: now,
          updatedAt: now,
        },
        decisions: [],
      };

      this.showToast('Creating file...', 'info');
      await window.storageManager.createFile(filename, initialData);
      
      this.showToast('File created successfully', 'success');
      this.showView('app');
      this.renderAppView();
    } catch (error) {
      console.error('Error creating file:', error);
      this.showToast(error.message || 'Failed to create file', 'error');
    }
  }

  /**
   * Handle sign out
   */
  handleSignOut() {
    const modal = this.createConfirmModal({
      title: 'Sign Out',
      message: 'Are you sure you want to sign out? Make sure all your changes are saved.',
      confirmText: 'Sign Out',
      cancelText: 'Cancel',
      onConfirm: () => {
        window.storageManager.closeFile();
        window.authManager.signOut();
        this.showView('home');
        this.showToast('Signed out successfully', 'success');
      },
    });
  }

  /**
   * Handle close file
   */
  handleCloseFile() {
    const modal = this.createConfirmModal({
      title: 'Close File',
      message: 'Are you sure you want to close this file? Make sure all your changes are saved.',
      confirmText: 'Close File',
      cancelText: 'Cancel',
      onConfirm: () => {
        window.storageManager.closeFile();
        this.selectedDecisionId = null;
        this.showFilePickerModal();
      },
    });
  }

  /**
   * Handle export
   */
  handleExport() {
    const data = window.storageManager.getCurrentData();
    if (!data) {
      this.showToast('No file open to export', 'error');
      return;
    }

    const fileInfo = window.storageManager.getCurrentFileInfo();
    const filename = fileInfo.fileName || 'decisionlog_export.json';
    
    window.storageManager.exportToDownload(data, filename);
    this.showToast('File exported successfully', 'success');
  }

  /**
   * Handle import
   */
  handleImport() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/json,.json';
    input.style.display = 'none';
    
    input.addEventListener('change', async (e) => {
      const file = e.target.files[0];
      if (!file) return;

      try {
        this.showToast('Importing file...', 'info');
        const data = await window.storageManager.importFromUserFile(file);
        
        // Show confirmation modal
        const modal = this.createConfirmModal({
          title: 'Import File',
          message: `Import "${file.name}"? This will replace your current data. Make sure your current file is saved first.`,
          confirmText: 'Import',
          cancelText: 'Cancel',
          onConfirm: async () => {
            // Create new file with imported data
            const timestamp = new Date().toISOString().replace(/[:.]/g, '').split('.')[0] + 'Z';
            const newFilename = `imported_${timestamp}.json`;
            
            await window.storageManager.createFile(newFilename, data);
            this.showToast('File imported successfully', 'success');
            this.showView('app');
            
            if (data.decisions && data.decisions.length > 0) {
              this.selectedDecisionId = data.decisions[0].id;
            }
            
            this.renderAppView();
          },
        });
      } catch (error) {
        console.error('Error importing file:', error);
        this.showToast(error.message || 'Failed to import file', 'error');
      } finally {
        document.body.removeChild(input);
      }
    });

    document.body.appendChild(input);
    input.click();
  }

  /**
   * Render main app view
   */
  renderAppView() {
    const data = window.storageManager.getCurrentData();
    if (!data) {
      this.showToast('No file open', 'error');
      return;
    }

    // Update file info display
    const fileInfo = window.storageManager.getCurrentFileInfo();
    const fileNameDisplay = document.getElementById('current-filename');
    if (fileNameDisplay) {
      fileNameDisplay.textContent = fileInfo.fileName || 'Untitled';
    }

    // Render decision list
    this.renderDecisionList();

    // Render decision detail
    if (this.selectedDecisionId) {
      this.renderDecisionDetail(this.selectedDecisionId);
    } else if (data.decisions && data.decisions.length > 0) {
      this.selectedDecisionId = data.decisions[0].id;
      this.renderDecisionDetail(this.selectedDecisionId);
    } else {
      this.renderEmptyDetail();
    }
  }

  /**
   * Render decision list
   */
  renderDecisionList() {
    const data = window.storageManager.getCurrentData();
    if (!data) return;

    const listContainer = document.getElementById('decision-list');
    if (!listContainer) return;

    // Filter and sort decisions
    let decisions = this.filterDecisions(data.decisions);
    decisions = this.sortDecisions(decisions);

    if (decisions.length === 0) {
      listContainer.innerHTML = `
        <div class="empty-state" role="status">
          <p>No decisions found. ${this.filterState.searchTerm ? 'Try adjusting your search.' : 'Add your first decision to get started.'}</p>
        </div>
      `;
      return;
    }

    listContainer.innerHTML = `
      <ul class="decision-items" role="list" aria-label="Decision list">
        ${decisions.map(decision => this.renderDecisionListItem(decision)).join('')}
      </ul>
    `;

    // Add click listeners
    const items = listContainer.querySelectorAll('.decision-item');
    items.forEach(item => {
      item.addEventListener('click', () => {
        this.selectedDecisionId = item.dataset.decisionId;
        this.renderDecisionList(); // Re-render to update selection
        this.renderDecisionDetail(this.selectedDecisionId);
      });
    });
  }

  /**
   * Render single decision list item
   */
  renderDecisionListItem(decision) {
    const isSelected = decision.id === this.selectedDecisionId;
    const stars = this.renderStars(decision.importance || 0);
    const date = decision.date ? new Date(decision.date).toLocaleDateString() : 'No date';
    
    return `
      <li class="decision-item ${isSelected ? 'selected' : ''}"
          data-decision-id="${window.utils.escapeHtml(decision.id)}"
          role="button"
          tabindex="0"
          aria-label="${window.utils.escapeHtml(decision.title)}, importance ${decision.importance || 0} stars, ${date}"
          aria-current="${isSelected ? 'true' : 'false'}">
        <div class="decision-item-content">
          <h3 class="decision-item-title">${window.utils.escapeHtml(decision.title)}</h3>
          <div class="decision-item-meta">
            <span class="decision-item-stars" aria-label="Importance: ${decision.importance || 0} out of 5 stars">
              ${stars}
            </span>
            <span class="decision-item-date">${date}</span>
          </div>
          ${decision.tags && decision.tags.length > 0 ? `
            <div class="decision-item-tags" aria-label="Tags">
              ${decision.tags.map(tag => `<span class="tag">${window.utils.escapeHtml(tag)}</span>`).join('')}
            </div>
          ` : ''}
        </div>
      </li>
    `;
  }

  /**
   * Render decision detail pane
   */
  renderDecisionDetail(decisionId) {
    const data = window.storageManager.getCurrentData();
    if (!data) return;

    const decision = data.decisions.find(d => d.id === decisionId);
    if (!decision) {
      this.renderEmptyDetail();
      return;
    }

    const detailContainer = document.getElementById('decision-detail');
    if (!detailContainer) return;

    const stars = this.renderStars(decision.importance || 0);
    const date = decision.date ? new Date(decision.date).toLocaleDateString() : 'No date';

    detailContainer.innerHTML = `
      <article class="decision-detail-content" aria-labelledby="detail-title">
        <header class="decision-detail-header">
          <h2 id="detail-title" class="decision-detail-title">${window.utils.escapeHtml(decision.title)}</h2>
          <div class="decision-detail-actions">
            <button class="btn btn-secondary btn-sm" 
                    data-action="edit-decision"
                    aria-label="Edit decision">
              Edit
            </button>
            <button class="btn btn-danger btn-sm" 
                    data-action="delete-decision"
                    aria-label="Delete decision">
              Delete
            </button>
          </div>
        </header>

        <div class="decision-detail-meta">
          <div class="meta-item">
            <span class="meta-label">Date:</span>
            <span class="meta-value">${date}</span>
          </div>
          <div class="meta-item">
            <span class="meta-label">Importance:</span>
            <span class="meta-value" aria-label="${decision.importance || 0} out of 5 stars">
              ${stars}
            </span>
          </div>
          ${decision.tags && decision.tags.length > 0 ? `
            <div class="meta-item">
              <span class="meta-label">Tags:</span>
              <div class="meta-tags">
                ${decision.tags.map(tag => `<span class="tag">${window.utils.escapeHtml(tag)}</span>`).join('')}
              </div>
            </div>
          ` : ''}
        </div>

        ${decision.finalDecision ? `
          <section class="decision-section" aria-labelledby="final-decision-heading">
            <h3 id="final-decision-heading" class="section-heading">Final Decision</h3>
            <p class="section-content">${window.utils.escapeHtml(decision.finalDecision)}</p>
          </section>
        ` : ''}

        ${decision.description ? `
          <section class="decision-section" aria-labelledby="description-heading">
            <h3 id="description-heading" class="section-heading">Description, Notes, Reasoning</h3>
            <p class="section-content">${window.utils.escapeHtml(decision.description).replace(/\n/g, '<br>')}</p>
          </section>
        ` : ''}

        <section class="decision-section" aria-labelledby="reviews-heading">
          <div class="section-header">
            <h3 id="reviews-heading" class="section-heading">Reviews</h3>
            <button class="btn btn-primary btn-sm" 
                    data-action="add-review"
                    aria-label="Add new review">
              Add Review
            </button>
          </div>
          ${this.renderReviewsSection(decision)}
        </section>
      </article>
    `;

    // Add event listeners
    const editBtn = detailContainer.querySelector('[data-action="edit-decision"]');
    if (editBtn) {
      editBtn.addEventListener('click', () => {
        window.forms.showDecisionForm(decision);
      });
    }

    const deleteBtn = detailContainer.querySelector('[data-action="delete-decision"]');
    if (deleteBtn) {
      deleteBtn.addEventListener('click', () => {
        this.handleDeleteDecision(decision.id);
      });
    }

    const addReviewBtn = detailContainer.querySelector('[data-action="add-review"]');
    if (addReviewBtn) {
      addReviewBtn.addEventListener('click', () => {
        window.forms.showReviewForm(decision.id);
      });
    }

    // Add listeners for review edit/delete
    const reviewEditBtns = detailContainer.querySelectorAll('[data-action="edit-review"]');
    reviewEditBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const reviewId = btn.dataset.reviewId;
        const review = decision.reviews.find(r => r.id === reviewId);
        if (review) {
          window.forms.showReviewForm(decision.id, review);
        }
      });
    });

    const reviewDeleteBtns = detailContainer.querySelectorAll('[data-action="delete-review"]');
    reviewDeleteBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const reviewId = btn.dataset.reviewId;
        this.handleDeleteReview(decision.id, reviewId);
      });
    });
  }

  /**
   * Render reviews section
   */
  renderReviewsSection(decision) {
    if (!decision.reviews || decision.reviews.length === 0) {
      return `
        <div class="empty-state">
          <p>No reviews yet. Add your first review to track how this decision evolves.</p>
        </div>
      `;
    }

    // Sort reviews by date (newest first)
    const sortedReviews = [...decision.reviews].sort((a, b) => {
      return new Date(b.createdAt) - new Date(a.createdAt);
    });

    return `
      <div class="reviews-list">
        ${sortedReviews.map(review => this.renderReviewItem(review)).join('')}
      </div>
      ${decision.reviews.length > 1 ? `
        <div class="charts-section">
          <h4 class="charts-heading">Rating Trends</h4>
          <div id="review-charts-${decision.id}" class="review-charts"></div>
        </div>
      ` : ''}
    `;
  }

  /**
   * Render single review item
   */
  renderReviewItem(review) {
    const date = new Date(review.createdAt).toLocaleString();
    
    return `
      <article class="review-item" aria-labelledby="review-${review.id}-date">
        <div class="review-header">
          <h4 id="review-${review.id}-date" class="review-date">${date}</h4>
          <div class="review-actions">
            <button class="btn btn-secondary btn-sm" 
                    data-action="edit-review"
                    data-review-id="${window.utils.escapeHtml(review.id)}"
                    aria-label="Edit review from ${date}">
              Edit
            </button>
            <button class="btn btn-danger btn-sm" 
                    data-action="delete-review"
                    data-review-id="${window.utils.escapeHtml(review.id)}"
                    aria-label="Delete review from ${date}">
              Delete
            </button>
          </div>
        </div>
        <div class="review-ratings">
          <div class="rating-item">
            <span class="rating-label">Outcome:</span>
            <span class="rating-value" aria-label="${review.outcomeRating || 0} out of 5 stars">
              ${this.renderStars(review.outcomeRating || 0)}
            </span>
          </div>
          <div class="rating-item">
            <span class="rating-label">Thesis Accuracy:</span>
            <span class="rating-value" aria-label="${review.thesisAccuracy || 0} out of 5 stars">
              ${this.renderStars(review.thesisAccuracy || 0)}
            </span>
          </div>
          <div class="rating-item">
            <span class="rating-label">Luck/Chance:</span>
            <span class="rating-value" aria-label="${review.luckRating || 0} out of 5 stars">
              ${this.renderStars(review.luckRating || 0)}
            </span>
          </div>
        </div>
        ${review.notes ? `
          <div class="review-notes">
            <p>${window.utils.escapeHtml(review.notes).replace(/\n/g, '<br>')}</p>
          </div>
        ` : ''}
      </article>
    `;
  }

  /**
   * Render empty detail state
   */
  renderEmptyDetail() {
    const detailContainer = document.getElementById('decision-detail');
    if (!detailContainer) return;

    detailContainer.innerHTML = `
      <div class="empty-state" role="status">
        <p>Select a decision to view details, or add a new decision to get started.</p>
      </div>
    `;
  }

  /**
   * Render star rating
   */
  renderStars(rating) {
    const fullStars = Math.floor(rating);
    const emptyStars = 5 - fullStars;
    
    return '★'.repeat(fullStars) + '☆'.repeat(emptyStars);
  }

  /**
   * Filter decisions based on current filter state
   */
  filterDecisions(decisions) {
    return decisions.filter(decision => {
      // Search term
      if (this.filterState.searchTerm) {
        const searchLower = this.filterState.searchTerm.toLowerCase();
        const matchesSearch = 
          decision.title.toLowerCase().includes(searchLower) ||
          (decision.description && decision.description.toLowerCase().includes(searchLower)) ||
          (decision.finalDecision && decision.finalDecision.toLowerCase().includes(searchLower)) ||
          (decision.tags && decision.tags.some(tag => tag.toLowerCase().includes(searchLower)));
        
        if (!matchesSearch) return false;
      }

      // Min importance
      if (this.filterState.minImportance > 0) {
        if ((decision.importance || 0) < this.filterState.minImportance) {
          return false;
        }
      }

      // Tags filter
      if (this.filterState.tags.length > 0) {
        if (!decision.tags || !this.filterState.tags.some(tag => decision.tags.includes(tag))) {
          return false;
        }
      }

      // Date range
      if (this.filterState.dateFrom || this.filterState.dateTo) {
        const decisionDate = decision.date ? new Date(decision.date) : null;
        if (!decisionDate) return false;

        if (this.filterState.dateFrom && decisionDate < new Date(this.filterState.dateFrom)) {
          return false;
        }
        if (this.filterState.dateTo && decisionDate > new Date(this.filterState.dateTo)) {
          return false;
        }
      }

      return true;
    });
  }

  /**
   * Sort decisions based on current sort state
   */
  sortDecisions(decisions) {
    const sorted = [...decisions].sort((a, b) => {
      let comparison = 0;

      switch (this.sortState.field) {
        case 'date':
          const dateA = a.date ? new Date(a.date) : new Date(0);
          const dateB = b.date ? new Date(b.date) : new Date(0);
          comparison = dateB - dateA; // Default desc
          break;
        case 'title':
          comparison = a.title.localeCompare(b.title);
          break;
        case 'importance':
          comparison = (b.importance || 0) - (a.importance || 0); // Default desc
          break;
      }

      return this.sortState.order === 'asc' ? -comparison : comparison;
    });

    return sorted;
  }

  /**
   * Handle delete decision
   */
  handleDeleteDecision(decisionId) {
    const data = window.storageManager.getCurrentData();
    const decision = data.decisions.find(d => d.id === decisionId);
    
    if (!decision) return;

    const modal = this.createConfirmModal({
      title: 'Delete Decision',
      message: `Are you sure you want to delete "${decision.title}"? This action cannot be undone.`,
      confirmText: 'Delete',
      cancelText: 'Cancel',
      onConfirm: async () => {
        try {
          // Remove decision
          data.decisions = data.decisions.filter(d => d.id !== decisionId);
          data.meta.updatedAt = new Date().toISOString();
          
          // Save to Drive
          await window.storageManager.updateFile(
            window.storageManager.getCurrentFileInfo().fileId,
            data
          );
          
          // Update UI
          this.selectedDecisionId = null;
          this.renderAppView();
          this.showToast('Decision deleted successfully', 'success');
        } catch (error) {
          console.error('Error deleting decision:', error);
          this.showToast(error.message || 'Failed to delete decision', 'error');
        }
      },
    });
  }

  /**
   * Handle delete review
   */
  handleDeleteReview(decisionId, reviewId) {
    const data = window.storageManager.getCurrentData();
    const decision = data.decisions.find(d => d.id === decisionId);
    
    if (!decision) return;

    const modal = this.createConfirmModal({
      title: 'Delete Review',
      message: 'Are you sure you want to delete this review? This action cannot be undone.',
      confirmText: 'Delete',
      cancelText: 'Cancel',
      onConfirm: async () => {
        try {
          // Remove review
          decision.reviews = decision.reviews.filter(r => r.id !== reviewId);
          decision.updatedAt = new Date().toISOString();
          data.meta.updatedAt = new Date().toISOString();
          
          // Save to Drive
          await window.storageManager.updateFile(
            window.storageManager.getCurrentFileInfo().fileId,
            data
          );
          
          // Update UI
          this.renderDecisionDetail(decisionId);
          this.showToast('Review deleted successfully', 'success');
        } catch (error) {
          console.error('Error deleting review:', error);
          this.showToast(error.message || 'Failed to delete review', 'error');
        }
      },
    });
  }

  /**
   * Create modal
   */
  createModal({ title, content, size = 'medium', onClose }) {
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-modal', 'true');
    modal.setAttribute('aria-labelledby', 'modal-title');
    
    modal.innerHTML = `
      <div class="modal-overlay"></div>
      <div class="modal-content modal-${size}">
        <header class="modal-header">
          <h2 id="modal-title" class="modal-title">${window.utils.escapeHtml(title)}</h2>
          <button class="modal-close" aria-label="Close dialog">×</button>
        </header>
        <div class="modal-body">
          ${content}
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    // Setup close handlers
    const closeBtn = modal.querySelector('.modal-close');
    const overlay = modal.querySelector('.modal-overlay');
    
    const close = () => {
      this.closeModal(modal);
      if (onClose) onClose();
    };

    closeBtn.addEventListener('click', close);
    overlay.addEventListener('click', close);

    // Trap focus
    window.accessibility.trapFocus(modal.querySelector('.modal-content'));

    // Show modal
    requestAnimationFrame(() => {
      modal.classList.add('active');
      closeBtn.focus();
    });

    return modal;
  }

  /**
   * Close modal
   */
  closeModal(modal) {
    modal.classList.remove('active');
    setTimeout(() => {
      window.accessibility.releaseFocus();
      document.body.removeChild(modal);
    }, 300);
  }

  /**
   * Create confirm modal
   */
  createConfirmModal({ title, message, confirmText, cancelText, onConfirm }) {
    const content = `
      <div class="confirm-modal-content">
        <p class="confirm-message">${window.utils.escapeHtml(message)}</p>
        <div class="confirm-actions">
          <button class="btn btn-secondary" data-action="cancel">${window.utils.escapeHtml(cancelText)}</button>
          <button class="btn btn-primary" data-action="confirm">${window.utils.escapeHtml(confirmText)}</button>
        </div>
      </div>
    `;

    const modal = this.createModal({
      title,
      content,
      size: 'small',
    });

    const confirmBtn = modal.querySelector('[data-action="confirm"]');
    const cancelBtn = modal.querySelector('[data-action="cancel"]');

    confirmBtn.addEventListener('click', () => {
      this.closeModal(modal);
      onConfirm();
    });

    cancelBtn.addEventListener('click', () => {
      this.closeModal(modal);
    });

    return modal;
  }

  /**
   * Show about modal
   */
  showAboutModal() {
    const content = `
      <div class="about-modal-content">
        <h3>Why DecisionLog Exists</h3>
        <p>Most of the important outcomes in life—career moves, financial choices, relationships, major purchases—are shaped by a handful of decisions made under uncertainty. Yet surprisingly, we rarely record what we were thinking at the moment we made those decisions.</p>
        
        <p>As time passes, our memory distorts the past. We forget our original reasoning. We fit new narratives to old outcomes. We judge decisions by how things turned out, not by the quality of thinking behind them. This blindness prevents learning.</p>
        
        <p><strong>DecisionLog exists to fix that.</strong></p>
        
        <p>It gives you a private, structured way to:</p>
        
        <ol>
          <li><strong>Capture major decisions as they happen</strong><br>
          Write down your reasoning, expectations, alternatives considered, concerns, and emotional factors—before hindsight colors everything.</li>
          
          <li><strong>Assign importance</strong><br>
          Not every decision deserves the same attention. Mark the high-impact ones that actually matter.</li>
          
          <li><strong>Review decisions over time</strong><br>
          As outcomes unfold, evaluate them across three dimensions:
            <ul>
              <li>How well things turned out</li>
              <li>How accurate your original thesis was</li>
              <li>How much luck or chance played a role</li>
            </ul>
          </li>
          
          <li><strong>See patterns in your judgment</strong><br>
          Over months or years, the reviews reveal where your thinking is consistently strong, where it's biased, and where blind spots repeat.</li>
          
          <li><strong>Build self-awareness and better intuition</strong><br>
          You begin to understand not only what decisions worked, but why—and how your perception changes over time.</li>
        </ol>
        
        <p><strong>This is not a productivity tool.</strong></p>
        <p>It's a mirror for your judgment—one that stays honest, even when your memory doesn't.</p>
        
        <h4>Your data remains yours.</h4>
        <p>Every decision and review is stored solely in your personal Google Drive. Nothing is stored on our servers. There is no tracking, no analytics, no behavioral logging.</p>
        
        <p>Just your decisions, your evaluations, and your improvement loop.</p>
        
        <p><strong>DecisionLog helps you learn from your own life—without noise, without bias, without forgetting.</strong></p>
      </div>
    `;

    this.createModal({
      title: 'About DecisionLog',
      content,
      size: 'large',
    });
  }

  /**
   * Show keyboard shortcuts modal
   */
  showKeyboardShortcutsModal() {
    const content = `
      <div class="shortcuts-modal-content">
        <table class="shortcuts-table">
          <thead>
            <tr>
              <th>Key</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><kbd>N</kbd></td>
              <td>Add new decision</td>
            </tr>
            <tr>
              <td><kbd>F</kbd></td>
              <td>Focus search</td>
            </tr>
            <tr>
              <td><kbd>?</kbd></td>
              <td>Show keyboard shortcuts</td>
            </tr>
          </tbody>
        </table>
        <p class="shortcuts-note">Note: Shortcuts only work when not typing in an input field.</p>
      </div>
    `;

    this.createModal({
      title: 'Keyboard Shortcuts',
      content,
      size: 'small',
    });
  }

  /**
   * Show toast notification
   */
  showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.setAttribute('role', 'status');
    toast.setAttribute('aria-live', 'polite');
    
    toast.innerHTML = `
      <span class="toast-message">${window.utils.escapeHtml(message)}</span>
      <button class="toast-close" aria-label="Dismiss notification">×</button>
    `;

    const container = document.getElementById('toast-container');
    if (container) {
      container.appendChild(toast);
    } else {
      document.body.appendChild(toast);
    }

    // Make focusable
    toast.setAttribute('tabindex', '0');

    // Close button
    const closeBtn = toast.querySelector('.toast-close');
    const close = () => {
      toast.classList.remove('active');
      setTimeout(() => {
        toast.remove();
      }, 300);
    };

    closeBtn.addEventListener('click', close);

    // Auto-dismiss after 5 seconds
    const timeout = setTimeout(close, 5000);

    // Show toast
    requestAnimationFrame(() => {
      toast.classList.add('active');
    });

    // Clear timeout if manually closed
    closeBtn.addEventListener('click', () => {
      clearTimeout(timeout);
    }, { once: true });
  }
}

// Export singleton instance
const uiManager = new UIManager();

// Make available globally
if (typeof window !== 'undefined') {
  window.uiManager = uiManager;
}
