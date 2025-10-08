import React from 'react';
import { Navbar } from '../components/Navbar';
import BiometricManagement from '../components/BiometricManagement';

export const BiometricPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-2">
              Biometric Health Management
            </h1>
            <p className="text-lg text-gray-600">
              Track your health metrics, calculate BMI, BMR, TDEE, and monitor your fitness progress
            </p>
          </div>
          <BiometricManagement />
        </div>
      </div>
    </div>
  );
};

export default BiometricPage;
