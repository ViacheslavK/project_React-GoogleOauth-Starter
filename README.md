# react-google-oauth-starter

A production-ready React + Express.js starter for Google OAuth authentication with secure token handling, token refresh, and comprehensive test coverage.

## Features

- 🔐 **Secure OAuth Flow** — Authorization code flow with PKCE, HttpOnly cookies, server-side token exchange
- ⚡ **Vite + React 18** — Modern, fast development experience
- 🔄 **Automatic Token Refresh** — Proactive refresh 60s before expiry, silent refresh with fallback
- 🧪 **79 Tests** — Comprehensive coverage of auth flows, components, error handling
- 🎯 **Production-Grade** — Error handling, loading states, session expiry detection
- 📱 **Responsive UI** — LoginButton, UserProfile, SessionExpiredBanner components

## Quick Start

```bash
npm install
cd backend && npm install && cd ..
npm run dev:all
```

Frontend: `http://localhost:5173`
Backend: `http://localhost:3001`

## Documentation

- [**CLAUDE.md**](CLAUDE.md) — Project guidance and detailed architecture
- [**DEV_GUIDE.md**](docs/DEV_GUIDE.md) — Development workflow and common tasks
- [**USER_GUIDE.md**](docs/USER_GUIDE.md) — User-facing features and usage
- [**SECURITY_AUDIT.md**](docs/SECURITY_AUDIT.md) — Security analysis and best practices
- [**SECURITY_FIX_SUMMARY.md**](docs/SECURITY_FIX_SUMMARY.md) — Security improvements implemented

## Google OAuth Setup

1. Create OAuth credentials at [Google Cloud Console](https://console.cloud.google.com/)
   - Add `http://localhost:5173` to authorized JavaScript origins
   - Add `http://localhost:3001` to authorized redirect URIs

2. Create `.env` (frontend):

   ```markdown
   VITE_GOOGLE_CLIENT_ID=your-client-id
   VITE_API_URL=http://localhost:3001
   ```

3. Create `backend/.env` (backend):

   ```markdown
   GOOGLE_CLIENT_ID=your-client-id
   GOOGLE_CLIENT_SECRET=your-client-secret
   SESSION_SECRET=generate-random-string
   FRONTEND_URL=http://localhost:5173
   ```

See [docs/CLAUDE.md](docs/CLAUDE.md) for detailed setup instructions.

## Testing

```bash
npm test                    # Run all tests
npm run test:watch         # Watch mode
npm test -- --coverage     # With coverage report
```

**Current coverage:** 79 passing tests across 10 test suites.

## Architecture Highlights

**Authorization Code Flow + PKCE:**

- Frontend requests authorization code from Google
- Backend securely exchanges code for tokens using Client Secret
- Tokens stored server-side in HttpOnly session cookies
- Frontend never handles access tokens (prevents XSS attacks)

**Token Refresh:**

- Proactive refresh scheduled 60 seconds before expiry
- Silent refresh uses stored refresh_token
- Automatic session expiry detection with user notification

**Backend API:**

- `POST /api/auth/google` — OAuth code exchange
- `GET /api/auth/user` — Get current session user
- `POST /api/auth/refresh` — Refresh access token
- `POST /api/auth/logout` — Destroy session

## Project Structure

   ```markdown
├── README.md                    # This file
├── docs/                        # Documentation
├── src/                         # React frontend
│   ├── auth/                   # OAuth + context
│   ├── components/             # UI components
│   └── utils/                  # Helpers
├── backend/                     # Express.js server
└── package.json
```

## Next Steps

1. Read [docs/CLAUDE.md](docs/CLAUDE.md) for architecture details
2. Review [docs/SECURITY_AUDIT.md](docs/SECURITY_AUDIT.md) for security considerations
3. Check [docs/DEV_GUIDE.md](docs/DEV_GUIDE.md) for development workflow

## License

MIT
