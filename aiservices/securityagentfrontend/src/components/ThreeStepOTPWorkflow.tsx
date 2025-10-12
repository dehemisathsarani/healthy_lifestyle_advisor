import React, { useState } from 'react';
import EmailVerificationPage from './EmailVerificationPage';
import ReportGenerationPage from './ReportGenerationPage';
import DecryptionPage from './DecryptionPage';
import './ThreeStepOTP.css';

type Step = 'email_verification' | 'report_generation' | 'decryption';

const ThreeStepOTPWorkflow: React.FC = () => {
  const [currentStep, setCurrentStep] = useState<Step>('email_verification');
  const [userEmail, setUserEmail] = useState('');
  const [reportData, setReportData] = useState(null);

  const handleEmailVerified = (email: string) => {
    setUserEmail(email);
    setCurrentStep('report_generation');
  };

  const handleReportDownloaded = (data: any) => {
    setReportData(data);
    setCurrentStep('decryption');
  };

  const handleBackToEmailVerification = () => {
    setCurrentStep('email_verification');
    setUserEmail('');
    setReportData(null);
  };

  const handleBackToReportGeneration = () => {
    setCurrentStep('report_generation');
    setReportData(null);
  };

  return (
    <div className="three-step-container">
      {currentStep === 'email_verification' && (
        <EmailVerificationPage 
          onEmailVerified={handleEmailVerified}
        />
      )}
      
      {currentStep === 'report_generation' && (
        <ReportGenerationPage 
          userEmail={userEmail}
          onReportDownloaded={handleReportDownloaded}
          onBack={handleBackToEmailVerification}
          showEmailInput={false} // Don't show email input since it's already verified
        />
      )}
      
      {currentStep === 'decryption' && (
        <DecryptionPage 
          userEmail={userEmail}
          reportData={reportData}
          onBack={handleBackToReportGeneration}
        />
      )}
    </div>
  );
};

export default ThreeStepOTPWorkflow;