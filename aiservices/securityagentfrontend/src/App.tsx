// Modern React doesn't require React import for JSX
import { Shield } from 'lucide-react';
import ThreeStepOTPWorkflow from './components/ThreeStepOTPWorkflow';
import './App.css';

function App() {

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-content">
          <Shield className="logo" size={40} />
          <div>
            <h1>Data & Security Agent</h1>
            <p>Secure Health Report Access System</p>
          </div>
        </div>
      </header>

      {/* Enhanced 3-Step Workflow is now the default */}

      {/* Enhanced 3-Step OTP Workflow */}
      <ThreeStepOTPWorkflow />

      <footer className="app-footer">
        <p>🔐 All data is encrypted using Fernet symmetric encryption</p>
        <p>Your privacy and security are our top priorities</p>
      </footer>
    </div>
  );
}

export default App;
