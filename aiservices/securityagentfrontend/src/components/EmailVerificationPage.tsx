import React, { useState } from 'react';
import { Mail, CheckCircle, AlertCircle, ArrowRight } from 'lucide-react';
import axios from 'axios';

interface EmailVerificationPageProps {
  onEmailVerified: (email: string) => void;
}

const EmailVerificationPage: React.FC<EmailVerificationPageProps> = ({ onEmailVerified }) => {
  const [email, setEmail] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [enteredOtp, setEnteredOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setError('Please enter a valid email address');
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      setError('Please enter a valid email address format');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');
    
    try {
      console.log('🔄 Requesting email verification OTP for:', email.trim());
      const response = await axios.post('/api/security/three-step/request-email-verification', {
        identifier: email.trim()
      });

      console.log('✅ Email OTP Response:', response.data);

      if (response.data.success) {
        setOtpSent(true);
        setSuccess(`📧 Step 1: Email verification OTP sent to ${email.trim()}! Check your inbox and enter the code below.`);
      } else {
        setError(response.data.message || 'Failed to send OTP. Please try again.');
      }
    } catch (err: any) {
      console.error('❌ Email OTP Error:', err);
      setError(err.response?.data?.detail || err.response?.data?.message || 'Failed to send OTP. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!enteredOtp.trim()) {
      setError('Please enter the OTP code');
      return;
    }

    // Basic OTP validation (should be 6 digits)
    if (!/^\d{6}$/.test(enteredOtp.trim())) {
      setError('OTP must be a 6-digit number');
      return;
    }

    setVerifying(true);
    setError('');
    setSuccess('');
    
    try {
      console.log('🔄 Verifying email OTP for:', email.trim());
      const response = await axios.post('/api/security/three-step/verify-email-verification', {
        identifier: email.trim(),
        otp_code: enteredOtp.trim()
      });

      console.log('✅ Email verification response:', response.data);

      if (response.data.success) {
        setSuccess('✅ Email verified successfully! Proceeding to Step 2: Report Generation...');
        setTimeout(() => {
          onEmailVerified(email.trim());
        }, 2000);
      } else {
        setError(response.data.message || 'Invalid OTP code. Please try again.');
      }
    } catch (err: any) {
      console.error('❌ Email verification error:', err);
      if (err.response?.data?.action === 'new_otp_sent') {
        setError('🔄 New OTP has been sent to your email. Please check and enter the new code.');
        setEnteredOtp(''); // Clear the input
      } else {
        setError(err.response?.data?.message || err.response?.data?.detail || 'Invalid OTP code. Please try again.');
      }
    } finally {
      setVerifying(false);
    }
  };

  return (
    <div className="form-container">
      <div className="form-header">
        <Mail size={32} className="form-icon" />
        <h2>Email Verification</h2>
        <p>Step 1 of 3: Verify your email address to access the health report system</p>
      </div>

      <div className="steps-indicator">
        <div className="step active">
          <div className="step-number">1</div>
          <div className="step-label">Email Verification</div>
        </div>
        <div className="step">
          <div className="step-number">2</div>
          <div className="step-label">Report Generation</div>
        </div>
        <div className="step">
          <div className="step-number">3</div>
          <div className="step-label">Report Decryption</div>
        </div>
      </div>

      {!otpSent ? (
        <form onSubmit={handleSendOtp} className="form">
          <div className="form-group">
            <label>Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email address"
              className="input"
              required
              disabled={loading}
            />
            <small className="help-text">
              🔐 We'll send a verification code to this email address
            </small>
          </div>

          {error && (
            <div className="alert alert-error">
              <AlertCircle size={16} />
              {error}
            </div>
          )}

          <button 
            type="submit" 
            className="btn btn-primary full-width" 
            disabled={loading || !email.trim()}
          >
            <Mail size={16} />
            {loading ? 'Sending OTP...' : 'Send Verification Code'}
          </button>
        </form>
      ) : (
        <div className="form">
          <div className="info-box">
            <p><strong>📧 Email:</strong> {email}</p>
            <p><strong>📱 Status:</strong> OTP sent successfully</p>
            <p><strong>⏰ Expires:</strong> 10 minutes</p>
          </div>

          <div className="form-group">
            <label>Enter Verification Code</label>
            <div className="otp-input-group">
              <input
                type="text"
                value={enteredOtp}
                onChange={(e) => setEnteredOtp(e.target.value)}
                placeholder="Enter 6-digit code"
                className="input"
                maxLength={6}
                disabled={verifying}
              />
              <button
                type="button"
                onClick={handleVerifyOtp}
                className="btn btn-secondary"
                disabled={verifying || !enteredOtp.trim()}
              >
                {verifying ? '🔄' : '🔍'}
                {verifying ? 'Verifying...' : 'Verify'}
              </button>
            </div>
            <small className="help-text">
              📧 Check your email for the 6-digit verification code
            </small>
          </div>

          {error && (
            <div className="alert alert-error">
              <AlertCircle size={16} />
              {error}
            </div>
          )}

          {success && (
            <div className="alert alert-success">
              <CheckCircle size={16} />
              {success}
            </div>
          )}

          <div className="button-group">
            <button
              type="button"
              onClick={() => {
                setOtpSent(false);
                setEnteredOtp('');
                setError('');
                setSuccess('');
              }}
              className="btn btn-secondary"
            >
              Change Email
            </button>
            <button
              type="button"
              onClick={handleSendOtp}
              className="btn btn-outline"
              disabled={loading}
            >
              Resend Code
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmailVerificationPage;