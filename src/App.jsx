import { GoogleOAuthProvider } from '@react-oauth/google';
import { FeedbackButton } from './FeedbackButton';
import { AuthProvider } from './auth/AuthContext';
import { LoginButton } from './components/LoginButton';
import { UserProfile } from './components/UserProfile';
import { AuthError } from './components/AuthError';
import { SessionExpiredBanner } from './components/SessionExpiredBanner';
import './App.css';

const getClientId = () => {
  return import.meta.env.VITE_GOOGLE_CLIENT_ID || null;
};

const getGithubRepoUrl = () => {
  return import.meta.env.VITE_GITHUB_REPO_URL || null;
};

function AppContent() {
  const githubRepoUrl = getGithubRepoUrl();

  return (
    <div className="App">
      <AuthError />
      <SessionExpiredBanner />
      <header className="App-header">
        <h1>Claude Test App</h1>
        <div className="header-controls">
          <UserProfile />
          <LoginButton />
          {githubRepoUrl && <FeedbackButton repositoryUrl={githubRepoUrl} />}
        </div>
      </header>
      <main>
        <p>Welcome to the test application with feedback and authentication support!</p>
      </main>
    </div>
  );
}

export default function App() {
  const clientId = getClientId();

  if (!clientId) {
    throw new Error(
      'VITE_GOOGLE_CLIENT_ID is not configured. ' +
      'Please set it in your .env file. See CLAUDE.md for setup instructions.'
    );
  }

  return (
    <GoogleOAuthProvider clientId={clientId}>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </GoogleOAuthProvider>
  );
}
