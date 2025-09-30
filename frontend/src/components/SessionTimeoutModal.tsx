import React, { useEffect, useState } from 'react';

interface SessionTimeoutAlertProps {
  isOpen: boolean;
  onExtend: () => void;
  onLogout: () => void;
  remainingTime: number;
}

const SessionTimeoutAlert: React.FC<SessionTimeoutAlertProps> = ({
  isOpen,
  onExtend,
  onLogout,
  remainingTime,
}) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsVisible(true);
    } else {
      const timer = setTimeout(() => {
        setIsVisible(false);
      }, 300); // Match this with the CSS transition duration
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  if (!isOpen && !isVisible) return null;

  return (
    <div 
      className={`fixed top-4 right-4 max-w-md w-full shadow-xl z-50 transition-all duration-300 transform ${
        isVisible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'
      }`}
    >
      <div className="bg-yellow-100 border-l-4 border-yellow-500 p-5 rounded-md">
        <div className="flex">
          <div className="flex-shrink-0">
            {/* Alert icon */}
            <svg className="h-6 w-6 text-yellow-600" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3 w-full">
            <h3 className="text-sm font-bold text-yellow-800">
              Session Timeout Warning
            </h3>
            <div className="mt-2 text-sm text-yellow-700">
              <p>
                Your session will expire in <span className="font-bold">{remainingTime}</span> seconds due to inactivity.
              </p>
            </div>
            <div className="mt-4 flex">
              <button
                onClick={onExtend}
                className="mr-3 rounded-md bg-yellow-600 px-3 py-1.5 text-sm font-medium text-white shadow-sm hover:bg-yellow-500 focus:outline-none focus:ring-2 focus:ring-yellow-600"
              >
                Extend Session
              </button>
              <button
                onClick={onLogout}
                className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SessionTimeoutAlert;
