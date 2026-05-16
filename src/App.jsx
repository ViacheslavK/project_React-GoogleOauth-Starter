import { GoogleOAuthProvider } from '@react-oauth/google';
import { FeedbackButton } from './FeedbackButton';
import { AuthProvider } from './auth/AuthContext';
import { LoginButton } from './components/LoginButton';
import { UserProfile } from './components/UserProfile';
import './App.css';

function AppContent() {
  return (
    <div className="App">
      <header className="App-header">
        <h1>Claude Test App</h1>
        <div className="header-controls">
          <UserProfile />
          <LoginButton />
          <FeedbackButton repositoryUrl="https://github.com/your-org/your-repo" />
        </div>
      </header>
      <main>
        <p>Welcome to the test application with feedback and authentication support!</p>
      </main>
    </div>
  );
}

export default function App() {
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

  if (!clientId) {
    console.warn('VITE_GOOGLE_CLIENT_ID not set. Auth will not work.');
  }

  return (
    <GoogleOAuthProvider clientId={clientId || 'placeholder'}>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </GoogleOAuthProvider>
  );
}
