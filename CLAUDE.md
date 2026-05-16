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
# Install dependencies
npm install

# Start development server (Vite)
npm run dev

# Build for production
npm build

# Run tests
npm test

# Run tests in watch mode
npm run test:watch
```

The development server runs at `http://localhost:5173` by default.

## Testing

This project uses Jest and React Testing Library for unit tests. All tests follow these patterns:
- Mock external dependencies at module level (`jest.mock()`)
- Use `data-testid` attributes for element selection
- Use `fireEvent` for user interactions
- Use `waitFor` for async state updates

```powershell
# Run all tests
npm test

# Run specific test file
npm test -- --testPathPattern="AuthContext"

# Run tests with coverage
npm test -- --coverage
```

**Key test files:**
- `src/FeedbackButton.test.jsx` - Feedback button tests
- `src/auth/AuthContext.test.jsx` - Auth state management tests
- `src/components/LoginButton.test.jsx` - Google login button tests
- `src/components/UserProfile.test.jsx` - User profile display tests

## Code Architecture

### Overview
This is a React application with reusable UI components and Google OAuth authentication. The architecture emphasizes separation of concerns with dedicated layers for authentication state, API integration, and UI components.

### Auth Architecture
Authentication uses Google Identity Services via `@react-oauth/google`:
- **AuthContext** (`src/auth/AuthContext.jsx`) - Manages user state and login/logout functions
- **useGoogleAuth** (`src/auth/useGoogleAuth.js`) - Handles Google login flow and userinfo API calls
- **GoogleOAuthProvider** - Top-level wrapper that initializes Google Identity Services

Auth state is centralized in `AuthContext`, accessed via the `useAuth()` hook throughout the app.

### Components
- **FeedbackButton** - Opens GitHub issue creation dialog. Props:
  - `repositoryUrl` (string, optional) - GitHub repository URL
- **LoginButton** - Google Sign-in button. Visible only when user is logged out.
- **UserProfile** - Displays user name, email, and avatar. Includes Sign out button.

### Key Patterns
- Components are functional and use React hooks
- Auth state flows via Context API, not prop-drilling
- Google-specific logic isolated in `useGoogleAuth` hook
- All components have comprehensive unit tests with `data-testid` selectors
- Accessibility attributes (aria-labels) on all interactive elements

## Configuration

### Google OAuth Setup

1. **Get a Google Client ID:**
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create a new project or select existing one
   - Go to APIs & Services → Credentials
   - Create OAuth 2.0 Client ID (Web application)
   - Add `http://localhost:5173` to "Authorized JavaScript origins"
   - Copy the Client ID

2. **Add to `.env`:**
   ```
   VITE_GOOGLE_CLIENT_ID=your-client-id-here
   ```
   The `.env` file is **not** committed to git. Each developer must create their own.

3. **Access in code:**
   ```jsx
   import.meta.env.VITE_GOOGLE_CLIENT_ID
   ```

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

The `accessToken` from `useAuth().user` can be used to make authenticated Google API calls.

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
├── .env                                   # Environment variables (not committed)
├── package.json                           # NPM dependencies and scripts
├── src/
│   ├── main.jsx                           # React app entry (Vite)
│   ├── index.css                          # Global styles
│   ├── App.jsx                            # Main app component
│   ├── App.css                            # App styling
│   ├── FeedbackButton.jsx                 # Feedback button component
│   ├── FeedbackButton.test.jsx            # Feedback button tests
│   ├── setupTests.js                      # Jest setup file
│   ├── auth/
│   │   ├── AuthContext.jsx                # Auth state provider & useAuth hook
│   │   ├── AuthContext.test.jsx           # Auth context tests
│   │   └── useGoogleAuth.js               # Google login hook
│   └── components/
│       ├── LoginButton.jsx                # Google Sign-in button
│       ├── LoginButton.test.jsx           # Login button tests
│       ├── UserProfile.jsx                # User profile display
│       └── UserProfile.test.jsx           # User profile tests
└── node_modules/                          # Dependencies (generated by npm)
```

## Notes

- This is a test repository - update this file as the actual project structure and patterns emerge
- Remove sections that don't apply to your specific project
- Link to external documentation or tools that are important for development
