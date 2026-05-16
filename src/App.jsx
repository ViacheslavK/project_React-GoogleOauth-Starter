import { FeedbackButton } from './FeedbackButton';
import './App.css';

function App() {
  return (
    <div className="App">
      <header className="App-header">
        <h1>Claude Test App</h1>
        <FeedbackButton repositoryUrl="https://github.com/your-org/your-repo" />
      </header>
      <main>
        <p>Welcome to the test application with feedback support!</p>
      </main>
    </div>
  );
}

export default App;
