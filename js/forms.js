/**
 * forms.js
 * Handles decision form, review form, validation, sanitization
 * Provides client-side validation and friendly error messages
 */

class FormsManager {
  constructor() {
    this.currentForm = null;
    this.editingDecision = null;
    this.editingReview = null;
  }

  /**
   * Show decision form (add or edit)
   * @param {Object} decision - Decision object to edit (null for new)
   */
  showDecisionForm(decision = null) {
    this.editingDecision = decision;
    const isEdit = decision !== null;
    
    const formContent = this.renderDecisionForm(decision);
    
    const modal = window.uiManager.createModal({
      title: isEdit ? 'Edit Decision' : 'Add Decision',
      content: formContent,
      size: 'large',
    });

    this.currentForm = modal;

    // Setup form submission
    const form = modal.querySelector('#decision-form');
    if (form) {
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        this.handleDecisionSubmit(form, isEdit);
      });
    }

    // Setup cancel button
    const cancelBtn = modal.querySelector('[data-action="cancel"]');
    if (cancelBtn) {
      cancelBtn.addEventListener('click', () => {
        window.uiManager.closeModal(modal);
      });
    }

    // Setup star rating inputs
    this.setupStarRating(modal, 'importance');

    // Focus first input
    const firstInput = form.querySelector('input, textarea');
    if (firstInput) {
      setTimeout(() => firstInput.focus(), 100);
    }
  }

  /**
   * Render decision form HTML
   */
  renderDecisionForm(decision) {
    const title = decision ? decision.title : '';
    const description = decision ? decision.description : '';
    const finalDecision = decision ? decision.finalDecision : '';
    const tags = decision && decision.tags ? decision.tags.join(', ') : '';
    const importance = decision ? decision.importance || 0 : 0;
    const date = decision && decision.date ? decision.date : new Date().toISOString().split('T')[0];

    return `
      <form id="decision-form" class="decision-form" novalidate>
        <div class="form-group">
          <label for="decision-title" class="form-label required">
            Title
          </label>
          <input 
            type="text" 
            id="decision-title" 
            name="title" 
            class="form-input" 
            value="${window.utils.escapeHtml(title)}"
            required
            aria-required="true"
            aria-describedby="title-error"
          />
          <span id="title-error" class="form-error" role="alert"></span>
        </div>

        <div class="form-group">
          <label for="decision-description" class="form-label">
            Description, Notes, Reasoning
          </label>
          <textarea 
            id="decision-description" 
            name="description" 
            class="form-textarea" 
            rows="6"
            aria-describedby="description-help"
          >${window.utils.escapeHtml(description)}</textarea>
          <small id="description-help" class="form-help">
            Capture your thinking: why you're making this decision, alternatives considered, concerns, expectations.
          </small>
        </div>

        <div class="form-group">
          <label for="decision-final" class="form-label">
            Final Decision
          </label>
          <input 
            type="text" 
            id="decision-final" 
            name="finalDecision" 
            class="form-input" 
            value="${window.utils.escapeHtml(finalDecision)}"
            aria-describedby="final-help"
          />
          <small id="final-help" class="form-help">
            A short statement of what you decided to do.
          </small>
        </div>

        <div class="form-group">
          <label for="decision-tags" class="form-label">
            Tags
          </label>
          <input 
            type="text" 
            id="decision-tags" 
            name="tags" 
            class="form-input" 
            value="${window.utils.escapeHtml(tags)}"
            aria-describedby="tags-help"
          />
          <small id="tags-help" class="form-help">
            Comma-separated tags (e.g., career, finance, health)
          </small>
        </div>

        <div class="form-group">
          <label class="form-label">
            Importance
          </label>
          <div class="star-rating-input" 
               data-field="importance" 
               data-value="${importance}"
               role="radiogroup"
               aria-label="Importance rating"
               aria-describedby="importance-help">
            ${this.renderStarRatingInput('importance', importance)}
          </div>
          <small id="importance-help" class="form-help">
            How important is this decision? (0-5 stars)
          </small>
        </div>

        <div class="form-group">
          <label for="decision-date" class="form-label">
            Date
          </label>
          <input 
            type="date" 
            id="decision-date" 
            name="date" 
            class="form-input" 
            value="${date}"
            aria-describedby="date-help"
          />
          <small id="date-help" class="form-help">
            When was this decision made?
          </small>
        </div>

        <div class="form-actions">
          <button type="button" class="btn btn-secondary" data-action="cancel">
            Cancel
          </button>
          <button type="submit" class="btn btn-primary">
            ${decision ? 'Update Decision' : 'Save Decision'}
          </button>
        </div>
      </form>
    `;
  }

  /**
   * Render star rating input
   */
  renderStarRatingInput(fieldName, currentValue) {
    let html = '';
    for (let i = 0; i <= 5; i++) {
      const checked = i === currentValue ? 'checked' : '';
      const label = i === 0 ? 'Not set' : `${i} star${i > 1 ? 's' : ''}`;
      html += `
        <label class="star-rating-option">
          <input 
            type="radio" 
            name="${fieldName}" 
            value="${i}" 
            ${checked}
            aria-label="${label}"
          />
          <span class="star-rating-display" aria-hidden="true">
            ${i === 0 ? '—' : '★'.repeat(i)}
          </span>
        </label>
      `;
    }
    return html;
  }

  /**
   * Setup star rating interactive behavior
   */
  setupStarRating(container, fieldName) {
    const ratingContainer = container.querySelector(`.star-rating-input[data-field="${fieldName}"]`);
    if (!ratingContainer) return;

    const options = ratingContainer.querySelectorAll('input[type="radio"]');
    
    options.forEach((option, index) => {
      // Click/change handler
      option.addEventListener('change', () => {
        ratingContainer.dataset.value = option.value;
      });

      // Keyboard navigation
      option.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') {
          e.preventDefault();
          const prevIndex = Math.max(0, index - 1);
          options[prevIndex].focus();
          options[prevIndex].checked = true;
          ratingContainer.dataset.value = options[prevIndex].value;
        } else if (e.key === 'ArrowRight' || e.key === 'ArrowUp') {
          e.preventDefault();
          const nextIndex = Math.min(options.length - 1, index + 1);
          options[nextIndex].focus();
          options[nextIndex].checked = true;
          ratingContainer.dataset.value = options[nextIndex].value;
        }
      });
    });
  }

  /**
   * Handle decision form submission
   */
  async handleDecisionSubmit(form, isEdit) {
    try {
      // Get form data
      const formData = new FormData(form);
      const data = {
        title: formData.get('title').trim(),
        description: formData.get('description').trim(),
        finalDecision: formData.get('finalDecision').trim(),
        tags: formData.get('tags')
          .split(',')
          .map(tag => tag.trim())
          .filter(tag => tag.length > 0),
        importance: parseInt(formData.get('importance') || '0', 10),
        date: formData.get('date'),
      };

      // Validate
      const errors = this.validateDecisionData(data);
      if (Object.keys(errors).length > 0) {
        this.displayFormErrors(form, errors);
        return;
      }

      // Sanitize
      data.title = window.utils.sanitizeText(data.title);
      data.description = window.utils.sanitizeText(data.description);
      data.finalDecision = window.utils.sanitizeText(data.finalDecision);
      data.tags = data.tags.map(tag => window.utils.sanitizeText(tag));

      // Get current file data
      const fileData = window.storageManager.getCurrentData();
      if (!fileData) {
        throw new Error('No file open');
      }

      const now = new Date().toISOString();

      if (isEdit && this.editingDecision) {
        // Update existing decision
        const decision = fileData.decisions.find(d => d.id === this.editingDecision.id);
        if (decision) {
          Object.assign(decision, data);
          decision.updatedAt = now;
        }
      } else {
        // Create new decision
        const newDecision = {
          id: window.utils.generateUUID(),
          ...data,
          createdAt: now,
          updatedAt: now,
          reviews: [],
        };
        fileData.decisions.unshift(newDecision); // Add to beginning
      }

      fileData.meta.updatedAt = now;

      // Save to Drive
      window.uiManager.showToast('Saving...', 'info');
      await window.storageManager.updateFile(
        window.storageManager.getCurrentFileInfo().fileId,
        fileData
      );

      // Close modal and update UI
      window.uiManager.closeModal(this.currentForm);
      window.uiManager.renderAppView();
      window.uiManager.showToast(
        isEdit ? 'Decision updated successfully' : 'Decision added successfully',
        'success'
      );

      // Select the new/edited decision
      if (!isEdit) {
        window.uiManager.selectedDecisionId = fileData.decisions[0].id;
        window.uiManager.renderDecisionDetail(fileData.decisions[0].id);
      }

    } catch (error) {
      console.error('Error saving decision:', error);
      window.uiManager.showToast(error.message || 'Failed to save decision', 'error');
    }
  }

  /**
   * Validate decision data
   */
  validateDecisionData(data) {
    const errors = {};

    if (!data.title || data.title.length === 0) {
      errors.title = 'Title is required';
    } else if (data.title.length > 200) {
      errors.title = 'Title must be 200 characters or less';
    }

    if (data.description && data.description.length > 5000) {
      errors.description = 'Description must be 5000 characters or less';
    }

    if (data.finalDecision && data.finalDecision.length > 500) {
      errors.finalDecision = 'Final decision must be 500 characters or less';
    }

    if (data.importance < 0 || data.importance > 5) {
      errors.importance = 'Importance must be between 0 and 5';
    }

    if (!data.date) {
      errors.date = 'Date is required';
    }

    return errors;
  }

  /**
   * Display form validation errors
   */
  displayFormErrors(form, errors) {
    // Clear previous errors
    const errorElements = form.querySelectorAll('.form-error');
    errorElements.forEach(el => {
      el.textContent = '';
    });

    const inputElements = form.querySelectorAll('.form-input, .form-textarea');
    inputElements.forEach(el => {
      el.classList.remove('error');
      el.removeAttribute('aria-invalid');
    });

    // Display new errors
    Object.keys(errors).forEach(fieldName => {
      const input = form.querySelector(`[name="${fieldName}"]`);
      const errorElement = form.querySelector(`#${fieldName}-error`);

      if (input) {
        input.classList.add('error');
        input.setAttribute('aria-invalid', 'true');
      }

      if (errorElement) {
        errorElement.textContent = errors[fieldName];
      }
    });

    // Focus first error field
    const firstErrorField = form.querySelector('.error');
    if (firstErrorField) {
      firstErrorField.focus();
    }

    window.uiManager.showToast('Please fix the errors in the form', 'error');
  }

  /**
   * Show review form (add or edit)
   * @param {string} decisionId - ID of decision being reviewed
   * @param {Object} review - Review object to edit (null for new)
   */
  showReviewForm(decisionId, review = null) {
    this.editingReview = review;
    const isEdit = review !== null;
    
    const formContent = this.renderReviewForm(review);
    
    const modal = window.uiManager.createModal({
      title: isEdit ? 'Edit Review' : 'Add Review',
      content: formContent,
      size: 'medium',
    });

    this.currentForm = modal;

    // Setup form submission
    const form = modal.querySelector('#review-form');
    if (form) {
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        this.handleReviewSubmit(form, decisionId, isEdit);
      });
    }

    // Setup cancel button
    const cancelBtn = modal.querySelector('[data-action="cancel"]');
    if (cancelBtn) {
      cancelBtn.addEventListener('click', () => {
        window.uiManager.closeModal(modal);
      });
    }

    // Setup star ratings
    this.setupStarRating(modal, 'outcomeRating');
    this.setupStarRating(modal, 'thesisAccuracy');
    this.setupStarRating(modal, 'luckRating');

    // Focus first input
    const firstInput = form.querySelector('input[type="radio"]:checked');
    if (firstInput) {
      setTimeout(() => firstInput.focus(), 100);
    }
  }

  /**
   * Render review form HTML
   */
  renderReviewForm(review) {
    const outcomeRating = review ? review.outcomeRating || 0 : 0;
    const thesisAccuracy = review ? review.thesisAccuracy || 0 : 0;
    const luckRating = review ? review.luckRating || 0 : 0;
    const notes = review ? review.notes || '' : '';

    return `
      <form id="review-form" class="review-form" novalidate>
        <div class="form-group">
          <label class="form-label required">
            Outcome Rating
          </label>
          <div class="star-rating-input" 
               data-field="outcomeRating" 
               data-value="${outcomeRating}"
               role="radiogroup"
               aria-label="Outcome rating"
               aria-describedby="outcome-help"
               aria-required="true">
            ${this.renderStarRatingInput('outcomeRating', outcomeRating)}
          </div>
          <small id="outcome-help" class="form-help">
            How well did the decision turn out as of today?
          </small>
          <span id="outcome-error" class="form-error" role="alert"></span>
        </div>

        <div class="form-group">
          <label class="form-label required">
            Thesis Accuracy
          </label>
          <div class="star-rating-input" 
               data-field="thesisAccuracy" 
               data-value="${thesisAccuracy}"
               role="radiogroup"
               aria-label="Thesis accuracy rating"
               aria-describedby="thesis-help"
               aria-required="true">
            ${this.renderStarRatingInput('thesisAccuracy', thesisAccuracy)}
          </div>
          <small id="thesis-help" class="form-help">
            How accurate was your original reasoning and expectations?
          </small>
          <span id="thesis-error" class="form-error" role="alert"></span>
        </div>

        <div class="form-group">
          <label class="form-label required">
            Luck / Chance
          </label>
          <div class="star-rating-input" 
               data-field="luckRating" 
               data-value="${luckRating}"
               role="radiogroup"
               aria-label="Luck or chance rating"
               aria-describedby="luck-help"
               aria-required="true">
            ${this.renderStarRatingInput('luckRating', luckRating)}
          </div>
          <small id="luck-help" class="form-help">
            How much did luck or random chance influence the outcome?
          </small>
          <span id="luck-error" class="form-error" role="alert"></span>
        </div>

        <div class="form-group">
          <label for="review-notes" class="form-label">
            Notes (optional)
          </label>
          <textarea 
            id="review-notes" 
            name="notes" 
            class="form-textarea" 
            rows="4"
            aria-describedby="notes-help"
          >${window.utils.escapeHtml(notes)}</textarea>
          <small id="notes-help" class="form-help">
            Additional observations, reflections, or context about this review.
          </small>
        </div>

        ${!review ? `
          <div class="form-info">
            <p><strong>Note:</strong> The review date will be recorded automatically as ${new Date().toLocaleString()}.</p>
          </div>
        ` : ''}

        <div class="form-actions">
          <button type="button" class="btn btn-secondary" data-action="cancel">
            Cancel
          </button>
          <button type="submit" class="btn btn-primary">
            ${review ? 'Update Review' : 'Save Review'}
          </button>
        </div>
      </form>
    `;
  }

  /**
   * Handle review form submission
   */
  async handleReviewSubmit(form, decisionId, isEdit) {
    try {
      // Get form data
      const formData = new FormData(form);
      const data = {
        outcomeRating: parseInt(formData.get('outcomeRating') || '0', 10),
        thesisAccuracy: parseInt(formData.get('thesisAccuracy') || '0', 10),
        luckRating: parseInt(formData.get('luckRating') || '0', 10),
        notes: formData.get('notes').trim(),
      };

      // Validate
      const errors = this.validateReviewData(data);
      if (Object.keys(errors).length > 0) {
        this.displayFormErrors(form, errors);
        return;
      }

      // Sanitize
      data.notes = window.utils.sanitizeText(data.notes);

      // Get current file data
      const fileData = window.storageManager.getCurrentData();
      if (!fileData) {
        throw new Error('No file open');
      }

      const decision = fileData.decisions.find(d => d.id === decisionId);
      if (!decision) {
        throw new Error('Decision not found');
      }

      const now = new Date().toISOString();

      if (isEdit && this.editingReview) {
        // Update existing review
        const review = decision.reviews.find(r => r.id === this.editingReview.id);
        if (review) {
          Object.assign(review, data);
          // Keep original createdAt
        }
      } else {
        // Create new review
        const newReview = {
          id: window.utils.generateUUID(),
          ...data,
          createdAt: now, // Auto-recorded timestamp
        };
        decision.reviews.push(newReview);
      }

      decision.updatedAt = now;
      fileData.meta.updatedAt = now;

      // Save to Drive
      window.uiManager.showToast('Saving...', 'info');
      await window.storageManager.updateFile(
        window.storageManager.getCurrentFileInfo().fileId,
        fileData
      );

      // Close modal and update UI
      window.uiManager.closeModal(this.currentForm);
      window.uiManager.renderDecisionDetail(decisionId);
      window.uiManager.showToast(
        isEdit ? 'Review updated successfully' : 'Review added successfully',
        'success'
      );

      // Render charts if there are multiple reviews
      if (decision.reviews.length > 1) {
        setTimeout(() => {
          window.charts.renderReviewCharts(decision);
        }, 100);
      }

    } catch (error) {
      console.error('Error saving review:', error);
      window.uiManager.showToast(error.message || 'Failed to save review', 'error');
    }
  }

  /**
   * Validate review data
   */
  validateReviewData(data) {
    const errors = {};

    if (data.outcomeRating < 0 || data.outcomeRating > 5) {
      errors.outcomeRating = 'Rating must be between 0 and 5';
    }

    if (data.thesisAccuracy < 0 || data.thesisAccuracy > 5) {
      errors.thesisAccuracy = 'Rating must be between 0 and 5';
    }

    if (data.luckRating < 0 || data.luckRating > 5) {
      errors.luckRating = 'Rating must be between 0 and 5';
    }

    if (data.notes && data.notes.length > 2000) {
      errors.notes = 'Notes must be 2000 characters or less';
    }

    return errors;
  }
}

// Export singleton instance
const formsManager = new FormsManager();

// Make available globally
if (typeof window !== 'undefined') {
  window.forms = formsManager;
}
