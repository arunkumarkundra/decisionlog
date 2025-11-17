# DecisionLog

**Decisions remembered. Judgment improved.**

DecisionLog is a private, Google Drive-backed tool that helps you capture major decisions, record your reasoning, review outcomes over time, and improve your judgment through structured feedback. Your data stays entirely with you.

## Table of Contents

- [Why DecisionLog Exists](#why-decisionlog-exists)
- [Features](#features)
- [Setup Instructions](#setup-instructions)
- [Deployment](#deployment)
- [Architecture](#architecture)
- [Data Schema](#data-schema)
- [Accessibility](#accessibility)
- [Security & Privacy](#security--privacy)
- [Testing & QA](#testing--qa)
- [Contributing](#contributing)

## Why DecisionLog Exists

Most important life outcomes—career moves, financial choices, relationships, major purchases—are shaped by a handful of decisions made under uncertainty. Yet we rarely record what we were thinking at the moment we made those decisions.

As time passes, memory distorts the past. We forget our original reasoning, fit new narratives to old outcomes, and judge decisions by results rather than the quality of thinking behind them. This blindness prevents learning.

**DecisionLog fixes that** by providing a structured way to:

1. **Capture major decisions as they happen** - Record reasoning, expectations, alternatives, concerns, and emotional factors before hindsight colors everything.
2. **Assign importance** - Mark high-impact decisions that actually matter.
3. **Review decisions over time** - Evaluate outcomes across three dimensions: how well things turned out, how accurate your thesis was, and how much luck played a role.
4. **See patterns in your judgment** - Reviews reveal where your thinking is strong, where it's biased, and where blind spots repeat.
5. **Build self-awareness and better intuition** - Understand not only what decisions worked, but why—and how your perception changes over time.

This is not a productivity tool. It's a mirror for your judgment—one that stays honest, even when your memory doesn't.

## Features

- ✅ **100% Client-Side** - Fully static web app, no server required
- ✅ **Private & Secure** - All data stored only in your Google Drive
- ✅ **No Tracking** - No cookies, no analytics, no behavioral logging
- ✅ **Accessible** - WCAG 2.1 AA compliant with full keyboard navigation
- ✅ **Responsive Design** - Works on desktop, tablet, and mobile
- ✅ **Decision Tracking** - Record title, reasoning, importance (0-5 stars), tags, and date
- ✅ **Review System** - Track outcome rating, thesis accuracy, and luck/chance over time
- ✅ **Visual Charts** - See rating trends with accessible Chart.js visualizations
- ✅ **Search & Filter** - Full-text search, tag filtering, importance filtering, date ranges
- ✅ **Export/Import** - Download and upload JSON files
- ✅ **High Contrast Mode** - For improved visibility
- ✅ **Keyboard Shortcuts** - Efficient navigation (N = new decision, F = search, ? = help)

## Setup Instructions

### Prerequisites

1. **Google Cloud Project** with Drive API enabled
2. **OAuth 2.0 Client ID** for web application
3. **API Key** for Google Drive API
4. **Web server** for local testing (e.g., `python -m http.server` or `npx serve`)

### Step 1: Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the **Google Drive API**:
   - Navigate to "APIs & Services" > "Library"
   - Search for "Google Drive API"
   - Click "Enable"

### Step 2: Create OAuth 2.0 Credentials

1. Go to "APIs & Services" > "Credentials"
2. Click "Create Credentials" > "OAuth client ID"
3. Configure consent screen if prompted:
   - User type: External
   - App name: DecisionLog
   - Support email: Your email
   - Authorized domains: Add your domain (e.g., `yourusername.github.io`)
   - Scopes: Add `https://www.googleapis.com/auth/drive.file`
4. Create OAuth client ID:
   - Application type: Web application
   - Name: DecisionLog Web Client
   - Authorized JavaScript origins:
     - `https://yourusername.github.io` (for production)
     - `http://localhost:8000` (for local testing)
     - `http://localhost:5500` (if using Live Server)
   - Authorized redirect URIs: Leave empty (not needed for implicit flow)
5. Copy the **Client ID**

### Step 3: Create API Key

1. In "APIs & Services" > "Credentials"
2. Click "Create Credentials" > "API key"
3. Copy the **API Key**
4. (Optional) Restrict the key:
   - Application restrictions: HTTP referrers
   - Add your domain
   - API restrictions: Google Drive API

### Step 4: Configure the Application

1. Clone or download this repository
2. Open `/js/auth.js`
3. Replace the placeholder values:
```javascript
   const AUTH_CONFIG = {
     CLIENT_ID: 'YOUR_GOOGLE_CLIENT_ID_HERE',
     API_KEY: 'YOUR_GOOGLE_API_KEY_HERE',
     // ...
   };
```

### Step 5: Test Locally

1. Start a local web server in the project directory:
```bash
   # Using Python 3
   python -m http.server 8000
   
   # Or using Node.js
   npx serve -p 8000
   
   # Or using PHP
   php -S localhost:8000
```

2. Open your browser to `http://localhost:8000`
3. Test the sign-in flow and file operations

## Deployment

### GitHub Pages

1. Create a new GitHub repository
2. Push all files to the repository
3. Go to repository Settings > Pages
4. Source: Deploy from branch `main` (or `master`)
5. Save and wait for deployment
6. Your app will be available at `https://yourusername.github.io/repository-name/`

### Update OAuth Credentials

After deployment, update your Google Cloud OAuth client:
1. Add your GitHub Pages URL to "Authorized JavaScript origins"
2. Example: `https://yourusername.github.io`

### Other Static Hosts

DecisionLog can be deployed to any static hosting service:
- **Netlify**: Drag and drop the folder or connect to Git
- **Vercel**: Import from Git repository
- **Cloudflare Pages**: Connect to Git repository
- **AWS S3 + CloudFront**: Upload files to S3 bucket
- **Firebase Hosting**: Use `firebase deploy`

## Architecture

### File Structure
```
decisionlog/
├── assets/
│   └── favicon.svg
├── js/
│   ├── auth.js              # Google authentication
│   ├── storage.js           # Drive file operations
│   ├── ui.js                # UI rendering
│   ├── forms.js             # Form handling & validation
│   ├── charts.js            # Chart.js visualizations
│   ├── accessibility.js     # Accessibility utilities
│   └── utils.js             # Helper functions
├── index.html               # Main app page
├── styles.css               # Application styles
├── script.js                # App initialization
├── 404.html                 # Error page
├── privacy.html             # Privacy policy
├── terms.html               # Terms of service
├── robots.txt               # SEO configuration
└── README.md                # This file
```

### Technology Stack

- **HTML5** - Semantic markup
- **CSS3** - Modern styling with CSS Grid and Flexbox
- **Vanilla JavaScript (ES6+)** - No frameworks, modular architecture
- **Google Identity Services** - Authentication
- **Google Drive API v3** - File storage
- **Chart.js** - Data visualization
- **DOMPurify** (optional via CDN) - XSS prevention

### Module Responsibilities

- **auth.js**: Handles Google sign-in, token management (in-memory only, no cookies)
- **storage.js**: Drive file CRUD operations, schema validation, conflict detection
- **ui.js**: DOM manipulation, rendering, modal management, toasts
- **forms.js**: Decision and review forms, validation, sanitization
- **charts.js**: Chart rendering with accessible table fallbacks
- **accessibility.js**: Focus trapping, ARIA utilities, screen reader support
- **utils.js**: UUID generation, date formatting, localStorage wrappers, sanitization

## Data Schema

All data is stored in a single JSON file in the user's Google Drive:
```json
{
  "meta": {
    "app": "DecisionLog",
    "version": "1.0",
    "username": "user@example.com",
    "createdAt": "2025-11-17T15:23:00Z",
    "updatedAt": "2025-11-17T15:45:00Z"
  },
  "decisions": [
    {
      "id": "uuid-v4",
      "title": "Accept job at XYZ",
      "finalDecision": "Accepted offer",
      "description": "Reasoning, notes, tradeoffs...",
      "date": "2024-03-01",
      "importance": 4,
      "tags": ["career", "offer"],
      "createdAt": "2024-03-01T12:00:00Z",
      "updatedAt": "2024-06-01T12:00:00Z",
      "reviews": [
        {
          "id": "uuid-v4",
          "createdAt": "2024-06-01T12:01:00Z",
          "outcomeRating": 3,
          "thesisAccuracy": 2,
          "luckRating": 1,
          "notes": "Some notes about the review"
        }
      ]
    }
  ]
}
```

### File Naming Convention

Default: `decisionlog_<username>_<timestamp>.json`

Example: `decisionlog_john_doe_20251117T152300Z.json`

### Data Validation

The app validates:
- Required fields (title, date)
- Data types (importance: 0-5 integer)
- Array structures (decisions, reviews, tags)
- Automatic migration for older schema versions

## Accessibility

DecisionLog is designed to meet **WCAG 2.1 Level AA** standards.

### Features

- ✅ **Full keyboard navigation** - Tab order, arrow keys, Enter/Space activation
- ✅ **Screen reader support** - ARIA labels, roles, live regions
- ✅ **Focus management** - Visible focus indicators, focus trapping in modals
- ✅ **High contrast mode** - Toggle for improved visibility
- ✅ **Semantic HTML** - Proper heading hierarchy, landmarks
- ✅ **Accessible forms** - Labels, error messages, required field indicators
- ✅ **Alternative text** - All images and charts have text equivalents
- ✅ **Color contrast** - Meets AA standards (4.5:1 for normal text)
- ✅ **No keyboard traps** - ESC to close modals, proper focus return
- ✅ **Accessible tables** - Data tables for all charts

### Keyboard Shortcuts

- `N` - Add new decision (when not in input)
- `F` - Focus search
- `?` - Show keyboard shortcuts help
- `Tab` - Navigate forward
- `Shift+Tab` - Navigate backward
- `Enter/Space` - Activate buttons
- `Escape` - Close modals

### Testing Recommendations

1. **Automated Testing**:
   - Run Lighthouse accessibility audit (Chrome DevTools)
   - Use axe DevTools browser extension
   - Test with WAVE accessibility evaluation tool

2. **Manual Testing**:
   - Navigate entire app using only keyboard
   - Test with screen reader (NVDA on Windows, VoiceOver on Mac)
   - Verify focus order and management
   - Check color contrast with browser tools
   - Test high contrast mode

3. **Screen Readers**:
   - NVDA (Windows) - https://www.nvaccess.org/
   - JAWS (Windows) - Commercial
   - VoiceOver (Mac/iOS) - Built-in
   - TalkBack (Android) - Built-in

## Security & Privacy

### Privacy Principles

1. **No Server Storage** - All data lives only in your Google Drive
2. **No Cookies** - Authentication tokens stored in memory only
3. **No Tracking** - No analytics, no behavioral logging, no third-party scripts
4. **Minimal Permissions** - Only `drive.file` scope (access to files app creates)
5. **Your Data, Your Control** - Export, import, delete anytime

### Security Measures

1. **XSS Prevention**:
   - All user input is sanitized before rendering
   - HTML escaping for text content
   - DOMPurify (via CDN) for any rich content (if enabled)

2. **Content Security Policy**:
```html
   <meta http-equiv="Content-Security-Policy" content="
     default-src 'self';
     script-src 'self' https://accounts.google.com https://apis.google.com https://cdn.jsdelivr.net;
     connect-src 'self' https://www.googleapis.com;
     img-src 'self' data:;
     style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
     font-src https://fonts.gstatic.com;
     frame-ancestors 'none';
     base-uri 'self';
   ">
```

3. **Security Headers**:
   - `X-Frame-Options: DENY` - Prevent clickjacking
   - `X-Content-Type-Options: nosniff` - Prevent MIME sniffing
   - `Referrer-Policy: strict-origin-when-cross-origin`

4. **Input Validation**:
   - Client-side validation for all forms
   - Length limits on text fields
   - Type checking for numeric inputs
   - Sanitization before storage

5. **Conflict Detection**:
   - Checks if file was modified remotely before saving
   - Warns user and offers merge options

### CSP Caveats

- Google Identity Services may require `'unsafe-inline'` for some styles
- Chart.js is loaded from CDN (jsDelivr) - specify exact version
- For production, consider self-hosting all dependencies

### Local Storage Usage

The app uses `localStorage` (not cookies) for:
- UI preferences (theme, high contrast, keyboard shortcuts)
- These are device-local and never transmitted
- Can be cleared anytime via browser settings

## Testing & QA

### QA Checklist

Before deploying, verify:

#### Authentication & File Management
- [ ] Sign in with Google works
- [ ] File list displays correctly
- [ ] Create new file works with custom filename
- [ ] Open existing file works
- [ ] File save/update works
- [ ] Export to JSON works
- [ ] Import from JSON works
- [ ] Close file returns to file picker
- [ ] Sign out works

#### Decision Management
- [ ] Add new decision works
- [ ] All form fields save correctly
- [ ] Edit decision works
- [ ] Delete decision works (with confirmation)
- [ ] Star ratings work (0-5)
- [ ] Tags save as array
- [ ] Date defaults to today but is editable
- [ ] Form validation shows appropriate errors

#### Review Management
- [ ] Add review to decision works
- [ ] All three ratings save correctly
- [ ] Review timestamp is auto-recorded
- [ ] Edit review works (keeps original timestamp)
- [ ] Delete review works (with confirmation)
- [ ] Multiple reviews display chronologically

#### Search & Filter
- [ ] Search finds decisions by title
- [ ] Search finds decisions by description
- [ ] Search finds decisions by tags
- [ ] Filter by tags works
- [ ] Filter by importance works
- [ ] Sort by date works (asc/desc)
- [ ] Sort by title works
- [ ] Sort by importance works

#### Charts & Visualization
- [ ] Charts render for decisions with 2+ reviews
- [ ] All three metrics shown on chart
- [ ] Accessible table displays below chart
- [ ] Table data matches chart data

#### Accessibility
- [ ] Full keyboard navigation works
- [ ] Tab order is logical
- [ ] Focus indicators visible
- [ ] Modals trap focus
- [ ] ESC closes modals
- [ ] Toasts announce properly
- [ ] Screen reader reads UI correctly
- [ ] High contrast mode works
- [ ] Color contrast meets AA (use browser tools)
- [ ] All images have alt text
- [ ] Forms have proper labels
- [ ] Error messages are associated with fields

#### Security
- [ ] No cookies are set (check DevTools)
- [ ] Input sanitization prevents XSS
- [ ] CSP headers are correct
- [ ] No external scripts except documented CDNs
- [ ] localStorage only used for preferences

#### Performance & Compatibility
- [ ] Works in Chrome
- [ ] Works in Firefox
- [ ] Works in Safari
- [ ] Works in Edge
- [ ] Responsive on mobile
- [ ] Responsive on tablet
- [ ] Works offline (read-only for loaded file)

### Automated Testing

Run Lighthouse audit:
```bash
# In Chrome DevTools
1. Open DevTools (F12)
2. Navigate to "Lighthouse" tab
3. Select "Accessibility" category
4. Click "Generate report"
5. Aim for score of 90+
```

Use axe DevTools:
```bash
# Install browser extension
1. Install axe DevTools for Chrome/Firefox
2. Run automated scan
3. Fix all critical and serious issues
```

## Contributing

This is an open-source project. Contributions are welcome!

### How to Contribute

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Test thoroughly (follow QA checklist)
5. Commit your changes (`git commit -m 'Add amazing feature'`)
6. Push to the branch (`git push origin feature/amazing-feature`)
7. Open a Pull Request

### Code Style

- Use 2 spaces for indentation
- Use meaningful variable names
- Comment complex logic
- Follow existing patterns in codebase
- Ensure accessibility compliance
- Write semantic HTML
- Keep functions focused and small

### Reporting Issues

Found a bug or have a suggestion?

1. Check existing issues first
2. Create a new issue with:
   - Clear title
   - Steps to reproduce (for bugs)
   - Expected behavior
   - Actual behavior
   - Browser and OS information
   - Screenshots if applicable

## License

This project is released under the MIT License. See LICENSE file for details.

## Credits

- Built with vanilla JavaScript, no frameworks
- Authentication: Google Identity Services
- Storage: Google Drive API
- Charts: Chart.js
- Sanitization: DOMPurify (optional)

## Support

For questions or support:
- Open an issue on GitHub
- Check the documentation in this README
- Review the inline code comments

---

**DecisionLog** - Decisions remembered. Judgment improved.

Your data stays yours. Your judgment improves over time.
