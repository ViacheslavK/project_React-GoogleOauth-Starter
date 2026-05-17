# Developer Guide: Token Refresh & Session Expiry Implementation

## Overview

This document describes the token refresh and session expiry system for developers working on this project. It covers the architecture, implementation patterns, and how to test or extend the system.

## Token Lifecycle Diagram

```
┌─ User Signs In ─────────────────────────────────────────────┐
│                                                               │
│  1. Frontend → Google: Get auth code (via GoogleOAuthProvider)
│  2. Frontend → Backend: POST /api/auth/google { code }
│  3. Backend → Google: Exchange code for access/refresh tokens
│  4. Backend: Store tokens in secure session (NOT to frontend)
│  5. Frontend: Store user profile (name/email/picture) in React state
│  6. Frontend: Calculate refresh timer (expiry_date - 60 seconds)
│
└──────────────────────────────────────────────────────────────┘
            ↓
        ┌───────────────────────────────┐
        │  Token Valid (active session) │
        └───────────────────────────────┘
            ↓
        [59 minutes pass]
            ↓
┌─ Proactive Refresh (60s before expiry) ─────────────────────┐
│                                                               │
│  1. Timer fires in AuthContext (scheduleRefresh callback)
│  2. setNeedsRefresh(true) is called
│  3. useGoogleAuth detects needsRefresh and calls silentRefresh
│  4. silentRefresh calls useGoogleLogin({ prompt: 'none' })
│  5. Google returns new auth code (no user interaction)
│  6. Frontend → Backend: POST /api/auth/google { new code }
│  7. Backend: Exchange for new tokens, update session
│  8. Frontend: New token expiry received, timer rescheduled
│
└──────────────────────────────────────────────────────────────┘
            ↓
        [cycle repeats]
            OR
┌─ Refresh Failure / Manual Logout ──────────────────────────┐
│                                                               │
│  Silent Refresh fails:                                       │
│    • setSessionExpired(true)                                │
│    • setError('Session expired. Please log in again.')      │
│    • SessionExpiredBanner appears with dismissible message  │
│                                                               │
│  User clicks dismiss or signs in again:                      │
│    • setSessionExpired(false)                               │
│    • New login cycle begins                                  │
│                                                               │
└──────────────────────────────────────────────────────────────┘
```

## Session Storage Shape

### Backend: `req.session`

```javascript
req.session = {
  user: {
    name: string,
    email: string,
    picture: string
  },
  tokens: {
    access_token: string,      // Current access token (used for API calls)
    refresh_token: string,      // Used to obtain new access token (preserved across rotations)
    expiry_date: number         // Millisecond epoch (Date.now() equivalent)
  }
}
```

The `refresh_token` is critical — it must be preserved across token rotations. Google does not always issue a new one, so the backend falls back to the stored value if a refresh response doesn't include one.

### Frontend: `AuthContext` State

```javascript
{
  user: null | { name, email, picture },
  isLoading: boolean,
  error: null | string,
  sessionExpired: boolean,
  needsRefresh: boolean,
  // ... methods: login(), logout(), setError(), setIsLoading(), setSessionExpired(), setNeedsRefresh()
}
```

Tokens are **never** stored in frontend state. Only the user profile (public information) and expiry date are sent to the frontend.

## AuthContext State Reference

| Field | Type | Initial | Updated By | Purpose |
|-------|------|---------|-----------|---------|
| `user` | Object\|null | null | `login()` | User profile (name, email, picture) |
| `isLoading` | boolean | true | `setIsLoading()` | Page loading state (auth restore, sign-in) |
| `error` | string\|null | null | `setError()` | Generic auth errors (network, OAuth failures) |
| `sessionExpired` | boolean | false | `setSessionExpired()` | Mid-session expiry flag (triggers banner) |
| `needsRefresh` | boolean | false | `setNeedsRefresh()` | Timer signal to trigger `silentRefresh()` |
| `login(userData, expiryDate?)` | function | — | called from `useGoogleAuth`, `restoreSession` | Set user, clear error, schedule refresh timer |
| `logout()` | async function | — | User clicks logout | Clear all state, destroy session |
| `setError()` | function | — | `useGoogleAuth`, tests | Set/clear error message |
| `setSessionExpired()` | function | — | `silentRefresh.onError()`, `setSessionExpired()` | Set/clear expiry flag |
| `setNeedsRefresh()` | function | — | `scheduleRefresh` timer | Signal that refresh is needed |

## How to Use `fetchWithAuth` in New Components

The `fetchWithAuth` utility is a wrapper around `fetch` that automatically detects 401 responses and calls an optional callback:

```javascript
import { fetchWithAuth } from '../utils/fetchWithAuth';
import { useAuth } from '../auth/AuthContext';

function MyComponent() {
  const { setSessionExpired } = useAuth();

  const handleClick = async () => {
    const response = await fetchWithAuth(
      'http://localhost:3001/api/some-protected-endpoint',
      {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      },
      {
        onSessionExpired: () => setSessionExpired(true)
      }
    );

    if (response.ok) {
      const data = await response.json();
      // Handle success
    } else {
      // Handle error (don't forget: 401 already called onSessionExpired)
    }
  };

  return <button onClick={handleClick}>Fetch Data</button>;
}
```

**Key points:**
- `fetchWithAuth` merges your options with `credentials: 'include'` (ensures cookies are sent)
- Non-401 responses pass through unchanged — you handle error logic normally
- `onSessionExpired` is optional — code is safe if you don't provide it
- The response object is always returned, so you can check `response.ok`, `response.status`, etc.

## The `silentRefresh` Flow

Located in `src/auth/useGoogleAuth.js`:

```javascript
const silentRefresh = useGoogleLogin({
  flow: 'auth-code',
  prompt: 'none',  // ← Key: no user interaction
  onSuccess: async ({ code }) => {
    // POST auth code to backend (same as manual login)
    const response = await fetch(`${apiUrl}/api/auth/google`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ code }),
    });

    if (!response.ok) throw new Error('Token refresh failed');

    const { user, expiry_date } = await response.json();
    login(user, expiry_date || null);  // Reset timer, clear sessionExpired
  },
  onError: (err) => {
    console.error('Silent refresh error:', err);
    setSessionExpired(true);  // Trigger banner
  },
});
```

**What `prompt: 'none'` means:**
- Google does NOT show a login dialog
- If the user is already logged into Google in their browser, a new auth code is returned instantly
- If they're not logged in, the request fails silently (no popup) → `onError` is called

## Testing Token Expiry

### Basic Timer Test Pattern

```javascript
import { render, screen, waitFor, act } from '@testing-library/react';

describe('Token refresh timer', () => {
  beforeEach(() => {
    jest.useFakeTimers();  // ← Enable fake timers for this suite
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ user: null, expiry_date: null })
    });
  });

  afterEach(() => {
    jest.useRealTimers();  // ← Restore real timers after each test
    jest.restoreAllMocks();
  });

  test('schedules refresh 60 seconds before expiry', async () => {
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    // Log in with 1-hour expiry
    const nowMs = Date.now();
    const expiryMs = nowMs + 60 * 60 * 1000;  // 1 hour from now

    act(() => {
      screen.getByTestId('login-btn').click();
      // In your TestComponent, call login(user, expiryMs)
    });

    // Before 60-second threshold, needsRefresh is false
    act(() => {
      jest.advanceTimersByTime(58 * 60 * 1000);  // Advance 58 minutes
    });

    await waitFor(() => {
      expect(screen.getByTestId('refresh-status')).toHaveTextContent('OK');
    });

    // Past the 60-second threshold, needsRefresh fires
    act(() => {
      jest.advanceTimersByTime(2 * 60 * 1000);  // +2 min = 60 total
    });

    await waitFor(() => {
      expect(screen.getByTestId('refresh-status')).toHaveTextContent('REFRESHING');
    });
  });
});
```

**Key rules:**
- `jest.useFakeTimers()` must be called in `beforeEach`, not globally
- Always wrap `jest.advanceTimersByTime()` in `act()`
- Always call `jest.useRealTimers()` in `afterEach`
- Scope fake timers to specific test suites to avoid affecting other tests

### Mocking `silentRefresh`

```javascript
let silentRefreshConfig;
useGoogleLogin.mockImplementation((config) => {
  if (config.prompt === 'none') {
    silentRefreshConfig = config;
  }
  return jest.fn();
});

act(() => {
  silentRefreshConfig.onError({ error: 'popup_closed_by_user' });
});

// Assert that sessionExpired was set
expect(contextSessionExpired).toBe(true);
```

## Known Limitations & Future Improvements

### Current Limitations

1. **In-memory Session Store** — The backend uses Express's default in-memory session store. Tokens are lost if the server restarts.
   - **Fix for Production:** Use Redis (`connect-redis`), MongoDB (`connect-mongo`), or PostgreSQL (`connect-pg-simple`)

2. **No Token Rotation Policy** — We don't rotate the refresh token on every use (Google often doesn't either).
   - **Future Improvement:** Implement optional token rotation at each refresh cycle for enhanced security

3. **No Early Logout on Concurrent Refresh** — If a user has multiple tabs open and one tab's refresh fails, others don't know about it.
   - **Future Improvement:** Use `storage` events to broadcast logout across tabs, or implement server-side token revocation checks

4. **No Refresh Retry Logic** — Single refresh attempt; no exponential backoff on transient failures.
   - **Future Improvement:** Implement retry logic with exponential backoff before setting `sessionExpired`

### Architecture Decisions

| Decision | Rationale |
|----------|-----------|
| 60s before expiry | Gives buffer for latency; typical token lifetime is 60min so 1min margin is safe |
| Silent refresh on every cycle | Simplest approach; keeps tokens fresh; avoids "surprise" expirations |
| `needsRefresh` signal vs direct call | Decouples timer (in context) from Google call (in hook); easier to test; cleaner re-render flow |
| `sessionExpired` flag vs auto-logout | Gives user a chance to re-auth immediately vs disrupting their workflow with forced logout |

## Backend Implementation Details

### POST /api/auth/refresh (Optional Future Endpoint)

Currently, the backend does NOT have a `/api/auth/refresh` endpoint — it only uses `/api/auth/google` for all token exchanges. Here's how a dedicated refresh endpoint could work:

```javascript
app.post('/api/auth/refresh', async (req, res) => {
  if (!req.session.user || !req.session.tokens?.refresh_token) {
    return res.status(401).json({ error: 'No active session' });
  }

  client.setCredentials({
    refresh_token: req.session.tokens.refresh_token
  });

  const { credentials } = await client.refreshAccessToken();

  req.session.tokens = {
    access_token: credentials.access_token,
    refresh_token: credentials.refresh_token || req.session.tokens.refresh_token,
    expiry_date: credentials.expiry_date
  };

  res.json({ success: true, expiry_date: credentials.expiry_date });
});
```

This endpoint would bypass Google entirely, using only the server-side refresh token — faster and more reliable. The frontend would POST to `/api/auth/refresh` instead of relying on `silentRefresh()`.

## Debugging Tips

### Check Session State

In any test or component, inspect `AuthContext`:

```javascript
const auth = useAuth();
console.log('User:', auth.user);
console.log('Session expired?', auth.sessionExpired);
console.log('Needs refresh?', auth.needsRefresh);
```

### Monitor Token Lifecycle

In `useGoogleAuth.js`, add logs to `silentRefresh.onSuccess` and `onError`:

```javascript
onSuccess: async ({ code }) => {
  console.log('🔄 Silent refresh: got auth code');
  // ...
},
onError: (err) => {
  console.error('❌ Silent refresh failed:', err);
  setSessionExpired(true);
}
```

### Test Timer Behavior

In tests with fake timers, log when the timer fires:

```javascript
act(() => {
  jest.advanceTimersByTime(59 * 60 * 1000);
  console.log('Advanced 59 minutes');
});

await waitFor(() => {
  const status = screen.getByTestId('refresh-status').textContent;
  console.log('Refresh status:', status);
});
```

## References

- [Google OAuth 2.0 Documentation](https://developers.google.com/identity)
- [HttpOnly Cookies (OWASP)](https://owasp.org/www-community/controls/Cookie_Security)
- [Token Refresh Patterns](https://auth0.com/blog/refresh-tokens-what-are-they-and-when-to-use-them/)
