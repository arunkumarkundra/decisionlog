/**
 * charts.js
 * Create charts (Chart.js) for ratings over time
 * Provide accessible table fallback under each chart
 */

class ChartsManager {
  constructor() {
    this.chartInstances = {};
  }

  /**
   * Render review charts for a decision
   * @param {Object} decision - Decision object with reviews
   */
  renderReviewCharts(decision) {
    if (!decision.reviews || decision.reviews.length < 2) {
      return; // Need at least 2 reviews for a meaningful chart
    }

    const chartContainer = document.getElementById(`review-charts-${decision.id}`);
    if (!chartContainer) {
      return;
    }

    // Sort reviews by date (oldest first for timeline)
    const sortedReviews = [...decision.reviews].sort((a, b) => {
      return new Date(a.createdAt) - new Date(b.createdAt);
    });

    // Prepare data
    const labels = sortedReviews.map(review => 
      new Date(review.createdAt).toLocaleDateString()
    );
    
    const outcomeData = sortedReviews.map(r => r.outcomeRating || 0);
    const thesisData = sortedReviews.map(r => r.thesisAccuracy || 0);
    const luckData = sortedReviews.map(r => r.luckRating || 0);

    // Clear existing content
    chartContainer.innerHTML = '';

    // Create canvas for chart
    const canvas = document.createElement('canvas');
    canvas.id = `chart-${decision.id}`;
    canvas.setAttribute('role', 'img');
    canvas.setAttribute('aria-label', 'Line chart showing rating trends over time');
    chartContainer.appendChild(canvas);

    // Create chart
    const ctx = canvas.getContext('2d');
    
    // Destroy existing chart if it exists
    if (this.chartInstances[decision.id]) {
      this.chartInstances[decision.id].destroy();
    }

    this.chartInstances[decision.id] = new Chart(ctx, {
      type: 'line',
      data: {
        labels: labels,
        datasets: [
          {
            label: 'Outcome Rating',
            data: outcomeData,
            borderColor: '#3b82f6',
            backgroundColor: 'rgba(59, 130, 246, 0.1)',
            tension: 0.3,
            fill: true,
          },
          {
            label: 'Thesis Accuracy',
            data: thesisData,
            borderColor: '#10b981',
            backgroundColor: 'rgba(16, 185, 129, 0.1)',
            tension: 0.3,
            fill: true,
          },
          {
            label: 'Luck / Chance',
            data: luckData,
            borderColor: '#f59e0b',
            backgroundColor: 'rgba(245, 158, 11, 0.1)',
            tension: 0.3,
            fill: true,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        aspectRatio: 2,
        plugins: {
          title: {
            display: true,
            text: 'Rating Trends Over Time',
            font: {
              size: 16,
              weight: 'bold',
            },
          },
          legend: {
            display: true,
            position: 'bottom',
          },
          tooltip: {
            mode: 'index',
            intersect: false,
          },
        },
        scales: {
          y: {
            beginAtZero: true,
            max: 5,
            ticks: {
              stepSize: 1,
            },
            title: {
              display: true,
              text: 'Rating (0-5 stars)',
            },
          },
          x: {
            title: {
              display: true,
              text: 'Review Date',
            },
          },
        },
        interaction: {
          mode: 'nearest',
          axis: 'x',
          intersect: false,
        },
      },
    });

    // Add accessible table below chart
    this.renderAccessibleTable(chartContainer, sortedReviews);
  }

  /**
   * Render accessible table for screen readers
   * @param {HTMLElement} container - Container element
   * @param {Array} reviews - Sorted reviews array
   */
  renderAccessibleTable(container, reviews) {
    const table = document.createElement('table');
    table.className = 'chart-data-table';
    table.setAttribute('aria-label', 'Review ratings data table');
    
    table.innerHTML = `
      <caption>Review Ratings Over Time (Accessible Data Table)</caption>
      <thead>
        <tr>
          <th scope="col">Review Date</th>
          <th scope="col">Outcome Rating</th>
          <th scope="col">Thesis Accuracy</th>
          <th scope="col">Luck / Chance</th>
          <th scope="col">Notes</th>
        </tr>
      </thead>
      <tbody>
        ${reviews.map(review => `
          <tr>
            <td data-label="Review Date">${new Date(review.createdAt).toLocaleString()}</td>
            <td data-label="Outcome Rating">
              <span aria-label="${review.outcomeRating || 0} out of 5 stars">
                ${this.renderStars(review.outcomeRating || 0)}
              </span>
            </td>
            <td data-label="Thesis Accuracy">
              <span aria-label="${review.thesisAccuracy || 0} out of 5 stars">
                ${this.renderStars(review.thesisAccuracy || 0)}
              </span>
            </td>
            <td data-label="Luck / Chance">
              <span aria-label="${review.luckRating || 0} out of 5 stars">
                ${this.renderStars(review.luckRating || 0)}
              </span>
            </td>
            <td data-label="Notes">
              ${review.notes ? window.utils.escapeHtml(review.notes) : '—'}
            </td>
          </tr>
        `).join('')}
      </tbody>
    `;

    container.appendChild(table);
  }

  /**
   * Render star rating as text
   * @param {number} rating - Rating value (0-5)
   * @returns {string} Star representation
   */
  renderStars(rating) {
    const fullStars = Math.floor(rating);
    const emptyStars = 5 - fullStars;
    return '★'.repeat(fullStars) + '☆'.repeat(emptyStars);
  }

  /**
   * Destroy a chart instance
   * @param {string} decisionId - Decision ID
   */
  destroyChart(decisionId) {
    if (this.chartInstances[decisionId]) {
      this.chartInstances[decisionId].destroy();
      delete this.chartInstances[decisionId];
    }
  }

  /**
   * Destroy all chart instances
   */
  destroyAllCharts() {
    Object.keys(this.chartInstances).forEach(id => {
      this.destroyChart(id);
    });
  }

  /**
   * Render summary statistics for all decisions
   * @param {Array} decisions - Array of all decisions
   */
  renderSummaryStats(decisions) {
    // This could be expanded to show aggregate statistics
    // For now, we focus on individual decision charts
    
    if (!decisions || decisions.length === 0) {
      return;
    }

    // Calculate some basic stats
    const totalDecisions = decisions.length;
    const decisionsWithReviews = decisions.filter(d => d.reviews && d.reviews.length > 0).length;
    const totalReviews = decisions.reduce((sum, d) => sum + (d.reviews ? d.reviews.length : 0), 0);
    
    const avgImportance = decisions.reduce((sum, d) => sum + (d.importance || 0), 0) / totalDecisions;

    console.log('Summary Stats:', {
      totalDecisions,
      decisionsWithReviews,
      totalReviews,
      avgImportance: avgImportance.toFixed(2),
    });

    // Could render this to a dashboard view if needed
  }

  /**
   * Export chart as image (optional feature)
   * @param {string} decisionId - Decision ID
   * @returns {string|null} Base64 image data URL
   */
  exportChartAsImage(decisionId) {
    const chartInstance = this.chartInstances[decisionId];
    if (!chartInstance) {
      return null;
    }

    return chartInstance.toBase64Image();
  }

  /**
   * Update chart theme based on user preference
   * @param {string} theme - Theme name ('light' or 'dark')
   */
  updateChartsTheme(theme) {
    const isDark = theme === 'dark';
    
    const gridColor = isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)';
    const textColor = isDark ? '#e2e8f0' : '#1e293b';

    // Update all existing charts
    Object.values(this.chartInstances).forEach(chart => {
      if (chart.options.scales) {
        if (chart.options.scales.x) {
          chart.options.scales.x.grid = { color: gridColor };
          chart.options.scales.x.ticks = { color: textColor };
        }
        if (chart.options.scales.y) {
          chart.options.scales.y.grid = { color: gridColor };
          chart.options.scales.y.ticks = { color: textColor };
        }
      }
      
      if (chart.options.plugins && chart.options.plugins.legend) {
        chart.options.plugins.legend.labels = { color: textColor };
      }

      if (chart.options.plugins && chart.options.plugins.title) {
        chart.options.plugins.title.color = textColor;
      }

      chart.update();
    });
  }
}

// Export singleton instance
const chartsManager = new ChartsManager();

// Make available globally
if (typeof window !== 'undefined') {
  window.charts = chartsManager;
}
