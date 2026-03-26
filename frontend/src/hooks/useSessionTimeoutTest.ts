import { useAuth } from '../auth/AuthContext';

// This hook is for testing purposes to simulate user inactivity
export const useSessionTimeoutTest = () => {
  const { extendSession, logout } = useAuth();

  // This function simulates user inactivity to trigger session timeout warning
  const simulateInactivity = (seconds: number = 3) => {
    console.log(`Testing session timeout (will appear in ${seconds} seconds)...`);
    return new Promise<void>((resolve) => {
      setTimeout(() => {
        console.log('Session timeout test triggered');
        // Just trigger the warning directly by simulating very short timeout
        // This is for testing only
        const event = new CustomEvent('session-timeout-test');
        document.dispatchEvent(event);
        resolve();
      }, seconds * 1000);
    });
  };

  return {
    simulateInactivity,
    extendSession,
    logout,
  };
};
