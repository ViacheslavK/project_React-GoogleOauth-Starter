# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a test repository for experimenting with Claude Code workflows and features.

## Development Setup

### Prerequisites
- Git
- PowerShell or Bash shell

### Quick Start

```powershell
# Clone and navigate to the repository
git clone <repository-url>
cd ClaudeTest
```

## Building and Running

```powershell
# Install dependencies (frontend)
npm install

# Install backend dependencies
cd backend && npm install && cd ..

# Start both frontend and backend servers
npm run dev:all

# Start only frontend (Vite)
npm run dev

# Start only backend
npm run dev:backend

# Build for production
npm build

# Run tests
npm test

# Run tests in watch mode
npm run test:watch
```

The development server runs at `http://localhost:5173` by default.
The backend server runs at `http://localhost:3001` by default.

## Testing

This project uses Jest and React Testing Library for comprehensive unit tests. **Current test coverage: 79 tests across 10 test suites, all passing.**

### Test Architecture Patterns

**Module-level mocking:**
- Mock external dependencies at top of test file with `jest.mock()`
- For `@react-oauth/google`, capture configs to trigger callbacks: `useGoogleLogin.mockImplementation((config) => { ... })`
- When mocking hooks called multiple times (useGoogleAuth calls useGoogleLogin twice), capture only the first non-duplicate to avoid React.StrictMode double-renders

**Component testing:**
- Use `data-testid` attributes for element selection
- Use `fireEvent` for user interactions and `act()` to wrap state updates
- Use `waitFor()` for async state updates and for proper "act" wrapping of async operations
- Render components with `AuthProvider` wrapper to access context

**Hook testing:**
- Use `renderHook()` with `wrapper` for testing hooks in isolation
- Wrap async operations in `await act(async () => { ... })`
- For components that use hooks internally, prefer `render()` over `renderHook()` to test full component behavior

**Fake timer pattern (for time-based behavior):**
- Use `jest.useFakeTimers()` in `beforeEach()` and `jest.useRealTimers()` in `afterEach()` to control time
- Scope fake timers to specific test suites or describe blocks, NOT globally in `setupTests.js`
- Use `jest.advanceTimersByTime(ms)` wrapped in `act()` to advance time
- Example: Test proactive token refresh that fires 60 seconds before token expiry

```powershell
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run specific test file
npm test -- --testPathPattern="AuthContext"

# Run single test
npm test -- --testNamePattern="successful login"

# Run tests with coverage (includes visual report)
npm test -- --coverage
```

### Test Files & Coverage

**OAuth & Auth (43 tests):**
- `src/auth/AuthContext.test.jsx` (16 tests) - State initialization, error handling, loading states, session restoration, sessionExpired state
- `src/auth/useGoogleAuth.test.js` (14 tests) - Hook structure, callbacks, error handling, silent refresh, session expiry integration
- `src/auth/error-handling.test.js` (12 tests) - Network errors, HTTP status codes, malformed responses, timeouts
- `src/components/AuthError.test.jsx` (6 tests) - Error display, dismissal, accessibility

**Components (13 tests):**
- `src/components/LoginButton.test.jsx` (4 tests) - Visibility, loading state, click handling
- `src/components/LoginButton.test.comprehensive.jsx` (7 tests) - Extended button behavior
- `src/components/UserProfile.test.jsx` - Profile display and logout
- `src/components/SessionExpiredBanner.test.jsx` (6 tests) - Session expiry banner display, dismissal, accessibility

**Utilities (7 tests):**
- `src/utils/fetchWithAuth.test.js` (7 tests) - 401 response handling, callback invocation, credentials merging

**Token Refresh (5 tests):**
- `src/auth/token-refresh.test.js` (5 tests) - Timer scheduling, expiry detection, refresh triggering

**Other (4 tests):**
- `src/FeedbackButton.test.jsx` - Feedback button functionality

## Code Architecture

### Overview
This is a React application with reusable UI components and Google OAuth authentication. The architecture emphasizes separation of concerns with dedicated layers for authentication state, API integration, and UI components.

### Auth Architecture
Authentication uses Google Identity Services via `@react-oauth/google` with a secure backend token exchange:
- **AuthContext** (`src/auth/AuthContext.jsx`) - Manages user state and login/logout functions
- **useGoogleAuth** (`src/auth/useGoogleAuth.js`) - Handles authorization code flow with PKCE
- **Backend** (`backend/server.js`) - Exchanges authorization codes for tokens securely server-side using HttpOnly cookies
- **GoogleOAuthProvider** - Top-level wrapper that initializes Google Identity Services

The authorization code flow provides enhanced security:
1. Frontend receives authorization code from Google (not a token)
2. Code is sent to backend via HTTPS POST
3. Backend securely exchanges code for access token using Client Secret
4. Tokens (access, refresh, expiry date) are stored in server session; access token never sent to frontend
5. User profile data (name, email, picture) is returned to frontend and stored in React state
6. Token expiry date is returned to frontend to enable proactive refresh scheduling

**Token Refresh & Session Expiry:**
- Frontend schedules a proactive refresh 60 seconds before token expiry
- When scheduled time arrives, `useGoogleAuth` calls `silentRefresh()` with `prompt: 'none'`
- Silent refresh uses the stored `refresh_token` to obtain a new access token server-side
- If silent refresh fails, `sessionExpired` flag is set and a banner prompts user to sign in again
- Session expiry detection happens automatically — no manual intervention needed

Auth state is centralized in `AuthContext`, accessed via the `useAuth()` hook throughout the app. Context provides: `user`, `login`, `logout`, `error`, `setError`, `isLoading`, `setIsLoading`, `sessionExpired`, `setSessionExpired`, `needsRefresh`, `setNeedsRefresh`.

### Components

- **FeedbackButton** - Opens GitHub issue creation dialog. Props:
  - `repositoryUrl` (string, optional) - GitHub repository URL
- **LoginButton** - Google Sign-in button. Visible only when user is logged out.
- **UserProfile** - Displays user name, email, and avatar. Includes Sign out button.
- **SessionExpiredBanner** - Displays dismissible banner when session expires. Reads `sessionExpired` flag from `AuthContext`.

### Key Patterns
- Components are functional and use React hooks
- Auth state flows via Context API, not prop-drilling
- Google-specific logic isolated in `useGoogleAuth` hook
- All components have comprehensive unit tests with `data-testid` selectors
- Accessibility attributes (aria-labels) on all interactive elements

## Configuration

### Google OAuth Setup

1. **Get a Google Client ID and Client Secret:**
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create a new project or select existing one
   - Go to APIs & Services → Credentials
   - Create OAuth 2.0 Client ID (Web application)
   - Add `http://localhost:5173` to "Authorized JavaScript origins"
   - Add `http://localhost:3001` to "Authorized redirect URIs" (backend)
   - Copy both the **Client ID** and **Client Secret**

2. **Add credentials to `.env` (frontend):**
   ```
   VITE_GOOGLE_CLIENT_ID=your-client-id-here
   VITE_API_URL=http://localhost:3001
   ```
   The `.env` file is **not** committed to git. Each developer must create their own.

3. **Add credentials to `backend/.env` (backend):**
   ```
   GOOGLE_CLIENT_ID=your-client-id-here
   GOOGLE_CLIENT_SECRET=your-client-secret-here
   SESSION_SECRET=generate-a-random-string-here
   FRONTEND_URL=http://localhost:5173
   ```
   The `backend/.env` file is **not** committed to git. **Never commit the Client Secret.**

4. **Important Security Notes:**
   - The Client Secret must ONLY be stored on the backend (`backend/.env`)
   - Never expose the Client Secret in frontend code or environment variables
   - The frontend only needs the Client ID (for initiating OAuth)
   - The backend handles all token exchanges using the Client Secret

## Common Development Tasks

### Using Google Authentication

The app automatically provides login/logout via `LoginButton` and `UserProfile` components. When a user logs in, their profile (name, email, avatar) is available via the `useAuth()` hook:

```jsx
import { useAuth } from './auth/AuthContext';

function MyComponent() {
  const { user, login, logout } = useAuth();
  return user ? <div>Hello, {user.name}</div> : <button onClick={login}>Login</button>;
}
```

**Security Note:** Access tokens are **not** exposed to the frontend. All authenticated API calls to Google must go through the backend using the stored access token (via the HttpOnly session cookie). This prevents token theft via XSS attacks.

### Backend API Endpoints

- **POST /api/auth/google** — OAuth code exchange. Accepts `{ code }`. Returns `{ user, expiry_date }`. Stores access/refresh tokens in session.
- **GET /api/auth/user** — Returns session user or null. Returns `{ user, expiry_date }` or `{ user: null, expiry_date: null }`.
- **POST /api/auth/refresh** — Server-side token refresh using stored refresh_token. Returns `{ success: true, expiry_date }` or 401 on failure.
- **POST /api/auth/logout** — Destroys session and clears session cookie. Returns `{ success: true }`.

### Using the FeedbackButton Component

```jsx
import { FeedbackButton } from './FeedbackButton';

<FeedbackButton repositoryUrl="https://github.com/your-org/your-repo" />
```

### Creating a Feature

1. Create a feature branch: `git checkout -b feature/description`
2. Make your changes
3. Commit with clear commit messages
4. Push and create a pull request

## File Structure

```
ClaudeTest/
├── CLAUDE.md                              # This file
├── index.html                             # Vite entry point
├── vite.config.js                         # Vite configuration
├── jest.config.js                         # Jest test configuration
├── .babelrc                               # Babel configuration for JSX/ES6
├── .gitignore                             # Git ignore rules
├── .env                                   # Frontend environment variables (not committed)
├── package.json                           # NPM dependencies and scripts
├── backend/                               # Express.js backend server
│   ├── server.js                          # OAuth token exchange + session management
│   ├── package.json                       # Backend dependencies
│   └── .env                               # Backend environment variables (not committed)
├── src/                                   # Frontend React application
│   ├── main.jsx                           # React app entry (Vite)
│   ├── index.css                          # Global styles
│   ├── App.jsx                            # Main app component
│   ├── App.css                            # App styling
│   ├── FeedbackButton.jsx                 # Feedback button component
│   ├── FeedbackButton.test.jsx            # Feedback button tests
│   ├── setupTests.js                      # Jest setup file
│   ├── auth/
│   │   ├── AuthContext.jsx                # Auth state provider & useAuth hook + token refresh scheduling
│   │   ├── AuthContext.test.jsx           # Auth context tests (16 tests)
│   │   ├── useGoogleAuth.js               # OAuth authorization code flow hook + silent refresh
│   │   ├── useGoogleAuth.test.js          # useGoogleAuth tests (14 tests)
│   │   ├── error-handling.test.js         # Comprehensive error scenarios (12 tests)
│   │   └── token-refresh.test.js          # Token refresh timer tests (5 tests)
│   ├── utils/
│   │   ├── fetchWithAuth.js               # 401-intercepting fetch wrapper
│   │   └── fetchWithAuth.test.js          # fetchWithAuth tests (7 tests)
│   └── components/
│       ├── LoginButton.jsx                # Google Sign-in button
│       ├── LoginButton.test.jsx           # Login button tests (4 tests)
│       ├── LoginButton.test.comprehensive.jsx # Extended tests (7 tests)
│       ├── UserProfile.jsx                # User profile display
│       ├── UserProfile.test.jsx           # User profile tests
│       ├── AuthError.jsx                  # Error display component
│       ├── AuthError.test.jsx             # AuthError tests (6 tests)
│       ├── AuthError.css                  # Error component styles
│       ├── SessionExpiredBanner.jsx       # Session expiry notification banner
│       ├── SessionExpiredBanner.test.jsx  # Banner tests (6 tests)
│       └── SessionExpiredBanner.css       # Banner styles
└── node_modules/                          # Dependencies (generated by npm)
```

## Notes

- This is a test repository - update this file as the actual project structure and patterns emerge
- Remove sections that don't apply to your specific project
- Link to external documentation or tools that are important for development
